const API = "https://api.telegram.org";

function token(): string {
  const t = process.env["TELEGRAM_BOT_TOKEN"];
  if (!t) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return t;
}

export async function telegram(method: string, payload: unknown) {
  const res = await fetch(`${API}/bot${token()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await res.json()) as { ok: boolean; description?: string };
  if (!res.ok || !body.ok) {
    const detail = body.description ?? JSON.stringify(body);
    console.error(`Telegram ${method} failed [${res.status}]: ${detail}`);
    throw new Error(`Telegram ${method} failed [${res.status}]: ${detail}`);
  }
  return body;
}

export function statusKeyboard(orderId: string) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Complete", callback_data: `set:completed:${orderId}` },
        { text: "⏳ Processing", callback_data: `set:processing:${orderId}` },
        { text: "❌ Cancel", callback_data: `set:cancelled:${orderId}` },
      ],
    ],
  };
}

/**
 * Completed → Unprocess → Processing; Processing → Uncomplete → Confirming.
 */
export function keyboardForStatus(status: string, orderId: string) {
  if (status === "completed") {
    return {
      inline_keyboard: [
        [{ text: "↩️ Unprocess", callback_data: `set:processing:${orderId}` }],
      ],
    };
  }
  if (status === "confirming") return statusKeyboard(orderId);
  if (status === "cancelled") {
    return { inline_keyboard: [] };
  }
  return {
    inline_keyboard: [
      ...(status === "processing" ? [[{ text: "↩️ Uncomplete", callback_data: `set:confirming:${orderId}` }]] : []),
      [
        { text: "\u2705 Complete", callback_data: `set:completed:${orderId}` },
        { text: "\u274c Reject", callback_data: `set:cancelled:${orderId}` },
      ],
    ],
  };
}

function esc(v: unknown) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function orderMessage(o: {
  id: string;
  status: string;
  amount: number;
  payable: number;
  fiat: string;
  asset: string;
  receive: string;
  utr: string;
  email: string;
  address?: string;
  method?: string;
  upiId?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  createdAt: string;
}) {
  return [
    `<b>New order</b> — <code>${esc(o.id)}</code>`,
    `Status: <b>${esc(o.status.toUpperCase())}</b>`,
    "",
    `Amount: <b>${esc(o.amount)} ${esc(o.fiat)}</b>`,
    `Paid (unique): <b>₹${esc(o.payable)}</b>`,
    `Asset: <b>${esc(o.receive)} ${esc(o.asset)}</b>`,
    o.method === "bank"
      ? `Payment: <b>Bank Transfer</b>\nBank: ${esc(o.bankName || "Not recorded")}\nA/C: <code>${esc(o.bankAccount || "Not recorded")}</code>\nIFSC: <code>${esc(o.bankIfsc || "Not recorded")}</code>`
      : `Payment: <b>UPI</b>\nUPI ID: <code>${esc(o.upiId || "Not recorded (legacy order)")}</code>`,
    `UTR: <code>${esc(o.utr)}</code>`,
    `User: ${esc(o.email)}`,
    o.address ? `Wallet: <code>${esc(o.address)}</code>` : "",
    `Time: ${esc(o.createdAt)}`,
  ]
    .filter(Boolean)
    .join("\n");
}
