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
 * Buttons that stay available for an order that is still open.
 * Once an order is completed or cancelled the keyboard is removed.
 */
export function keyboardForStatus(status: string, orderId: string) {
  if (status === "completed" || status === "cancelled") {
    return { inline_keyboard: [] };
  }
  return {
    inline_keyboard: [
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
  createdAt: string;
}) {
  return [
    `<b>New order</b> — <code>${esc(o.id)}</code>`,
    `Status: <b>${esc(o.status.toUpperCase())}</b>`,
    "",
    `Amount: <b>${esc(o.amount)} ${esc(o.fiat)}</b>`,
    `Paid (unique): <b>₹${esc(o.payable)}</b>`,
    `Asset: <b>${esc(o.receive)} ${esc(o.asset)}</b>`,
    `UTR: <code>${esc(o.utr)}</code>`,
    `User: ${esc(o.email)}`,
    o.address ? `Wallet: <code>${esc(o.address)}</code>` : "",
    `Time: ${esc(o.createdAt)}`,
  ]
    .filter(Boolean)
    .join("\n");
}
