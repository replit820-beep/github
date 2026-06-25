import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CoinIcon } from "@/components/brand/CoinIcon";
import { COINS, COIN_BY_SYMBOL, MIN_INR, MAX_INR, FEE_RATE } from "@/lib/coins";
import { usePrices } from "@/hooks/use-prices";
import { formatINR, formatCrypto } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sell")({
  head: () => ({
    meta: [
      { title: "Sell Crypto to UPI · Velqorfi" },
      { name: "description", content: "Sell USDT, BTC, ETH and more — receive INR directly in your UPI account instantly." },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  const { data: prices } = usePrices();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coinSym, setCoinSym] = useState("USDT");
  const coin = COIN_BY_SYMBOL[coinSym];
  const [network, setNetwork] = useState(coin.networks[0].id);
  const [cryptoAmt, setCryptoAmt] = useState("");
  const [upiId, setUpiId] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCoin = (s: string) => { setCoinSym(s); setNetwork(COIN_BY_SYMBOL[s].networks[0].id); };
  const rate = prices?.[coin.id]?.inr ?? 0;
  const crypto = Number(cryptoAmt) || 0;
  const grossInr = crypto * rate;
  const fee = grossInr * FEE_RATE;
  const netInr = grossInr - fee;
  const error = netInr > 0 && (netInr < MIN_INR || netInr > MAX_INR);
  const ok = !error && netInr >= MIN_INR && netInr <= MAX_INR && /^[\w.\-]{2,}@[\w.\-]{2,}$/.test(upiId);

  const submit = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    setProcessing(true);
    const { data, error: err } = await supabase.from("orders").insert({
      user_id: user.id, type: "sell", coin: coin.symbol, network,
      fiat_amount_inr: netInr, crypto_amount: crypto, rate_inr: rate, fee_inr: fee,
      wallet_address: null, upi_app: null, upi_id: upiId, status: "completed",
    }).select("id").single();
    setProcessing(false);
    if (err) return toast.error(err.message);
    setDone(data.id);
  };

  return (
    <AppShell>
      <header className="px-5 pt-5">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Home</Link>
        <h1 className="mt-3 text-2xl font-bold">Sell crypto</h1>
        <p className="text-sm text-muted-foreground">Receive INR to UPI · Min ₹{MIN_INR.toLocaleString("en-IN")} · Max ₹{MAX_INR.toLocaleString("en-IN")}</p>
      </header>

      <section className="px-5 pt-5 space-y-4">
        <div className="rounded-3xl border bg-card p-4 space-y-3">
          <div>
            <Label className="text-xs uppercase">Coin</Label>
            <Select value={coinSym} onValueChange={onCoin}>
              <SelectTrigger className="mt-1 h-14">
                <div className="flex items-center gap-2"><CoinIcon coin={coin} size={28}/><SelectValue/></div>
              </SelectTrigger>
              <SelectContent>
                {COINS.map((c) => (
                  <SelectItem key={c.symbol} value={c.symbol}>
                    <div className="flex items-center gap-2"><CoinIcon coin={c} size={22}/><span className="font-semibold">{c.symbol}</span><span className="text-muted-foreground">{c.name}</span></div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase">Network you're sending from</Label>
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger className="mt-1 h-12"><SelectValue/></SelectTrigger>
              <SelectContent>{coin.networks.map((n) => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-5">
          <Label className="text-xs uppercase">You sell</Label>
          <div className="mt-2 flex items-center gap-2">
            <Input inputMode="decimal" value={cryptoAmt} onChange={(e)=>setCryptoAmt(e.target.value.replace(/[^\d.]/g,""))} placeholder="0.00" className="h-14 border-0 px-0 text-3xl font-bold shadow-none focus-visible:ring-0"/>
            <span className="text-2xl font-bold text-muted-foreground">{coin.symbol}</span>
          </div>
          {error && <p className="mt-1 text-xs text-destructive">Order value must be between ₹{MIN_INR.toLocaleString("en-IN")} and ₹{MAX_INR.toLocaleString("en-IN")}</p>}
        </div>

        <div className="rounded-3xl border bg-card p-4">
          <Label className="text-xs uppercase">Your UPI ID</Label>
          <Input value={upiId} onChange={(e)=>setUpiId(e.target.value)} placeholder="yourname@bank" className="mt-2 h-12"/>
        </div>

        <div className="rounded-3xl border bg-card p-4 text-sm space-y-2">
          <Row label="Rate" value={rate>0 ? `1 ${coin.symbol} = ${formatINR(rate)}` : "—"}/>
          <Row label="Gross" value={formatINR(grossInr)}/>
          <Row label="Fee (1%)" value={`− ${formatINR(fee)}`}/>
          <div className="my-2 h-px bg-border"/>
          <Row label="You receive" value={<span className="text-base font-bold">{formatINR(netInr)}</span>}/>
        </div>

        <Button onClick={submit} disabled={!ok || processing} className="brand-gradient h-14 w-full rounded-2xl text-base font-bold text-white">
          {processing ? "Processing..." : "Sell now"}
        </Button>
      </section>

      <Dialog open={!!done} onOpenChange={(o)=>!o && setDone(null)}>
        <DialogContent className="max-w-sm">
          <div className="py-4 text-center">
            <CheckCircle2 size={56} className="mx-auto text-success"/>
            <h3 className="mt-3 text-xl font-bold">Sell order placed!</h3>
            <p className="mt-1 text-sm text-muted-foreground">{formatINR(netInr)} will reach {upiId} shortly.</p>
            <Button className="brand-gradient mt-4 w-full text-white" onClick={()=>navigate({ to: "/app/orders" })}>View orders</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>;
}
