import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CoinIcon } from "@/components/brand/CoinIcon";
import { COIN_BY_SYMBOL } from "@/lib/coins";
import { formatINR, formatCrypto } from "@/lib/format";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  Wallet,
  Settings,
  Eye,
  EyeOff,
  TrendingUp,
  Bell,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Velqorfi" }] }),
  component: Dashboard,
});

function relativeTime(iso: string) {
  const d = new Date(iso).getTime();
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function Dashboard() {
  const { user } = useAuth();
  const [hidden, setHidden] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: orders } = useQuery({
    queryKey: ["orders-recent", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!user,
  });

  const recent = (orders ?? []).slice(0, 5);
  const totalVolume = (orders ?? []).reduce((s, o) => s + Number(o.fiat_amount_inr || 0), 0);
  const ordersCount = (orders ?? []).length;
  const firstName = (profile?.full_name || user?.email?.split("@")[0] || "Friend").split(" ")[0];

  // Aggregate top holdings from orders (buys − sells per coin)
  const holdingsMap = new Map<string, { qty: number; inr: number }>();
  for (const o of orders ?? []) {
    const prev = holdingsMap.get(o.coin) ?? { qty: 0, inr: 0 };
    const qty = Number(o.crypto_amount || 0) * (o.type === "buy" ? 1 : -1);
    const inr = Number(o.fiat_amount_inr || 0) * (o.type === "buy" ? 1 : -1);
    holdingsMap.set(o.coin, { qty: prev.qty + qty, inr: prev.inr + inr });
  }
  const topHoldings = [...holdingsMap.entries()]
    .filter(([, v]) => v.qty > 0)
    .sort((a, b) => b[1].inr - a[1].inr)
    .slice(0, 3);

  // Simple deterministic sparkline path (decorative)
  const spark = "M0,20 L12,16 L24,18 L36,12 L48,14 L60,8 L72,11 L84,5 L96,9 L108,4";

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 pt-5">
        <Logo />
        <button
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/80"
        >
          <Bell size={16} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-[#0b1424]" />
        </button>
      </header>

      <div className="px-5 pt-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Welcome back</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight">
          {firstName} <span className="inline-block">👋</span>
        </h1>
      </div>

      {/* Portfolio hero */}
      <section className="px-5 pt-4">
        <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0e1a2e] p-5">
          {/* subtle ambient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full opacity-60 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(34,211,238,0.18), transparent 70%)" }}
          />
          {/* grid texture */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Total volume
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 ring-1 ring-emerald-400/25">
                <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" /> LIVE
              </span>
            </div>
            <button
              onClick={() => setHidden((v) => !v)}
              className="grid h-7 w-7 place-items-center rounded-full bg-white/5 text-white/60 ring-1 ring-white/10"
              aria-label={hidden ? "Show balance" : "Hide balance"}
            >
              {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>

          <div className="relative mt-2 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-[32px] font-extrabold leading-none tracking-tight text-white tabular-nums">
                {hidden ? "₹ • • • • •" : formatINR(totalVolume)}
              </h2>
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
                <TrendingUp size={11} /> +₹0.00 (0.00%)
                <span className="text-white/35">· 24h</span>
              </p>
            </div>
            {/* sparkline */}
            <svg width="108" height="28" viewBox="0 0 108 28" className="shrink-0 opacity-90">
              <defs>
                <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${spark} L108,28 L0,28 Z`} fill="url(#sparkFill)" />
              <path d={spark} stroke="#22d3ee" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Stat strip */}
          <div className="relative mt-4 grid grid-cols-3 divide-x divide-white/[0.06] rounded-2xl bg-black/30 ring-1 ring-white/[0.06]">
            <div className="px-3 py-2.5">
              <p className="text-[9.5px] font-semibold uppercase tracking-wider text-white/45">Orders</p>
              <p className="mt-0.5 text-sm font-bold text-white tabular-nums">{ordersCount}</p>
            </div>
            <div className="px-3 py-2.5">
              <p className="text-[9.5px] font-semibold uppercase tracking-wider text-white/45">Assets</p>
              <p className="mt-0.5 text-sm font-bold text-white tabular-nums">{topHoldings.length}</p>
            </div>
            <div className="px-3 py-2.5">
              <p className="text-[9.5px] font-semibold uppercase tracking-wider text-white/45">Network</p>
              <p className="mt-0.5 text-sm font-bold text-white">UPI</p>
            </div>
          </div>

          {/* Top holdings */}
          {topHoldings.length > 0 && (
            <div className="relative mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {topHoldings.map(([sym, v]) => {
                const c = COIN_BY_SYMBOL[sym];
                return (
                  <div
                    key={sym}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-2.5"
                  >
                    {c ? <CoinIcon coin={c} size={18} /> : <span className="h-[18px] w-[18px] rounded-full bg-white/10" />}
                    <span className="text-[10.5px] font-bold text-white">{sym}</span>
                    <span className="text-[10px] font-medium text-white/55 tabular-nums">
                      {hidden ? "•••" : formatCrypto(v.qty)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          <div className="relative mt-4 grid grid-cols-2 gap-2.5">
            <Link
              to="/buy"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-[13px] font-bold text-[#0a1424] transition active:scale-[0.98]"
            >
              <ArrowDownToLine size={15} /> Buy
            </Link>
            <Link
              to="/sell"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] py-3 text-[13px] font-bold text-white transition hover:bg-white/[0.07]"
            >
              <ArrowUpFromLine size={15} /> Sell
            </Link>
          </div>
        </div>
      </section>

      {/* Quick tiles */}
      <section className="grid grid-cols-3 gap-2 px-5 pt-3">
        <QuickTile to="/app/orders"   icon={Receipt}  label="Orders"   tint="#22d3ee" />
        <QuickTile to="/app/wallets"  icon={Wallet}   label="Wallets"  tint="#a78bfa" />
        <QuickTile to="/app/settings" icon={Settings} label="Settings" tint="#94a3b8" />
      </section>


      {/* Recent activity */}
      <section className="px-5 pt-6 pb-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Recent activity</h2>
            <p className="text-[11px] text-white/50">Your latest trades</p>
          </div>
          <Link to="/app/orders" className="text-xs font-semibold text-cyan-400">View all →</Link>
        </div>

        <div className="mt-3 space-y-2">
          {!recent.length && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30">
                <Receipt size={20} />
              </div>
              <p className="mt-3 text-sm font-semibold text-white">No orders yet</p>
              <p className="mt-0.5 text-xs text-white/55">Your first trade is just a tap away.</p>
              <Link
                to="/buy"
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-400 to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-[0_6px_20px_rgba(34,211,238,0.35)]"
              >
                Make your first buy →
              </Link>
            </div>
          )}

          {recent.map((o) => {
            const coin = COIN_BY_SYMBOL[o.coin];
            const isBuy = o.type === "buy";
            const status = (o.status ?? "completed").toLowerCase();
            const pending = status === "pending";
            return (
              <Link
                key={o.id}
                to="/app/orders"
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]"
              >
                <div className="relative shrink-0">
                  {coin ? (
                    <CoinIcon coin={coin} size={40} />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">
                      {o.coin?.slice(0, 3)}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full ring-2 ring-[#0b1424] ${
                      isBuy ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  >
                    {isBuy ? (
                      <ArrowDownToLine size={9} className="text-white" />
                    ) : (
                      <ArrowUpFromLine size={9} className="text-white" />
                    )}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-white">
                      {isBuy ? "Bought" : "Sold"} {o.coin}
                    </p>
                    {pending ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 ring-1 ring-amber-400/30">
                        <Clock size={8} /> Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                        <CheckCircle2 size={8} /> Done
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-white/50">{relativeTime(o.created_at)} · UPI</p>
                </div>

                <div className="text-right">
                  <p className={`text-sm font-extrabold ${isBuy ? "text-white" : "text-rose-300"}`}>
                    {isBuy ? "−" : "+"}
                    {formatINR(Number(o.fiat_amount_inr))}
                  </p>
                  <p className={`text-[11px] font-semibold ${isBuy ? "text-emerald-300" : "text-white/55"}`}>
                    {isBuy ? "+" : "−"}
                    {formatCrypto(Number(o.crypto_amount))} {o.coin}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function QuickTile({
  to,
  icon: Icon,
  label,
  tint,
}: {
  to: string;
  icon: typeof Receipt;
  label: string;
  tint: string;
}) {
  return (
    <Link
      to={to as never}
      className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 transition hover:bg-white/[0.05]"
    >
      <span
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-1 ring-white/10"
        style={{ background: `${tint}1f` }}
      >
        <Icon size={13} style={{ color: tint }} />
      </span>
      <span className="truncate text-[11.5px] font-semibold text-white/85">{label}</span>
    </Link>
  );
}
