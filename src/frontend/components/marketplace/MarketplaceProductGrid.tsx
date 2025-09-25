/**
 * Marketplace Product Grid Component
 * Displays products in a responsive grid layout
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { MarketplaceProduct } from '../../../models/MarketplaceProduct';

interface MarketplaceProductGridProps {
  products: MarketplaceProduct[];
  loading?: boolean;
  error?: string;
  showSellerInfo?: boolean;
  gridColumns?: number;
}

const MarketplaceProductGrid: React.FC<MarketplaceProductGridProps> = ({
  products,
  loading = false,
  error,
  showSellerInfo = true,
  gridColumns = 4
}) => {
  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
        gap: '24px',
        padding: '20px 0'
      }}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} style={{
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '20px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            <div style={{
              height: '200px',
              background: '#e9ecef',
              borderRadius: '8px',
              marginBottom: '15px'
            }}></div>
            <div style={{
              height: '20px',
              background: '#e9ecef',
              borderRadius: '4px',
              marginBottom: '10px'
            }}></div>
            <div style={{
              height: '16px',
              background: '#e9ecef',
              borderRadius: '4px',
              width: '60%'
            }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: '#e74c3c'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>😞</div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Oops! Something went wrong</h3>
        <p style={{ color: '#666' }}>{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: '#666'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔍</div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>No products found</h3>
        <p>Try adjusting your search criteria or browse our categories</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
      gap: '24px',
      padding: '20px 0'
    }}>
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          showSellerInfo={showSellerInfo}
        />
      ))}
    </div>
  );
};

interface ProductCardProps {
  product: MarketplaceProduct;
  showSellerInfo: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, showSellerInfo }) => {
  const formatPrice = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    return `${numAmount.toFixed(2)} ${currency}`;
  };

  const getReputationColor = (reputation: number) => {
    if (reputation >= 80) return '#27ae60';
    if (reputation >= 60) return '#f39c12';
    if (reputation >= 40) return '#e67e22';
    return '#e74c3c';
  };

  const getReputationText = (reputation: number) => {
    if (reputation >= 80) return 'Excellent';
    if (reputation >= 60) return 'Good';
    if (reputation >= 40) return 'Fair';
    return 'Poor';
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
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        border: '1px solid #f0f0f0'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
      }}
      >
        {/* Product Image */}
        <div style={{
          position: 'relative',
          height: '200px',
          background: '#f8f9fa',
          overflow: 'hidden'
        }}>
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '2rem'
            }}>
              📦
            </div>
          )}
          
          {/* Availability Badge */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: product.availability === 'available' ? '#27ae60' : '#e74c3c',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {product.availability}
          </div>

          {/* Image Count Badge */}
          {product.images && product.images.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.8rem'
            }}>
              +{product.images.length - 1}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div style={{ padding: '20px' }}>
          {/* Title */}
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#333',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {product.title}
          </h3>

          {/* Price */}
          <div style={{
            fontSize: '1.3rem',
            fontWeight: '700',
            color: '#667eea',
            marginBottom: '12px'
          }}>
            {formatPrice(product.price.amount, product.price.currency)}
            {product.price.usdValue && (
              <span style={{
                fontSize: '0.9rem',
                color: '#666',
                fontWeight: '400',
                marginLeft: '8px'
              }}>
                (${product.price.usdValue.toFixed(2)})
              </span>
            )}
          </div>

          {/* Seller Info */}
          {showSellerInfo && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                {product.seller.displayName ? product.seller.displayName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#666',
                  marginBottom: '2px'
                }}>
                  {product.seller.displayName || 'Anonymous Seller'}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: getReputationColor(product.seller.reputation)
                  }}></div>
                  <span style={{
                    fontSize: '0.8rem',
                    color: getReputationColor(product.seller.reputation),
                    fontWeight: '600'
                  }}>
                    {getReputationText(product.seller.reputation)} ({product.seller.reputation.toFixed(0)})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Product Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: '#666',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>👁️</span>
              <span>{product.stats.views}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>❤️</span>
              <span>{product.stats.favorites}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>⭐</span>
              <span>{product.stats.averageRating.toFixed(1)}</span>
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              marginBottom: '12px'
            }}>
              {product.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  style={{
                    background: '#f8f9fa',
                    color: '#666',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.7rem'
                  }}
                >
                  {tag}
                </span>
              ))}
              {product.tags.length > 3 && (
                <span style={{
                  background: '#f8f9fa',
                  color: '#666',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.7rem'
                }}>
                  +{product.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Delivery Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: '#666'
          }}>
            {product.shipping.available && (
              <span style={{
                background: '#e8f5e8',
                color: '#27ae60',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.7rem'
              }}>
                📦 Shipping
              </span>
            )}
            {product.digitalDelivery.available && (
              <span style={{
                background: '#e3f2fd',
                color: '#1976d2',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.7rem'
              }}>
                💾 Digital
              </span>
            )}
            {product.blockchain.verified && (
              <span style={{
                background: '#fff3e0',
                color: '#f57c00',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.7rem'
              }}>
                ✅ Verified
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MarketplaceProductGrid;
