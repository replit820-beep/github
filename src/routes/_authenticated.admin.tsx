import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Logo } from "@/components/brand/Logo";
import {
  adminLogin,
  adminLogout,
  isAdmin,
  usePaymentSettings,
  setUpiId,
  setQrImage,
  DEFAULT_UPI_ID,
} from "@/lib/payment-settings";
import { toast } from "sonner";
import { Lock, Upload, Save, LogOut, Image as ImageIcon, Trash2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Velqorfi" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(isAdmin());
  }, []);

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-4rem)] bg-[linear-gradient(165deg,#08101c_0%,#0b1726_45%,#0a0f1e_100%)] px-5 py-6 text-white">
        <header className="flex items-center justify-between">
          <Logo />
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/80">
            Admin
          </span>
        </header>

        {authed ? <AdminPanel onLogout={() => setAuthed(false)} /> : <LoginForm onAuthed={() => setAuthed(true)} />}
      </div>
    </AppShell>
  );
}

function LoginForm({ onAuthed }: { onAuthed: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(user.trim(), pass)) {
      setErr("");
      onAuthed();
      toast.success("Welcome, admin");
    } else {
      setErr("Invalid username or password");
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-3xl bg-white/[0.04] p-7 ring-1 ring-white/10 backdrop-blur-xl">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-400 text-slate-900">
        <Lock size={22} />
      </div>
      <h1 className="mt-4 text-center text-xl font-extrabold">Admin sign in</h1>
      <p className="mt-1 text-center text-sm text-white/60">Restricted area</p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-white/70">Username</span>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
            className="mt-1 w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-cyan-400/60"
            placeholder="username"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-white/70">Password</span>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-cyan-400/60"
            placeholder="••••••"
          />
        </label>

        {err && (
          <p className="flex items-center gap-2 rounded-lg bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-300">
            <ShieldAlert size={14} /> {err}
          </p>
        )}

        <button
          type="submit"
          className="mt-2 block w-full rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 py-3 text-sm font-extrabold tracking-wide text-slate-900 shadow-lg shadow-cyan-500/20"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const settings = usePaymentSettings();
  const [upi, setUpi] = useState(settings.upiId);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUpi(settings.upiId);
  }, [settings.upiId]);

  const saveUpi = () => {
    const v = upi.trim();
    if (!v.includes("@") || v.length < 3) {
      toast.error("Enter a valid UPI ID (e.g. name@bank)");
      return;
    }
    setUpiId(v);
    toast.success("UPI ID updated");
  };

  const resetUpi = () => {
    setUpiId(DEFAULT_UPI_ID);
    setUpi(DEFAULT_UPI_ID);
    toast.success("UPI ID reset to default");
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Image too large (max 2 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setQrImage(String(reader.result));
      toast.success("QR image uploaded");
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const clearQr = () => {
    setQrImage(null);
    toast.success("Custom QR removed — auto-generated QR will be used");
  };

  const logout = () => {
    adminLogout();
    onLogout();
    toast.success("Signed out");
  };

  return (
    <div className="mx-auto mt-6 max-w-xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Payment settings</h1>
          <p className="text-sm text-white/60">These show on step 3 of the buy flow.</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/15"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>

      {/* UPI ID */}
      <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">UPI ID</h2>
        <p className="mt-1 text-xs text-white/50">Shown to users when they scan to pay.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={upi}
            onChange={(e) => setUpi(e.target.value)}
            placeholder="merchant@bank"
            className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-white outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-cyan-400/60"
          />
          <button
            onClick={saveUpi}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-300 to-teal-300 px-4 py-3 text-sm font-extrabold text-slate-900"
          >
            <Save size={16} /> Save
          </button>
        </div>
        <button
          onClick={resetUpi}
          className="mt-2 text-xs font-semibold text-white/50 hover:text-white/80"
        >
          Reset to default ({DEFAULT_UPI_ID})
        </button>
      </div>

      {/* QR image */}
      <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">QR code image</h2>
        <p className="mt-1 text-xs text-white/50">
          Upload a custom QR image to override the auto-generated one. PNG/JPG, up to 2 MB.
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-white/10">
            {settings.qrImage ? (
              <img src={settings.qrImage} alt="Current QR" className="h-full w-full object-contain" />
            ) : (
              <div className="text-center text-[10px] font-semibold text-slate-500">
                <ImageIcon size={22} className="mx-auto" />
                <p className="mt-1">No custom QR</p>
                <p className="text-[9px] text-slate-400">(auto-generated)</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15"
            >
              <Upload size={14} /> {settings.qrImage ? "Replace image" : "Upload image"}
            </button>
            {settings.qrImage && (
              <button
                onClick={clearQr}
                className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/25"
              >
                <Trash2 size={14} /> Remove
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onPickFile}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate({ to: "/buy" })}
        className="block w-full rounded-full border border-white/20 py-3 text-sm font-bold text-white/80 hover:bg-white/5"
      >
        Preview on buy page →
      </button>
    </div>
  );
}
