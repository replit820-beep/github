import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Shield, FileText, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/settings")({
  head: () => ({ meta: [{ title: "Settings · Velqorfi" }] }),
  component: Settings,
});

function Settings() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const items = [
    { icon: Shield, label: "Privacy & security", note: "RLS-protected data" },
    { icon: FileText, label: "Terms of service", note: "velqorfi.com/terms" },
    { icon: HelpCircle, label: "Help & support", note: "support@velqorfi.com" },
  ];
  return (
    <AppShell>
      <header className="px-5 pt-5">
        <Link to="/app/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16}/>Dashboard</Link>
        <h1 className="mt-3 text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </header>
      <section className="px-5 pt-4 space-y-2">
        {items.map(({ icon: Icon, label, note }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border bg-card p-4">
            <Icon size={20} className="text-primary"/>
            <div className="flex-1"><p className="text-sm font-bold">{label}</p><p className="text-xs text-muted-foreground">{note}</p></div>
          </div>
        ))}
        <Button variant="outline" className="h-12 w-full" onClick={async ()=>{ await signOut(); navigate({ to: "/" }); }}>
          <LogOut size={16}/> Sign out
        </Button>
        <p className="pt-4 text-center text-xs text-muted-foreground">Velqorfi v1.0 · velqorfi.com</p>
      </section>
    </AppShell>
  );
}
