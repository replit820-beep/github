import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CoinIcon } from "@/components/brand/CoinIcon";
import { COIN_BY_SYMBOL } from "@/lib/coins";
import { formatINR, formatCrypto } from "@/lib/format";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/orders")({
  head: () => ({ meta: [{ title: "My Orders · Velqorfi" }] }),
  component: Orders,
});

function Orders() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <AppShell>
      <header className="px-5 pt-5">
        <Link to="/app/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Dashboard</Link>
        <h1 className="mt-3 text-2xl font-bold">Orders</h1>
      </header>
      <section className="px-5 pt-4 space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!isLoading && !orders?.length && (
          <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No orders yet. <Link to="/buy" className="font-semibold text-primary">Buy crypto →</Link>
          </div>
        )}
        {orders?.map((o) => {
          const coin = COIN_BY_SYMBOL[o.coin];
          return (
            <div key={o.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-3">
                {coin && <CoinIcon coin={coin}/>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">
                    {o.type === "buy" ? "Buy" : "Sell"} {o.coin} <span className="text-muted-foreground font-normal">· {o.network}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN")}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${o.status==="completed"?"bg-success/15 text-success":"bg-muted text-muted-foreground"}`}>
                  {o.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-muted-foreground">Amount</p><p className="font-bold">{formatINR(Number(o.fiat_amount_inr))}</p></div>
                <div><p className="text-muted-foreground">Crypto</p><p className="font-bold">{formatCrypto(Number(o.crypto_amount))} {o.coin}</p></div>
                {o.wallet_address && <div className="col-span-2"><p className="text-muted-foreground">Wallet</p><p className="font-mono text-[11px] break-all">{o.wallet_address}</p></div>}
                {o.upi_id && <div className="col-span-2"><p className="text-muted-foreground">UPI</p><p className="font-mono text-[11px]">{o.upi_id}</p></div>}
              </div>
            </div>
          );
        })}
      </section>
    </AppShell>
  );
}
