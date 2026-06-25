export type Network = {
  id: string;
  label: string;
};

export type Coin = {
  id: string; // coingecko id
  symbol: string;
  name: string;
  color: string;
  networks: Network[];
};

export const COINS: Coin[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", color: "#F7931A", networks: [{ id: "BTC", label: "Bitcoin" }] },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", color: "#627EEA", networks: [{ id: "ERC20", label: "Ethereum (ERC20)" }, { id: "ARB", label: "Arbitrum" }, { id: "OP", label: "Optimism" }, { id: "BASE", label: "Base" }] },
  { id: "tether", symbol: "USDT", name: "Tether USD", color: "#26A17B", networks: [{ id: "TRC20", label: "Tron (TRC20)" }, { id: "ERC20", label: "Ethereum (ERC20)" }, { id: "BEP20", label: "BNB Chain (BEP20)" }, { id: "SOL", label: "Solana" }] },
  { id: "usd-coin", symbol: "USDC", name: "USD Coin", color: "#2775CA", networks: [{ id: "ERC20", label: "Ethereum (ERC20)" }, { id: "BEP20", label: "BNB Chain (BEP20)" }, { id: "SOL", label: "Solana" }, { id: "ARB", label: "Arbitrum" }] },
  { id: "binancecoin", symbol: "BNB", name: "BNB", color: "#F3BA2F", networks: [{ id: "BEP20", label: "BNB Chain (BEP20)" }, { id: "BEP2", label: "BNB Beacon (BEP2)" }] },
  { id: "solana", symbol: "SOL", name: "Solana", color: "#9945FF", networks: [{ id: "SOL", label: "Solana" }] },
  { id: "ripple", symbol: "XRP", name: "XRP", color: "#23292F", networks: [{ id: "XRP", label: "XRP Ledger" }] },
  { id: "tron", symbol: "TRX", name: "TRON", color: "#FF060A", networks: [{ id: "TRC20", label: "Tron (TRC20)" }] },
  { id: "the-open-network", symbol: "TON", name: "Toncoin", color: "#0098EA", networks: [{ id: "TON", label: "TON" }] },
  { id: "cardano", symbol: "ADA", name: "Cardano", color: "#0033AD", networks: [{ id: "ADA", label: "Cardano" }] },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", color: "#C2A633", networks: [{ id: "DOGE", label: "Dogecoin" }] },
  { id: "matic-network", symbol: "MATIC", name: "Polygon", color: "#8247E5", networks: [{ id: "POLYGON", label: "Polygon" }, { id: "ERC20", label: "Ethereum (ERC20)" }] },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche", color: "#E84142", networks: [{ id: "AVAX-C", label: "Avalanche C-Chain" }] },
  { id: "polkadot", symbol: "DOT", name: "Polkadot", color: "#E6007A", networks: [{ id: "DOT", label: "Polkadot" }] },
  { id: "litecoin", symbol: "LTC", name: "Litecoin", color: "#345D9D", networks: [{ id: "LTC", label: "Litecoin" }] },
  { id: "shiba-inu", symbol: "SHIB", name: "Shiba Inu", color: "#FFA409", networks: [{ id: "ERC20", label: "Ethereum (ERC20)" }, { id: "BEP20", label: "BNB Chain (BEP20)" }] },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", color: "#2A5ADA", networks: [{ id: "ERC20", label: "Ethereum (ERC20)" }, { id: "BEP20", label: "BNB Chain (BEP20)" }] },
  { id: "cosmos", symbol: "ATOM", name: "Cosmos", color: "#2E3148", networks: [{ id: "ATOM", label: "Cosmos Hub" }] },
  { id: "near", symbol: "NEAR", name: "NEAR Protocol", color: "#00C08B", networks: [{ id: "NEAR", label: "NEAR" }] },
  { id: "arbitrum", symbol: "ARB", name: "Arbitrum", color: "#28A0F0", networks: [{ id: "ARB", label: "Arbitrum" }] },
  { id: "optimism", symbol: "OP", name: "Optimism", color: "#FF0420", networks: [{ id: "OP", label: "Optimism" }] },
  { id: "aptos", symbol: "APT", name: "Aptos", color: "#1B1F23", networks: [{ id: "APT", label: "Aptos" }] },
  { id: "sui", symbol: "SUI", name: "Sui", color: "#4DA2FF", networks: [{ id: "SUI", label: "Sui" }] },
  { id: "pepe", symbol: "PEPE", name: "Pepe", color: "#3C8E3F", networks: [{ id: "ERC20", label: "Ethereum (ERC20)" }] },
  { id: "filecoin", symbol: "FIL", name: "Filecoin", color: "#0090FF", networks: [{ id: "FIL", label: "Filecoin" }] },
  { id: "internet-computer", symbol: "ICP", name: "Internet Computer", color: "#522785", networks: [{ id: "ICP", label: "Internet Computer" }] },
  { id: "hedera-hashgraph", symbol: "HBAR", name: "Hedera", color: "#222222", networks: [{ id: "HBAR", label: "Hedera" }] },
  { id: "stellar", symbol: "XLM", name: "Stellar", color: "#08B5E5", networks: [{ id: "XLM", label: "Stellar" }] },
  { id: "algorand", symbol: "ALGO", name: "Algorand", color: "#000000", networks: [{ id: "ALGO", label: "Algorand" }] },
  { id: "injective-protocol", symbol: "INJ", name: "Injective", color: "#00C2FF", networks: [{ id: "INJ", label: "Injective" }] },
];

export const COIN_BY_SYMBOL = Object.fromEntries(COINS.map((c) => [c.symbol, c]));
export const COIN_BY_ID = Object.fromEntries(COINS.map((c) => [c.id, c]));

export const MIN_INR = 2500;
export const MAX_INR = 50000;
export const FEE_RATE = 0.01; // 1%
