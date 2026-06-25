import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { COINS, type Coin } from "@/lib/coins";
import { CoinIcon } from "@/components/brand/CoinIcon";
import { useCoinImages } from "@/hooks/useCoinImages";

export type CoinNetworkSelection = {
  coinId: string;
  networkId: string;
};

type Row = { coin: Coin; networkId: string; networkLabel: string };

const POPULAR_KEYS = [
  "usd-coin|ERC20",
  "bitcoin|BTC",
  "ethereum|ERC20",
  "tether|TRC20",
  "binancecoin|BEP20",
  "solana|SOL",
];

function buildRows(): Row[] {
  const rows: Row[] = [];
  for (const coin of COINS) {
    for (const n of coin.networks) {
      rows.push({ coin, networkId: n.id, networkLabel: n.label });
    }
  }
  return rows;
}

const ALL_ROWS = buildRows();
const POPULAR_ROWS = POPULAR_KEYS
  .map((k) => {
    const [coinId, networkId] = k.split("|");
    return ALL_ROWS.find((r) => r.coin.id === coinId && r.networkId === networkId);
  })
  .filter((r): r is Row => Boolean(r));

export function CoinPicker({
  open,
  onClose,
  onSelect,
  selected,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (sel: CoinNetworkSelection) => void;
  selected?: CoinNetworkSelection;
}) {
  const [query, setQuery] = useState("");
  const coinImages = useCoinImages();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return ALL_ROWS.filter((r) => {
      const hay = `${r.coin.symbol} ${r.coin.name} ${r.networkLabel}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  if (!open) return null;

  const handlePick = (r: Row) => {
    onSelect({ coinId: r.coin.id, networkId: r.networkId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-t-3xl border border-white/10 bg-card text-card-foreground shadow-2xl shadow-black/60 animate-in slide-in-from-bottom duration-300">
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-white/15" />

        <div className="flex items-center justify-between px-5 pt-3">
          <h3 className="text-base font-bold">Select crypto & network</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-secondary-foreground"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pt-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-secondary/60 px-4 py-2.5">
            <Search size={16} className="text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search coin or network…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="mt-3 max-h-[60vh] overflow-y-auto px-2 pb-6">
          {filtered === null ? (
            <>
              <SectionLabel>Popular</SectionLabel>
              <List rows={POPULAR_ROWS} onPick={handlePick} selected={selected} coinImages={coinImages} />
              <SectionLabel>All assets</SectionLabel>
              <List rows={ALL_ROWS} onPick={handlePick} selected={selected} coinImages={coinImages} />
            </>
          ) : filtered.length > 0 ? (
            <List rows={filtered} onPick={handlePick} selected={selected} coinImages={coinImages} />
          ) : (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              No matches for "{query}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function List({
  rows,
  onPick,
  selected,
  coinImages,
}: {
  rows: Row[];
  onPick: (r: Row) => void;
  selected?: CoinNetworkSelection;
  coinImages: Record<string, string>;
}) {
  return (
    <ul className="space-y-1">
      {rows.map((r) => {
        const isSel = selected?.coinId === r.coin.id && selected?.networkId === r.networkId;
        return (
          <li key={`${r.coin.id}-${r.networkId}`}>
            <button
              onClick={() => onPick(r)}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                isSel ? "bg-primary/15 ring-1 ring-primary/40" : "hover:bg-secondary/70"
              }`}
            >
              <CoinIcon coin={r.coin} image={coinImages[r.coin.id]} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {r.coin.symbol} <span className="text-muted-foreground">— {r.networkLabel}</span>
                </p>
                <p className="truncate text-xs text-muted-foreground">{r.coin.name}</p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
