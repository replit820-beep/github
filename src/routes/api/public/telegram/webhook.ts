import { createFileRoute } from "@tanstack/react-router";

const LABEL: Record<string, string> = {
  completed: "✅ Completed",
  processing: "⏳ Processing",
  cancelled: "❌ Cancelled",
};

function upiKeyboard(accounts: Array<{ id: string; upiId: string }>) {
  return {
    inline_keyboard: [
      ...accounts.map((account) => [
        { text: `🗑 Remove ${account.upiId}`, callback_data: `upi_remove:${account.id}` },
      ]),
      [{ text: "➕ Add UPI", callback_data: "upi_add" }],
    ],
  };
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["TELEGRAM_WEBHOOK_SECRET"];
        if (!secret) {
          console.error("TELEGRAM_WEBHOOK_SECRET is not configured");
          return new Response("Webhook is not configured", { status: 503 });
        }
        const actualSecret =
          request.headers.get("x-telegram-bot-api-secret-token") ?? "";
        const { createHash, timingSafeEqual } = await import("node:crypto");
        const expectedHash = createHash("sha256").update(secret).digest();
        const actualHash = createHash("sha256").update(actualSecret).digest();
        if (!timingSafeEqual(expectedHash, actualHash)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { telegram, statusKeyboard, keyboardForStatus } = await import(
          "@/lib/telegram.server"
        );
        const { patchDocument, getDocument } = await import(
          "@/lib/firestore.server"
        );
        const { addUpi, getBotState, listUpis, removeUpi, setBotState, validUpiId } =
          await import("@/lib/upi.server");

        const update = (await request.json()) as {
          callback_query?: {
            id: string;
            data?: string;
            message?: { chat: { id: number }; message_id: number };
          };
          message?: { chat: { id: number }; text?: string };
        };

        const configuredChatId = process.env["TELEGRAM_CHAT_ID"];
        const cq = update.callback_query;
        if (cq?.message && configuredChatId && String(cq.message.chat.id) !== configuredChatId) {
          await telegram("answerCallbackQuery", {
            callback_query_id: cq.id,
            text: "This action is not allowed.",
            show_alert: true,
          });
          return Response.json({ ok: true });
        }
        if (cq?.data === "upi_add" && cq.message) {
          await telegram("answerCallbackQuery", { callback_query_id: cq.id });
          await setBotState(String(cq.message.chat.id), "upi_add");
          await telegram("sendMessage", { chat_id: cq.message.chat.id, text: "Send the new UPI ID now (example: name@bank)." });
          return Response.json({ ok: true });
        }
        if (cq?.data?.startsWith("upi_remove:") && cq.message) {
          await telegram("answerCallbackQuery", { callback_query_id: cq.id });
          try {
            await removeUpi(cq.data.slice("upi_remove:".length));
            const accounts = await listUpis();
            await telegram("editMessageText", { chat_id: cq.message.chat.id, message_id: cq.message.message_id, text: `Active UPI IDs (${accounts.length})`, reply_markup: upiKeyboard(accounts) });
          } catch (error) {
            await telegram("sendMessage", { chat_id: cq.message.chat.id, text: error instanceof Error ? error.message : "Could not remove UPI ID." });
          }
          return Response.json({ ok: true });
        }
        if (cq?.data?.startsWith("set:")) {
          const [, status, orderId] = cq.data.split(":");
          const allowed = ["completed", "processing", "cancelled"];
          if (
            status &&
            orderId &&
            allowed.includes(status) &&
            cq.message &&
            (!configuredChatId || String(cq.message.chat.id) === configuredChatId)
          ) {
            await telegram("answerCallbackQuery", {
              callback_query_id: cq.id,
              text: `Updating order ${orderId}…`,
            });
            await patchDocument("orders", orderId, {
              status,
              updatedAt: new Date().toISOString(),
            });
            const orderDoc = await getDocument("orders", orderId);
            if (orderDoc) {
              const { sendOrderStatusEmail } = await import("@/lib/email.server");
              await sendOrderStatusEmail(status, {
                id: orderId,
                email: String(orderDoc["email"] ?? ""),
                asset: String(orderDoc["asset"] ?? ""),
                receive: String(orderDoc["receive"] ?? ""),
                amount: Number(orderDoc["amount"] ?? 0),
                payable: Number(orderDoc["payable"] ?? orderDoc["amount"] ?? 0),
                fiat: String(orderDoc["fiat"] ?? "INR"),
                address: String(orderDoc["address"] ?? ""),
                utr: String(orderDoc["utr"] ?? ""),
              });
            }
            await telegram("editMessageReplyMarkup", {
              chat_id: cq.message.chat.id,
              message_id: cq.message.message_id,
              reply_markup: keyboardForStatus(status, orderId),
            });
            await telegram("sendMessage", {
              chat_id: cq.message.chat.id,
              reply_to_message_id: cq.message.message_id,
              text: `Order <code>${orderId}</code> marked ${LABEL[status] ?? status}`,
              parse_mode: "HTML",
            });
          } else {
            await telegram("answerCallbackQuery", {
              callback_query_id: cq.id,
              text: "This action is not allowed.",
              show_alert: true,
            });
          }
          return Response.json({ ok: true });
        }

        const text = update.message?.text ?? "";
        const chatId = update.message?.chat.id;
        if (chatId && configuredChatId && String(chatId) !== configuredChatId) return Response.json({ ok: true });
        if (chatId && text.startsWith("/start")) {
          await telegram("sendMessage", {
            chat_id: chatId,
            text: `Velqorfi order bot ready.\nChat ID: <code>${chatId}</code>\nCommands:\n/status &lt;orderId&gt;\n/upi\n/rate 96`,
            parse_mode: "HTML",
          });
        } else if (chatId && text.startsWith("/upi")) {
          await setBotState(String(chatId), "none");
          const accounts = await listUpis();
          await telegram("sendMessage", { chat_id: chatId, text: `Active UPI IDs (${accounts.length})`, reply_markup: upiKeyboard(accounts) });
        } else if (chatId && text.startsWith("/rate")) {
          const { getInrRate, setInrRate } = await import("@/lib/settings.server");
          const raw = text.split(/\s+/)[1];
          if (!raw) {
            const current = await getInrRate();
            await telegram("sendMessage", {
              chat_id: chatId,
              text: current
                ? `Current rate: <b>1 USDT = \u20b9${current}</b>\nChange it with /rate 96`
                : "No manual rate set. Live market FX is in use.\nSet one with /rate 96",
              parse_mode: "HTML",
            });
          } else {
            const value = Number(raw);
            if (!Number.isFinite(value) || value <= 0) {
              await telegram("sendMessage", {
                chat_id: chatId,
                text: "Usage: /rate 96 (rupees per 1 USDT)",
              });
            } else {
              const rate = await setInrRate(value);
              await telegram("sendMessage", {
                chat_id: chatId,
                text: `Rate updated \u2705\n1 USDT = <b>\u20b9${rate}</b>\nAll coins are now priced at their live USD price \u00d7 ${rate}.`,
                parse_mode: "HTML",
              });
            }
          }
        } else if (chatId && text.startsWith("/status")) {
          const id = text.split(/\s+/)[1];
          const order = id ? await getDocument("orders", id) : null;
          await telegram("sendMessage", {
            chat_id: chatId,
            text: order
              ? `Order <code>${id}</code>\nStatus: <b>${String(order["status"]).toUpperCase()}</b>\nAmount: ${order["amount"]} ${order["fiat"]}\nUTR: <code>${order["utr"]}</code>`
              : "Order not found. Usage: /status <orderId>",
            parse_mode: "HTML",
            ...(order ? { reply_markup: statusKeyboard(String(id)) } : {}),
          });
        } else if (chatId && (await getBotState(String(chatId))) === "upi_add") {
          if (!validUpiId(text)) {
            await telegram("sendMessage", { chat_id: chatId, text: "Invalid UPI ID. Send a value like name@bank, or use /upi to cancel." });
          } else {
            await addUpi(text);
            await setBotState(String(chatId), "none");
            const accounts = await listUpis();
            await telegram("sendMessage", { chat_id: chatId, text: `UPI added. Active UPI IDs (${accounts.length})`, reply_markup: upiKeyboard(accounts) });
          }
        }

        return Response.json({ ok: true });
      },
    },
  },
});
