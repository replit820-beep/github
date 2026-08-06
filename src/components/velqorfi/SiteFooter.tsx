import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Products",
    links: [
      "On and Off Ramps",
      "Token Listing",
      "Card",
      "Crypto Payment",
      "NFT Checkout",
    ],
  },
  {
    title: "Community",
    links: ["About", "VQF Token", "Careers", "Blog", "Brand kit"],
  },
  {
    title: "Support",
    links: ["Help center", "Contact us", "Status", "Fees", "Security"],
  },
  {
    title: "Legal",
    links: ["Terms of service", "Privacy policy", "AML policy", "Licenses"],
  },
];

const SOCIALS = ["X", "TG", "DC", "MD", "YT", "IN"];

export function SiteFooter() {
  return (
    <footer className="bg-white px-5 pb-10 pt-12">
      <div className="mx-auto max-w-6xl">
        <Logo tone="dark" />
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
          Velqorfi (VQF) is a payment solutions provider that seamlessly connects
          fiat and crypto economies for global consumers, merchants, developers,
          and institutions.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {SOCIALS.map((s) => (
            <span
              key={s}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-soft text-[11px] font-semibold text-ink-soft"
            >
              {s}
            </span>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-[17px] font-bold text-ink">{col.title}</p>
              <ul className="mt-3 space-y-3">
                {col.links.map((l) => (
                  <li key={l} className="text-[15px] text-ink-soft">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-5 text-[13px] text-ink-soft">
          © {new Date().getFullYear()} Velqorfi. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
