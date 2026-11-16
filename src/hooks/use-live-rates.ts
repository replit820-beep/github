import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLiveRates } from "@/lib/rates.functions";
import { CRYPTOS, FIATS, type Crypto, type Fiat } from "@/lib/velqorfi-data";

/**
 * Merges live CoinGecko / FX rates onto the static asset lists so every
 * conversion (e.g. 10,000 INR -> USDT) uses real market pricing.
 */
export function useLiveRates() {
  const fetchRates = useServerFn(getLiveRates);
  const { data } = useQuery({
    queryKey: ["live-rates"],
    queryFn: () => fetchRates(),
    refetchInterval: 20_000,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const cryptos = useMemo<Crypto[]>(
    () =>
      CRYPTOS.map((c) => {
        const price = data?.crypto[c.symbol];
        return typeof price === "number" && price > 0 ? { ...c, price } : c;
      }),
    [data],
  );

  const fiats = useMemo<Fiat[]>(
    () =>
      FIATS.map((f) => {
        const rate = data?.fiat[f.code];
        return typeof rate === "number" && rate > 0 ? { ...f, rate } : f;
      }),
    [data],
  );

  return {
    cryptos,
    fiats,
    updatedAt: data?.updatedAt ?? null,
    isLive: Boolean(data),
    findCrypto: (symbol: string) =>
      cryptos.find((c) => c.symbol === symbol) ?? cryptos[0]!,
    findFiat: (code: string) => fiats.find((f) => f.code === code) ?? fiats[0]!,
  };
}
