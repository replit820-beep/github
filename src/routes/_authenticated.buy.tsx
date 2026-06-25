import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CoinIcon } from "@/components/brand/CoinIcon";
import { CoinPicker, type CoinNetworkSelection } from "@/components/coin/CoinPicker";
import { COINS, COIN_BY_SYMBOL, MIN_INR, MAX_INR, FEE_RATE } from "@/lib/coins";
import { usePrices } from "@/hooks/use-prices";
import { formatINR, formatCrypto } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Copy, Zap, Wallet as WalletIcon, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePaymentSettings } from "@/lib/payment-settings";

export const Route = createFileRoute("/_authenticated/buy")({
  validateSearch: (s: Record<string, unknown>) => ({
    coin: typeof s.coin === "string" ? s.coin : "USDT",
    amount: typeof s.amount === "number" ? s.amount : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Buy Crypto with UPI · Velqorfi" },
      { name: "description", content: "Buy USDT, BTC, ETH and more with UPI. Instant settlement, low fees." },
    ],
  }),
  component: BuyPage,
});

const MERCHANT_NAME = "Velqorfi";
const PAY_WINDOW_SECONDS = 30 * 60;

function BuyPage() {
  const { coin: initCoin, amount: initAmount } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: prices } = usePrices();
  const paymentSettings = usePaymentSettings();

  const initialCoin = COIN_BY_SYMBOL[initCoin] ?? COIN_BY_SYMBOL.USDT;
  const [selection, setSelection] = useState<CoinNetworkSelection>({
    coinId: initialCoin.id,
    networkId: initialCoin.networks[0].id,
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [amount, setAmount] = useState<string>(String(initAmount ?? 2500));
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0); // 0 = quote, 1-3 = wizard
  const [address, setAddress] = useState("");
  const [utr, setUtr] = useState("");
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stepLoading, setStepLoading] = useState<null | 1 | 2 | 3>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const coin = COINS.find((c) => c.id === selection.coinId) ?? COIN_BY_SYMBOL.USDT;
  const network = coin.networks.find((n) => n.id === selection.networkId) ?? coin.networks[0];

  const fiat = Number(amount) || 0;
  const basePrice = prices?.[coin.id]?.inr ?? 0;
  // Markup: USDT gets a flat ₹4 premium on buy
  const markup = coin.symbol === "USDT" && basePrice > 0 ? 4 : 0;
  const rate = basePrice > 0 ? basePrice + markup : 0;
  const fee = fiat * FEE_RATE;
  const cryptoAmount = rate > 0 ? (fiat - fee) / rate : 0;
  const amountError = fiat > 0 && (fiat < MIN_INR || fiat > MAX_INR);

  const goToStep = (next: 1 | 2 | 3, delayMs: number) => {
    setStepLoading(next);
    setTimeout(() => {
      setStep(next);
      setStepLoading(null);
    }, delayMs);
  };

  const handleProceed = () => {
    if (!user) {
      toast.error("Please sign in to continue");
      navigate({ to: "/auth" });
      return;
    }
    if (amountError || fiat < MIN_INR) return toast.error(`Min ₹${MIN_INR.toLocaleString("en-IN")}`);
    goToStep(1, 900);
  };

  // Browser back guard on step 3
  useEffect(() => {
    if (step !== 3) return;
    window.history.pushState({ buyStep3: true }, "");
    const onPop = () => {
      setCancelOpen(true);
      window.history.pushState({ buyStep3: true }, "");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [step]);

  return (
    <AppShell hideNav>
      <div className="min-h-screen bg-background">
        {step === 0 && (
          <QuoteStep
            coin={coin}
            network={network}
            amount={amount}
            setAmount={setAmount}
            rate={rate}
            cryptoAmount={cryptoAmount}
            amountError={amountError}
            openPicker={() => setPickerOpen(true)}
            onProceed={handleProceed}
            loading={stepLoading === 1}
          />
        )}

        {step >= 1 && step <= 3 && (
          <WizardHeader
            step={step as 1 | 2 | 3}
            title={
              step === 1 ? `Enter ${coin.symbol} Wallet address` :
              step === 2 ? "Choose payment method" :
              "Pay via UPI"
            }
            onBack={() => {
              if (step === 3) { setCancelOpen(true); return; }
              setStep((s) => (s === 1 ? 0 : ((s - 1) as 1 | 2)));
            }}
          />
        )}

        {step === 1 && (
          <AddressStep
            coin={coin}
            network={network}
            address={address}
            setAddress={setAddress}
            openPicker={() => setPickerOpen(true)}
            onProceed={() => goToStep(2, 800)}
            loading={stepLoading === 2}
          />
        )}

        {step === 2 && (
          <PaymentMethodStep onProceed={() => goToStep(3, 1100)} loading={stepLoading === 3} />
        )}

        {step === 3 && (
          <UpiPayStep
            fiat={fiat}
            coin={coin}
            cryptoAmount={cryptoAmount}
            upiId={paymentSettings.upiId}
            customQr={paymentSettings.qrImage}
            utr={utr}
            setUtr={setUtr}
            processing={processing}
            onConfirm={async () => {
              if (!user) return;
              if (utr.trim().length < 6) return toast.error("Enter a valid UTR / transaction ID");
              setProcessing(true);
              const { data, error } = await supabase.from("orders").insert({
                user_id: user.id,
                type: "buy",
                coin: coin.symbol,
                network: network.id,
                fiat_amount_inr: fiat,
                crypto_amount: cryptoAmount,
                rate_inr: rate,
                fee_inr: fee,
                wallet_address: address,
                upi_app: "upi",
                upi_id: paymentSettings.upiId,
                status: "pending",
              }).select("id").single();
              setProcessing(false);
              if (error) return toast.error(error.message);
              setSuccessOrder(data.id);
            }}
          />
        )}
      </div>

      <CoinPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selected={selection}
        onSelect={(sel) => setSelection(sel)}
      />

      <Dialog open={!!successOrder} onOpenChange={(o) => { if (!o) { setSuccessOrder(null); navigate({ to: "/" }); } }}>
        <DialogContent className="max-w-sm">
          <div className="py-4 text-center">
            <CheckCircle2 size={56} className="mx-auto text-success" />
            <h3 className="mt-3 text-xl font-bold">Payment submitted!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We'll send {formatCrypto(cryptoAmount)} {coin.symbol} on {network.label} once your UPI payment is verified (usually under 5 minutes).
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setSuccessOrder(null); navigate({ to: "/" }); }}>Home</Button>
              <Button className="brand-gradient flex-1 text-white" onClick={() => navigate({ to: "/app/orders" })}>View orders</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-sm">
          <div className="py-2 text-center">
            <AlertCircle size={48} className="mx-auto text-amber-500" />
            <h3 className="mt-3 text-lg font-bold">Cancel this transaction?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              If you've already paid via UPI, do not cancel — submit your UTR instead. Cancelling will close this order.
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCancelOpen(false)}>
                Keep paying
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setCancelOpen(false);
                  setStep(0);
                  setUtr("");
                  navigate({ to: "/" });
                }}
              >
                Yes, cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

