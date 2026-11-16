import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { signInWithCustomToken } from "firebase/auth";
import { ChevronLeft, Loader2, Mail, MailCheck, ShieldCheck } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { requestEmailOtp, verifyEmailOtp } from "@/lib/auth.functions";
import { BrandMark } from "@/components/velqorfi/BrandMark";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect:
      typeof search["redirect"] === "string"
        ? (search["redirect"] as string).replace(/^"|"$/g, "")
        : "/ramp",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Velqorfi" },
      {
        name: "description",
        content:
          "Sign in to Velqorfi with a one-time code sent to your email — no password needed.",
      },
      { property: "og:title", content: "Sign in — Velqorfi" },
      {
        property: "og:description",
        content: "Passwordless email sign in for your Velqorfi orders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[430px] flex-col items-center justify-center gap-4 bg-white px-6">
        <p className="text-[16px] text-ink">
          Signed in as <span className="font-semibold">{user.email}</span>
        </p>
        <Link
          to="/ramp"
          className="rounded-2xl bg-buy-gradient px-6 py-3 text-[14px] font-semibold text-brand-foreground"
        >
          Continue
        </Link>
      </main>
    );
  }

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await requestEmailOtp({ data: { email } });
      setStep("code");
      setNotice(`We sent a 6-digit code to ${email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Authentication is not configured yet.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { token } = await verifyEmailOtp({ data: { email, code } });
      await signInWithCustomToken(auth, token);
      navigate({ to: redirect as string });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-white px-5 pb-16">
      <div className="flex h-16 items-center gap-3">
        <button
          onClick={() => (step === "code" ? setStep("email") : window.history.back())}
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-full border border-ramp-line"
        >
          <ChevronLeft className="h-5 w-5 text-ink" />
        </button>
        <span className="text-[16px] font-semibold text-ink">Sign in</span>
      </div>

      <div className="mt-6 rounded-3xl border border-ramp-line bg-white p-6 shadow-[0_18px_50px_-28px_rgba(18,20,26,0.35)]">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="font-display text-[20px] font-bold text-brand">
            Velqorfi
          </span>
        </div>
        <h1 className="mt-5 text-[22px] font-bold leading-tight text-ink">
          {step === "email" ? "Welcome back" : "Check your inbox"}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          {step === "email"
            ? "Enter your email and we'll send you a one-time code. No password needed."
            : `We sent a 6-digit code to ${email}. It expires in 10 minutes.`}
        </p>

        {step === "email" ? (
          <form onSubmit={sendCode} className="mt-6 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-ink-soft">
                Email address
              </span>
              <div className="flex h-13 items-center gap-2 rounded-2xl border border-ramp-line bg-ramp-soft/40 px-4 transition focus-within:border-brand focus-within:bg-white">
                <Mail className="h-4 w-4 shrink-0 text-ink-soft" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-full w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-soft/60"
                />
              </div>
            </label>
            {error && <p className="text-[12px] text-danger">{error}</p>}
            <button
              type="submit"
              disabled={busy || !email}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-buy-gradient text-[14px] font-semibold text-brand-foreground transition active:scale-[0.99] disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Send code
            </button>
          </form>
        ) : (
          <form onSubmit={confirm} className="mt-6 space-y-3">
            {notice && (
              <p className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-[12px] text-success">
                <MailCheck className="h-4 w-4 shrink-0" /> {notice}
              </p>
            )}
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="––––––"
              className="h-14 w-full rounded-2xl border border-ramp-line bg-ramp-soft/40 px-4 text-center text-[22px] font-bold tracking-[12px] text-ink outline-none transition focus:border-brand focus:bg-white"
            />
            {error && <p className="text-[12px] text-danger">{error}</p>}
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-buy-gradient text-[14px] font-semibold text-brand-foreground transition active:scale-[0.99] disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify &amp; continue
            </button>
            <button
              type="button"
              onClick={() => void sendCode()}
              disabled={busy}
              className="h-11 w-full text-[13px] font-semibold text-brand disabled:opacity-50"
            >
              Resend code
            </button>
          </form>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-ramp-soft/50 px-3 py-2.5 text-[11px] text-ink-soft">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Passwordless &amp; encrypted — we never store a password.
        </div>
      </div>

      <p className="mt-6 text-center text-[12px] text-ink-soft">
        By continuing you agree to the Velqorfi terms of service.
      </p>
    </main>
  );
}

