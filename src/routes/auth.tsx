import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import appIcon from "@/assets/velqorfi-app-icon.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Lock, BadgeCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Velqorfi" },
      { name: "description", content: "Sign in or create your Velqorfi account to buy and sell crypto with UPI." },
    ],
  }),
  component: AuthPage,
});

function getAuthRedirectUrl(path = "/auth/callback") {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function shouldUseLovableOAuthBroker() {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top || window.location.hostname.endsWith(".lovable.app");
  } catch {
    return true;
  }
}

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user) navigate({ to: "/app/dashboard" }); }, [user, navigate]);

  return (
    <div className="shell-mobile relative bg-background overflow-hidden">
      {/* Ambient brand glow */}
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-40 -right-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative px-5 pt-5">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      <div className="relative px-5 pt-8 pb-8">
        {/* Brand lockup */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute -inset-2 rounded-[28px] bg-gradient-to-br from-cyan-400/30 via-blue-500/30 to-purple-600/30 blur-2xl" />
            <img
              src={appIcon}
              alt="Velqorfi"
              width={64}
              height={64}
              className="relative h-16 w-16 rounded-[22px] object-cover shadow-[0_12px_40px_-12px_rgba(34,211,238,0.45)] ring-1 ring-white/10"
            />
          </div>
          <h1 className="mt-5 text-[26px] font-bold tracking-tight leading-tight">
            Welcome to <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">Velqorfi</span>
          </h1>
          <p className="mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-muted-foreground">
            Sign in to buy & sell crypto with UPI in seconds.
          </p>
        </div>

        {/* Auth card */}
        <div className="mt-7 rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl">
          <GoogleButton />

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            or with email
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/[0.03] border border-white/5">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm /></TabsContent>
            <TabsContent value="signup"><SignUpForm /></TabsContent>
          </Tabs>
        </div>

        {/* Trust footer */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-muted-foreground/70">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={12} /> 256-bit secure</span>
          <span className="h-3 w-px bg-border" />
          <span className="inline-flex items-center gap-1.5"><Lock size={12} /> Encrypted</span>
          <span className="h-3 w-px bg-border" />
          <span className="inline-flex items-center gap-1.5"><BadgeCheck size={12} /> KYC verified</span>
        </div>

        <p className="mt-4 px-2 text-center text-[11px] leading-relaxed text-muted-foreground/60">
          By continuing, you agree to Velqorfi's <span className="text-foreground/70">Terms of Service</span> and <span className="text-foreground/70">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className="h-12 w-full border-white/10 bg-white/[0.03] text-[15px] font-semibold transition-all hover:bg-white/[0.06] hover:border-white/20"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const redirectUri = getAuthRedirectUrl("/auth/callback");

        if (shouldUseLovableOAuthBroker()) {
          const result = await lovable.auth.signInWithOAuth("google", {
            redirect_uri: redirectUri,
            extraParams: { prompt: "select_account" },
          });
          if (result.redirected) return;
          if (result.error) {
            toast.error(result.error.message || "Google sign-in failed");
            setLoading(false);
            return;
          }
          toast.success("Welcome!");
          window.location.assign("/app/dashboard");
          return;
        }

        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUri,
            queryParams: { prompt: "select_account" },
          },
        });
        if (error) { toast.error(error.message || "Google sign-in failed"); setLoading(false); }
      }}
    >
      <GoogleIcon /> {loading ? "Connecting..." : "Continue with Google"}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.2 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.2 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.1z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C41 35.3 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function PasswordInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 pr-11 bg-white/[0.02] border-white/10 focus-visible:border-cyan-400/40"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/app/dashboard" });
  };
  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="si-email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</Label>
        <Input id="si-email" type="email" placeholder="you@example.com" required value={email} onChange={(e)=>setEmail(e.target.value)} className="h-12 bg-white/[0.02] border-white/10 focus-visible:border-cyan-400/40"/>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="si-pass" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</Label>
          <button type="button" className="text-xs text-cyan-400 hover:text-cyan-300">Forgot?</button>
        </div>
        <PasswordInput id="si-pass" value={password} onChange={setPassword} />
      </div>
      <Button type="submit" disabled={loading} className="brand-gradient h-12 w-full text-base font-bold text-white shadow-[0_10px_30px_-10px_rgba(34,211,238,0.5)] transition-transform active:scale-[0.99]">
        {loading ? "Signing in..." : "Sign in securely"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: getAuthRedirectUrl("/auth/callback"), data: { full_name: name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — you're in!");
    navigate({ to: "/app/dashboard" });
  };
  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="su-name" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Full name</Label>
        <Input id="su-name" placeholder="Jane Doe" required value={name} onChange={(e)=>setName(e.target.value)} className="h-12 bg-white/[0.02] border-white/10 focus-visible:border-cyan-400/40"/>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</Label>
        <Input id="su-email" type="email" placeholder="you@example.com" required value={email} onChange={(e)=>setEmail(e.target.value)} className="h-12 bg-white/[0.02] border-white/10 focus-visible:border-cyan-400/40"/>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-pass" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</Label>
        <PasswordInput id="su-pass" value={password} onChange={setPassword} />
        <p className="text-[11px] text-muted-foreground/70">At least 6 characters</p>
      </div>
      <Button type="submit" disabled={loading} className="brand-gradient h-12 w-full text-base font-bold text-white shadow-[0_10px_30px_-10px_rgba(34,211,238,0.5)] transition-transform active:scale-[0.99]">
        {loading ? "Creating..." : "Create account"}
      </Button>
    </form>
  );
}
