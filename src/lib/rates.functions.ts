import { createServerFn } from "@tanstack/react-start";

export type LiveRates = {
  crypto: Record<string, number>;
  fiat: Record<string, number>;
  updatedAt: number;
};

const COIN_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  BNB: "binancecoin",
  SOL: "solana",
  TON: "the-open-network",
  MATIC: "matic-network",
  XRP: "ripple",
  GRAM: "gram-2",
};

/** Live crypto USD prices + fiat FX rates (units per 1 USD). */
export const getLiveRates = createServerFn({ method: "GET" }).handler(
  async (): Promise<LiveRates> => {
    const ids = Object.values(COIN_IDS).join(",");
    const crypto: Record<string, number> = {};
    const fiat: Record<string, number> = {};

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
        { headers: { accept: "application/json" } },
      );
      if (res.ok) {
        const json = (await res.json()) as Record<string, { usd?: number }>;
        for (const [symbol, id] of Object.entries(COIN_IDS)) {
          const usd = json[id]?.usd;
          if (typeof usd === "number") crypto[symbol] = usd;
        }
      }
    } catch {
      /* fall back to static prices on the client */
    }

    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD", {
        headers: { accept: "application/json" },
      });
      if (res.ok) {
        const json = (await res.json()) as { rates?: Record<string, number> };
        for (const [code, rate] of Object.entries(json.rates ?? {})) {
          if (typeof rate === "number") fiat[code] = rate;
        }
      }
    } catch {
      /* fall back to static rates on the client */
    }

    try {
      const { getInrRate } = await import("@/lib/settings.server");
      const manualInr = await getInrRate();
      if (manualInr) fiat["INR"] = manualInr;
    } catch {
      /* keep live FX when the manual rate is unavailable */
    }

    return { crypto, fiat, updatedAt: Date.now() };
  },
);
