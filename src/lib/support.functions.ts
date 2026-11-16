import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const sessionInput = z.object({
  sessionId: z.string().min(5).max(40),
  key: z.string().min(20).max(80),
});

/** Public order status lookup used by the support bot (returns no personal data). */
export const lookupOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ orderId: z.string().regex(/^\d{10,20}$/) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { getDocument } = await import("@/lib/firestore.server");
    const o = await getDocument("orders", data.orderId);
    if (!o) return { found: false as const };
    return {
      found: true as const,
      id: data.orderId,
      status: String(o["status"] ?? "confirming"),
      amount: Number(o["amount"] ?? 0),
      fiat: String(o["fiat"] ?? "INR"),
      asset: String(o["asset"] ?? ""),
      receive: String(o["receive"] ?? ""),
      utrSubmitted: Boolean(String(o["utr"] ?? "")),
      createdAt: String(o["createdAt"] ?? ""),
      updatedAt: String(o["updatedAt"] ?? ""),
    };
  });

export const startLiveSupport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(80),
        email: z.string().trim().email().max(120),
        businessType: z.string().max(40),
        issueType: z.string().max(60),
        description: z.string().max(1000),
        transcript: z.string().max(4000),
        botTranscript: z.string().max(200000).optional(),
        idToken: z.string().max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { createSession } = await import("@/lib/support.server");
    let userId = "";
    if (data.idToken) {
      try {
        const { verifyIdToken } = await import("@/lib/verify-token.server");
        userId = (await verifyIdToken(data.idToken)).uid;
      } catch {
        userId = "";
      }
    }
    const { idToken: _t, ...rest } = data;
    return createSession({ ...rest, userId });
  });

/** Signed-in users: reopen their still-open live chat (on any device). */
export const resumeSupport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ idToken: z.string().min(10).max(4000) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { verifyIdToken } = await import("@/lib/verify-token.server");
    const { resumeForUser } = await import("@/lib/support.server");
    const user = await verifyIdToken(data.idToken);
    return resumeForUser(user.uid);
  });

export const sendSupportPhoto = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    sessionInput
      .extend({
        image: z
          .string()
          .max(900_000)
          .regex(/^data:image\/(jpeg|png|webp);base64,/),
        caption: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const s = await import("@/lib/support.server");
    const { patchDocument } = await import("@/lib/firestore.server");
    const session = await s.authSession(data.sessionId, data.key);
    if (session.status === "closed") throw new Error("This chat has ended.");
    const caption = data.caption?.trim() ?? "";
    await s.addMessage(session.id, "user", caption, data.image);
    await patchDocument("support_sessions", session.id, { lastUserAt: new Date().toISOString() });
    if (session.status === "active") {
      const mid = await s.sendPhotoToTelegram(
        data.image,
        `📷 <b>${s.esc(session.name)}</b> · <code>${session.id}</code>${caption ? `\n${s.esc(caption)}` : ""}\n\n<i>Reply to this message to answer.</i>`,
      );
      await s.mapTelegramMessage(mid, session.id);
    }
    return { ok: true };
  });

export const sendSupportMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    sessionInput.extend({ text: z.string().trim().min(1).max(2000) }).parse(input),
  )
  .handler(async ({ data }) => {
    const s = await import("@/lib/support.server");
    const { telegram } = await import("@/lib/telegram.server");
    const { patchDocument } = await import("@/lib/firestore.server");
    const session = await s.authSession(data.sessionId, data.key);
    if (session.status === "closed") throw new Error("This chat has ended.");
    await s.addMessage(session.id, "user", data.text);
    await patchDocument("support_sessions", session.id, { lastUserAt: new Date().toISOString() });
    if (session.status === "active") {
      const chatId = process.env["TELEGRAM_CHAT_ID"];
      if (chatId) {
        const sent = (await telegram("sendMessage", {
          chat_id: chatId,
          parse_mode: "HTML",
          text: `💬 <b>${s.esc(session.name)}</b> · <code>${session.id}</code>\n${s.esc(data.text)}\n\n<i>Reply to this message to answer. Reply "end" to close the chat.</i>`,
        })) as { result?: { message_id?: number } };
        await s.mapTelegramMessage(sent.result?.message_id, session.id);
      }
    }
    return { ok: true };
  });

export const pollSupport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => sessionInput.parse(input))
  .handler(async ({ data }) => {
    const s = await import("@/lib/support.server");
    let session = await s.authSession(data.sessionId, data.key);
    if (
      session.status !== "closed" &&
      Date.now() - Date.parse(session.lastUserAt || "0") > s.INACTIVITY_CLOSE_MS
    ) {
      await s.closeSession(session.id, "inactive", true);
      session = { ...session, status: "closed", closedReason: "inactive" };
    }
    const messages = await s.listMessages(session.id);
    return {
      status: session.status,
      agentName: session.agentName,
      agentPhoto: session.agentPhoto,
      closedReason: session.closedReason,
      lastUserAt: session.lastUserAt,
      messages,
    };
  });

export const endSupport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => sessionInput.parse(input))
  .handler(async ({ data }) => {
    const s = await import("@/lib/support.server");
    const session = await s.authSession(data.sessionId, data.key);
    await s.closeSession(session.id, "user", true);
    return { ok: true };
  });
