import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import {
  createDocument,
  getDocument,
  patchDocument,
  queryByField,
  setDocument,
} from "./firestore.server";
import { telegram } from "./telegram.server";

export const INACTIVITY_CLOSE_MS = 10 * 60 * 1000;

const AGENTS = [
  { name: "Priya Sharma", photo: "https://randomuser.me/api/portraits/women/44.jpg" },
  { name: "Ananya Iyer", photo: "https://randomuser.me/api/portraits/women/68.jpg" },
  { name: "Sneha Kapoor", photo: "https://randomuser.me/api/portraits/women/21.jpg" },
  { name: "Riya Mehta", photo: "https://randomuser.me/api/portraits/women/12.jpg" },
  { name: "Neha Verma", photo: "https://randomuser.me/api/portraits/women/50.jpg" },
  { name: "Rahul Verma", photo: "https://randomuser.me/api/portraits/men/32.jpg" },
  { name: "Arjun Nair", photo: "https://randomuser.me/api/portraits/men/46.jpg" },
  { name: "Karan Malhotra", photo: "https://randomuser.me/api/portraits/men/22.jpg" },
  { name: "Aditya Rao", photo: "https://randomuser.me/api/portraits/men/75.jpg" },
  { name: "Vikram Singh", photo: "https://randomuser.me/api/portraits/men/11.jpg" },
];

export function randomAgent() {
  return AGENTS[Math.floor(Math.random() * AGENTS.length)] ?? AGENTS[0]!;
}

export function esc(v: unknown) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export type Session = {
  id: string;
  status: "waiting" | "active" | "closed";
  name: string;
  email: string;
  agentName: string;
  agentPhoto: string;
  lastUserAt: string;
  closedReason: string;
};

function toSession(d: Record<string, unknown>): Session {
  return {
    id: String(d["id"] ?? ""),
    status: String(d["status"] ?? "closed") as Session["status"],
    name: String(d["name"] ?? ""),
    email: String(d["email"] ?? ""),
    agentName: String(d["agentName"] ?? ""),
    agentPhoto: String(d["agentPhoto"] ?? ""),
    lastUserAt: String(d["lastUserAt"] ?? ""),
    closedReason: String(d["closedReason"] ?? ""),
  };
}

/** Load a session and verify the caller holds its secret key. */
export async function authSession(id: string, key: string): Promise<Session> {
  const doc = await getDocument("support_sessions", id);
  if (!doc) throw new Error("Chat session not found");
  const a = Buffer.from(String(doc["keyHash"] ?? ""));
  const b = Buffer.from(hashKey(key));
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Chat session not found");
  return toSession(doc);
}

export async function getSession(id: string): Promise<Session | null> {
  const doc = await getDocument("support_sessions", id);
  return doc ? toSession(doc) : null;
}

export async function addMessage(
  sessionId: string,
  from: "user" | "agent" | "system",
  text: string,
  image = "",
) {
  const at = new Date().toISOString();
  const id = `${sessionId}_${Date.now()}_${randomBytes(3).toString("hex")}`;
  await createDocument("support_messages", id, { sessionId, from, text, at, image });
}

/** Send a user photo (data URL) to the admin Telegram chat; returns the Telegram message id. */
export async function sendPhotoToTelegram(dataUrl: string, caption: string) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("Unsupported image");
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const bytes = Buffer.from(m[2]!, "base64");
  const form = new FormData();
  form.append("chat_id", adminChat());
  form.append("caption", caption.slice(0, 1000));
  form.append("parse_mode", "HTML");
  form.append("photo", new Blob([bytes], { type: m[1] ?? "image/jpeg" }), "photo.jpg");
  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: form,
  });
  const body = (await res.json()) as {
    ok: boolean;
    description?: string;
    result?: { message_id?: number };
  };
  if (!res.ok || !body.ok)
    throw new Error(`Telegram sendPhoto failed: ${body.description ?? res.status}`);
  return body.result?.message_id;
}

