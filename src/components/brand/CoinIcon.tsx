import { useState } from "react";
import type { Coin } from "@/lib/coins";

export function CoinIcon({ coin, image, size = 36 }: { coin: Coin; image?: string; size?: number }) {
  const fallback = `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`;
  const [src, setSrc] = useState<string | null>(image || fallback);

  if (src) {
    return (
      <img
        src={src}
        alt={coin.symbol}
        className="shrink-0 rounded-full bg-white object-contain"
        style={{ width: size, height: size }}
        loading="lazy"
        onError={() => setSrc(null)}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white shrink-0"
      style={{ width: size, height: size, backgroundColor: coin.color, fontSize: size * 0.36 }}
    >
      {coin.symbol.slice(0, 3)}
    </div>
  );
}
