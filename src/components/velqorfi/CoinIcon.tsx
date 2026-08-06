import { useState } from "react";
import type { Crypto } from "@/lib/velqorfi-data";

/** Real coin artwork with a colored-glyph fallback when no icon exists. */
export function CoinIcon({
  crypto,
  size = 26,
}: {
  crypto: Crypto;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (!crypto.icon || failed) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
        style={{ background: crypto.color, width: size, height: size }}
      >
        {crypto.glyph}
      </span>
    );
  }

  return (
    <img
      src={crypto.icon}
      alt={`${crypto.symbol} logo`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full"
      style={{ width: size, height: size }}
    />
  );
}
