/**
 * useBlockchain - React hooks for direct blockchain queries
 *
 * Enables components to query ProductRegistry contract directly
 * without relying on the server API.
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { getBlockchainService, MergedProduct } from '../services/blockchainService';
import { getBlockchainCacheService } from '../services/blockchainCacheService';

// Query mode: 'cached' (server API) or 'direct' (blockchain)
export type QueryMode = 'cached' | 'direct';

interface BlockchainContextValue {
  queryMode: QueryMode;
  setQueryMode: (mode: QueryMode) => void;
  isBlockchainReady: boolean;
  contractAddress: string | null;
  rpcUrl: string | null;
  connectedAddress: string | null;
  initializeBlockchain: (rpcUrl: string, contractAddress: string) => Promise<void>;
  connectWallet: (contractAddress: string) => Promise<void>;
}

const BlockchainContext = createContext<BlockchainContextValue | undefined>(undefined);

/**
 * BlockchainProvider - Manages blockchain connection state
 */
export function BlockchainProvider({ children }: { children: ReactNode }) {
  const [queryMode, setQueryMode] = useState<QueryMode>('cached');
  const [isBlockchainReady, setIsBlockchainReady] = useState(false);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [rpcUrl, setRpcUrl] = useState<string | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const initializeBlockchain = useCallback(async (rpc: string, contract: string) => {
    try {
      const service = getBlockchainService();
      await service.initializeWithRPC(rpc, contract);
      setRpcUrl(rpc);
      setContractAddress(contract);
      setIsBlockchainReady(true);
    } catch (error) {
      console.error('Failed to initialize blockchain:', error);
      setIsBlockchainReady(false);
    }
  }, []);

  const connectWallet = useCallback(async (contract: string) => {
    try {
      const service = getBlockchainService();
      await service.initializeWithWallet(contract);
      const address = await service.getConnectedAddress();
      setConnectedAddress(address);
      setContractAddress(contract);
      setIsBlockchainReady(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setIsBlockchainReady(false);
    }
  }, []);

  return (
    <BlockchainContext.Provider
      value={{
        queryMode,
        setQueryMode,
        isBlockchainReady,
        contractAddress,
        rpcUrl,
        connectedAddress,
        initializeBlockchain,
        connectWallet
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
}

/**
 * useBlockchainContext - Access blockchain connection state
 */
export function useBlockchainContext() {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchainContext must be used within BlockchainProvider');
  }
  return context;
}

/**
 * useProduct - Fetch single product (supports both modes)
 */
export function useProduct(productId: string | undefined) {
  const { queryMode, isBlockchainReady } = useBlockchainContext();
  const [product, setProduct] = useState<MergedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      setCacheHit(false);

      try {
        if (queryMode === 'direct') {
          // Direct blockchain query with IndexedDB cache
          if (!isBlockchainReady) {
            throw new Error('Blockchain not initialized');
          }

          const cache = getBlockchainCacheService();

          // 1. Try IndexedDB first (instant ~10ms)
          const cached = await cache.getCachedProduct(productId);
          if (cached) {
            setProduct(cached as any);
            setCacheHit(true);
            setLoading(false);
            console.log(`⚡ Cache hit: ${productId} (IndexedDB)`);
          }

          // 2. Then query blockchain in background (slower ~1500ms)
          const service = getBlockchainService();
          const productData = await service.getProductWithMetadata(productId);
          setProduct(productData as any);
          setCacheHit(false);

          // 3. Update cache for next time
          await cache.cacheProduct(productData);
          console.log(`🔗 Fresh data: ${productId} (blockchain + cached)`);

        } else {
          // Cached mode - query server API
          const response = await fetch(`/api/products/${productId}`);
          const data = await response.json();

          if (response.ok) {
            setProduct(data.data);
          } else {
            setError(data.message || 'Product not found');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, queryMode, isBlockchainReady]);

  return { product, loading, error, cacheHit };
}

/**
 * useProducts - Fetch product list (supports both modes)
 */
export function useProducts(options: {
  category?: string;
  seller?: string;
  limit?: number;
} = {}) {
  const { queryMode, isBlockchainReady } = useBlockchainContext();
  const [products, setProducts] = useState<MergedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        if (queryMode === 'direct') {
          // Direct blockchain query
          if (!isBlockchainReady) {
            throw new Error('Blockchain not initialized');
          }

          const service = getBlockchainService();
          let productIds: string[];

          if (options.category) {
            productIds = await service.getProductsByCategory(options.category);
          } else if (options.seller) {
            productIds = await service.getProductsBySeller(options.seller);
          } else {
            productIds = await service.getAllActiveProducts();
          }

          // Limit results if specified
          if (options.limit) {
            productIds = productIds.slice(0, options.limit);
          }

          const productsData = await service.getProductsWithMetadata(productIds);
          setProducts(productsData as any); // Type assertion for compatibility
        } else {
          // Cached mode - query server API
          const params = new URLSearchParams();
          if (options.category) params.append('categoryId', options.category);
          if (options.seller) params.append('sellerWalletAddress', options.seller);
          if (options.limit) params.append('limit', options.limit.toString());

          const response = await fetch(`/api/products?${params.toString()}`);
          const data = await response.json();

          if (response.ok) {
            setProducts(data.data.products || []);
          } else {
            setError(data.message || 'Failed to load products');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [queryMode, isBlockchainReady, options.category, options.seller, options.limit]);

  return { products, loading, error };
}

/**
 * useQueryMode - Toggle between cached and direct mode
 */
export function useQueryMode() {
  const { queryMode, setQueryMode, isBlockchainReady } = useBlockchainContext();

  const toggleMode = useCallback(() => {
    if (queryMode === 'cached') {
      if (!isBlockchainReady) {
        console.warn('Cannot switch to direct mode: blockchain not initialized');
        return;
      }
      setQueryMode('direct');
    } else {
      setQueryMode('cached');
    }
  }, [queryMode, isBlockchainReady, setQueryMode]);

  return {
    queryMode,
    setQueryMode,
    toggleMode,
    canUseDirect: isBlockchainReady
  };
}

/**
 * useBlockchainInit - Initialize blockchain on app load
 */
export function useBlockchainInit() {
  const { initializeBlockchain } = useBlockchainContext();

  useEffect(() => {
    const init = async () => {
      // Try to get config from environment or API
      try {
        const response = await fetch('/api/config/blockchain');
        if (response.ok) {
          const config = await response.json();
          if (config.data?.rpcUrl && config.data?.contractAddress) {
            await initializeBlockchain(config.data.rpcUrl, config.data.contractAddress);
          }
        }
      } catch (error) {
        console.warn('Failed to auto-initialize blockchain:', error);
      }
    };

    init();
  }, [initializeBlockchain]);
}
