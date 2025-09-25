/**
 * Seller Spotlight Component
 * Features top sellers and new sellers
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Seller {
  id: string;
  displayName: string;
  reputation: number;
  totalSales: number;
  totalProducts: number;
  joinDate: string;
  specialties: string[];
  avatar?: string;
  isNew?: boolean;
  isTopSeller?: boolean;
}

const SellerSpotlight: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real app, this would come from API
    const mockSellers: Seller[] = [
      {
        id: 'seller-1',
        displayName: 'DigitalArtMaster',
        reputation: 95,
        totalSales: 234,
        totalProducts: 45,
        joinDate: '2024-01-15',
        specialties: ['Digital Art', 'NFTs', 'Illustrations'],
        isTopSeller: true
      },
      {
        id: 'seller-2',
        displayName: 'CryptoCrafts',
        reputation: 88,
        totalSales: 156,
        totalProducts: 23,
        joinDate: '2024-02-20',
        specialties: ['Handmade Items', 'Crypto Merchandise'],
        isTopSeller: true
      },
      {
        id: 'seller-3',
        displayName: 'TechGadgetsPro',
        reputation: 92,
        totalSales: 189,
        totalProducts: 34,
        joinDate: '2024-01-08',
        specialties: ['Electronics', 'Gadgets', 'Accessories'],
        isTopSeller: true
      },
      {
        id: 'seller-4',
        displayName: 'NewbieCreator',
        reputation: 75,
        totalSales: 12,
        totalProducts: 5,
        joinDate: '2024-03-01',
        specialties: ['Art', 'Crafts'],
        isNew: true
      },
      {
        id: 'seller-5',
        displayName: 'BlockchainBooks',
        reputation: 85,
        totalSales: 67,
        totalProducts: 18,
        joinDate: '2024-02-10',
        specialties: ['E-books', 'Educational Content'],
        isNew: true
      }
    ];

    setTimeout(() => {
      setSellers(mockSellers);
      setLoading(false);
    }, 1000);
  }, []);

  const topSellers = sellers.filter(seller => seller.isTopSeller);
  const newSellers = sellers.filter(seller => seller.isNew);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading seller spotlight...
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ 
        fontSize: '2.5rem', 
        textAlign: 'center', 
        marginBottom: '40px',
        color: '#333'
      }}>
        👥 Seller Spotlight
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        marginBottom: '40px'
      }}>
        {/* Top Sellers */}
        <div>
          <h3 style={{
            fontSize: '1.5rem',
            marginBottom: '20px',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>🏆</span>
            Top Sellers
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {topSellers.map((seller, index) => (
              <SellerCard 
                key={seller.id} 
                seller={seller} 
                rank={index + 1}
                type="top"
              />
            ))}
          </div>
        </div>

        {/* New Sellers */}
        <div>
          <h3 style={{
            fontSize: '1.5rem',
            marginBottom: '20px',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>✨</span>
            New Sellers
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {newSellers.map((seller, index) => (
              <SellerCard 
                key={seller.id} 
                seller={seller} 
                rank={index + 1}
                type="new"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Become a Seller CTA */}
      <div style={{
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '40px',
        borderRadius: '16px',
        marginTop: '40px'
      }}>
        <h3 style={{
          fontSize: '1.8rem',
          marginBottom: '15px'
        }}>
          Ready to Start Selling?
        </h3>
        <p style={{
          fontSize: '1.1rem',
          marginBottom: '25px',
          opacity: 0.9
        }}>
          Join our community of anonymous sellers and start earning with crypto
        </p>
        <Link 
          to="/marketplace/sell" 
          style={{
            display: 'inline-block',
            background: 'white',
            color: '#667eea',
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
          Start Selling Today
        </Link>
      </div>
    </div>
  );
};

interface SellerCardProps {
  seller: Seller;
  rank: number;
  type: 'top' | 'new';
}

const SellerCard: React.FC<SellerCardProps> = ({ seller, rank, type }) => {
  const getReputationColor = (reputation: number) => {
    if (reputation >= 90) return '#27ae60';
    if (reputation >= 80) return '#f39c12';
    if (reputation >= 70) return '#e67e22';
    return '#e74c3c';
  };

  const getReputationText = (reputation: number) => {
    if (reputation >= 90) return 'Excellent';
    if (reputation >= 80) return 'Very Good';
    if (reputation >= 70) return 'Good';
    return 'Fair';
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <Link
      to={`/marketplace/seller/${seller.id}`}
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
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease',
        border: '1px solid #f0f0f0',
        position: 'relative'
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
        {/* Badge */}
        {type === 'top' && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '15px',
            background: '#ffd700',
            color: '#333',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '0.7rem',
            fontWeight: '700',
            textTransform: 'uppercase'
          }}>
            Top #{rank}
          </div>
        )}
        
        {type === 'new' && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '15px',
            background: '#27ae60',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '0.7rem',
            fontWeight: '700',
            textTransform: 'uppercase'
          }}>
            New
          </div>
        )}

        {/* Avatar */}
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.2rem',
          fontWeight: '600',
          flexShrink: 0
        }}>
          {seller.displayName.charAt(0).toUpperCase()}
        </div>

        {/* Seller Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '6px',
            color: '#333'
          }}>
            {seller.displayName}
          </h4>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: getReputationColor(seller.reputation)
            }}></div>
            <span style={{
              fontSize: '0.8rem',
              color: getReputationColor(seller.reputation),
              fontWeight: '600'
            }}>
              {getReputationText(seller.reputation)} ({seller.reputation})
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.8rem',
            color: '#666',
            marginBottom: '8px'
          }}>
            <span>🛍️ {seller.totalSales} sales</span>
            <span>📦 {seller.totalProducts} items</span>
            <span>📅 {formatJoinDate(seller.joinDate)}</span>
          </div>

          {/* Specialties */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px'
          }}>
            {seller.specialties.slice(0, 2).map((specialty, index) => (
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
                {specialty}
              </span>
            ))}
            {seller.specialties.length > 2 && (
              <span style={{
                background: '#f8f9fa',
                color: '#666',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.7rem'
              }}>
                +{seller.specialties.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div style={{
          color: '#667eea',
          fontSize: '1.2rem',
          flexShrink: 0
        }}>
          →
        </div>
      </div>
    </Link>
  );
};

export default SellerSpotlight;
