import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CoinIcon } from "@/components/brand/CoinIcon";
import { COINS } from "@/lib/coins";
import { usePrices } from "@/hooks/use-prices";
import { formatINR, formatPct } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "Crypto Markets — Live INR Prices · Velqorfi" },
      { name: "description", content: "Live INR prices for Bitcoin, Ethereum, USDT and 30+ cryptocurrencies. 24h change updated every 30 seconds." },
    ],
  }),
  component: Markets,
});

function Markets() {
  const { data: prices, dataUpdatedAt, isFetching } = usePrices();
  const [q, setQ] = useState("");
  const filtered = COINS.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) || c.symbol.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppShell>
      <header className="px-5 pt-5">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Home</Link>
        <div className="mt-3 flex items-end justify-between gap-3">
          <h1 className="text-2xl font-bold">Markets</h1>
          <div className="flex items-center gap-2 pb-1">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className={`absolute inline-flex h-full w-full rounded-full bg-success opacity-75 ${isFetching ? "animate-ping" : ""}`} />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {dataUpdatedAt ? `Live · ${new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Live"}
            </span>
          </div>
        </div>
        <div className="relative mt-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search coin or symbol" className="h-12 pl-9"/>
        </div>
      </header>

      <section className="px-5 pt-4 space-y-2">
        {filtered.map((coin) => {
          const p = prices?.[coin.id];
          const change = p?.inr_24h_change ?? 0;
          return (
            <Link
              key={coin.id}
              to="/buy"
              search={{ coin: coin.symbol } as never}
              className="flex items-center gap-3 rounded-2xl border bg-card p-3 active:bg-accent"
            >
              <CoinIcon coin={coin} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{coin.name}</p>
                <p className="text-xs text-muted-foreground">{coin.symbol} · {coin.networks.length} network{coin.networks.length>1?"s":""}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{p ? formatINR(p.inr) : "—"}</p>
                <p className={`text-xs font-semibold ${change>=0?"text-success":"text-destructive"}`}>
                  {p ? formatPct(change) : "—"}
                </p>
              </div>
            </Link>
          );
        })}
      </section>
    </AppShell>
  );
}
