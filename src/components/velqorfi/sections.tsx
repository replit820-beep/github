import { useState } from "react";

const STATS = [
  { value: "145+", label: "Supported countries" },
  { value: "42+", label: "Fiat currencies" },
  { value: "255+", label: "Payment channels" },
  { value: "$4.2B", label: "Volume settled" },
];

const PAYMENT_LOGOS: ReadonlyArray<readonly [string, string, string]> = [
  ["DANA", "bg-logo-blue", "rounded-full"], ["BDO", "bg-logo-red", "rounded-sm"],
  ["GCash", "bg-logo-blue", "rounded-full"], ["kakaopay", "bg-logo-yellow", "rounded-full"],
  ["SPEi", "bg-logo-red", "rotate-45 rounded-sm"], ["PIX", "bg-logo-teal", "rotate-45 rounded-sm"],
  ["UPI", "bg-logo-orange", "rounded-sm"], ["GrabPay", "bg-logo-green", "rounded-full"],
  ["OVO", "bg-logo-violet", "rounded-full"], ["Maya", "bg-logo-green", "rounded-sm"],
];

const PROJECTS: ReadonlyArray<readonly [string, string, string]> = [
  ["OKX", "bg-ink", "grid"], ["Bitget", "bg-logo-teal", "diamond"], ["NEAR", "bg-ink", "ring"],
  ["polygon", "bg-logo-violet", "hex"], ["ARBITRUM", "bg-logo-blue", "hex"], ["CHAINUP", "bg-logo-blue", "diamond"],
  ["Sui", "bg-logo-blue", "drop"], ["TOKEN POCKET", "bg-logo-blue", "rounded"], ["Bitget Wallet", "bg-logo-teal", "diamond"],
  ["bitrue", "bg-logo-blue", "ring"], ["CELO", "bg-logo-yellow", "circle"], ["Pionex", "bg-logo-teal", "grid"],
  ["DODO", "bg-logo-yellow", "circle"], ["BingX", "bg-logo-blue", "diamond"], ["LBANK", "bg-logo-blue", "ring"],
  ["METAONE", "bg-logo-violet", "hex"], ["CoinTR", "bg-logo-red", "circle"], ["SaaSGo", "bg-logo-blue", "rounded"],
];

function LogoMark({ color, shape }: { color: string; shape: string }) {
  const shapeClass =
    shape === "circle" || shape === "ring"
      ? "rounded-full"
      : shape === "hex"
        ? "logo-hex"
        : shape === "drop"
          ? "rounded-full rounded-bl-none"
          : shape === "diamond"
            ? "rotate-45 rounded-sm"
            : "rounded-sm";
  return (
    <span
      className={`relative h-3.5 w-3.5 shrink-0 ${color} ${shapeClass} ${
        shape === "ring" ? "ring-2 ring-inset ring-white/70" : ""
      }`}
    />
  );
}

const COVERAGE = [
  {
    title: "On & off ramps",
    desc: "Buy and sell 200+ assets with cards, bank transfers and local wallets.",
  },
  {
    title: "Merchant payments",
    desc: "Accept crypto, settle in local currency the same business day.",
  },
  {
    title: "Card issuing",
    desc: "Ship a branded Web3 card with spend controls out of the box.",
  },
  {
    title: "Token listings",
    desc: "Make your token purchasable with fiat in every supported market.",
  },
];

const TESTIMONIALS = [
  {
    name: "Sandeep Nailwal",
    role: "Co-founder, Polygon",
    quote:
      "Velqorfi gives us an essential gateway between fiat and crypto. It opens capital inroads that push our DeFi ecosystem to the next level.",
  },
  {
    name: "Gracy Chen",
    role: "CEO, Bitget",
    quote:
      "Their coverage of local payment channels lets users onboard in minutes with the methods they already trust, in the currency they already hold.",
  },
  {
    name: "Illia Polosukhin",
    role: "Co-founder, NEAR",
    quote:
      "A frictionless fiat gateway is the missing layer for mainstream adoption, and Velqorfi delivers it at global scale.",
  },
];

export function TrustBar() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-display text-[30px] font-extrabold leading-none text-ink">
                {s.value}
              </p>
              <p className="mt-2 text-[12px] uppercase tracking-[0.12em] text-ink-soft">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-hidden border-t border-border py-5">
        <div className="payment-marquee flex w-max gap-8 px-5 hover:[animation-play-state:paused]">
          {[...PAYMENT_LOGOS, ...PAYMENT_LOGOS].map(([name, color, shape], index) => (
            <span
              key={`${name}-${index}`}
              className="flex shrink-0 items-center gap-2 text-[13px] font-semibold text-ink-soft"
            >
              <LogoMark color={color} shape={shape} />
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Coverage() {
  return (
    <section className="bg-background px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
          Platform
        </p>
        <h2 className="mt-3 max-w-2xl text-[30px] font-extrabold leading-[1.12] text-ink md:text-[42px]">
          Everything you need to move value across borders
        </h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
          {COVERAGE.map((c, i) => (
            <div key={c.title} className="bg-card p-7">
              <span className="font-display text-[12px] font-bold text-brand">
                0{i + 1}
              </span>
              <h3 className="mt-3 text-[18px] font-bold text-ink">{c.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Projects() {
  return (
    <section className="border-y border-border bg-surface-soft px-5 py-20">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-[26px] font-extrabold leading-tight text-ink md:text-[34px]">
          Trusted by leading Web3 teams
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {PROJECTS.map(([name, color, shape]) => (
            <span
              key={name}
              className="flex h-14 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-[12px] font-semibold text-ink"
            >
              <LogoMark color={color} shape={shape} />
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  const [i, setI] = useState(0);
  const t = TESTIMONIALS[i]!;
  return (
    <section className="bg-background px-5 py-20">
      <div className="mx-auto max-w-3xl">
        <blockquote className="font-display text-[22px] font-semibold leading-[1.45] text-ink md:text-[28px]">
          “{t.quote}”
        </blockquote>
        <div className="mt-7 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-[14px] font-bold text-brand-foreground">
            {t.name.charAt(0)}
          </span>
          <div>
            <p className="text-[14px] font-semibold text-ink">{t.name}</p>
            <p className="text-[12px] text-ink-soft">{t.role}</p>
          </div>
        </div>
        <div className="mt-8 flex gap-2">
          {TESTIMONIALS.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Testimonial ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-[3px] w-10 rounded-full transition-colors ${
                idx === i ? "bg-ink" : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactCta() {
  return (
    <section className="px-5 pb-20">
      <div className="mx-auto max-w-6xl rounded-3xl bg-cta-gradient px-8 py-14 text-center md:px-16">
        <h2 className="mx-auto max-w-xl text-[26px] font-extrabold leading-tight text-brand-foreground md:text-[36px]">
          Ready to add fiat rails to your product?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-brand-foreground/75">
          Go live in days with a single API and a compliance stack that already
          covers 145+ markets.
        </p>
        <button className="mt-8 h-12 rounded-xl bg-brand-foreground px-7 text-[14px] font-semibold text-ink">
          Contact us
        </button>
      </div>
    </section>
  );
}
