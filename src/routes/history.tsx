import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ChevronLeft, Clock, MinusCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { listMyOrders } from "@/lib/orders.functions";
import { ChatBubble } from "@/components/velqorfi/ChatBubble";
import { BrandMark } from "@/components/velqorfi/BrandMark";
import { CoinIcon } from "@/components/velqorfi/CoinIcon";
import { CRYPTOS } from "@/lib/velqorfi-data";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Order history — Velqorfi" },
      {
        name: "description",
        content:
          "Track every Velqorfi crypto order: amount, price, asset total and live status updates.",
      },
      { property: "og:title", content: "Order history — Velqorfi" },
      {
        property: "og:description",
        content: "See all your Velqorfi buy orders and their live status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: History,
});

type Order = {
  id: string;
  status: string;
  amount: number;
  payable: number;
  fiat: string;
  asset: string;
  receive: string;
  utr: string;
  createdAt: string;
};

const STATUS = {
  completed: { label: "Completed", cls: "text-success", Icon: CheckCircle2 },
  processing: { label: "Processing", cls: "text-notice-foreground", Icon: Clock },
  confirming: { label: "Order confirming", cls: "text-brand", Icon: Clock },
  cancelled: { label: "Cancelled", cls: "text-ink-soft", Icon: MinusCircle },
} as const;

function History() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [hideClosed, setHideClosed] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { redirect: "/history" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      try {
        const idToken = await user.getIdToken();
        const next = await listMyOrders({ data: { idToken } });
        if (active) setOrders(next as Order[]);
      } catch (err) {
        console.error("orders load failed", err);
        if (active) setOrders([]);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user]);

  const list = (orders ?? []).filter(
    (o) => !hideClosed || o.status !== "cancelled",
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-white pb-24">
      <div className="flex h-16 items-center gap-3 px-4">
        <Link to="/ramp" aria-label="Back">
          <ChevronLeft className="h-6 w-6 text-ink" />
        </Link>
        <h1 className="font-display text-[20px] font-bold text-ink">
          Order history
        </h1>
      </div>

      <div className="flex items-end gap-6 border-b border-ramp-line px-4">
        <span className="relative flex h-11 items-center text-[14px] font-semibold text-brand">
          Buy Crypto
          <span className="absolute inset-x-0 bottom-0 h-[2px] bg-ramp-primary" />
        </span>
        <span className="flex h-11 items-center text-[14px] text-ink-soft">
          Sell Crypto
        </span>
        <span className="flex h-11 items-center text-[14px] text-ink-soft">
          Buy Stocks
        </span>
      </div>

      <label className="flex items-center justify-end gap-2 px-4 py-3 text-[13px] text-ink-soft">
        Hide Closed Order
        <input
          type="checkbox"
          checked={hideClosed}
          onChange={(e) => setHideClosed(e.target.checked)}
          className="h-4 w-4 rounded border-ramp-line accent-[oklch(0.55_0.2_265)]"
        />
      </label>

      <div className="space-y-3 px-4">
        {orders === null && (
          <p className="py-10 text-center text-[13px] text-ink-soft">Loading…</p>
        )}
        {orders !== null && list.length === 0 && (
          <p className="py-12 text-center text-[13px] text-ink-soft">
            No orders yet.
          </p>
        )}
        {list.map((o) => {
          const s = STATUS[o.status as keyof typeof STATUS] ?? STATUS.processing;
          return (
            <div
              key={o.id}
              className="overflow-hidden rounded-xl border border-ramp-line"
            >
              <div className="flex items-center justify-between bg-surface-soft px-4 py-3">
                <span className="flex items-center gap-2">
                  <AssetIcon symbol={o.asset} />
                  <span className="text-[15px] font-bold text-ink">
                    {o.asset}
                  </span>
                </span>
                <span className="text-[12px] text-ink-soft">
                  {new Date(o.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="space-y-2.5 px-4 py-4 text-[13px]">
                <Row label={`Order amount (${o.fiat})`} value={String(o.amount)} />
                <Row label={`Paid (${o.fiat})`} value={String(o.payable)} />
                <Row label={`Total (${o.asset})`} value={o.receive} />
                <Row label="UTR" value={o.utr || "Not submitted yet"} />
                <Row label="Order ID" value={o.id} />
                <p
                  className={`flex items-center justify-end gap-1.5 pt-1 text-[14px] font-semibold ${s.cls}`}
                >
                  <s.Icon className="h-4 w-4" /> {s.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 flex justify-center border-t border-ramp-line bg-white py-3 text-[11px] text-ink-soft">
        <span className="flex items-center gap-1">
          Powered by
          <Link to="/" className="inline-flex items-center gap-1 font-semibold text-brand">
            <BrandMark />
            Velqorfi
          </Link>
        </span>
      </div>
      <ChatBubble />
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-ink-soft">{label}</span>
      <span className="break-all text-right font-semibold text-ink">{value}</span>
    </div>
  );
}

function AssetIcon({ symbol }: { symbol: string }) {
  const crypto = CRYPTOS.find((c) => c.symbol === symbol);
  if (crypto) return <CoinIcon crypto={crypto} size={28} />;
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand">
      {symbol.slice(0, 2)}
    </span>
  );
}
