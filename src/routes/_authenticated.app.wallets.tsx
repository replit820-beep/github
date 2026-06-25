import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COINS, COIN_BY_SYMBOL } from "@/lib/coins";
import { CoinIcon } from "@/components/brand/CoinIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/wallets")({
  head: () => ({ meta: [{ title: "Saved Wallets · Velqorfi" }] }),
  component: Wallets,
});

function Wallets() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: wallets } = useQuery({
    queryKey: ["wallets", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("wallet_addresses").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("wallet_addresses").delete().eq("id", id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["wallets"] }); toast.success("Removed"); },
  });

  return (
    <AppShell>
      <header className="px-5 pt-5">
        <Link to="/app/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Dashboard</Link>
        <div className="mt-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Wallets</h1>
          <Button onClick={()=>setOpen(true)} className="brand-gradient text-white"><Plus size={16}/>Add</Button>
        </div>
      </header>
      <section className="px-5 pt-4 space-y-2">
        {!wallets?.length && <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">No saved wallets yet.</div>}
        {wallets?.map((w) => {
          const coin = COIN_BY_SYMBOL[w.coin];
          return (
            <div key={w.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
              {coin && <CoinIcon coin={coin}/>}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{w.label} <span className="text-muted-foreground font-normal">· {w.network}</span></p>
                <p className="font-mono text-[11px] text-muted-foreground break-all">{w.address}</p>
              </div>
              <button onClick={()=>del.mutate(w.id)} className="text-destructive p-2"><Trash2 size={16}/></button>
            </div>
          );
        })}
      </section>
      <AddWalletDialog open={open} onOpenChange={setOpen}/>
    </AppShell>
  );
}

function AddWalletDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [coinSym, setCoinSym] = useState("USDT");
  const [network, setNetwork] = useState(COIN_BY_SYMBOL.USDT.networks[0].id);
  const [address, setAddress] = useState("");
  const coin = COIN_BY_SYMBOL[coinSym];

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("wallet_addresses").insert({
        user_id: user!.id, label: label.trim(), coin: coinSym, network, address: address.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallets"] });
      toast.success("Wallet saved");
      onOpenChange(false);
      setLabel(""); setAddress("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add wallet</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Label</Label><Input value={label} onChange={(e)=>setLabel(e.target.value)} placeholder="My Trust Wallet" className="h-11"/></div>
          <div>
            <Label>Coin</Label>
            <Select value={coinSym} onValueChange={(v)=>{setCoinSym(v); setNetwork(COIN_BY_SYMBOL[v].networks[0].id);}}>
              <SelectTrigger className="h-11"><SelectValue/></SelectTrigger>
              <SelectContent>{COINS.map((c)=><SelectItem key={c.symbol} value={c.symbol}>{c.symbol} — {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Network</Label>
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger className="h-11"><SelectValue/></SelectTrigger>
              <SelectContent>{coin.networks.map((n)=><SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Address</Label><Input value={address} onChange={(e)=>setAddress(e.target.value)} className="h-11 font-mono text-sm"/></div>
          <Button onClick={()=>save.mutate()} disabled={!label || address.length<8 || save.isPending} className="brand-gradient w-full text-white">
            {save.isPending ? "Saving..." : "Save wallet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
