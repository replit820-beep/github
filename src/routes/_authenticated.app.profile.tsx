import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Camera,
  LogOut,
  ShieldCheck,
  BadgeCheck,
  ChevronRight,
  Settings,
  Bell,
  CreditCard,
  FileText,
  HelpCircle,
  Lock,
  Sparkles,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => ({ meta: [{ title: "My Profile · Velqorfi" }] }),
  component: Profile,
});

function Profile() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile]);

  const signedAvatar = useQuery({
    queryKey: ["avatar-signed", avatarUrl],
    queryFn: async () => {
      if (!avatarUrl || avatarUrl.startsWith("http")) return avatarUrl;
      const { data } = await supabase.storage.from("avatars").createSignedUrl(avatarUrl, 3600);
      return data?.signedUrl ?? null;
    },
    enabled: !!avatarUrl,
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").upsert({
        id: user!.id, full_name: name, phone, avatar_url: avatarUrl, email: user!.email,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved");
      setEditing(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upload = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    setAvatarUrl(path);
    toast.success("Avatar uploaded — tap Save");
  };

  const displayName = name || user?.email?.split("@")[0] || "Account";
  const memberId = (user?.id ?? "").slice(0, 8).toUpperCase();
  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "—";

  const copyId = async () => {
    if (!user?.id) return;
    await navigator.clipboard.writeText(user.id);
    toast.success("User ID copied");
  };

  const menuGroups: { title: string; items: { icon: typeof Settings; label: string; to?: string; sub?: string; danger?: boolean; onClick?: () => void }[] }[] = [
    {
      title: "Account",
      items: [
        { icon: CreditCard, label: "Payment methods", sub: "UPI, bank accounts", to: "/app/settings" },
        { icon: FileText, label: "Transaction history", sub: "Statements & invoices", to: "/app/orders" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", sub: "Price alerts, order updates", to: "/app/settings" },
        { icon: Lock, label: "Security", sub: "Password, 2FA, sessions", to: "/app/settings" },
        { icon: Settings, label: "App settings", to: "/app/settings" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help center", sub: "FAQs & live chat", to: "/app/settings" },
        { icon: Sparkles, label: "What's new", sub: "Latest updates", to: "/app/settings" },
      ],
    },
  ];

  return (
    <AppShell>
      <header className="px-5 pt-5">
        <Link to="/app/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft size={16} />Dashboard
        </Link>
        <div className="mt-3 flex items-end justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <button
            onClick={() => setEditing((v) => !v)}
            className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/80 hover:bg-white/5"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </header>

      {/* Hero identity card */}
      <section className="px-5 pt-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.015] p-5 backdrop-blur-xl">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(34,211,238,0.35), transparent 70%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(20,184,166,0.25), transparent 70%)" }}
          />

          <div className="relative flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-2 ring-white/20 shadow-[0_8px_32px_rgba(34,211,238,0.25)]">
                <AvatarImage src={signedAvatar.data ?? undefined} />
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-600 text-2xl font-bold text-white">
                  {(name || user?.email || "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white shadow-lg ring-2 ring-[#0b1424]"
                aria-label="Change photo"
              >
                <Camera size={12} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-lg font-bold text-white">{displayName}</h2>
                <BadgeCheck size={16} className="shrink-0 text-cyan-400" />
              </div>
              <p className="truncate text-xs text-white/60">{user?.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Verified
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 ring-1 ring-cyan-400/30">
                  <Sparkles size={10} /> Tier 2
                </span>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="relative mt-5 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-black/20">
            {[
              { k: "Volume", v: "₹0", sub: "Lifetime" },
              { k: "Orders", v: "0", sub: "Completed" },
              { k: "Member", v: joined, sub: "Since" },
            ].map((s) => (
              <div key={s.k} className="px-2 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-white/45">{s.k}</p>
                <p className="mt-0.5 text-sm font-bold text-white">{s.v}</p>
                <p className="text-[10px] text-white/50">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* User ID */}
          <button
            onClick={copyId}
            className="relative mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left transition hover:bg-white/[0.06]"
          >
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/45">User ID</p>
              <p className="font-mono text-xs font-semibold text-white/85">VQF-{memberId}</p>
            </div>
            <Copy size={14} className="text-white/50" />
          </button>
        </div>
      </section>


      {/* Edit form (collapsible) */}
      {editing && (
        <section className="px-5 pt-4">
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div>
              <Label className="text-xs text-white/70">Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 bg-black/30" />
            </div>
            <div>
              <Label className="text-xs text-white/70">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." className="mt-1 h-11 bg-black/30" />
            </div>
            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="brand-gradient h-11 w-full text-white"
            >
              {save.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </section>
      )}

      {/* Menu groups */}
      <section className="px-5 pt-5 pb-6 space-y-5">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
              {group.title}
            </p>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
              {group.items.map(({ icon: Icon, label, sub, to }) => (
                <Link
                  key={label}
                  to={to ?? "/app/settings"}
                  className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.04]"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.06] text-white/80 ring-1 ring-white/10">
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{label}</p>
                    {sub && <p className="truncate text-[11px] text-white/50">{sub}</p>}
                  </div>
                  <ChevronRight size={16} className="text-white/40" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={async () => { await signOut(); navigate({ to: "/" }); }}
          className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] py-4 text-sm font-semibold text-white/90 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_8px_24px_-12px_rgba(0,0,0,0.6)] transition-all duration-200 hover:border-red-400/30 hover:from-red-500/[0.08] hover:to-red-500/[0.02] hover:text-red-200 active:scale-[0.985]"
        >
          <LogOut size={16} strokeWidth={2.25} className="text-white/70 transition-colors group-hover:text-red-300" />
          <span className="tracking-wide">Sign out</span>
        </button>

        <p className="pt-2 text-center text-[10px] text-white/35">Velqorfi · v1.0.0</p>
      </section>
    </AppShell>
  );
}
