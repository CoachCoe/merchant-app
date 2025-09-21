import { SUPPORTED_CHAINS, COINGECKO_API_BASE_URL } from '../config/index.js';
import { TokenWithPrice } from '../types/index.js';

export class PolkadotPriceService {
  private static priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private static CACHE_DURATION = 60000; // 1 minute cache

  static async getTokenPrices(tokens: TokenWithPrice[]): Promise<TokenWithPrice[]> {
    const uniqueCoingeckoIds = [...new Set(tokens.map(token => {
      const chain = SUPPORTED_CHAINS.find(c => c.id === token.chainId);
      return chain?.coingeckoId;
    }).filter(Boolean))] as string[];

    if (uniqueCoingeckoIds.length === 0) {
      return tokens;
    }

    try {
      const prices = await this.fetchPricesFromCoingecko(uniqueCoingeckoIds);
      
      return tokens.map(token => {
        const chain = SUPPORTED_CHAINS.find(c => c.id === token.chainId);
        const coingeckoId = chain?.coingeckoId;
        
        if (coingeckoId && prices[coingeckoId]) {
          const priceUSD = prices[coingeckoId];
          const valueUSD = parseFloat(token.balance.toString()) * priceUSD;
          
          return {
            ...token,
            priceUSD,
            valueUSD
          };
        }
        
        return token;
      });
    } catch (error) {
      console.error('❌ Failed to fetch token prices:', error);
      return tokens;
    }
  }

  private static async fetchPricesFromCoingecko(coinIds: string[]): Promise<{[coinId: string]: number}> {
    const prices: {[coinId: string]: number} = {};
    
    for (const coinId of coinIds) {
      const cached = this.priceCache.get(coinId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        prices[coinId] = cached.price;
        continue;
      }

      try {
        const response = await fetch(`${COINGECKO_API_BASE_URL}/simple/price?ids=${coinId}&vs_currencies=usd`);
        const data = await response.json();
        
        if (data[coinId]?.usd) {
          const price = data[coinId].usd;
          prices[coinId] = price;
          this.priceCache.set(coinId, { price, timestamp: Date.now() });
        }
      } catch (error) {
        console.error(`❌ Failed to fetch price for ${coinId}:`, error);
      }
    }

    return prices;
  }

  static clearCache() {
    this.priceCache.clear();
  }
}
