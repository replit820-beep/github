import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Zap, Globe2 } from "lucide-react";
import { SiteHeader } from "@/components/velqorfi/SiteHeader";
import { SiteFooter } from "@/components/velqorfi/SiteFooter";
import { BuyWidget } from "@/components/velqorfi/BuyWidget";
import {
  ContactCta,
  Coverage,
  Projects,
  Testimonials,
  TrustBar,
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
      { property: "og:title", content: "Velqorfi — Buy Crypto with Fiat in Minutes" },
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

const HIGHLIGHTS = [
  { icon: Zap, title: "Settles in minutes", desc: "Median order confirmation under 90 seconds." },
  { icon: ShieldCheck, title: "Licensed rails", desc: "KYC, AML and custody handled end to end." },
  { icon: Globe2, title: "145+ countries", desc: "Local methods people already trust." },
];

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
              One integration for on-ramps, off-ramps, cards and payouts. Let your
              users move between local currency and digital assets without leaving
              your product.
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

            <dl className="mt-12 grid max-w-lg grid-cols-1 gap-5 sm:grid-cols-3">
              {HIGHLIGHTS.map((h) => (
                <div key={h.title}>
                  <h.icon className="h-5 w-5 text-brand" strokeWidth={2} />
                  <dt className="mt-3 text-[13px] font-semibold text-ink">{h.title}</dt>
                  <dd className="mt-1 text-[12px] leading-relaxed text-ink-soft">
                    {h.desc}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <BuyWidget />
          </div>
        </div>
      </section>

      <TrustBar />
      <Coverage />
      <Projects />
      <Testimonials />
      <ContactCta />
      <SiteFooter />
    </main>
  );
}
