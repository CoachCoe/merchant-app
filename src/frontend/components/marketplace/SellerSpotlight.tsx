/**
 * Seller Spotlight Component
 * Displays featured sellers and new sellers
 */

import React from 'react';
import { Link } from 'react-router-dom';

interface Seller {
  id: string;
  reputation: number;
  totalSales: number;
  joinDate: string;
  specialties: string[];
  avatar?: string;
}

const SellerSpotlight: React.FC = () => {
  const featuredSellers: Seller[] = [
    {
      id: 'seller-1',
      reputation: 4.9,
      totalSales: 156,
      joinDate: '2024-01-15',
      specialties: ['Electronics', 'Gadgets'],
      avatar: '👨‍💻'
    },
    {
      id: 'seller-2',
      reputation: 4.8,
      totalSales: 89,
      joinDate: '2024-02-20',
      specialties: ['Art', 'Crafts'],
      avatar: '👩‍🎨'
    },
    {
      id: 'seller-3',
      reputation: 4.7,
      totalSales: 203,
      joinDate: '2023-11-10',
      specialties: ['Books', 'Collectibles'],
      avatar: '👨‍📚'
    }
  ];

  const newSellers: Seller[] = [
    {
      id: 'seller-4',
      reputation: 5.0,
      totalSales: 12,
      joinDate: '2024-09-01',
      specialties: ['Jewelry'],
      avatar: '👩‍💎'
    },
    {
      id: 'seller-5',
      reputation: 4.8,
      totalSales: 8,
      joinDate: '2024-09-15',
      specialties: ['Home & Garden'],
      avatar: '👨‍🌾'
    }
  ];

  return (
    <section>
      <h2 style={{ 
        fontSize: '2.5rem', 
        textAlign: 'center', 
        marginBottom: '50px',
        color: '#333'
      }}>
        🌟 Seller Spotlight
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '40px',
        marginBottom: '60px'
      }}>
        {/* Featured Sellers */}
        <div>
          <h3 style={{
            fontSize: '1.8rem',
            marginBottom: '30px',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🏆 Top Sellers
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {featuredSellers.map((seller) => (
              <Link
                key={seller.id}
                to={`/marketplace/seller/${seller.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '20px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  textDecoration: 'none',
                  color: '#333',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  border: '1px solid #f0f0f0'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{
                  fontSize: '2.5rem',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8f9fa',
                  borderRadius: '50%'
                }}>
                  {seller.avatar}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '5px'
                  }}>
                    Seller #{seller.id.split('-')[1]}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '5px',
                    fontSize: '0.9rem'
                  }}>
                    <span style={{ color: '#667eea' }}>
                      ⭐ {seller.reputation}
                    </span>
                    <span style={{ color: '#666' }}>
                      • {seller.totalSales} sales
                    </span>
                  </div>
                  
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#666'
                  }}>
                    {seller.specialties.join(', ')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* New Sellers */}
        <div>
          <h3 style={{
            fontSize: '1.8rem',
            marginBottom: '30px',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🆕 New Sellers
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {newSellers.map((seller) => (
              <Link
                key={seller.id}
                to={`/marketplace/seller/${seller.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '20px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  textDecoration: 'none',
                  color: '#333',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  border: '1px solid #f0f0f0'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{
                  fontSize: '2.5rem',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8f9fa',
                  borderRadius: '50%'
                }}>
                  {seller.avatar}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    Seller #{seller.id.split('-')[1]}
                    <span style={{
                      background: '#28a745',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: '600'
                    }}>
                      NEW
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '5px',
                    fontSize: '0.9rem'
                  }}>
                    <span style={{ color: '#667eea' }}>
                      ⭐ {seller.reputation}
                    </span>
                    <span style={{ color: '#666' }}>
                      • {seller.totalSales} sales
                    </span>
                  </div>
                  
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#666'
                  }}>
                    {seller.specialties.join(', ')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div style={{
        textAlign: 'center',
        padding: '40px',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '12px'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          marginBottom: '15px',
          color: '#333'
        }}>
          Want to become a featured seller?
        </h3>
        <p style={{
          color: '#666',
          marginBottom: '20px'
        }}>
          Build your reputation and grow your business in the Web3 marketplace
        </p>
        <Link
          to="/marketplace/sell"
          style={{
            display: 'inline-block',
            background: '#667eea',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#5a6fd8'}
          onMouseOut={(e) => e.currentTarget.style.background = '#667eea'}
        >
          Start Selling Today
        </Link>
      </div>
    </section>
  );
};

export default SellerSpotlight;
