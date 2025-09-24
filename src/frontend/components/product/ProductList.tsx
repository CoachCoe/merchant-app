import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { Product } from '../../../models/Product';

interface ProductListProps {
  category?: string;
  searchQuery?: string;
}

const ProductList: React.FC<ProductListProps> = ({ category, searchQuery }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchProducts = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '12',
        isActive: 'true',
      });

      if (category) {
        params.append('category', category);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }

      if (reset) {
        setProducts(data.data.products);
      } else {
        setProducts(prev => [...prev, ...data.data.products]);
      }

      setHasMore(data.data.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1, true);
  }, [category, searchQuery]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(page + 1, false);
    }
  };

  if (error) {
    return (
      <div className="alert alert-error">
        <h3>Error Loading Products</h3>
        <p>{error}</p>
        <button 
          onClick={() => fetchProducts(1, true)}
          className="btn btn-primary"
          style={{ marginTop: '10px' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading && products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>No Products Found</h3>
        <p>
          {category 
            ? `No products found in the "${category}" category.`
            : searchQuery 
            ? `No products found matching "${searchQuery}".`
            : 'No products available at the moment.'
          }
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button
            onClick={loadMore}
            disabled={loading}
            className="btn btn-outline"
          >
            {loading ? 'Loading...' : 'Load More Products'}
          </button>
        </div>
      )}

      {loading && products.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
