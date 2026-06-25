import { useEffect, useState } from "react";

const COIN_IDS = [
  "bitcoin", "ethereum", "tether", "usd-coin", "binancecoin", "solana",
  "ripple", "tron", "the-open-network", "cardano", "dogecoin", "matic-network",
  "avalanche-2", "polkadot", "litecoin", "shiba-inu", "chainlink", "cosmos",
  "near", "arbitrum", "optimism", "aptos", "sui", "pepe", "filecoin",
  "internet-computer", "hedera-hashgraph", "stellar", "algorand", "injective-protocol",
];

export function useCoinImages() {
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=250&ids=${COIN_IDS.join(",")}`,
        );
        if (!response.ok) throw new Error("CoinGecko API error");
        const data = (await response.json()) as Array<{ id: string; image: string }>;
        const map: Record<string, string> = {};
        for (const coin of data) {
          map[coin.id] = coin.image;
        }
        setImages(map);
      } catch (error) {
        console.error("Failed to fetch coin images:", error);
      }
    };

    fetchImages();
  }, []);

  return images;
}
