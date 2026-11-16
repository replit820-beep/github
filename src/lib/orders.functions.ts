import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const createPendingOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        idToken: z.string().min(10),
        amount: z.number().positive(),
        fiat: z.string().min(1).max(8),
        asset: z.string().min(1).max(16),
        receive: z.string().min(1).max(32),
        address: z.string().max(120).optional(),
        method: z.string().max(16).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { verifyIdToken } = await import("@/lib/verify-token.server");
    const { createDocument, getDocument } = await import(
      "@/lib/firestore.server"
    );
    const { randomUpi, randomBank } = await import("@/lib/upi.server");

    const user = await verifyIdToken(data.idToken);

    // Server-side KYC gate: order tabhi banega jab KYC verified ho.
    const kyc = (await getDocument(
      "kyc",
      user.email.trim().toLowerCase(),
    )) as { status?: string } | null;
    if (kyc?.status !== "verified") {
      throw new Error("KYC required before placing an order.");
    }

    const id = `${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
    const createdAt = new Date().toISOString();
    const upi = await randomUpi();
    const bank = data.method === "bank" ? await randomBank() : null;
    if (data.method === "bank" && !bank) {
      throw new Error("Bank transfer is not available right now. Please choose UPI.");
    }

    const order = {
      id,
      uid: user.uid,
      email: user.email,
      status: "confirming",
      amount: data.amount,
      payable: data.amount,
      fiat: data.fiat,
      asset: data.asset,
      receive: data.receive,
      utr: "",
      address: data.address ?? "",
      createdAt,
      updatedAt: createdAt,
      upiId: upi.upiId,
      method: bank ? "bank" : "upi",
      bankName: bank?.bankName ?? "",
      bankAccount: bank?.accountNumber ?? "",
      bankIfsc: bank?.ifsc ?? "",
    };

    await createDocument("orders", id, order);

    return {
      id,
      status: order.status,
      upiId: upi.upiId,
      bank: bank
        ? {
            bankName: bank.bankName,
            holderName: bank.holderName,
            accountNumber: bank.accountNumber,
            ifsc: bank.ifsc,
          }
        : null,
    };
  });

export const listMyOrders = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ idToken: z.string().min(10) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { verifyIdToken } = await import("@/lib/verify-token.server");
    const { listDocuments } = await import("@/lib/firestore.server");
    const user = await verifyIdToken(data.idToken);
    const orders = await listDocuments("orders");
    return orders
      .filter((order) => order["uid"] === user.uid)
      .map((order) => ({
        id: String(order["id"] ?? ""),
        status: String(order["status"] ?? "confirming"),
        amount: Number(order["amount"] ?? 0),
        payable: Number(order["payable"] ?? order["amount"] ?? 0),
        fiat: String(order["fiat"] ?? "INR"),
        asset: String(order["asset"] ?? ""),
        receive: String(order["receive"] ?? ""),
        utr: String(order["utr"] ?? ""),
        createdAt: String(order["createdAt"] ?? ""),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

export const submitOrderUtr = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        idToken: z.string().min(10),
        orderId: z.string().min(10).max(32),
        utr: z.string().regex(/^\d{12}$/),
        payable: z.number().positive(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { verifyIdToken } = await import("@/lib/verify-token.server");
    const { getDocument, patchDocument } = await import(
      "@/lib/firestore.server"
    );
    const { telegram, statusKeyboard, orderMessage } = await import(
      "@/lib/telegram.server"
    );

    const user = await verifyIdToken(data.idToken);
    const existing = await getDocument("orders", data.orderId);
    if (!existing || existing["uid"] !== user.uid) {
      throw new Error("Order not found");
    }

    const updatedAt = new Date().toISOString();
    const order = {
      id: data.orderId,
      status: String(existing["status"] ?? "confirming"),
      amount: Number(existing["amount"] ?? 0),
      utr: data.utr,
      payable: data.payable,
      fiat: String(existing["fiat"] ?? ""),
      asset: String(existing["asset"] ?? ""),
      receive: String(existing["receive"] ?? ""),
      email: String(existing["email"] ?? ""),
      address: String(existing["address"] ?? ""),
      createdAt: String(existing["createdAt"] ?? updatedAt),
      updatedAt,
    };
    await patchDocument("orders", data.orderId, {
      utr: data.utr,
      payable: data.payable,
      updatedAt,
    });

    const chatId = process.env["TELEGRAM_CHAT_ID"];
    if (chatId) {
      const sent = (await telegram("sendMessage", {
        chat_id: chatId,
        text: orderMessage(order),
        parse_mode: "HTML",
        reply_markup: statusKeyboard(data.orderId),
      })) as { result?: { message_id?: number } };
      const messageId = sent.result?.message_id;
      if (messageId) {
        await patchDocument("orders", data.orderId, {
          telegramMessageId: messageId,
        });
      }
    }

    return { id: data.orderId, status: order.status };
  });
