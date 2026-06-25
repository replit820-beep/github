import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ChevronDown, ArrowRightLeft, Coins, CreditCard, Wallet, Image as ImageIcon } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/use-auth";

type ProductItem = {
  icon: typeof ArrowRightLeft;
  title: string;
  desc: string;
  to: string;
  badge?: string;
};

const PRODUCTS: ProductItem[] = [
  { icon: ArrowRightLeft, title: "Buy & Sell", desc: "Instant INR ⇄ crypto with UPI", to: "/buy" },
  { icon: Coins, title: "Markets", desc: "Live prices for 30+ assets", to: "/markets", badge: "LIVE" },
  { icon: Wallet, title: "Wallets", desc: "Save addresses across networks", to: "/app/wallets" },
  { icon: CreditCard, title: "Demo Checkout", desc: "Test UPI payouts safely", to: "/buy" },
  { icon: ImageIcon, title: "Portfolio", desc: "Track every order in one place", to: "/app/orders" },
];

const ANIM_MS = 300;

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [productsOpen, setProductsOpen] = useState(true);
  const { user } = useAuth();

  const requestOpen = () => {
    setMounted(true);
    setClosing(false);
    requestAnimationFrame(() => setOpen(true));
  };

  const requestClose = () => {
    if (!mounted || closing) return;
    setClosing(true);
    setOpen(false);
    window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, ANIM_MS);
  };

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mounted]);

  return (
    <>
      <button
        aria-label="Open menu"
        onClick={requestOpen}
        className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-900 shadow-md ring-1 ring-black/5"
      >
        <Menu size={20} strokeWidth={2.5} />

      </button>

      {mounted && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${open ? "animate-fade-in" : "animate-fade-out"}`}
            onClick={requestClose}
            aria-hidden
          />
          <aside
            className={`absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col overflow-y-auto bg-background shadow-2xl will-change-transform ${open ? "animate-slide-in-right" : "animate-slide-out-right"}`}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 pt-5">
              <Logo />
              <button
                aria-label="Close menu"
                onClick={requestClose}
                className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground transition-transform hover:scale-105 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>



            <nav className="mt-6 px-5 pb-8">
              <button
                onClick={() => setProductsOpen((v) => !v)}
                className="flex w-full items-center gap-2 py-3 text-lg font-bold"
              >
                Products
                <ChevronDown
                  size={20}
                  className={`transition-transform ${productsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {productsOpen && (
                <ul className="space-y-4 pl-1">
                  {PRODUCTS.map(({ icon: Icon, title, desc, to, badge }) => (
                    <li key={title}>
                      <Link
                        to={to}
                        onClick={requestClose}
                        className="flex items-start gap-3"
                      >
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
                          <Icon size={22} />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="text-base font-semibold text-foreground">{title}</span>
                            {badge && (
                              <span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                                {badge}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">{desc}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 space-y-4 border-t pt-6">
                <Link to="/markets" onClick={requestClose} className="block text-lg font-bold">Markets</Link>
                <Link to="/sell" onClick={requestClose} className="block text-lg font-bold">Sell crypto</Link>
                {user ? (
                  <Link to="/app/dashboard" onClick={requestClose} className="block text-lg font-bold">
                    Dashboard
                  </Link>
                ) : null}
                <Link to="/buy" onClick={requestClose} className="block text-lg font-bold">Buy now</Link>
              </div>

              <div className="mt-8">
                {user ? (
                  <Link
                    to="/app/profile"
                    onClick={requestClose}
                    className="block rounded-full border-2 border-primary px-6 py-3 text-center text-base font-bold text-primary"
                  >
                    My Account
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    onClick={requestClose}
                    className="block rounded-full border-2 border-primary px-6 py-3 text-center text-base font-bold text-primary"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
