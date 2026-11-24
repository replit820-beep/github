import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/velqorfi/SiteHeader";
import { SiteFooter } from "@/components/velqorfi/SiteFooter";
import { BuyWidget } from "@/components/velqorfi/BuyWidget";
import {
  ContactCta,
  Coverage,
  Projects,
  Testimonials,
} from "@/components/velqorfi/sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Velqorfi — Buy Crypto with Fiat in Minutes" },
      {
        name: "description",
        content:
          "Velqorfi is the settlement layer between fiat and crypto: buy and sell digital assets with 42+ currencies, cards, and local payment rails across 145+ countries.",
      },
      {
        property: "og:title",
        content: "Velqorfi — Buy Crypto with Fiat in Minutes",
      },
      {
        property: "og:description",
        content:
          "Global fiat-to-crypto on and off ramps for consumers, merchants, and Web3 projects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const HOME_STATS = [
  { target: 500, prefix: "", suffix: "K+", label: "Users worldwide" },
  { target: 12, prefix: "$", suffix: "B+", label: "Transaction volume" },
  { display: "99.9%", label: "Uptime" },
  { display: "150+", label: "Countries supported" },
] as const;

function CountUpStat({
  target,
  prefix,
  suffix,
}: {
  target: number;
  prefix: string;
  suffix: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(target);
      return;
    }

    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 1700, 1);
      setCount(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <>
      {prefix}
      {Math.floor(count).toLocaleString("en-US")}
      {suffix}
    </>
  );
}

function HomeStats() {
  return (
    <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-y-5 sm:grid-cols-4 sm:gap-y-0">
      {HOME_STATS.map((stat) => (
        <div
          key={stat.label}
          className="border-l border-border px-4 first:border-l-0 sm:px-5 sm:first:pl-0"
        >
          <dt className="font-display text-[28px] font-extrabold leading-none text-ink">
            {"target" in stat ? (
              <CountUpStat
                target={stat.target}
                prefix={stat.prefix}
                suffix={stat.suffix}
              />
            ) : (
              stat.display
            )}
          </dt>
          <dd className="mt-2 text-[12px] text-ink-soft">{stat.label}</dd>
        </div>
      ))}
    </dl>
  );
}

function Home() {
  return (
    <main className="bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="absolute inset-0 grid-backdrop" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 md:grid-cols-[1.05fr_0.95fr] md:pb-24 md:pt-20">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Fiat infrastructure for Web3
            </span>
            <h1 className="mt-6 text-[38px] font-extrabold leading-[1.05] text-ink md:text-[60px]">
              The settlement layer
              <br />
              between <span className="text-brand">money</span> and
              <br />
              <span className="text-brand">crypto</span>.
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-[1.75] text-ink-soft md:text-[16px]">
              Velqorfi powers seamless fiat-to-crypto flows for a more open
              global economy. Move money, onchain and beyond, with the
              infrastructure builders trust.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/ramp"
                search={{ fiat: "INR", crypto: "USDC", amount: "5000" }}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-6 text-[14px] font-semibold text-brand-foreground transition-opacity hover:opacity-90"
              >
                Start a transfer
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button className="h-12 rounded-xl border border-border bg-card px-6 text-[14px] font-semibold text-ink transition-colors hover:bg-surface-soft">
                Talk to sales
              </button>
            </div>

            <HomeStats />
          </div>

          <div className="relative px-5 py-4">
            <style>{`
              @keyframes velqorfi-rate-float {
                0%, 100% { transform: translateY(0) rotate(-7deg); }
                50% { transform: translateY(-10px) rotate(-7deg); }
              }
              .velqorfi-rate-float { animation: velqorfi-rate-float 5.2s ease-in-out infinite; }
              .velqorfi-rate-float--late { animation-delay: 850ms; }
              @media (prefers-reduced-motion: reduce) {
                .velqorfi-rate-float, .velqorfi-rate-float--late { animation: none; }
              }
            `}</style>
            <span
              aria-hidden="true"
              className="velqorfi-rate-float absolute left-[-12px] top-[20%] z-0 hidden rounded-xl border border-border bg-card px-4 py-3 shadow-card md:block"
            >
              <span className="flex items-center gap-2 text-[13px] font-bold text-brand">
                +2.4% <ArrowRight className="h-4 w-4" />
              </span>
              <span className="mt-0.5 block text-[11px] text-ink-soft">
                USDC
              </span>
            </span>
            <span
              aria-hidden="true"
              className="velqorfi-rate-float velqorfi-rate-float--late absolute right-[-150px] top-[15%] z-0 hidden max-w-[150px] rounded-xl border border-border bg-card px-4 py-3 shadow-card md:block"
            >
              <span className="block text-[12px] font-semibold text-ink">
                Faster
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-ink-soft">
                A more open financial future.
              </span>
            </span>
            <span
              aria-hidden="true"
              className="velqorfi-rate-float velqorfi-rate-float--late absolute bottom-[19%] right-[-14px] z-0 hidden rotate-[-7deg] rounded-xl border border-border bg-card px-4 py-3 shadow-card md:block"
            >
              <span className="flex items-center gap-2 text-[13px] font-bold text-brand">
                +2.4% <ArrowRight className="h-4 w-4" />
              </span>
              <span className="mt-0.5 block text-[11px] text-ink-soft">
                USDC
              </span>
            </span>
            <div className="relative z-10">
              <BuyWidget />
            </div>
          </div>
        </div>
      </section>

      <Coverage />
      <Projects />
      <Testimonials />
      <ContactCta />
      <SiteFooter />
    </main>
  );
}