/* ─────────── Quote (step 0) ─────────── */
function QuoteStep({
  coin, network, amount, setAmount, rate, cryptoAmount, amountError, openPicker, onProceed, loading,
}: any) {
  return (
    <div className="px-5 pt-5">
      <header className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft size={16} /> Home
        </Link>
      </header>

      <div className="mt-5 flex gap-6 border-b text-base font-bold">
        <span className="border-b-2 border-primary pb-3 text-primary">Buy Crypto</span>
        <Link to="/sell" className="pb-3 text-muted-foreground">Sell Crypto</Link>
      </div>

      <section className="mt-6 space-y-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">You pay</p>
          <div className="mt-2 flex items-center justify-between rounded-2xl border bg-card px-4 py-4">
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              className="h-12 border-0 px-0 text-3xl font-extrabold shadow-none focus-visible:ring-0"
            />
            <div className="flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
              <img src="https://flagcdn.com/w40/in.png" alt="India" className="h-6 w-6 rounded-full object-cover" />
              <span className="text-sm font-bold">INR</span>
            </div>
          </div>
          {amountError && <p className="mt-1 text-xs text-destructive">Min ₹{MIN_INR.toLocaleString("en-IN")} · Max ₹{MAX_INR.toLocaleString("en-IN")}</p>}
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">You receive (estimate)</p>
          <div className="mt-2 flex items-center justify-between rounded-2xl border bg-card px-4 py-4">
            <p className="text-3xl font-extrabold tabular-nums">
              {rate > 0 ? formatCrypto(cryptoAmount) : "—"}
            </p>
            <button onClick={openPicker} className="flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
              <CoinIcon coin={coin} size={28} />
              <div className="text-left leading-tight">
                <p className="text-sm font-bold">{coin.symbol}</p>
                <p className="text-[10px] text-muted-foreground">{network.label}</p>
              </div>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-secondary/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Your order</span>
          <span className="font-bold">
            {formatCrypto(cryptoAmount)} {coin.symbol} for {formatINR(Number(amount) || 0)}
          </span>
        </div>

        <Button
          onClick={onProceed}
          disabled={loading}
          className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
        >
          {loading ? (<><Loader2 size={18} className="mr-2 animate-spin" /> Preparing order…</>) : (<>Proceed · Buy {coin.symbol} <ArrowRight size={18} className="ml-1" /></>)}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Rate: 1 {coin.symbol} = {rate > 0 ? formatINR(rate) : "—"} · Fee 1%
        </p>
      </section>
    </div>
  );
}