/** Find the signed-in user's open chat and issue a fresh key for it. */
export async function resumeForUser(userId: string) {
  const rows = await queryByField("support_sessions", "userId", userId);
  const open = rows
    .filter((r) => String(r["status"] ?? "") !== "closed")
    .sort((a, b) => String(b["createdAt"] ?? "").localeCompare(String(a["createdAt"] ?? "")))[0];
  if (!open) return null;
  const id = String(open["id"]);
  const key = randomBytes(24).toString("hex");
  await patchDocument("support_sessions", id, { keyHash: hashKey(key) });
  return {
    id,
    key,
    profile: {
      name: String(open["name"] ?? ""),
      email: String(open["email"] ?? ""),
      businessType: String(open["businessType"] ?? ""),
      issueType: String(open["issueType"] ?? ""),
      description: String(open["description"] ?? ""),
    },
    botTranscript: String(open["botTranscript"] ?? ""),
  };
}

export async function listMessages(sessionId: string) {
  const rows = await queryByField("support_messages", "sessionId", sessionId);
  return rows
    .map((r) => ({
      id: String(r["id"] ?? ""),
      from: String(r["from"] ?? "system"),
      text: String(r["text"] ?? ""),
      at: String(r["at"] ?? ""),
      image: String(r["image"] ?? ""),
    }))
    .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}

/** Remember which Telegram message belongs to which chat, so replies can be routed. */
export async function mapTelegramMessage(messageId: number | undefined, sessionId: string) {
  if (!messageId) return;
  await setDocument("support_tgmap", String(messageId), { sessionId });
}

export async function sessionForTelegramMessage(messageId: number) {
  const doc = await getDocument("support_tgmap", String(messageId));
  return doc ? String(doc["sessionId"] ?? "") : "";
}

function adminChat() {
  const chatId = process.env["TELEGRAM_CHAT_ID"];
  if (!chatId) throw new Error("Live support is not available right now.");
  return chatId;
}

export async function createSession(input: {
  name: string;
  email: string;
  businessType: string;
  issueType: string;
  description: string;
  transcript: string;
  userId?: string | undefined;
  botTranscript?: string | undefined;
}) {
  const chatId = adminChat();
  const id = `cs${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
  const key = randomBytes(24).toString("hex");
  const now = new Date().toISOString();
  await createDocument("support_sessions", id, {
    status: "waiting",
    keyHash: hashKey(key),
    name: input.name,
    email: input.email,
    businessType: input.businessType,
    issueType: input.issueType,
    description: input.description,
    agentName: "",
    agentPhoto: "",
    createdAt: now,
    lastUserAt: now,
    closedReason: "",
    userId: input.userId ?? "",
    botTranscript: (input.botTranscript ?? "").slice(0, 200000),
  });
  const sent = (await telegram("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: [
      `🆘 <b>Live support request</b> — <code>${id}</code>`,
      "",
      `Name: <b>${esc(input.name)}</b>`,
      `Email: ${esc(input.email)}`,
      `Business: ${esc(input.businessType)}`,
      `Issue: ${esc(input.issueType)}`,
      `Description: ${esc(input.description)}`,
      input.transcript ? `\n<b>Bot chat so far</b>\n${esc(input.transcript).slice(0, 2500)}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Accept", callback_data: `sup_accept:${id}` },
          { text: "❌ Decline", callback_data: `sup_decline:${id}` },
        ],
      ],
    },
  })) as { result?: { message_id?: number } };
  await mapTelegramMessage(sent.result?.message_id, id);
  return { id, key };
}

export async function closeSession(id: string, reason: string, notifyTelegram: boolean) {
  const s = await getSession(id);
  if (!s || s.status === "closed") return;
  await patchDocument("support_sessions", id, { status: "closed", closedReason: reason });
  const text =
    reason === "inactive"
      ? "This chat was closed due to 10 minutes of inactivity. Feel free to start a new chat anytime."
      : reason === "agent"
        ? "The support agent has ended this chat. Thank you for contacting Velqorfi support!"
        : reason === "declined"
          ? "All our agents are busy right now. Please try again shortly or email support@velqorfi.org."
          : "You ended this chat. Thank you for contacting Velqorfi support!";
  await addMessage(id, "system", text);
  if (notifyTelegram) {
    try {
      await telegram("sendMessage", {
        chat_id: adminChat(),
        parse_mode: "HTML",
        text: `🔒 Chat <code>${id}</code> (${esc(s.name)}) closed — ${reason === "inactive" ? "user inactive 10 min" : reason === "user" ? "ended by user" : reason}.`,
      });
    } catch (e) {
      console.error("Telegram close notice failed", e);
    }
  }
}
