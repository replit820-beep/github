export type Fiat = {
  code: string;
  name: string;
  iso: string;
  rate: number; // units per 1 USD
};

export type Crypto = {
  symbol: string;
  name: string;
  network: string;
  color: string;
  glyph: string;
  price: number; // USD
  icon?: string;
  memo?: boolean;
};

export type Stock = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  color: string;
  glyph: string;
  points: number[];
};

export const FIATS: Fiat[] = [
  { code: "INR", name: "Indian Rupee", iso: "in", rate: 83.4 },
  { code: "ARS", name: "Argentine Peso", iso: "ar", rate: 912 },
  { code: "AUD", name: "Australian Dollar", iso: "au", rate: 1.51 },
  { code: "BDT", name: "Bangladeshi Taka", iso: "bd", rate: 117 },
  { code: "BWP", name: "Botswanan Pula", iso: "bw", rate: 13.7 },
  { code: "BRL", name: "Brazilian Real", iso: "br", rate: 5.42 },
  { code: "CAD", name: "Canadian Dollar", iso: "ca", rate: 1.37 },
  { code: "EUR", name: "Euro", iso: "eu", rate: 0.92 },
  { code: "GBP", name: "British Pound", iso: "gb", rate: 0.78 },
  { code: "HKD", name: "Hong Kong Dollar", iso: "hk", rate: 7.81 },
  { code: "IDR", name: "Indonesian Rupiah", iso: "id", rate: 16200 },
  { code: "ILS", name: "Israeli New Sheqel", iso: "il", rate: 3.71 },
  { code: "JPY", name: "Japanese Yen", iso: "jp", rate: 157 },
  { code: "KZT", name: "Kazakhstani Tenge", iso: "kz", rate: 468 },
  { code: "KES", name: "Kenyan Shilling", iso: "ke", rate: 129 },
  { code: "KWD", name: "Kuwaiti Dinar", iso: "kw", rate: 0.31 },
  { code: "MXN", name: "Mexican Peso", iso: "mx", rate: 18.3 },
  { code: "NGN", name: "Nigerian Naira", iso: "ng", rate: 1520 },
  { code: "PHP", name: "Philippine Peso", iso: "ph", rate: 58.2 },
  { code: "SGD", name: "Singapore Dollar", iso: "sg", rate: 1.35 },
  { code: "TRY", name: "Turkish Lira", iso: "tr", rate: 32.8 },
  { code: "USD", name: "US Dollar", iso: "us", rate: 1 },
  { code: "VND", name: "Vietnamese Dong", iso: "vn", rate: 25400 },
  { code: "ZAR", name: "South African Rand", iso: "za", rate: 18.4 },
];

export const CRYPTOS: Crypto[] = [
  {
    symbol: "USDC",
    name: "BNB Smart Chain (BEP20)",
    network: "BNB Smart Chain (BEP20)",
    color: "oklch(0.6 0.17 250)",
    glyph: "$",
    price: 1,
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdc.png",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    network: "Bitcoin",
    color: "oklch(0.72 0.17 60)",
    glyph: "₿",
    price: 96500,
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png",
  },
  {
    symbol: "ETH",
    name: "Ethereum (ERC20)",
    network: "Ethereum (ERC20)",
    color: "oklch(0.35 0.06 285)",
    glyph: "Ξ",
    price: 3350,
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png",
  },
  {
    symbol: "USDT",
    name: "Tron (TRC20)",
    network: "Tron (TRC20)",
    color: "oklch(0.66 0.13 165)",
    glyph: "₮",
    price: 1,
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdt.png",
  },
  {
    symbol: "BNB",
    name: "BNB Smart Chain (BEP20)",
    network: "BNB Smart Chain (BEP20)",
    color: "oklch(0.82 0.16 95)",
    glyph: "B",
    price: 690,
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/bnb.png",
  },
  {
    symbol: "SOL",
    name: "Solana",
    network: "Solana",
    color: "oklch(0.62 0.2 300)",
    glyph: "S",
    price: 178,
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/sol.png",
  },
  {
    symbol: "TON",
    name: "Toncoin",
    network: "TON",
    color: "oklch(0.68 0.14 235)",
    glyph: "T",
    price: 1.4,
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ton/info/logo.png",
  },
  {
    symbol: "MATIC",
    name: "Polygon",
    network: "Polygon",
    color: "oklch(0.55 0.22 300)",
    glyph: "M",
    price: 0.72,
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/matic.png",
  },
  {
    symbol: "XRP",
    name: "Ripple",
    network: "Ripple",
    color: "oklch(0.3 0.02 265)",
    glyph: "X",
    price: 2.28,
    icon: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/xrp.png",
  },
];

export const STOCKS: Stock[] = [
  {
    symbol: "NVDAx",
    name: "NVIDIA",
    price: 210.65,
    change: 1.94,
    color: "oklch(0.66 0.16 145)",
    glyph: "N",
    points: [22, 30, 44, 62, 48, 34, 30, 26],
  },
  {
    symbol: "TSLAx",
    name: "Tesla",
    price: 322.0,
    change: -0.02,
    color: "oklch(0.58 0.22 20)",
    glyph: "T",
    points: [58, 44, 34, 26, 20, 30, 26, 22],
  },
  {
    symbol: "GOOGLx",
    name: "Google",
    price: 373.96,
    change: 0.12,
    color: "oklch(0.6 0.19 255)",
    glyph: "G",
    points: [26, 40, 56, 34, 22, 40, 58, 66],
  },
  {
    symbol: "AAPLx",
    name: "Apple",
    price: 246.31,
    change: 0.84,
    color: "oklch(0.4 0.01 265)",
    glyph: "A",
    points: [30, 36, 30, 42, 50, 46, 56, 60],
  },
  {
    symbol: "METAx",
    name: "Meta",
    price: 604.12,
    change: -1.21,
    color: "oklch(0.58 0.2 255)",
    glyph: "M",
    points: [60, 52, 56, 40, 34, 30, 26, 24],
  },
  {
    symbol: "AMZNx",
    name: "Amazon",
    price: 231.44,
    change: 2.31,
    color: "oklch(0.72 0.15 70)",
    glyph: "A",
    points: [20, 28, 26, 38, 46, 44, 58, 64],
  },
];

export const PAYMENT_METHODS = [
  { id: "ewallet", label: "E-Wallet", speed: "Instant", badge: "UPI" },
  { id: "card", label: "Credit / Debit Card", speed: "Instant", badge: "VISA" },
  { id: "bank", label: "Bank Transfer", speed: "1–2 hours", badge: "IMPS" },
];

export function formatAmount(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function convert(fiatAmount: number, fiat: Fiat, crypto: Crypto) {
  const usd = fiatAmount / fiat.rate;
  const fee = usd * 0.015;
  return Math.max(0, (usd - fee) / crypto.price);
}
