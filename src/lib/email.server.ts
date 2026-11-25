const BRAND = "Velqorfi";

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
  return `${order.fiat ?? "INR"} ${Number(value).toFixed(2)}`;
}

function receiptTime() {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) + " IST";
}

/** Plain label / value receipt list. */
function rows(items: Array<[string, string]>) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">
    ${items
      .filter(([, value]) => value && value !== "-")
      .map(
        ([label, value]) => `<tr>
        <td style="padding:7px 0;color:#666666;width:45%;vertical-align:top">${esc(label)}</td>
        <td style="padding:7px 0;color:#222222;font-weight:600;text-align:right;word-break:break-all">${esc(value)}</td>
      </tr>`,
      )
      .join("")}
  </table>`;
}

function sectionTitle(text: string) {
  return `<p style="margin:20px 0 6px;font-size:14px;font-weight:700;color:#222222">${esc(text)}</p>`;
}

function para(text: string) {
  return `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#444444">${esc(text)}</p>`;
}

const RULE = `<div style="border-top:1px solid #eeeeee;margin:16px 0"></div>`;

/** Simple receipt shell used by every email: white page, thin border, no banners. */
export function layout(options: {
  preheader: string;
  title: string;
  body: string;
  footnote?: string;
}) {
  return `<!doctype html>
<html><body style="margin:0;background:#ffffff;padding:20px 12px;font-family:Arial,Helvetica,sans-serif;color:#222222">
  <span style="display:none;opacity:0;color:transparent;height:0;overflow:hidden">${esc(options.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;border:1px solid #e5e5e5">
    <tr><td style="padding:22px 24px">
      <div style="font-size:16px;font-weight:700;color:#222222">${BRAND}</div>
      ${RULE}
      <div style="font-size:18px;font-weight:700;color:#222222;margin:0 0 4px">${esc(options.title)}</div>
      <div style="font-size:12px;color:#888888;margin:0 0 16px">${esc(receiptTime())}</div>
      ${options.body}
      ${RULE}
      <p style="margin:0;font-size:12px;line-height:1.6;color:#888888">${esc(options.footnote ?? "Questions? Just reply to this email with your order ID.")}</p>
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
      title: "Payment received",
      body: `${para(`Thanks for using ${BRAND}. We have received your payment and we're doing our very best to process your order as quickly as possible.`)}
${para(`You will receive another email once your ${asset} has been sent to your wallet address.`)}
${sectionTitle("Order Details")}
${rows([
  ["Order ID", order.id],
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
      title: `${asset} sent`,
      body: `${para(`Thanks for using ${BRAND}. Here is your transaction receipt.`)}
${rows([
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
      title: "Order cancelled",
      body: `${para(`Thanks for using ${BRAND}. Unfortunately we were unable to process this order. If a payment was debited, it will be refunded to the original payment method within 24 hours.`)}
${sectionTitle("Order Details")}
${rows([
  ["Order ID", order.id],
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

/** KYC approved. */
export function kycVerifiedEmail(name: string) {
  return {
    subject: `Your ${BRAND} KYC is verified`,
    html: layout({
      preheader: "Your identity verification is complete. You can now buy crypto without limits.",
      title: "KYC verified",
      body: `${para(`Hi ${name}, your identity verification is complete.`)}
${rows([
  ["Status", "Verified"],
  ["Verified on", receiptTime()],
])}
${para("You will not be asked for KYC again on this account. You can continue placing orders right away.")}`,
      footnote: "If you didn't submit this KYC, reply to this email immediately.",
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
      <p style="margin:8px 0 4px;font-size:28px;letter-spacing:6px;font-weight:700;color:#222222">${esc(code)}</p>`,
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
