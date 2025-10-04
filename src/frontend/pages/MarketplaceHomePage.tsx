/**
 * Marketplace Homepage - Etsy-inspired design
 * Features product discovery, categories, and trending items
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MarketplaceProductGrid from '../components/marketplace/MarketplaceProductGrid';
import CategoryCarousel from '../components/marketplace/CategoryCarousel';
import SearchBar from '../components/marketplace/SearchBar';
import TrendingSection from '../components/marketplace/TrendingSection';
import SellerSpotlight from '../components/marketplace/SellerSpotlight';
import { MarketplaceProduct } from '../../models/MarketplaceProduct';

const MarketplaceHomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<MarketplaceProduct[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);
      
      // Fetch featured products (newest listings)
      const featuredResponse = await fetch('/api/marketplace/products?sortBy=newest&limit=8');
      const featuredData = await featuredResponse.json();
      
      if (featuredData.success) {
        setFeaturedProducts(featuredData.data.products);
      }

      // Fetch trending products (most viewed)
      const trendingResponse = await fetch('/api/marketplace/products?sortBy=popularity&limit=6');
      const trendingData = await trendingResponse.json();
      
      if (trendingData.success) {
        setTrendingProducts(trendingData.data.products);
      }
    } catch (err) {
      setError('Failed to load marketplace data');
      console.error('Error fetching marketplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        fontSize: '0.875rem',
        color: '#64748b',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderRadius: '50%',
          borderTopColor: '#0f172a',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        Loading marketplace...
      </div>
    );
  }

  return (
    <div className="marketplace-homepage">
      {/* Hero Section */}
      <section className="hero-section" style={{
        background: 'white',
        color: '#0f172a',
        padding: '80px 20px',
        textAlign: 'center',
        marginBottom: '80px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '3.5rem',
            marginBottom: '24px',
            fontWeight: '700',
            letterSpacing: '-0.03em',
            lineHeight: '1.1'
          }}>
            Decentralized Marketplace
          </h1>
          <p style={{
            fontSize: '1.25rem',
            marginBottom: '48px',
            color: '#64748b',
            maxWidth: '700px',
            margin: '0 auto 48px auto',
            lineHeight: '1.6'
          }}>
            Discover unique digital goods from verified sellers. Built on Polkadot for true ownership.
          </p>
          
          {/* Search Bar */}
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <SearchBar onSearch={(query) => {
              // Navigate to search results
              window.location.href = `/marketplace/search?q=${encodeURIComponent(query)}`;
            }} />
          </div>

          {/* Trust Indicators */}
          <div style={{
            display: 'flex',
            gap: '48px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '56px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: '#f1f5f9',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '1.75rem'
              }}>🔒</div>
              <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#0f172a' }}>Secure Escrow</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Multi-sig protection</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: '#f1f5f9',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '1.75rem'
              }}>👤</div>
              <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#0f172a' }}>Anonymous</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Privacy-first</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: '#f1f5f9',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '1.75rem'
              }}>⚡</div>
              <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#0f172a' }}>Instant</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Crypto payments</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Categories Section */}
        <section style={{ marginBottom: '80px' }}>
          <h2 style={{
            fontSize: '1.5rem',
            textAlign: 'center',
            marginBottom: '40px',
            color: '#0f172a',
            fontWeight: '700',
            letterSpacing: '-0.02em'
          }}>
            Browse Categories
          </h2>
          <CategoryCarousel />
        </section>

        {/* Trending Section */}
        <section style={{ marginBottom: '80px' }}>
          <TrendingSection products={trendingProducts} />
        </section>

        {/* Featured Products */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#0f172a',
              margin: 0,
              fontWeight: '700',
              letterSpacing: '-0.02em'
            }}>
              Newest Listings
            </h2>
            <Link
              to="/marketplace/products"
              style={{
                color: '#64748b',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >
              View All →
            </Link>
          </div>
          
          {error ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#e74c3c', 
              fontSize: '1.1rem',
              padding: '40px'
            }}>
              {error}
            </div>
          ) : (
            <MarketplaceProductGrid products={featuredProducts} />
          )}
        </section>

        {/* Seller Spotlight */}
        <section style={{ marginBottom: '80px' }}>
          <SellerSpotlight />
        </section>

        {/* How It Works */}
        <section style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          padding: '64px 48px',
          borderRadius: '20px',
          marginBottom: '80px'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            textAlign: 'center',
            marginBottom: '56px',
            color: '#0f172a',
            fontWeight: '700',
            letterSpacing: '-0.02em'
          }}>
            How It Works
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '40px' 
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: '#0f172a',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '2rem',
                color: 'white',
                fontWeight: '700'
              }}>
                1
              </div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '12px', color: '#0f172a', fontWeight: '700', letterSpacing: '-0.01em' }}>
                Browse & Discover
              </h3>
              <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '0.875rem' }}>
                Explore unique products from verified sellers. Use advanced filters to find exactly what you're looking for.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: '#0f172a',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '2rem',
                color: 'white',
                fontWeight: '700'
              }}>
                2
              </div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '12px', color: '#0f172a', fontWeight: '700', letterSpacing: '-0.01em' }}>
                Secure Purchase
              </h3>
              <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '0.875rem' }}>
                Pay with cryptocurrency. Your funds are held in escrow until you confirm delivery.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: '#0f172a',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: '2rem',
                color: 'white',
                fontWeight: '700'
              }}>
                3
              </div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '12px', color: '#0f172a', fontWeight: '700', letterSpacing: '-0.01em' }}>
                Enjoy & Review
              </h3>
              <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '0.875rem' }}>
                Receive your item and leave a review. Help build the community reputation system.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section style={{
          textAlign: 'center',
          padding: '64px 48px',
          background: '#0f172a',
          color: 'white',
          borderRadius: '20px',
          marginBottom: '40px'
        }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: '700', letterSpacing: '-0.02em' }}>
            Ready to Start Selling?
          </h2>
          <p style={{ fontSize: '1rem', marginBottom: '32px', color: '#94a3b8', lineHeight: '1.6' }}>
            Join verified sellers in the decentralized marketplace
          </p>
          <Link
            to="/marketplace/sell"
            className="btn btn-primary"
            style={{
              display: 'inline-block',
              background: 'white',
              color: '#0f172a',
              padding: '14px 28px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
            }}
          >
            List Your First Item
          </Link>
        </section>
      </div>
    </div>
  );
};

export default MarketplaceHomePage;
