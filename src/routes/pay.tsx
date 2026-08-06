import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { CheckoutBlue } from "@/components/checkout/CheckoutBlue";
import { CheckoutTeal } from "@/components/checkout/CheckoutTeal";
import { useAuth } from "@/hooks/use-auth";
import { submitOrderUtr } from "@/lib/orders.functions";

export const Route = createFileRoute("/pay")({
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: cleanSearchValue(search["orderId"], ""),
    upiId: cleanSearchValue(search["upiId"], ""),
    amount: cleanSearchValue(search["amount"], "1500"),
    fiat: cleanSearchValue(search["fiat"], "INR"),
    asset: cleanSearchValue(search["asset"], "USDC"),
    receive: cleanSearchValue(search["receive"], "0"),
    address: cleanSearchValue(search["address"], ""),
  }),
  head: () => ({
    meta: [
      { title: "Complete UPI Payment — Velqorfi" },
      {
        name: "description",
        content:
          "Scan the UPI QR code or copy the UPI ID to complete your Velqorfi crypto order, then submit your 12-digit UTR.",
      },
      { property: "og:title", content: "Complete UPI Payment — Velqorfi" },
      {
        property: "og:description",
        content:
          "Pay with any UPI app and submit your UTR to finish your Velqorfi order.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pay,
});

function cleanSearchValue(value: unknown, fallback: string) {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return fallback;
  return value.replace(/^"|"$/g, "");
}

function Pay() {
  const { orderId, upiId, amount, fiat, asset, receive, address } = Route.useSearch();
  const original = Number(amount) || 0;
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Skin + unique payable amount are picked on the client so every visit
  // gets one of the two checkout designs at random.
  const [skin, setSkin] = useState<"blue" | "teal" | null>(null);
  const [payable, setPayable] = useState(original);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setSkin(Math.random() < 0.5 ? "blue" : "teal");
    const offset = Math.floor(Math.random() * 199) / 100 + 0.01;
    setPayable(Math.max(1, Number((original - offset).toFixed(2))));
  }, [original]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { redirect: "/ramp" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => navigate({ to: "/history" }), 3000);
    return () => clearTimeout(t);
  }, [success, navigate]);

  async function handlePaid(utr: string) {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const idToken = await user?.getIdToken();
      if (!idToken) throw new Error("Please sign in again.");
      if (!orderId) throw new Error("Order is missing. Please place it again.");
      await submitOrderUtr({
        data: {
          idToken,
          orderId,
          payable,
          utr,
        },
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit your UTR.",
      );
      setSubmitting(false);
    }
  }

  if (!skin) return <div className="min-h-screen bg-white" />;

  return (
    <>
      {error && (
        <p className="bg-danger/10 px-4 py-2 text-center text-[13px] text-danger">
          {error}
        </p>
      )}
      {skin === "blue" ? (
        <CheckoutBlue payable={payable} original={original} onPaid={handlePaid} upiId={upiId} />
      ) : (
        <CheckoutTeal payable={Math.round(payable)} onPaid={handlePaid} upiId={upiId} />
      )}
      {success && <SuccessPopup />}
    </>
  );
}

function SuccessPopup() {
  const [left, setLeft] = useState(3);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-8">
      <div className="w-full max-w-[320px] rounded-2xl bg-white px-6 py-7 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h2 className="mt-4 font-display text-[18px] font-bold text-ink">
          Payment success
        </h2>
        <p className="mt-1.5 text-[13px] text-ink-soft">
          Redirecting you in {left} second{left === 1 ? "" : "s"}…
        </p>
      </div>
    </div>
  );
}
