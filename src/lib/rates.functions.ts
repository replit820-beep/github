import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

export type LiveRates = {
  crypto: Record<string, number>;
  fiat: Record<string, number>;
  updatedAt: number;
  /** "manual" = /rate from Telegram bot, "live" = market FX, "none" = nothing found */
  inrSource: "manual" | "live" | "none";
  manualInr: number | null;
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

// Stablecoins are always exactly 1 USD, so with a manual rate of 115
// 1 USDT / 1 USDC = exactly ₹115 (not ₹114.98 from a 0.9998 market quote).
const STABLES = ["USDT", "USDC"];

/** fetch JSON with a hard timeout so a slow third-party API can never hang the whole response. */
async function fetchJson<T>(url: string, ms = 3000): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: ctrl.signal,
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function readManualInr(): Promise<number | null> {
  try {
    const { getInrRate } = await import("@/lib/settings.server");
    return await getInrRate();
  } catch (err) {
    console.error("getInrRate failed, falling back to live FX:", err);
    return null;
  }
}

/**
 * Live crypto USD prices + fiat FX rates (units per 1 USD).
 *
 * Rate logic:
 *  - Bot `/rate 115` sets manual INR rate = 115  -> 1 USDT/USDC = ₹115,
 *    every other coin = live USD price × 115.
 *  - `/rate 120` -> everything uses 120, `/rate 110` -> everything uses 110.
 *  - No manual rate set -> live market FX is used.
 *
 * POST (not GET) so no browser / CDN / edge cache can ever serve a stale rate.
 */
export const getLiveRates = createServerFn({ method: "POST" }).handler(
  async (): Promise<LiveRates> => {
    setResponseHeaders({
      "Cache-Control": "no-store, no-cache, must-revalidate",
    });

    const ids = Object.values(COIN_IDS).join(",");

    // All three run in parallel; each one fails on its own without affecting the others.
    const [manualInr, cg, fx] = await Promise.all([
      readManualInr(),
      fetchJson<Record<string, { usd?: number }>>(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      ),
      fetchJson<{ rates?: Record<string, number> }>(
        "https://open.er-api.com/v6/latest/USD",
      ),
    ]);

    const crypto: Record<string, number> = {};
    for (const [symbol, id] of Object.entries(COIN_IDS)) {
      const usd = cg?.[id]?.usd;
      if (typeof usd === "number") crypto[symbol] = usd;
    }
    for (const s of STABLES) crypto[s] = 1;

    const fiat: Record<string, number> = {};
    for (const [code, rate] of Object.entries(fx?.rates ?? {})) {
      if (typeof rate === "number") fiat[code] = rate;
    }

    let inrSource: LiveRates["inrSource"] = "none";
    if (manualInr) {
      fiat["INR"] = manualInr;
      inrSource = "manual";
    } else if (typeof fiat["INR"] === "number") {
      inrSource = "live";
    }

    return { crypto, fiat, updatedAt: Date.now(), inrSource, manualInr };
  },
);
