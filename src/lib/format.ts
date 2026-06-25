export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

export const formatCrypto = (n: number, decimals = 6) => {
  if (!isFinite(n) || n === 0) return "0";
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
};

export const formatPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
