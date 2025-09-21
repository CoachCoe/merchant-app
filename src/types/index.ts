export interface CardData {
  type?: string; // e.g., 'TAG_ISO_14443_4'
  standard?: string; // e.g., 'TAG_ISO_14443_4'
  uid?: string;
  data?: Buffer; // Response from SELECT AID if autoProcessing is on
  atr?: Buffer;
}

export interface TokenWithPrice {
  address: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  priceUSD: number;
  valueUSD: number;
  chainId: number;
  chainName: string;
  chainDisplayName: string;
  isNativeToken: boolean;
}


export interface ChainBalances {
  chainId: number;
  chainName: string;
  chainDisplayName: string;
  tokens: TokenWithPrice[];
  totalValueUSD: number;
}

export interface MultiChainPortfolio {
  address: string;
  chains: ChainBalances[];
  totalValueUSD: number;
  allTokens: TokenWithPrice[];
} 