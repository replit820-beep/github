import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  Check,
  Clock,
  HelpCircle,
  Info,
  Maximize2,
  Menu,
  Search,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import { Flag } from "@/components/velqorfi/Flag";
import { CoinIcon } from "@/components/velqorfi/CoinIcon";
import { RampMenu } from "@/components/velqorfi/RampMenu";
import { ChatBubble } from "@/components/velqorfi/ChatBubble";
import { BrandMark } from "@/components/velqorfi/BrandMark";
import { PaymentMarks } from "@/components/velqorfi/PaymentMarks";
import { useLiveRates } from "@/hooks/use-live-rates";
import { useAuth } from "@/hooks/use-auth";
import { createPendingOrder } from "@/lib/orders.functions";
import {
  CRYPTOS,
  FIATS,
  PAYMENT_METHODS,
  STOCKS,
  convert,
  formatAmount,
  type Crypto,
  type Fiat,
} from "@/lib/velqorfi-data";

export const Route = createFileRoute("/ramp")({
  validateSearch: (search: {
    fiat?: unknown;
    crypto?: unknown;
    amount?: unknown;
  }): { fiat?: string; crypto?: string; amount?: string } => ({
    ...(search["fiat"] === undefined
      ? {}
      : { fiat: cleanSearchValue(search["fiat"], "INR") }),
    ...(search["crypto"] === undefined
      ? {}
      : { crypto: cleanSearchValue(search["crypto"], "USDC") }),
    ...(search["amount"] === undefined
      ? {}
      : { amount: cleanSearchValue(search["amount"], "5000") }),
  }),
  head: () => ({
    meta: [
      { title: "Velqorfi Ramp — Buy & Sell Crypto and Stocks" },
      {
        name: "description",
        content:
          "Buy crypto, sell crypto, or buy tokenized stocks with local payment methods on the Velqorfi ramp.",
      },
      { property: "og:title", content: "Velqorfi Ramp — Buy & Sell Crypto" },
      {
        property: "og:description",
        content:
          "Choose your currency, asset, and payment method and complete your order in three steps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ramp,
});

function cleanSearchValue(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  return value.replace(/^"|"$/g, "");
}

type Tab = "buy" | "sell" | "stocks";
type Step = "quote" | "wallet" | "payment" | "review";

function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  const w = 320;
  const h = 90;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / Math.max(1, max - min)) * (h - 12) - 6;
    return `${x},${y}`;
  });
  const lastCoordinate = coords.at(-1)?.split(",")[1];
  const stroke = up ? "oklch(0.62 0.16 150)" : "oklch(0.58 0.2 20)";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full">
      <polygon
        points={`0,${h} ${coords.join(" ")} ${w},${h}`}
        fill={stroke}
        opacity="0.16"
      />
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
      />
      <circle
        cx={w}
        cy={Number(lastCoordinate ?? h / 2)}
        r="4"
        fill={stroke}
      />
    </svg>
  );
}

function Picker({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white animate-sheet-up">
      <div className="flex items-center justify-between border-b border-ramp-line px-4 py-4">
        <p className="text-[17px] font-semibold text-ink">{title}</p>
        <button onClick={onClose} aria-label="Close">
          <X className="h-5 w-5 text-ink" />
        </button>
      </div>
      {children}
    </div>
  );
}

