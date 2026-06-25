import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LineChart, Receipt, User } from "lucide-react";

type NavItem = { to: string; label: string; icon?: typeof Home; primary?: boolean };
const items: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/markets", label: "Markets", icon: LineChart },
  { to: "/buy", label: "Buy", primary: true },
  { to: "/app/orders", label: "Orders", icon: Receipt },
  { to: "/app/profile", label: "Profile", icon: User },
];

function BuyLogo({ className }: { className?: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 14L20 6L28 14" stroke="url(#platinumGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 6V22" stroke="url(#platinumGrad)" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 26L20 34L12 26" stroke="rgba(255,255,255,0.25)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 18V34" stroke="rgba(255,255,255,0.25)" strokeWidth="3" strokeLinecap="round" />
      <defs>
        <linearGradient id="platinumGrad" x1="12" y1="6" x2="28" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#80E9FF" />
          <stop offset="0.5" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#4D9FFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-white/5 bg-[#11141b]/95 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="flex items-center justify-between px-2 py-2">
        {items.map(({ to, label, icon: Icon, primary }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          if (primary) {
            return (
              <Link key={to} to={to as never} className="group relative -top-5 flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 opacity-40 blur-lg transition-opacity group-hover:opacity-60" />
                  <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-[#1a1f29] shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30" />
                    <div className="absolute inset-[1px] flex items-center justify-center rounded-[15px] bg-[#11141b]">
                      <BuyLogo />
                    </div>
                  </div>
                </div>
                <span className="mt-1 text-[11px] font-bold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text uppercase tracking-[0.15em]">
                  {label}
                </span>
              </Link>
            );
          }
          if (!Icon) return null;
          return (
            <Link
              key={to}
              to={to as never}
              className="flex flex-1 flex-col items-center gap-1 py-1 transition-all active:scale-95 group"
            >
              <div className="p-1">
                <Icon size={22} className={active ? "text-primary" : "text-white/40 group-hover:text-white"} />
              </div>
              <span className={active ? "text-[10px] font-semibold text-primary" : "text-[10px] font-medium text-white/40 uppercase tracking-widest group-hover:text-white"}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
