const BRAND = "Velqorfi";
const ACCENT = "#f0b90b";

type OrderLike = {
  id: string;
  asset?: string;
  receive?: string;
  amount?: number;
  payable?: number;
  fee?: number;
  fiat?: string;
  address?: string;
  txHash?: string;
  utr?: string;
  createdAt?: string;
};

function from() {
  return process.env["OTP_FROM_EMAIL"] || `${BRAND} <noreply@velqorfi.com>`;
}

/** Sends an email through Resend. Throws when delivery is not configured. */
export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "Email delivery is not configured yet. Add the RESEND_API_KEY secret.",
    );
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from: from(), to: [to], subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("Resend failed", res.status, body);
    throw new Error(`Email delivery failed [${res.status}]`);
  }
}

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function money(order: OrderLike, value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return `${order.fiat ?? "INR"}${Number(value).toFixed(2)}`;
}

function receiptTime() {
  return `${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC`;
}

/** Label / value rows, AlchemyPay-style two column receipt table. */
function rows(items: Array<[string, string]>) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    ${items
      .filter(([, value]) => value && value !== "-")
      .map(
        ([label, value], index) => `<tr>
        <td style="padding:14px 0;border-top:${index === 0 ? "0" : "1px solid #eef0f3"};color:#8b8f98;font-size:13px;width:42%;vertical-align:top">${esc(label)}</td>
        <td style="padding:14px 0;border-top:${index === 0 ? "0" : "1px solid #eef0f3"};color:#12141a;font-size:13px;font-weight:600;text-align:right;word-break:break-all">${esc(value)}</td>
      </tr>`,
      )
      .join("")}
  </table>`;
}

function sectionTitle(text: string) {
  return `<h2 style="margin:28px 0 4px;font-size:15px;font-weight:700;color:#12141a">${esc(text)}</h2>`;
}

function para(text: string) {
  return `<p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#5c616b">${esc(text)}</p>`;
}

/** Shared responsive shell used by every transactional email. */
export function layout(options: {
  preheader: string;
  title: string;
  body: string;
  footnote?: string;
}) {
  return `<!doctype html>
<html><body style="margin:0;background:#f4f5f7;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <span style="display:none;opacity:0;color:transparent;height:0;overflow:hidden">${esc(options.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e8ec">
    <tr><td style="padding:22px 32px;background:#12141a">
      <span style="color:${ACCENT};font-size:18px;font-weight:800;letter-spacing:.5px">${BRAND}</span>
    </td></tr>
    <tr><td style="padding:34px 32px 36px">
      <h1 style="margin:0 0 22px;font-size:23px;line-height:1.35;color:#12141a;text-align:center;font-weight:700">${esc(options.title)}</h1>
      ${options.body}
      ${
        options.footnote
          ? `<p style="margin:26px 0 0;font-size:12px;line-height:1.7;color:#8b8f98">${esc(options.footnote)}</p>`
          : ""
      }
    </td></tr>
    <tr><td style="padding:18px 32px;background:#fafbfc;border-top:1px solid #e6e8ec">
      <p style="margin:0;font-size:11px;line-height:1.7;color:#8b8f98">This is an automated message from ${BRAND}. Need help? Reply to this email with your order ID.<br/>&copy; ${new Date().getFullYear()} ${BRAND}. All rights reserved.</p>
    </td></tr>
  </table>
</body></html>`;
}

