import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Logo } from "@/components/brand/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { CoinIcon } from "@/components/brand/CoinIcon";
import { CoinPicker, type CoinNetworkSelection } from "@/components/coin/CoinPicker";
import { COINS, MIN_INR, MAX_INR } from "@/lib/coins";
import { usePrices } from "@/hooks/use-prices";
import { formatINR, formatPct } from "@/lib/format";
import { ChevronDown, ShieldCheck, Zap, Wallet, Globe2, Layers, Code2, Coins, ArrowRight, Mail, MessageCircle, Send } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Velqorfi — Buy & Sell Crypto in India with UPI" },
      { name: "description", content: "Buy USDT, BTC, ETH & 30+ coins in seconds with UPI. Live INR prices and low fees." },
      { property: "og:title", content: "Velqorfi — Bridging fiat and crypto for India" },
      { property: "og:description", content: "Buy crypto with UPI. Sell crypto to UPI. Instant, simple, secure." },
    ],
  }),
  component: Home,
});



function Home() {
  const { data: prices, dataUpdatedAt, isFetching } = usePrices();
  const navigate = useNavigate();
  const [inr, setInr] = useState<string>("2500");
  const [selection, setSelection] = useState<CoinNetworkSelection>({
    coinId: "tether",
    networkId: "TRC20",
  });
  const [pickerOpen, setPickerOpen] = useState(false);

  const coin = useMemo(
    () => COINS.find((c) => c.id === selection.coinId)!,
    [selection.coinId],
  );
  const network = useMemo(
    () => coin.networks.find((n) => n.id === selection.networkId) ?? coin.networks[0],
    [coin, selection.networkId],
  );
  const price = prices?.[selection.coinId]?.inr ?? 0;
  const youGet = price > 0 ? (Number(inr || 0) / price).toFixed(coin.symbol === "BTC" ? 6 : 4) : "0";

  const featured = ["bitcoin", "ethereum", "tether", "solana", "binancecoin"];

  return (
    <AppShell>
      {/* Hero — dark moody */}
      <section className="relative overflow-hidden bg-[linear-gradient(165deg,#08101c_0%,#0b1726_45%,#0a0f1e_100%)] px-5 pb-10 pt-5 text-white">
        <div className="pointer-events-none absolute -left-20 top-32 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px]" />

        <header className="relative flex items-center justify-between">
          <Logo />
          <MobileMenu />
        </header>

        <div className="relative pt-10 text-center">
        <h1 className="text-[40px] font-extrabold leading-[1.05] tracking-tight">
            Bridging the <span className="bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">fiat</span>
            <br />
            and <span className="bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">crypto</span> world
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-white/80">
            Velqorfi makes it effortless to buy and sell digital assets with INR.
            UPI in, crypto out — on every major network, in seconds.
          </p>
          <Link
            to="/buy"
            className="mt-6 inline-block rounded-full border border-white/70 px-8 py-3 text-base font-semibold text-white"
          >
            Get started
          </Link>
        </div>

        {/* Quote card */}
        <div className="relative mt-10 rounded-3xl bg-white/[0.04] p-4 backdrop-blur-xl ring-1 ring-white/10">
          <div className="rounded-2xl bg-card p-5 text-card-foreground">
            <p className="text-sm font-medium text-muted-foreground">You Pay</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <input
                inputMode="decimal"
                value={inr}
                onChange={(e) => setInr(e.target.value.replace(/[^0-9.]/g, ""))}
                className="w-full bg-transparent text-3xl font-extrabold tracking-tight outline-none"
                placeholder="0"
              />
              <div className="flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
                <img src="https://flagcdn.com/w40/in.png" alt="India" className="h-6 w-6 rounded-full object-cover" />
                <span className="text-sm font-bold">INR</span>
              </div>
            </div>
          </div>

          <div className="relative mt-3 rounded-2xl bg-card p-5 text-card-foreground">
            <p className="text-sm font-medium text-muted-foreground">You Get</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-3xl font-extrabold tracking-tight">{youGet}</p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
                  on {network.label}
                </p>
              </div>
              <button
                onClick={() => setPickerOpen(true)}
                className="flex shrink-0 items-center gap-2 rounded-full bg-secondary px-3 py-1.5"
              >
                <CoinIcon coin={coin} size={24} />
                <span className="text-sm font-bold">{coin.symbol}</span>
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          <button
            onClick={() => navigate({ to: "/buy", search: { coin: coin.symbol, amount: Number(inr) || undefined } as never })}
            className="mt-4 block w-full rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 py-4 text-base font-extrabold tracking-wide text-slate-900 shadow-lg shadow-cyan-500/30"
          >
            BUY NOW
          </button>

          <div className="mt-4 flex flex-col items-center gap-2 text-[11px] text-white/70">
            <p>Powered by <span className="font-bold text-white">Velqorfi</span></p>
            <div className="flex h-9 items-center gap-3 rounded-xl bg-white px-3 shadow-sm">
              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-5 w-auto object-contain" loading="lazy" />
              <span className="h-4 w-px bg-slate-200" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" className="h-3.5 w-auto object-contain" loading="lazy" />
              <span className="h-4 w-px bg-slate-200" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-4 w-auto object-contain" loading="lazy" />
              <span className="h-4 w-px bg-slate-200" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" className="h-4 w-auto object-contain" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust pills */}
      <section className="grid grid-cols-3 gap-2.5 px-5 pt-6">
        {[
          { icon: Zap,         label: "Instant UPI", sub: "~12s settle", tint: "#22d3ee" },
          { icon: ShieldCheck, label: "Low Fees",   sub: "from 0.5%",  tint: "#34d399" },
          { icon: Wallet,      label: "30+ Coins",   sub: "8 networks",  tint: "#a78bfa" },
        ].map(({ icon: Icon, label, sub, tint }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.015] p-3 backdrop-blur-sm"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full blur-2xl"
              style={{ background: `${tint}33` }}
            />
            <span
              className="grid h-8 w-8 place-items-center rounded-full ring-1 ring-white/10"
              style={{ background: `radial-gradient(circle at 30% 30%, ${tint}40, ${tint}10 60%, transparent 75%)` }}
            >
              <Icon size={16} style={{ color: tint }} />
            </span>
            <p className="mt-2 text-[12px] font-bold leading-tight text-white">{label}</p>
            <p className="text-[10px] font-medium text-white/55">{sub}</p>
          </div>
        ))}
      </section>


      {/* Live ticker */}
      <section className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold">Live prices</h2>
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className={`absolute inline-flex h-full w-full rounded-full bg-success opacity-75 ${isFetching ? "animate-ping" : ""}`} />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {dataUpdatedAt ? (
              <span className="text-[10px] font-medium text-muted-foreground">
                {new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            ) : null}
          </div>
          <Link to="/markets" className="text-xs font-semibold text-primary">See all →</Link>
        </div>
        <div className="mt-3 space-y-2">
          {featured.map((id) => {
            const c = COINS.find((x) => x.id === id)!;
            const p = prices?.[id];
            const change = p?.inr_24h_change ?? 0;
            return (
              <Link
                key={id}
                to="/buy"
                search={{ coin: c.symbol } as never}
                className="flex items-center gap-3 rounded-2xl border bg-card p-3"
              >
                <CoinIcon coin={c} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{p ? formatINR(p.inr) : "—"}</p>
                  <p className={`text-xs font-semibold ${change >= 0 ? "text-success" : "text-destructive"}`}>
                    {p ? formatPct(change) : "—"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 pt-8">
        <h2 className="text-base font-bold">How it works</h2>
        <ol className="mt-3 space-y-2">
          {[
            "Enter how much INR you want to spend",
            "Pick the coin and network",
            "Paste your wallet address",
            "Pay via UPI — crypto arrives instantly",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl border bg-card p-3">
              <span className="brand-gradient flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                {i + 1}
              </span>
              <p className="text-sm">{step}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Min ₹{MIN_INR.toLocaleString("en-IN")} · Max ₹{MAX_INR.toLocaleString("en-IN")} per order
        </p>
      </section>

      {/* Global coverage / stats */}
      <section className="mt-10 bg-[linear-gradient(180deg,#0a1220_0%,#0b1424_100%)] px-5 py-10 text-white">
        <h2 className="text-[28px] font-extrabold leading-tight">
          Peerless <span className="bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">pan-India</span> coverage
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Velqorfi supports INR ↔ crypto across every UPI app and major Indian bank.
          From metros to tier-3 towns — wallets settle in seconds, 24×7.
        </p>
        <Link to="/buy" className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 to-teal-300 px-6 py-3 text-sm font-bold text-slate-900">
          Talk to us <ArrowRight size={16} />
        </Link>

        <div className="mt-8 grid grid-cols-2 gap-3 rounded-3xl bg-white/[0.04] p-4 ring-1 ring-white/10">
          {[
            {
              n: "1M+",
              l: "Trades settled",
              cluster: [
                { src: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg", alt: "GPay" },
                { src: "https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg", alt: "PhonePe" },
                { src: "https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg", alt: "Paytm" },
              ],
            },
            {
              n: "30+",
              l: "Cryptocurrencies",
              cluster: [
                { src: "https://assets.coincap.io/assets/icons/btc@2x.png", alt: "BTC" },
                { src: "https://assets.coincap.io/assets/icons/eth@2x.png", alt: "ETH" },
                { src: "https://assets.coincap.io/assets/icons/usdt@2x.png", alt: "USDT" },
              ],
            },
            {
              n: "8+",
              l: "Networks supported",
              chips: [
                { label: "TRX", color: "#EF4444" },
                { label: "ETH", color: "#627EEA" },
                { label: "BSC", color: "#F0B90B" },
              ],
            },
            {
              n: "ALL",
              l: "UPI apps & banks",
              chips: [
                { label: "HDFC", color: "#004C8F" },
                { label: "SBI", color: "#22409A" },
                { label: "ICICI", color: "#B02A30" },
              ],
            },
          ].map((stat) => (
            <div key={stat.l} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 ring-1 ring-white/10">
              <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan-400/10 blur-2xl" />
              <p className="text-2xl font-extrabold leading-none">{stat.n}</p>
              <p className="mt-1.5 text-[11px] font-medium text-white/60">{stat.l}</p>

              <div className="mt-3 flex items-center">
                {stat.cluster?.map((c, i) => (
                  <span
                    key={c.alt}
                    className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-white shadow-md ring-2 ring-[#0b1424]"
                    style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i }}
                  >
                    <img src={c.src} alt={c.alt} className="h-4 w-4 object-contain" loading="lazy" />
                  </span>
                ))}
                {stat.chips?.map((c, i) => (
                  <span
                    key={c.label}
                    className="grid h-7 min-w-7 place-items-center rounded-full px-1.5 text-[9px] font-extrabold tracking-tight text-white shadow-md ring-2 ring-[#0b1424]"
                    style={{ backgroundColor: c.color, marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i }}
                  >
                    {c.label}
                  </span>
                ))}
                <span
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[11px] font-bold text-white/80 ring-2 ring-[#0b1424]"
                  style={{ marginLeft: -8, zIndex: 1 }}
                >
                  +
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Networks we power */}
      <section className="px-5 py-10">
        <h2 className="text-center text-[24px] font-extrabold leading-tight">
          Powering the leading <span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">Web3 networks</span>
        </h2>
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {[
            { name: "Bitcoin",  logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg",   tint: "#F7931A" },
            { name: "Ethereum", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.svg",  tint: "#627EEA" },
            { name: "Tron",     logo: "https://cryptologos.cc/logos/tron-trx-logo.svg",      tint: "#EF0027" },
            { name: "Solana",   logo: "https://cryptologos.cc/logos/solana-sol-logo.svg",    tint: "#14F195" },
            { name: "BNB",      logo: "https://cryptologos.cc/logos/bnb-bnb-logo.svg",       tint: "#F3BA2F" },
            { name: "Polygon",  logo: "https://cryptologos.cc/logos/polygon-matic-logo.svg", tint: "#8247E5" },
            { name: "Arbitrum", logo: "https://cryptologos.cc/logos/arbitrum-arb-logo.svg",  tint: "#28A0F0" },
            { name: "Base",     logo: "https://avatars.githubusercontent.com/u/108554348?s=200&v=4", tint: "#0052FF" },
            { name: "Avalanche",logo: "https://cryptologos.cc/logos/avalanche-avax-logo.svg",tint: "#E84142" },
            { name: "Optimism", logo: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg", tint: "#FF0420" },
            { name: "TON",      logo: "https://cryptologos.cc/logos/toncoin-ton-logo.svg",   tint: "#0098EA" },
            { name: "Sui",      logo: "https://cryptologos.cc/logos/sui-sui-logo.svg",       tint: "#4DA2FF" },
          ].map(({ name, logo, tint }) => (
            <div
              key={name}
              className="group relative flex h-14 items-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.015] px-2.5 backdrop-blur-sm transition hover:border-white/20"
            >
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full ring-1 ring-white/10"
                style={{ background: `radial-gradient(circle at 30% 30%, ${tint}33, ${tint}10 60%, transparent 75%)` }}
              >
                <img src={logo} alt={name} loading="lazy" className="h-5 w-5 object-contain" />
              </span>
              <span className="truncate text-[11px] font-semibold tracking-wide text-white/90">{name}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-center gap-3">
          <Link to="/markets" className="rounded-full bg-foreground px-5 py-2.5 text-xs font-bold text-background">See all coins</Link>
          <a href="mailto:hello@velqorfi.com" className="rounded-full border border-foreground/30 px-5 py-2.5 text-xs font-bold">Talk to us</a>
        </div>
      </section>

      {/* Liquidity */}
      <section className="bg-secondary/40 px-5 py-10">
        <h2 className="text-center text-[24px] font-extrabold leading-tight">
          Unleash limitless trades with our <span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">trusted liquidity</span> from top exchanges
        </h2>
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {[
            { name: "Binance",    logo: "https://cryptologos.cc/logos/bnb-bnb-logo.svg",                                tint: "#F3BA2F" },
            { name: "Coinbase",   logo: "https://avatars.githubusercontent.com/u/1885080?s=200&v=4",                    tint: "#0052FF" },
            { name: "OKX",        logo: "https://www.okx.com/cdn/assets/imgs/2210/957A1FAD55FF146F.png",                tint: "#FFFFFF" },
            { name: "Kraken",     logo: "https://assets.coingecko.com/markets/images/29/small/kraken.jpg",              tint: "#7B5FF5" },
            { name: "Bybit",      logo: "https://assets.coingecko.com/markets/images/698/small/bybit_spot.png",         tint: "#F7A600" },
            { name: "KuCoin",     logo: "https://assets.coingecko.com/markets/images/61/small/kucoin.png",              tint: "#01BC8D" },
            { name: "Bitfinex",   logo: "https://assets.coingecko.com/markets/images/4/small/BItfinex.png",             tint: "#16B157" },
            { name: "Crypto.com", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3635.png",tint: "#103F68" },
            { name: "Huobi",      logo: "https://assets.coingecko.com/markets/images/25/small/logo_V_colour_black.png", tint: "#2CA6E0" },
          ].map(({ name, logo, tint }) => (
            <div
              key={name}
              className="group relative flex h-14 items-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.015] px-2.5 backdrop-blur-sm transition hover:border-white/20"
            >
              <span
                className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-white/95 ring-1 ring-white/10"
                style={{ boxShadow: `0 0 0 1px ${tint}22 inset` }}
              >
                <img src={logo} alt={name} loading="lazy" className="h-7 w-7 rounded-full object-cover" />
              </span>
              <span className="truncate text-[11px] font-semibold tracking-wide text-white/90">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Developer integration */}
      <section className="px-5 py-10">
        <h2 className="text-[24px] font-extrabold leading-tight">
          <span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">A few lines</span> of code, that's all
        </h2>
        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-400 text-slate-900">
              <Code2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold">Integration</h3>
              <p className="mt-1 text-sm text-muted-foreground">Embed Velqorfi's on/off-ramp via iframe, REST API or SDK — with full INR + UPI support.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-400 text-slate-900">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold">Merchant dashboard</h3>
              <p className="mt-1 text-sm text-muted-foreground">Configure assets, fees, webhooks and payouts after launch.</p>
            </div>
          </div>
        </div>

        <pre className="mt-6 overflow-x-auto rounded-2xl bg-[#0b1220] p-4 text-[11px] leading-relaxed text-white/90 ring-1 ring-white/10">
{`<iframe
  src="https://ramp.velqorfi.com/?appId=
    [your_api_key]&crypto=USDT&network=TRX
    &fiat=INR&amount=2500
    &address=[customer_wallet]"
  allow="payment"
  width="100%" height="100%"
  frameborder="0"
/>`}
        </pre>
      </section>

      {/* Token / community CTA */}
      <section className="px-5 py-10 text-center">
        <h2 className="text-[26px] font-extrabold">
          <span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">VELQ</span> community
        </h2>
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
          Join 50,000+ traders building the fiat-crypto bridge for India.
        </p>
        <a href="#" className="mt-5 inline-block rounded-full bg-gradient-to-r from-cyan-300 to-teal-300 px-7 py-3 text-sm font-bold text-slate-900">
          Learn more
        </a>
      </section>

      {/* Contact gradient CTA */}
      <section className="mx-5 mb-10 overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#0e7490_0%,#155e75_50%,#1e3a8a_100%)] p-7 text-center text-white">
        <p className="text-base font-semibold leading-relaxed">
          Contact us today for more information and the best option for your project.
        </p>
        <a href="mailto:support@velqorfi.com" className="mt-5 inline-block rounded-full border border-white/70 px-7 py-3 text-sm font-bold">
          Contact us
        </a>
      </section>

      {/* Footer */}
      <footer className="bg-[linear-gradient(180deg,#0a1220_0%,#070d18_100%)] px-5 pb-8 pt-10 text-white">
        <Logo />
        <p className="mt-4 text-sm leading-relaxed text-white/70">
          Velqorfi is a fiat–crypto payments platform connecting Indian consumers,
          merchants and developers to global digital assets via UPI.
        </p>
        <div className="mt-5 flex gap-3">
          {[Send, MessageCircle, Mail].map((Icon, i) => (
            <a key={i} href="#" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white">
              <Icon size={16} />
            </a>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
          <div>
            <p className="text-base font-extrabold">Products</p>
            <ul className="mt-3 space-y-2 text-white/70">
              <li><Link to="/buy">Buy crypto</Link></li>
              <li><Link to="/sell">Sell crypto</Link></li>
              <li><Link to="/markets">Markets</Link></li>
              <li><a href="#">API & SDK</a></li>
            </ul>
          </div>
          <div>
            <p className="text-base font-extrabold">Community</p>
            <ul className="mt-3 space-y-2 text-white/70">
              <li><a href="#">About</a></li>
              <li><a href="#">VELQ token</a></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </div>
          <div>
            <p className="text-base font-extrabold">Learn</p>
            <ul className="mt-3 space-y-2 text-white/70">
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Brand kit</a></li>
            </ul>
          </div>
          <div>
            <p className="text-base font-extrabold">Legal</p>
            <ul className="mt-3 space-y-2 text-white/70">
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-5 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Velqorfi · velqorfi.com
        </div>
      </footer>

      <CoinPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selected={selection}
        onSelect={(sel) => setSelection(sel)}
      />
    </AppShell>
  );
}