/* ─────────── Wizard header (steps 1–3) ─────────── */
function WizardHeader({ step, title, onBack }: { step: 1 | 2 | 3; title: string; onBack: () => void }) {
  return (
    <div className="px-5 pt-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold leading-tight">{title}</h1>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <span className="text-xs font-semibold text-muted-foreground">Step {step} of 3</span>
        <div className="flex flex-1 gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Step 1: Address ─────────── */
function AddressStep({ coin, network, address, setAddress, openPicker, onProceed, loading }: any) {
  return (
    <section className="px-5 pt-6 space-y-5">
      <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <p>Please enter your wallet address accurately. Only enter the address of a wallet that you own and to which you have access.</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-muted-foreground">Network</p>
        <button
          onClick={openPicker}
          className="flex w-full items-center justify-between rounded-2xl border bg-card px-4 py-4"
        >
          <div className="flex items-center gap-3">
            <CoinIcon coin={coin} size={32} />
            <span className="text-base font-bold">{network.label}</span>
          </div>
          <ChevronDown size={18} />
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-muted-foreground">Wallet address</p>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your wallet address here"
          className="h-14 rounded-2xl border bg-card px-4 font-mono text-sm"
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-background/95 px-5 pb-6 pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <Button
          onClick={onProceed}
          disabled={address.trim().length < 8 || loading}
          className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
        >
          {loading ? (<><Loader2 size={18} className="mr-2 animate-spin" /> Verifying address…</>) : (<>Proceed <ArrowRight size={18} className="ml-1" /></>)}
        </Button>
      </div>
    </section>
  );
}

/* ─────────── Step 2: Payment method ─────────── */
function PaymentMethodStep({ onProceed, loading }: { onProceed: () => void; loading?: boolean }) {
  const [selected, setSelected] = useState<string>("upi");
  return (
    <section className="px-5 pt-6 space-y-3">
      {[
        { id: "upi", title: "UPI / E-Wallet", sub: "Instant", icon: <WalletIcon size={20} /> },
      ].map((m) => (
        <button
          key={m.id}
          onClick={() => setSelected(m.id)}
          className="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left"
        >
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary">
            {m.icon}
          </div>
          <div className="flex-1">
            <p className="text-base font-bold">{m.title}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Zap size={12} className="text-amber-500" />
              {m.sub}
            </p>
          </div>
          <span className="rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary">UPI</span>
          <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${selected === m.id ? "border-primary" : "border-border"}`}>
            {selected === m.id && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
          </span>
        </button>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-10 bg-background/95 px-5 pb-6 pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <Button
          onClick={onProceed}
          disabled={loading}
          className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
        >
          {loading ? (<><Loader2 size={18} className="mr-2 animate-spin" /> Generating UPI QR…</>) : (<>Proceed <ArrowRight size={18} className="ml-1" /></>)}
        </Button>
      </div>
    </section>
  );
}

/* ─────────── Step 3: UPI pay (QR + timer + UTR) ─────────── */
function UpiPayStep({
  fiat, coin, cryptoAmount, upiId, customQr, utr, setUtr, processing, onConfirm,
}: {
  fiat: number; coin: any; cryptoAmount: number;
  upiId: string; customQr: string | null;
  utr: string; setUtr: (v: string) => void;
  processing: boolean; onConfirm: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(PAY_WINDOW_SECONDS);
  const [generating, setGenerating] = useState(true);
  const [genProgress, setGenProgress] = useState(0);
  const [genStage, setGenStage] = useState(0);

  const genStages = [
    "Creating secure order…",
    "Connecting to UPI gateway…",
    "Generating QR code…",
    "Finalizing payment session…",
  ];

  useEffect(() => {
    if (!generating) return;
    const total = 2600;
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / total) * 100);
      setGenProgress(pct);
      setGenStage(Math.min(genStages.length - 1, Math.floor((pct / 100) * genStages.length)));
      if (elapsed >= total) {
        clearInterval(tick);
        setGenProgress(100);
        setTimeout(() => setGenerating(false), 250);
      }
    }, 80);
    return () => clearInterval(tick);
  }, [generating]);

  useEffect(() => {
    if (generating || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft, generating]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const expired = secondsLeft === 0;

  const upiLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: upiId, pn: MERCHANT_NAME, am: String(fiat || 0), cu: "INR",
      tn: `Velqorfi ${coin.symbol}`,
    });
    return `upi://pay?${params.toString()}`;
  }, [fiat, coin.symbol, upiId]);

  // Always generate a fresh QR that encodes the exact amount, so the user's
  // UPI app pre-fills the amount on scan. Custom static QR (no amount) is
  // only used as a fallback if amount is not set.
  const qrSrc = fiat > 0
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiLink)}`
    : (customQr || `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiLink)}`);

  if (generating) {
    return (
      <section className="px-5 pt-10 pb-32">
        <div className="mx-auto max-w-sm rounded-3xl border bg-card p-7 text-center shadow-sm animate-fade-in">
          <div className="relative mx-auto h-20 w-20">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="absolute inset-2 rounded-full bg-primary/10" />
            <Loader2 size={40} className="absolute inset-0 m-auto animate-spin text-primary" />
          </div>
          <h2 className="mt-5 text-lg font-extrabold">Setting up your payment</h2>
          <p className="mt-1 text-sm text-muted-foreground">Please don't close this screen.</p>

          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 transition-[width] duration-150 ease-out"
              style={{ width: `${genProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-semibold tabular-nums text-muted-foreground">
            {Math.round(genProgress)}%
          </p>

          <ul className="mt-5 space-y-2 text-left text-sm">
            {genStages.map((s, i) => {
              const done = i < genStage || genProgress >= 100;
              const active = i === genStage && genProgress < 100;
              return (
                <li key={s} className="flex items-center gap-2.5">
                  {done ? (
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                  ) : active ? (
                    <Loader2 size={16} className="shrink-0 animate-spin text-primary" />
                  ) : (
                    <span className="h-4 w-4 shrink-0 rounded-full border-2 border-muted" />
                  )}
                  <span className={done ? "text-foreground" : active ? "font-medium text-foreground" : "text-muted-foreground"}>
                    {s}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 pt-6 pb-32 space-y-4">
      {/* Amount + timer */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground">
        <p className="text-xs opacity-80">Pay exactly</p>
        <p className="mt-1 text-3xl font-extrabold">{formatINR(fiat)}</p>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="opacity-80">You'll receive</span>
          <span className="font-bold">{formatCrypto(cryptoAmount)} {coin.symbol}</span>
        </div>
        <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${expired ? "bg-red-500" : "bg-white/20"}`}>
          ⏱ {expired ? "Expired — refresh" : `${mm}:${ss} left to pay`}
        </div>
      </div>

      {/* QR */}
      <div className="rounded-2xl border bg-card p-5 text-center">
        <p className="text-sm font-semibold">Scan with any UPI app</p>
        <p className="mt-0.5 text-xs text-muted-foreground">GPay · PhonePe · Paytm · BHIM</p>
        <div className="mt-4 inline-block rounded-2xl border bg-white p-3">
          <img src={qrSrc} alt="UPI QR code" width={220} height={220} className="block" />
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary px-3 py-2.5">
          <div className="text-left">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">UPI ID</p>
            <code className="text-sm font-bold">{upiId}</code>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(upiId); toast.success("UPI ID copied"); }}
            className="grid h-9 w-9 place-items-center rounded-lg bg-background"
          >
            <Copy size={16} />
          </button>
        </div>

        <a
          href={upiLink}
          className="mt-3 inline-block w-full rounded-xl border border-primary px-4 py-3 text-sm font-bold text-primary"
        >
          Open UPI app
        </a>
      </div>

      {/* UTR */}
      <div className="rounded-2xl border bg-card p-4">
        <p className="text-sm font-semibold">Enter UTR / Transaction ID</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          After paying, paste the 12-digit UTR from your UPI app to confirm.
        </p>
        <Input
          value={utr}
          onChange={(e) => setUtr(e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 22))}
          placeholder="e.g. 412345678901"
          className="mt-3 h-12 rounded-xl font-mono text-sm"
          inputMode="numeric"
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-background/95 px-5 pb-6 pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <Button
          onClick={onConfirm}
          disabled={processing || expired || utr.trim().length < 6}
          className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
        >
          {processing ? "Submitting..." : "I have paid · Submit UTR"}
        </Button>
      </div>
    </section>
  );
}
