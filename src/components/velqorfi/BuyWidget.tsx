import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Search, X } from "lucide-react";
import { Flag } from "@/components/velqorfi/Flag";
import { CoinIcon } from "@/components/velqorfi/CoinIcon";
import { BrandMark } from "@/components/velqorfi/BrandMark";
import { useLiveRates } from "@/hooks/use-live-rates";
import {
  CRYPTOS,
  FIATS,
  convert,
  formatAmount,
  type Crypto,
  type Fiat,
} from "@/lib/velqorfi-data";

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-x-3 top-3 z-30 max-h-[85%] overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="flex items-center justify-between px-4 pt-4">
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        <button onClick={onClose} aria-label="Close">
          <X className="h-4 w-4 text-ink-soft" />
        </button>
      </div>
      {children}
    </div>
  );
}

export function BuyWidget() {
  const { cryptos, fiats } = useLiveRates();
  const [fiatCode, setFiatCode] = useState("HKD");
  const [cryptoSymbol, setCryptoSymbol] = useState(CRYPTOS[0]!.symbol);
  const fiat: Fiat = fiats.find((f) => f.code === fiatCode) ?? fiats[0]!;
  const crypto: Crypto =
    cryptos.find((c) => c.symbol === cryptoSymbol) ?? cryptos[0]!;
  const setFiat = (f: Fiat) => setFiatCode(f.code);
  const setCrypto = (c: Crypto) => setCryptoSymbol(c.symbol);
  const [amount, setAmount] = useState("2353");
  const [sheet, setSheet] = useState<null | "fiat" | "crypto">(null);
  const [query, setQuery] = useState("");

  const receive = useMemo(
    () => convert(Number(amount) || 0, fiat, crypto),
    [amount, fiat, crypto],
  );

  const fiatList = fiats.filter((f) =>
    `${f.name} ${f.code}`.toLowerCase().includes(query.toLowerCase()),
  );
  const cryptoList = cryptos.filter((c) =>
    `${c.symbol} ${c.name}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="relative mx-auto w-full max-w-[400px] rounded-2xl border border-border bg-card p-5 shadow-lift animate-rise">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-ink">Buy crypto</p>
        <span className="rounded-md bg-surface-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
          Live rate
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface-soft/60 px-4 py-3.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-soft">
          You pay
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            className="w-full min-w-0 bg-transparent font-display text-[26px] font-bold text-ink outline-none"
          />
          <button
            onClick={() => {
              setSheet("fiat");
              setQuery("");
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5"
          >
            <Flag iso={fiat.iso} size={20} />
            <span className="text-[13px] font-semibold text-ink">{fiat.code}</span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-soft" />
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-surface-soft/60 px-4 py-3.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-soft">
          You receive
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="w-full min-w-0 truncate font-display text-[26px] font-bold text-ink">
            {formatAmount(receive)}
          </p>
          <button
            onClick={() => {
              setSheet("crypto");
              setQuery("");
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5"
          >
            <CoinIcon crypto={crypto} size={20} />
            <span className="text-[13px] font-semibold text-ink">
              {crypto.symbol}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-soft" />
          </button>
        </div>
      </div>

      <Link
        to="/ramp"
        search={{ fiat: fiat.code, crypto: crypto.symbol, amount }}
        className="mt-4 flex h-12 items-center justify-center rounded-xl bg-buy-gradient text-[14px] font-semibold text-brand-foreground transition-opacity hover:opacity-90"
      >
        Continue
      </Link>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <p className="flex items-center gap-1.5 text-[11px] text-ink-soft">
          Powered by
          <span className="inline-flex items-center gap-1 font-semibold text-ink">
            <BrandMark className="h-3.5 w-3.5 text-brand" /> Velqorfi
          </span>
        </p>
        <div className="flex items-center gap-2.5 text-[10px] font-semibold text-ink-soft">
          <span>VISA</span>
          <span>MC</span>
          <span>UPI</span>
          <span>G Pay</span>
        </div>
      </div>


      {sheet === "fiat" && (
        <Sheet title="Select fiat currency" onClose={() => setSheet(null)}>
          <div className="px-4 pb-2 pt-3">
            <div className="flex items-center gap-2 rounded-lg bg-surface-soft px-3 py-2">
              <Search className="h-4 w-4 text-ink-soft" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search here..."
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
              />
            </div>
          </div>
          <p className="px-4 pb-1 text-[11px] font-semibold text-ink">
            Available now
          </p>
          <div className="max-h-72 overflow-y-auto pb-3">
            {fiatList.map((f) => (
              <button
                key={f.code}
                onClick={() => {
                  setFiat(f);
                  setSheet(null);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-soft"
              >
                <Flag iso={f.iso} size={26} />
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {f.name}
                  </span>
                  <span className="block text-[11px] text-ink-soft">
                    {f.code}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {sheet === "crypto" && (
        <Sheet title="Select crypto" onClose={() => setSheet(null)}>
          <div className="px-4 pb-2 pt-3">
            <div className="flex items-center gap-2 rounded-lg border border-brand/40 px-3 py-2">
              <Search className="h-4 w-4 text-ink-soft" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search here..."
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
              />
            </div>
          </div>
          <p className="px-4 pb-1 text-[11px] font-semibold text-ink">Popular</p>
          <div className="max-h-72 overflow-y-auto pb-3">
            {cryptoList.map((c) => (
              <button
                key={c.symbol + c.network}
                onClick={() => {
                  setCrypto(c);
                  setSheet(null);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-soft"
              >
                <CoinIcon crypto={c} size={26} />
                <span className="text-sm text-ink">
                  <span className="font-semibold">{c.symbol}</span> - {c.name}
                </span>
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
