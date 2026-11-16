// Rule-based first-line support bot. Runs only while no human agent is connected.

export type BotIntent =
  | "live"
  | "order"
  | "greeting"
  | "thanks"
  | "kyc"
  | "fees"
  | "refund"
  | "payment"
  | "account"
  | "bye"
  | "unknown";

const LIVE = [
  "live",
  "agent",
  "human",
  "customer care",
  "customer service",
  "customer support",
  "executive",
  "representative",
  "real person",
  "talk to",
  "speak to",
  "call me",
  "insaan",
  "baat karni",
  "baat krni",
  "baat karao",
  "support team",
  "operator",
  "staff",
];
const ORDER = [
  "order",
  "status",
  "pending",
  "not received",
  "nahi aaya",
  "nhi aaya",
  "nahi mila",
  "nhi mila",
  "crypto",
  "usdt",
  "usdc",
  "coin",
  "token",
  "utr",
  "transaction",
  "txn",
  "delay",
  "stuck",
  "processing",
  "deposit",
  "credited",
  "kab aayega",
  "kab ayega",
  "track",
];

const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

export function detectIntent(raw: string): BotIntent {
  const t = ` ${raw.toLowerCase().trim()} `;
  if (has(t, LIVE)) return "live";
  if (/\b\d{13,20}\b/.test(t)) return "order";
  if (has(t, ["refund", "money back", "paisa wapas", "return my"])) return "refund";
  if (has(t, ORDER)) return "order";
  if (has(t, ["kyc", "verification", "verify", "aadhaar", "pan card", "document"])) return "kyc";
  if (has(t, ["fee", "fees", "charge", "commission", "rate", "price"])) return "fees";
  if (has(t, ["upi", "bank", "payment", "paid", "pay ", "imps", "neft"])) return "payment";
  if (has(t, ["login", "otp", "account", "email", "password", "sign in"])) return "account";
  if (has(t, [" thank", " thx", " thanks", "shukriya", "dhanyavad"])) return "thanks";
  if (has(t, [" bye", "goodbye", " ok bye"])) return "bye";
  if (/^\s*(hi|hii+|hello|hey|hlo|namaste|good (morning|evening|afternoon))\b/.test(t))
    return "greeting";
  return "unknown";
}

export function extractOrderId(raw: string): string | null {
  const m = raw.match(/\b(\d{13,20})\b/);
  return m?.[1] ?? null;
}

export function statusLine(status: string, utrSubmitted: boolean) {
  switch (status) {
    case "completed":
      return "✅ **Completed** — your crypto has been sent to your wallet address. Depending on network congestion it can take a few minutes to reflect.";
    case "processing":
      return "⏳ **Processing** — your payment is verified and the transfer is being processed. This usually completes within 30–60 minutes.";
    case "cancelled":
      return "❌ **Cancelled / Rejected** — we could not verify a matching payment for this order. If money was debited, please connect with a live agent with your UTR.";
    default:
      return utrSubmitted
        ? "🔍 **Confirming payment** — we have received your UTR and our team is verifying the payment. This normally takes 10–30 minutes."
        : "🕒 **Awaiting payment** — we haven't received a UTR for this order yet. Please complete the payment and submit the 12-digit UTR on the payment page.";
  }
}

export const REPLIES: Record<Exclude<BotIntent, "order" | "live">, string> = {
  greeting:
    "Hello! 👋 How can I help you today? You can ask about an order, payments, KYC or fees.",
  thanks: "You're welcome! Is there anything else I can help you with?",
  kyc: "For KYC, please keep a valid government ID ready. Verification is usually completed within a few minutes. If your KYC is stuck, I can connect you to a live agent.",
  fees: "Our rates are shown live on the buy page and include all network fees — the amount you see on the confirm page is exactly what you pay.",
  refund:
    "Refunds for unverified or cancelled orders are processed back to the original payment source within 3–5 working days. Please share your **Order ID** so I can check it.",
  payment:
    "Please pay the exact order amount to the account/UPI shown on the payment page, then submit the 12-digit UTR. If you've already paid, share your **Order ID** and I'll check the status.",
  account:
    "For login issues, use the email OTP option on the login page. OTPs are valid for a few minutes — please check your spam folder too.",
  bye: "Thank you for contacting Velqorfi support. Have a great day! 😊",
  unknown:
    "I'm sorry, I didn't quite get that. I can help with **order status**, **payments**, **KYC** and **fees**. If you'd like to speak to a person, just type *live support*.",
};