/** Payment verified, asset release in progress. */
export function paymentReceivedEmail(order: OrderLike) {
  const asset = order.asset ?? "crypto";
  const amount = money(order, order.payable ?? order.amount);
  return {
    subject: `Your ${asset} is being sent to your address (${amount})`,
    html: layout({
      preheader: `We have received your payment and your ${asset} is being processed.`,
      title: `Your ${asset} is being sent to your address (${amount})`,
      body: `${para(`Thanks for using ${BRAND}. We have received your payment and we're doing our very best to process your order as quickly as possible.`)}
${para(`You will receive another email once your ${asset} has been sent to your wallet address.`)}
${sectionTitle("Order Details")}
${rows([
  ["Order ID", order.id],
  ["Time", receiptTime()],
  ["Ramp fee", money(order, order.fee)],
  ["UTR / Reference", order.utr ?? "-"],
  ["Payment Amount", amount],
])}
${sectionTitle(`When will I get my ${asset}?`)}
${para("Depending on the network you choose, transactions normally take between a few minutes and half an hour to complete, but may take longer if we need to run additional checks.")}
${para(`While we aim to process your transaction quickly, don't be alarmed if you haven't received your ${asset} after a few hours. Please feel free to contact our support team if your transaction is still pending.`)}`,
      footnote: `When writing to us, please include your Order ID ${order.id}.`,
    }),
  };
}

/** Asset delivered. */
export function orderCompletedEmail(order: OrderLike) {
  const asset = order.asset ?? "crypto";
  const amount = money(order, order.payable ?? order.amount);
  return {
    subject: `Your ${asset} has been sent to your address (${amount})`,
    html: layout({
      preheader: `${order.receive ?? asset} has been sent to your address.`,
      title: `Your ${asset} has been sent to your address (${amount})`,
      body: `${para(`Thanks for using ${BRAND}. Here is your transaction receipt.`)}
${rows([
  ["Receipt Time", receiptTime()],
  ["Order ID", order.id],
  ["Destination wallet address", order.address ?? "-"],
  ["Transaction hash", order.txHash ?? "-"],
  ["Received", order.receive ? `${order.receive}` : "-"],
  ["Amount", amount],
])}
<div style="margin-top:26px">
${para("Once an order / purchase to buy cryptocurrency has been made, it cannot be cancelled or recalled. Please refer to our Terms of Use.")}
${para(`If you have any questions, please feel free to contact our Support Center. When reaching out, kindly include your order code ${order.id}.`)}
</div>`,
    }),
  };
}

/** Order could not be processed. */
export function orderCancelledEmail(order: OrderLike) {
  const amount = money(order, order.payable ?? order.amount);
  return {
    subject: `Your order ${order.id} has been cancelled (${amount})`,
    html: layout({
      preheader: "Your order was cancelled and any payment will be refunded.",
      title: "Your order could not be completed",
      body: `${para(`Thanks for using ${BRAND}. Unfortunately we were unable to process this order. If a payment was debited, it will be refunded to the original payment method within 24 hours.`)}
${sectionTitle("Order Details")}
${rows([
  ["Order ID", order.id],
  ["Time", receiptTime()],
  ["Asset", order.asset ?? "-"],
  ["Quantity", order.receive ?? "-"],
  ["UTR / Reference", order.utr ?? "-"],
  ["Payment Amount", amount],
  ["Status", "Cancelled"],
])}`,
      footnote: `If you believe this is a mistake, reply to this email quoting your Order ID ${order.id} and our team will review it.`,
    }),
  };
}

/** Login one-time passcode. */
export function otpEmail(code: string) {
  return {
    subject: `${code} is your ${BRAND} login code`,
    html: layout({
      preheader: `Your login code is ${code}. It expires in 10 minutes.`,
      title: "Your login code",
      body: `${para("Enter this code to finish signing in. It expires in 10 minutes.")}
      <div style="text-align:center;border:1px solid #e6e8ec;border-radius:12px;background:#fafbfc;padding:22px">
        <span style="font-size:34px;letter-spacing:10px;font-weight:800;color:#12141a">${esc(code)}</span>
      </div>`,
      footnote:
        "If you didn't request this code, you can safely ignore this email — no one can access your account without it.",
    }),
  };
}

/** Sends the status email matching a new order status; failures are logged only. */
export async function sendOrderStatusEmail(status: string, order: OrderLike & { email?: string }) {
  const to = order.email;
  if (!to) return;
  const mail =
    status === "processing"
      ? paymentReceivedEmail(order)
      : status === "completed"
        ? orderCompletedEmail(order)
        : status === "cancelled"
          ? orderCancelledEmail(order)
          : null;
  if (!mail) return;
  try {
    await sendEmail(to, mail.subject, mail.html);
  } catch (error) {
    console.error("Order status email failed", order.id, error);
  }
}
