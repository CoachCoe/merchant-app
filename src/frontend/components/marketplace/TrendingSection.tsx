/**
 * Trending Section Component
 * Displays trending products in a horizontal scrollable section
 */

import React from 'react';
import { Link } from 'react-router-dom';

interface MarketplaceProduct {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: {
    amount: number;
    currency: string;
    usdValue: number;
  };
  seller: {
    id: string;
    reputation: number;
    totalSales: number;
  };
  condition: string;
  availability: string;
  createdAt: string;
}

interface TrendingSectionProps {
  products: MarketplaceProduct[];
}

const TrendingSection: React.FC<TrendingSectionProps> = ({ products }) => {
  return (
    <section>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ 
          fontSize: '2.5rem', 
          color: '#333',
          margin: 0
        }}>
          🔥 Trending Now
        </h2>
        <Link 
          to="/marketplace/trending" 
          style={{
            color: '#667eea',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1.1rem'
          }}
        >
          View All Trending →
        </Link>
      </div>

      {products.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#666',
          fontSize: '1.1rem'
        }}>
          No trending products available yet. Check back soon!
        </div>
      ) : (
        <div style={{
          display: 'flex',
          gap: '20px',
          overflowX: 'auto',
          padding: '20px 0',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/marketplace/product/${product.id}`}
              style={{
                display: 'block',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                textDecoration: 'none',
                color: '#333',
                minWidth: '280px',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                border: '1px solid #f0f0f0'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{
                height: '200px',
                background: `url(${product.images[0] || 'https://via.placeholder.com/280x200?text=Product'}) center/cover`,
                borderRadius: '12px 12px 0 0',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: '#ff6b6b',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  🔥 Trending
                </div>
              </div>
              
              <div style={{ padding: '20px' }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '8px',
                  lineHeight: '1.3',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {product.title}
                </h3>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: '#667eea'
                  }}>
                    {product.price.amount} {product.price.currency}
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#666'
                  }}>
                    (${product.price.usdValue.toFixed(2)})
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.9rem',
                  color: '#666'
                }}>
                  <span>⭐ {product.seller.reputation.toFixed(1)}</span>
                  <span>•</span>
                  <span>{product.seller.totalSales} sales</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default TrendingSection;
