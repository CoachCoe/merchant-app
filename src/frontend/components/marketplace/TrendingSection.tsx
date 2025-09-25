/**
 * Trending Section Component
 * Displays trending products and categories
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { MarketplaceProduct } from '../../../models/MarketplaceProduct';

interface TrendingSectionProps {
  products: MarketplaceProduct[];
}

const TrendingSection: React.FC<TrendingSectionProps> = ({ products }) => {
  const trendingCategories = [
    { name: 'Digital Art', count: 45, change: '+12%', icon: '🎨' },
    { name: 'NFTs', count: 23, change: '+8%', icon: '🖼️' },
    { name: 'Crypto Merch', count: 18, change: '+15%', icon: '₿' },
    { name: 'Electronics', count: 34, change: '+5%', icon: '📱' }
  ];

  return (
    <div>
      <h2 style={{ 
        fontSize: '2.5rem', 
        textAlign: 'center', 
        marginBottom: '40px',
        color: '#333'
      }}>
        🔥 Trending Now
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        marginBottom: '40px'
      }}>
        {/* Trending Products */}
        <div>
          <h3 style={{
            fontSize: '1.5rem',
            marginBottom: '20px',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>⭐</span>
            Popular Products
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {products.slice(0, 4).map((product, index) => (
              <TrendingProductCard 
                key={product.id} 
                product={product} 
                rank={index + 1}
              />
            ))}
          </div>
        </div>

        {/* Trending Categories */}
        <div>
          <h3 style={{
            fontSize: '1.5rem',
            marginBottom: '20px',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>📈</span>
            Hot Categories
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {trendingCategories.map((category, index) => (
              <TrendingCategoryCard 
                key={category.name} 
                category={category} 
                rank={index + 1}
              />
            ))}
          </div>
        </div>
      </div>

      {/* View All Link */}
      <div style={{ textAlign: 'center' }}>
        <Link 
          to="/marketplace/trending" 
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          View All Trending Items
        </Link>
      </div>
    </div>
  );
};

interface TrendingProductCardProps {
  product: MarketplaceProduct;
  rank: number;
}

const TrendingProductCard: React.FC<TrendingProductCardProps> = ({ product, rank }) => {
  const formatPrice = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    return `${numAmount.toFixed(2)} ${currency}`;
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#ffd700'; // Gold
      case 2: return '#c0c0c0'; // Silver
      case 3: return '#cd7f32'; // Bronze
      default: return '#667eea';
    }
  };

  return (
    <Link
      to={`/marketplace/product/${product.id}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        background: 'white',
        padding: '15px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease',
        border: '1px solid #f0f0f0'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateX(4px)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      }}
      >
        {/* Rank Badge */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: getRankColor(rank),
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '0.9rem',
          flexShrink: 0
        }}>
          {rank}
        </div>

        {/* Product Image */}
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '8px',
          overflow: 'hidden',
          flexShrink: 0,
          background: '#f8f9fa'
        }}>
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              fontSize: '1.2rem'
            }}>
              📦
            </div>
          )}
        </div>

        {/* Product Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            fontSize: '0.95rem',
            fontWeight: '600',
            marginBottom: '4px',
            color: '#333',
            lineHeight: '1.3',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {product.title}
          </h4>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: '#666'
          }}>
            <span style={{
              color: '#667eea',
              fontWeight: '600'
            }}>
              {formatPrice(product.price.amount, product.price.currency)}
            </span>
            <span>•</span>
            <span>👁️ {product.stats.views}</span>
            <span>•</span>
            <span>❤️ {product.stats.favorites}</span>
          </div>
        </div>

        {/* Trending Arrow */}
        <div style={{
          color: '#27ae60',
          fontSize: '1.2rem',
          flexShrink: 0
        }}>
          ↗️
        </div>
      </div>
    </Link>
  );
};

interface TrendingCategoryCardProps {
  category: {
    name: string;
    count: number;
    change: string;
    icon: string;
  };
  rank: number;
}

const TrendingCategoryCard: React.FC<TrendingCategoryCardProps> = ({ category, rank }) => {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#ffd700'; // Gold
      case 2: return '#c0c0c0'; // Silver
      case 3: return '#cd7f32'; // Bronze
      default: return '#667eea';
    }
  };

  return (
    <Link
      to={`/marketplace/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        background: 'white',
        padding: '15px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease',
        border: '1px solid #f0f0f0'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateX(4px)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      }}
      >
        {/* Rank Badge */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: getRankColor(rank),
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '0.9rem',
          flexShrink: 0
        }}>
          {rank}
        </div>

        {/* Category Icon */}
        <div style={{
          fontSize: '1.8rem',
          flexShrink: 0
        }}>
          {category.icon}
        </div>

        {/* Category Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            fontSize: '0.95rem',
            fontWeight: '600',
            marginBottom: '4px',
            color: '#333'
          }}>
            {category.name}
          </h4>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: '#666'
          }}>
            <span>{category.count} items</span>
            <span>•</span>
            <span style={{
              color: '#27ae60',
              fontWeight: '600'
            }}>
              {category.change}
            </span>
          </div>
        </div>

        {/* Trending Arrow */}
        <div style={{
          color: '#27ae60',
          fontSize: '1.2rem',
          flexShrink: 0
        }}>
          ↗️
        </div>
      </div>
    </Link>
  );
};

export default TrendingSection;
