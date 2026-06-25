import { useQuery } from "@tanstack/react-query";
import { COINS } from "@/lib/coins";

export type PriceMap = Record<string, { inr: number; inr_24h_change: number }>;

const FALLBACK: PriceMap = Object.fromEntries(
  COINS.map((c) => [c.id, { inr: 100, inr_24h_change: 0 }])
);

export function usePrices() {
  return useQuery({
    queryKey: ["prices"],
    queryFn: async (): Promise<PriceMap> => {
      const ids = COINS.map((c) => c.id).join(",");
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=inr&include_24hr_change=true`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("price fetch failed");
        const json = (await res.json()) as PriceMap;
        return { ...FALLBACK, ...json };
      } catch {
        return FALLBACK;
      }
    },
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}