function Ramp() {
  const params = Route.useSearch();
  const [tab, setTab] = useState<Tab>("buy");
  const [step, setStep] = useState<Step>("quote");
  const { cryptos, fiats } = useLiveRates();
  const [fiatCode, setFiatCode] = useState(params.fiat ?? "INR");
  const [cryptoSymbol, setCryptoSymbol] = useState(params.crypto ?? "USDC");
  const fallbackFiat = fiats[0] ?? FIATS[0];
  const fallbackCrypto = cryptos[0] ?? CRYPTOS[0];
  if (!fallbackFiat || !fallbackCrypto) {
    throw new Error("Velqorfi asset configuration is empty");
  }
  const fiat: Fiat = fiats.find((f) => f.code === fiatCode) ?? fallbackFiat;
  const crypto: Crypto =
    cryptos.find((c) => c.symbol === cryptoSymbol) ?? fallbackCrypto;
  const setFiat = (f: Fiat) => setFiatCode(f.code);
  const setCrypto = (c: Crypto) => setCryptoSymbol(c.symbol);
  const [menuOpen, setMenuOpen] = useState(false);
  const [amount, setAmount] = useState(params.amount ?? "5000");
  const [picker, setPicker] = useState<null | "fiat" | "crypto">(null);
  const [query, setQuery] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [method, setMethod] = useState(PAYMENT_METHODS[0]?.id ?? "upi");
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [quoteSec, setQuoteSec] = useState(15);

  useEffect(() => {
    if (step !== "review") return;
    setQuoteSec(15);
    const t = setInterval(
      () => setQuoteSec((s) => (s <= 1 ? 15 : s - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [step]);


  const receive = useMemo(
    () => convert(Number(amount) || 0, fiat, crypto),
    [amount, fiat, crypto],
  );

  const stepIndex = step === "wallet" ? 1 : step === "payment" ? 2 : 3;

  const fiatList = fiats.filter((f) =>
    `${f.name} ${f.code}`.toLowerCase().includes(query.toLowerCase()),
  );
  const cryptoList = cryptos.filter((c) =>
    `${c.symbol} ${c.name}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-white pb-20 shadow-[0_0_40px_-28px_oklch(0.25_0.04_265/0.35)]">
      {/* top bar */}
      {step === "quote" ? (
        <div className="flex h-16 items-center justify-between border-b border-ramp-line px-4">
          <div className="flex items-end gap-6">
            {(
              [
                ["buy", "Buy Crypto"],
                ["sell", "Sell Crypto"],
                ["stocks", "Buy Stocks"],
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative flex h-16 items-center text-[14px] transition-colors ${
                  tab === id
                    ? "font-semibold text-brand"
                    : "font-medium text-ink-soft"
                }`}
              >
                {label}
                {id === "stocks" && (
                  <sup className="ml-1 rounded bg-brand/10 px-1 text-[8px] font-bold text-brand">
                    NEW
                  </sup>
                )}
                {tab === id && (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] bg-ramp-primary" />
                )}
              </button>
            ))}
          </div>
          <button className="flex h-9 w-9 items-center justify-center" onClick={() => setMenuOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5 text-ink" />
          </button>
        </div>
      ) : (
        <div className="flex h-16 items-center justify-between border-b border-ramp-line px-4">
          <button
            onClick={() =>
              setStep(
                step === "wallet"
                  ? "quote"
                  : step === "payment"
                    ? "wallet"
                    : "payment",
              )
            }
            className="flex items-center gap-3"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5 text-ink" />
            <span className="text-[16px] font-semibold text-ink">
              {step === "wallet"
                ? `Enter ${crypto.symbol} Wallet address`
                : step === "payment"
                  ? "Choose payment method"
                  : "Confirm the order"}
            </span>

          </button>
          <button onClick={() => setMenuOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5 text-ink" />
          </button>
        </div>
      )}

      {step !== "quote" && (
        <div className="flex items-center gap-3 px-4 py-4">
          <span className="text-[12px] text-ink-soft">Step {stepIndex} of 3</span>
          <div className="flex flex-1 gap-2">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`h-[5px] flex-1 rounded-full ${
                   n <= stepIndex ? "bg-ramp-primary" : "bg-ramp-primary/15"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* QUOTE */}
      {step === "quote" && tab !== "stocks" && (
        <div className="px-4 pt-5 animate-rise">
          <div className="rounded-2xl border border-ramp-line bg-white p-4 shadow-card transition-colors focus-within:border-brand">
            <p className="text-[11px] text-ink-soft">
              {tab === "buy" ? "You Pay" : "You Sell"}
            </p>
            <div className="flex items-center justify-between gap-2">
              <input
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^\d.]/g, ""))
                }
                inputMode="decimal"
                 className="w-full min-w-0 bg-transparent font-display text-[24px] font-bold tracking-tight text-ink outline-none"
              />
              <button
                onClick={() => {
                  setPicker(tab === "buy" ? "fiat" : "crypto");
                  setQuery("");
                }}
                 className="flex shrink-0 items-center gap-1.5 rounded-xl bg-ramp-primary-soft px-2.5 py-2"
              >
                {tab === "buy" ? (
                  <Flag iso={fiat.iso} size={22} />
                ) : (
                  <CoinIcon crypto={crypto} size={22} />
                )}
                <span className="text-[15px] font-medium text-ink">
                  {tab === "buy" ? fiat.code : crypto.symbol}
                </span>
                <ChevronDown className="h-4 w-4 text-ink-soft" />
              </button>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-ramp-line bg-white p-4 shadow-card">
            <p className="text-[11px] text-ink-soft">You Get</p>
            <div className="flex items-center justify-between gap-2">
              <p className="w-full min-w-0 truncate font-display text-[24px] font-bold tracking-tight text-ink">
                {tab === "buy"
                  ? formatAmount(receive)
                  : formatAmount((Number(amount) || 0) * crypto.price * fiat.rate)}
              </p>
              <button
                onClick={() => {
                  setPicker(tab === "buy" ? "crypto" : "fiat");
                  setQuery("");
                }}
                 className="flex shrink-0 items-center gap-1.5 rounded-xl bg-ramp-primary-soft px-2.5 py-2"
              >
                {tab === "buy" ? (
                  <CoinIcon crypto={crypto} size={22} />
                ) : (
                  <Flag iso={fiat.iso} size={22} />
                )}
                <span className="text-[15px] font-medium text-ink">
                  {tab === "buy" ? crypto.symbol : fiat.code}
                </span>
                <ChevronDown className="h-4 w-4 text-ink-soft" />
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 rounded-2xl bg-ramp-primary-soft p-4 text-[12px]">
            <div className="flex justify-between">
              <span className="text-ink-soft">Rate</span>
              <span className="font-medium text-ink">
                1 {crypto.symbol} ≈ {formatAmount(crypto.price * fiat.rate)}{" "}
                {fiat.code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Network</span>
              <span className="font-medium text-ink">{crypto.network}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Processing fee</span>
              <span className="font-medium text-ink">1.5%</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (!authLoading && !user) {
                navigate({ to: "/login", search: { redirect: "/ramp" } });
                return;
              }
              setStep("wallet");
            }}
            className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-buy-gradient py-4 text-[14px] font-semibold text-brand-foreground shadow-card transition-opacity hover:opacity-90"
          >
            Proceed <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* STOCKS */}
      {step === "quote" && tab === "stocks" && (
        <div className="space-y-3 px-5 pt-5">
          {STOCKS.map((s) => (
            <div key={s.symbol} className="rounded-2xl border border-ramp-line bg-white p-4 shadow-card">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: s.color }}
                >
                  {s.glyph}
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-ink">
                    {s.symbol}
                  </span>
                  <span className="block text-[12px] text-ink-soft">
                    {s.name}
                  </span>
                </span>
              </div>
              <p className="mt-2 text-[19px] font-bold text-ink">
                {formatAmount(s.price)}{" "}
                <span className="text-[12px] font-medium text-ink-soft">USD</span>{" "}
                <span
                  className={
                    s.change >= 0
                      ? "text-[15px] font-semibold text-success"
                      : "text-[15px] font-semibold text-danger"
                  }
                >
                  {s.change >= 0 ? "+" : ""}
                  {s.change.toFixed(2)}%
                </span>
              </p>
              <Sparkline points={s.points} up={s.change >= 0} />
            </div>
          ))}
        </div>
      )}

      {/* WALLET */}
      {step === "wallet" && (
        <div className="px-4 animate-rise">
          <div className="rounded-2xl bg-notice p-3 text-[12px] leading-relaxed text-ink">
            Please enter your wallet address accurately. Only enter the address of
            a wallet that you own and to which you have access.
          </div>

          <p className="mt-6 text-[15px] text-ink">Network</p>
          <button
            onClick={() => {
              setPicker("crypto");
              setQuery("");
            }}
            className="mt-2 flex h-14 w-full items-center justify-between rounded-2xl border border-ramp-line px-4"
          >
            <span className="flex items-center gap-3">
              <CoinIcon crypto={crypto} size={28} />
              <span className="text-[15px] text-ink">{crypto.network}</span>
            </span>
            <ChevronDown className="h-5 w-5 text-ink-soft" />
          </button>

          <p className="mt-5 flex items-center gap-1.5 text-[15px] text-ink">
            Wallet address <HelpCircle className="h-4 w-4 text-ink-soft" />
          </p>
          <div className="mt-2 flex h-14 items-center gap-2 rounded-2xl border border-ramp-line px-4">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your wallet address or domain here"
              className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-soft"
            />
            <Maximize2 className="h-4 w-4 shrink-0 text-ink-soft" />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-soft">
            <Info className="h-3.5 w-3.5" /> We support{" "}
            <span className="text-brand">SPACE ID</span> and ENS domains for this
            asset.
          </p>

          {crypto.memo && (
            <>
              <p className="mt-5 flex items-center gap-1.5 text-[15px] text-ink">
                Memo <HelpCircle className="h-4 w-4 text-ink-soft" />
              </p>
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Mandatory"
                className="mt-2 h-10 w-2/3 border-b border-border bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-soft"
              />
            </>
          )}

          <FooterCta
            disabled={address.trim().length < 8 || Boolean(crypto.memo && !memo.trim())}
            onClick={() => setStep("payment")}
          />
        </div>
      )}

      {/* PAYMENT */}
      {step === "payment" && (
        <div className="px-4 animate-rise">
          <div className="space-y-3">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                 className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-all ${
                   method === m.id ? "border-ramp-primary bg-ramp-primary-soft/40" : "border-ramp-line"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white">
                    <Wallet className="h-5 w-5 text-ink" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">
                      {m.label}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] text-ink-soft">
                      <Zap className="h-3 w-3 text-brand" /> {m.speed}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-2.5">
                  <UpiBadge />
                  {method === m.id ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand">
                      <Check className="h-3 w-3 text-brand-foreground" />
                    </span>
                  ) : (
                    <span className="h-5 w-5 rounded-full border border-border" />
                  )}
                </span>
              </button>
            ))}
          </div>
          <FooterCta onClick={() => setStep("review")} />
        </div>
      )}

      {/* CONFIRM THE ORDER */}
      {step === "review" && (
        <div className="px-4 animate-rise">
          <p className="font-display text-[34px] font-bold leading-none tracking-tight text-ink">
            {formatAmount(Number(amount) || 0).replace(/\.00$/, "")}{" "}
            <span className="text-[17px] font-semibold text-ink-soft">
              {fiat.code}
            </span>
          </p>

          <p className="mt-6 text-[16px] font-semibold text-ink">
            Order summary
          </p>
          <div className="mt-3 overflow-hidden rounded-2xl border border-ramp-line bg-surface-soft">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[13px] text-ink-soft">
                Your chosen payment method is
              </span>
              <span className="text-[13px] font-medium text-brand">
                 {PAYMENT_METHODS.find((m) => m.id === method)?.label ?? "E-Wallet"}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-white px-4 py-3.5">
              <span className="text-[15px] font-medium text-ink">UPI</span>
              <UpiBadge />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-1 text-[11px] text-ink-soft">
            <Clock className="h-3 w-3" /> {quoteSec} sec
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[14px] text-ink">
              Your order <Info className="h-3.5 w-3.5 text-ink-soft" />
            </span>
            <span className="flex items-center gap-1 text-[14px] text-ink">
              <span className="font-semibold">
                {formatAmount(receive)} {crypto.symbol}
              </span>
              <span className="text-ink-soft">for</span>
              <span className="font-semibold">
                {formatAmount(Number(amount) || 0).replace(/\.00$/, "")}{" "}
                {fiat.code}
              </span>
              <ChevronDown className="h-4 w-4 text-ink-soft" />
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-ramp-line bg-notice p-4">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
               <Info className="h-4 w-4 text-notice-foreground" /> Notice
            </p>
            <ol className="mt-2.5 space-y-2 text-[12px] leading-snug text-ink-soft">
              <li>
                1. The amount you transfer must be the same as the order amount
              </li>
              <li>2. Do not make multiple transfers to the current UPI ID</li>
              <li>
                3. After completing the payment, please fill in the 12-digit UTR
              </li>
              <li>
                4. If you have any questions, please contact customer service{" "}
                <span className="font-semibold text-brand">
                  support@velqorfi.org
                </span>
              </li>
            </ol>
          </div>

          {orderError && (
            <p className="mt-4 text-center text-[12px] text-danger">
              {orderError}
            </p>
          )}
          <button
            disabled={placingOrder}
            onClick={async () => {
              if (placingOrder) return;
              if (!user) {
                navigate({ to: "/login", search: { redirect: "/ramp" } });
                return;
              }
              setPlacingOrder(true);
              setOrderError("");
              try {
                const idToken = await user.getIdToken();
                const result = await createPendingOrder({
                  data: {
                    idToken,
                    amount: Number(amount) || 0,
                    fiat: fiat.code,
                    asset: crypto.symbol,
                    receive: formatAmount(receive),
                    address,
                  },
                });
                await navigate({
                  to: "/pay",
                  search: {
                    orderId: result.id,
                    upiId: result.upiId,
                    amount: String(Number(amount) || 0),
                    fiat: fiat.code,
                    asset: crypto.symbol,
                    receive: formatAmount(receive),
                    address,
                  },
                });
              } catch (error) {
                setOrderError(
                  error instanceof Error
                    ? error.message
                    : "Could not create your order.",
                );
                setPlacingOrder(false);
              }
            }}
             className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-buy-gradient py-4 text-[14px] font-semibold text-brand-foreground shadow-card"
          >
            {placingOrder ? "Creating order…" : "Proceed to payment"}
            {!placingOrder && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      )}


      {menuOpen && <RampMenu onClose={() => setMenuOpen(false)} />}

      {/* pickers */}
      <Picker
        title="Select fiat currency"
        open={picker === "fiat"}
        onClose={() => setPicker(null)}
      >
        <div className="px-5 pb-2 pt-4">
          <div className="flex items-center gap-2 rounded-lg bg-surface-soft px-3 py-2.5">
            <Search className="h-4 w-4 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search here..."
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
            />
          </div>
        </div>
        <p className="px-5 pb-1 text-[12px] font-semibold text-ink">Recent</p>
        <button className="flex w-full items-center justify-between bg-surface-soft px-5 py-3">
          <span className="flex items-center gap-3">
            <Flag iso={fiat.iso} size={26} />
            <span>
              <span className="block text-[15px] font-semibold text-brand">
                {fiat.name}
              </span>
              <span className="block text-[12px] text-ink-soft">{fiat.code}</span>
            </span>
          </span>
          <Check className="h-4 w-4 text-brand" />
        </button>
        <p className="px-5 pb-1 pt-4 text-[12px] font-semibold text-ink">
          Available now
        </p>
        <div className="flex-1 overflow-y-auto pb-6">
          {fiatList.map((f) => (
            <button
              key={f.code}
              onClick={() => {
                setFiat(f);
                setPicker(null);
              }}
              className="flex w-full items-center gap-3 px-5 py-3 text-left"
            >
              <Flag iso={f.iso} size={26} />
              <span>
                <span className="block text-[15px] font-semibold text-ink">
                  {f.name}
                </span>
                <span className="block text-[12px] text-ink-soft">{f.code}</span>
              </span>
            </button>
          ))}
        </div>
      </Picker>

      <Picker
        title="Select crypto"
        open={picker === "crypto"}
        onClose={() => setPicker(null)}
      >
        <div className="px-5 pb-2 pt-4">
          <div className="flex items-center gap-2 rounded-lg border border-brand/50 px-3 py-2.5">
            <Search className="h-4 w-4 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search here..."
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
            />
          </div>
        </div>
        <p className="px-5 pb-1 text-[12px] font-semibold text-ink">All</p>
        <div className="flex-1 overflow-y-auto pb-6">
          {cryptoList.map((c) => (
            <button
              key={c.symbol + c.network}
              onClick={() => {
                setCrypto(c);
                setPicker(null);
              }}
              className="flex w-full items-center gap-3 px-5 py-3 text-left"
            >
              <CoinIcon crypto={c} size={28} />
              <span className="text-[15px] text-ink">
                <span className="font-semibold">{c.symbol}</span> - {c.name}
              </span>
            </button>
          ))}
        </div>
      </Picker>

      <ChatBubble />

      <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col items-center gap-1 border-t border-ramp-line bg-white py-2 text-[11px] text-ink-soft">
        <PaymentMarks />
        <span className="flex items-center">Powered by{" "}
        <Link to="/" className="ml-1 inline-flex items-center gap-1 font-semibold text-brand">
          <BrandMark />
          Velqorfi
        </Link></span>
      </div>
    </main>
  );
}

function FooterCta({
  onClick,
  disabled,
  label = "Proceed",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-10 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-buy-gradient py-4 text-[14px] font-semibold text-brand-foreground shadow-card disabled:opacity-40"
    >
      {label} <ArrowRight className="h-4 w-4" />
    </button>
  );
}

export function UpiBadge() {
  return (
    <span className="flex h-6 w-11 items-center justify-center rounded border border-border bg-white text-[10px] font-extrabold italic tracking-tight text-[oklch(0.45_0.15_265)]">
      UP
      <span className="text-[oklch(0.65_0.19_35)]">I</span>
      <span className="text-[oklch(0.6_0.16_145)]">›</span>
    </span>
  );
}
