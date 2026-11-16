import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

const NAV = [
  { label: "Products", to: "/" },
  { label: "Solutions", to: "/" },
  { label: "Developers", to: "/" },
  { label: "Company", to: "/" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link to="/" aria-label="Velqorfi home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              className="text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {n.label}
            </Link>
          ))}
          <Link
            to="/ramp"
            search={{ fiat: "INR", crypto: "USDC", amount: "5000" }}
            className="rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-brand-foreground transition-opacity hover:opacity-90"
          >
            Launch app
          </Link>
        </nav>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-ink md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
      </div>
      {open && <MobileMenu onClose={() => setOpen(false)} />}
    </header>
  );
}
