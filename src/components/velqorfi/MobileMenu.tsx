import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, X } from "lucide-react";
import { Logo } from "./Logo";
import { RampIcon } from "./icons/RampIcon";
import { TokenIcon } from "./icons/TokenIcon";
import { CardIcon } from "./icons/CardIcon";
import { PaymentIcon } from "./icons/PaymentIcon";
import { NftIcon } from "./icons/NftIcon";

const PRODUCTS = [
  {
    icon: RampIcon,
    title: "On and Off Ramps",
    desc: "D2C fiat-crypto exchanges on your platform",
  },
  {
    icon: TokenIcon,
    title: "Token Listing",
    desc: "List your token for seamless fiat purchases",
    badge: "NEW",
  },
  {
    icon: CardIcon,
    title: "Card",
    desc: "Issue a Web3 card with your branding",
  },
  {
    icon: PaymentIcon,
    title: "Crypto Payment",
    desc: "Accept crypto and receive funds in local currency",
  },
  {
    icon: NftIcon,
    title: "NFT Checkout",
    desc: "Direct NFT purchases with fiat payments",
  },
];

export function MobileMenu({ onClose }: { onClose: () => void }) {
  const [productsOpen, setProductsOpen] = useState(true);
  const [communityOpen, setCommunityOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40"
      />
        <div className="absolute inset-y-0 right-0 w-[92%] animate-in slide-in-from-right overflow-y-auto bg-white duration-300 ease-out">
        <div className="flex items-start justify-between px-5 pt-5">
          <Logo tone="dark" />
           <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-soft"
          >
            <X className="h-5 w-5 text-ink" />
          </button>
        </div>

        <div className="px-5 pb-10 pt-8">
          <button
            onClick={() => setProductsOpen((v) => !v)}
             className="flex items-center gap-2 text-[20px] font-semibold text-ink"
          >
            Products
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-200 ${
                productsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {productsOpen && (
             <div className="mt-5 space-y-5 pl-2 animate-rise">
              {PRODUCTS.map((p) => (
                <div key={p.title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center">
                    <p.icon />
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                       <span className="text-[17px] font-medium text-ink">
                        {p.title}
                      </span>
                      {p.badge && (
                        <span className="rounded-md bg-brand-cyan px-2 py-0.5 text-[11px] font-bold text-ink">
                          {p.badge}
                        </span>
                      )}
                    </span>
                     <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">
                      {p.desc}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="mt-9 text-[19px] font-semibold text-ink">
            Velqorfi Chain
          </p>

          <p className="mt-8 flex items-center gap-3 text-[19px] font-semibold text-ink">
            RWA
            <span className="rounded-full border border-brand px-3 py-1 text-[13px] font-medium text-brand">
              New
            </span>
          </p>

          <p className="mt-8 text-[19px] font-semibold text-ink">About</p>

          <button
            onClick={() => setCommunityOpen((v) => !v)}
            className="mt-8 flex items-center gap-2 text-[19px] font-semibold text-ink"
          >
            Community
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-200 ${
                communityOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {communityOpen && (
            <div className="mt-3 space-y-3 pl-3 text-[16px] text-ink-soft">
              <p>Blog</p>
              <p>X (Twitter)</p>
              <p>Telegram</p>
            </div>
          )}

          <Link
            to="/ramp"
            search={{ fiat: "INR", crypto: "USDC", amount: "5000" }}
            onClick={onClose}
            className="mt-9 flex h-14 w-[70%] items-center justify-center rounded-full border-2 border-brand text-[19px] font-semibold text-brand"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
