import { createFileRoute } from "@tanstack/react-router";

const LABEL: Record<string, string> = {
  confirming: "🕒 Confirming",
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

function bankKeyboard(banks: Array<{ id: string; bankName: string; accountNumber: string }>) {
  return {
    inline_keyboard: [
      ...banks.map((b) => [
        { text: `🗑 Remove ${b.bankName} •${b.accountNumber.slice(-4)}`, callback_data: `bank_remove:${b.id}` },
      ]),
      [{ text: "➕ Add Bank", callback_data: "bank_add" }],
    ],
  };
}

function bankListText(banks: Array<{ bankName: string; holderName: string; accountNumber: string; ifsc: string }>) {
  if (!banks.length) return "No bank accounts yet. Tap ➕ Add Bank.";
  return `Active bank accounts (${banks.length})\n\n` + banks
    .map((b, i) => `${i + 1}. ${b.bankName}\n   ${b.holderName}\n   A/C ${b.accountNumber}\n   IFSC ${b.ifsc}`)
    .join("\n\n");
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

        const { telegram, orderMessage, keyboardForStatus } = await import(
          "@/lib/telegram.server"
        );
        const { patchDocument, getDocument } = await import(
          "@/lib/firestore.server"
        );
        const {
          addUpi, getBotState, listUpis, removeUpi, setBotState, validUpiId,
          addBank, getBotDraft, listBanks, removeBank, validAccountNumber, validIfsc,
        } = await import("@/lib/upi.server");

        const update = (await request.json()) as {
          callback_query?: {
            id: string;
            data?: string;
            message?: { chat: { id: number }; message_id: number };
          };
          message?: {
            chat: { id: number };
            text?: string;
            message_id?: number;
            reply_to_message?: { message_id: number };
          };
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
        // ---------- Live support: accept / decline ----------
        if ((cq?.data?.startsWith("sup_accept:") || cq?.data?.startsWith("sup_decline:")) && cq.message) {
          const sup = await import("@/lib/support.server");
          const accept = cq.data.startsWith("sup_accept:");
          const sid = cq.data.slice(cq.data.indexOf(":") + 1);
          const session = await sup.getSession(sid);
          if (!session || session.status !== "waiting") {
            await telegram("answerCallbackQuery", { callback_query_id: cq.id, text: "This request is no longer waiting.", show_alert: true });
            await telegram("editMessageReplyMarkup", { chat_id: cq.message.chat.id, message_id: cq.message.message_id, reply_markup: { inline_keyboard: [] } });
            return Response.json({ ok: true });
          }
          await telegram("answerCallbackQuery", { callback_query_id: cq.id, text: accept ? "Chat accepted" : "Declined" });
          await telegram("editMessageReplyMarkup", { chat_id: cq.message.chat.id, message_id: cq.message.message_id, reply_markup: { inline_keyboard: [] } });
          if (!accept) {
            await sup.closeSession(sid, "declined", false);
            await telegram("sendMessage", { chat_id: cq.message.chat.id, reply_to_message_id: cq.message.message_id, text: `Declined chat ${sid}.` });
            return Response.json({ ok: true });
          }
          const agent = sup.randomAgent();
          await patchDocument("support_sessions", sid, {
            status: "active",
            agentName: agent.name,
            agentPhoto: agent.photo,
            lastUserAt: new Date().toISOString(),
          });
          await sup.addMessage(sid, "agent", `Hi ${session.name}, I'm ${agent.name} from Velqorfi support. How can I help you today?`);
          const sent = (await telegram("sendMessage", {
            chat_id: cq.message.chat.id,
            reply_to_message_id: cq.message.message_id,
            parse_mode: "HTML",
            text: `✅ Accepted chat <code>${sid}</code>. You appear to the user as <b>${sup.esc(agent.name)}</b>.\nReply (tag) to any message of this chat to answer the user. Reply <b>end</b> to close the chat.`,
          })) as { result?: { message_id?: number } };
          await sup.mapTelegramMessage(sent.result?.message_id, sid);
          // Forward anything the user sent while waiting for an agent.
          try {
            const earlier = (await sup.listMessages(sid)).filter((m) => m.from === "user");
            for (const m of earlier) {
              if (m.image) {
                const mid = await sup.sendPhotoToTelegram(
                  m.image,
                  `📷 <b>${sup.esc(session.name)}</b> · <code>${sid}</code>${m.text ? `\n${sup.esc(m.text)}` : ""}`,
                );
                await sup.mapTelegramMessage(mid, sid);
              } else if (m.text) {
                const fw = (await telegram("sendMessage", {
                  chat_id: cq.message.chat.id,
                  parse_mode: "HTML",
                  text: `💬 <b>${sup.esc(session.name)}</b> · <code>${sid}</code> (sent while waiting)\n${sup.esc(m.text)}`,
                })) as { result?: { message_id?: number } };
                await sup.mapTelegramMessage(fw.result?.message_id, sid);
              }
            }
          } catch (e) {
            console.error("Forwarding waiting messages failed", e);
          }
          return Response.json({ ok: true });
        }

        if (cq?.data === "upi_add" && cq.message) {
          await telegram("answerCallbackQuery", { callback_query_id: cq.id });
          await setBotState(String(cq.message.chat.id), "upi_add");
          await telegram("sendMessage", { chat_id: cq.message.chat.id, text: "Send the new UPI ID now (example: name@bank)." });
          return Response.json({ ok: true });
        }
        if (cq?.data === "bank_add" && cq.message) {
          await telegram("answerCallbackQuery", { callback_query_id: cq.id });
          await setBotState(String(cq.message.chat.id), "bank_name");
          await telegram("sendMessage", { chat_id: cq.message.chat.id, text: "Step 1/4: Send the Bank Name (example: HDFC Bank).\nUse /bank to cancel." });
          return Response.json({ ok: true });
        }
        if (cq?.data?.startsWith("bank_remove:") && cq.message) {
          await telegram("answerCallbackQuery", { callback_query_id: cq.id });
          await removeBank(cq.data.slice("bank_remove:".length));
          const banks = await listBanks();
          await telegram("editMessageText", { chat_id: cq.message.chat.id, message_id: cq.message.message_id, text: bankListText(banks), reply_markup: bankKeyboard(banks) });
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
          const allowed = ["completed", "processing", "cancelled", "confirming"];
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
            const currentOrder = await getDocument("orders", orderId);
            if (!currentOrder || (status === "confirming" && currentOrder["status"] !== "processing")) {
              await telegram("sendMessage", { chat_id: cq.message.chat.id, text: "Uncomplete is only available for a processing order." });
              return Response.json({ ok: true });
            }
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
        // ---------- Live support: admin replies to a tagged chat message ----------
        const replyTo = update.message?.reply_to_message?.message_id;
        if (chatId && replyTo && text.trim()) {
          const sup = await import("@/lib/support.server");
          const sid = await sup.sessionForTelegramMessage(replyTo);
          if (sid) {
            const session = await sup.getSession(sid);
            if (!session || session.status === "closed") {
              await telegram("sendMessage", { chat_id: chatId, reply_to_message_id: update.message?.message_id, text: `Chat ${sid} is already closed.` });
            } else if (session.status !== "active") {
              await telegram("sendMessage", { chat_id: chatId, reply_to_message_id: update.message?.message_id, text: `Accept chat ${sid} first.` });
            } else if (text.trim().toLowerCase() === "end") {
              await sup.closeSession(sid, "agent", false);
              await telegram("sendMessage", { chat_id: chatId, reply_to_message_id: update.message?.message_id, parse_mode: "HTML", text: `🔒 Chat <code>${sid}</code> ended.` });
            } else {
              await sup.addMessage(sid, "agent", text.trim());
              await sup.mapTelegramMessage(update.message?.message_id, sid);
            }
            return Response.json({ ok: true });
          }
        }

        if (chatId && text.startsWith("/start")) {
          await telegram("sendMessage", {
            chat_id: chatId,
            text: `Velqorfi order bot ready.\nChat ID: <code>${chatId}</code>\nCommands:\n/status &lt;orderId&gt;\n/upi\n/bank\n/rate 96`,
            parse_mode: "HTML",
          });
        } else if (chatId && text.startsWith("/upi")) {
          await setBotState(String(chatId), "none");
          const accounts = await listUpis();
          await telegram("sendMessage", { chat_id: chatId, text: `Active UPI IDs (${accounts.length})`, reply_markup: upiKeyboard(accounts) });
        } else if (chatId && text.startsWith("/bank")) {
          await setBotState(String(chatId), "none");
          const banks = await listBanks();
          await telegram("sendMessage", { chat_id: chatId, text: bankListText(banks), reply_markup: bankKeyboard(banks) });
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
              // Read it back exactly like the website does, to prove it really saved.
              const saved = await getInrRate();
              await telegram("sendMessage", {
                chat_id: chatId,
                text:
                  saved === rate
                    ? `Rate updated \u2705\n1 USDT = 1 USDC = <b>\u20b9${rate}</b>\nAll other coins = live USD price \u00d7 ${rate}.\nWebsite pe 20 sec ke andar dikhega (page refresh karo).`
                    : `\u26a0\ufe0f Rate save hua par read-back match nahi hua.\nSaved: ${saved ?? "none"} | Expected: ${rate}\nFirebase env / Firestore permission check karo.`,
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
              ? orderMessage({
                  id: String(id), status: String(order["status"] ?? "confirming"),
                  amount: Number(order["amount"] ?? 0), payable: Number(order["payable"] ?? order["amount"] ?? 0),
                  fiat: String(order["fiat"] ?? "INR"), asset: String(order["asset"] ?? ""),
                  receive: String(order["receive"] ?? ""), utr: String(order["utr"] ?? ""),
                  email: String(order["email"] ?? ""), address: String(order["address"] ?? ""),
                  createdAt: String(order["createdAt"] ?? ""), method: String(order["method"] ?? "upi"),
                  upiId: String(order["upiId"] ?? ""), bankName: String(order["bankName"] ?? ""),
                  bankAccount: String(order["bankAccount"] ?? ""), bankIfsc: String(order["bankIfsc"] ?? ""),
                })
              : "Order not found. Usage: /status &lt;orderId&gt;",
            parse_mode: "HTML",
            ...(order ? { reply_markup: keyboardForStatus(String(order["status"] ?? "confirming"), String(id)) } : {}),
          });
        } else if (chatId && (await getBotState(String(chatId))).startsWith("bank_")) {
          const key = String(chatId);
          const step = await getBotState(key);
          const draft = await getBotDraft(key);
          const value = text.trim();
          const say = (t: string) => telegram("sendMessage", { chat_id: chatId, text: t });
          if (!value) {
            await say("Please send a text value, or /bank to cancel.");
          } else if (step === "bank_name") {
            await setBotState(key, "bank_holder", { ...draft, bankName: value });
            await say("Step 2/4: Send the Account Holder Name.");
          } else if (step === "bank_holder") {
            await setBotState(key, "bank_account", { ...draft, holderName: value });
            await say("Step 3/4: Send the Account Number.");
          } else if (step === "bank_account") {
            if (!validAccountNumber(value)) {
              await say("Invalid account number (digits only). Send again, or /bank to cancel.");
            } else {
              await setBotState(key, "bank_ifsc", { ...draft, accountNumber: value.replace(/\s+/g, "") });
              await say("Step 4/4: Send the IFSC Code (example: HDFC0001234).");
            }
          } else if (step === "bank_ifsc") {
            if (!validIfsc(value)) {
              await say("Invalid IFSC code. It looks like HDFC0001234. Send again, or /bank to cancel.");
            } else {
              await addBank({
                bankName: draft["bankName"] ?? "",
                holderName: draft["holderName"] ?? "",
                accountNumber: draft["accountNumber"] ?? "",
                ifsc: value,
              });
              await setBotState(key, "none");
              const banks = await listBanks();
              await telegram("sendMessage", { chat_id: chatId, text: `Bank added ✅\n\n${bankListText(banks)}`, reply_markup: bankKeyboard(banks) });
            }
          }
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
