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
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading marketplace...
      </div>
    );
  }

  return (
    <div className="marketplace-homepage">
      {/* Hero Section */}
      <section className="hero-section" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '80px 20px',
        textAlign: 'center',
        marginBottom: '60px'
      }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '3.5rem', 
            marginBottom: '20px', 
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            🌐 Web3 Marketplace
          </h1>
          <p style={{ 
            fontSize: '1.4rem', 
            marginBottom: '40px', 
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto 40px auto'
          }}>
            Discover unique items from anonymous sellers. Pay with DOT and KSM cryptocurrency.
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
            gap: '40px', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            marginTop: '40px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '2rem' }}>🔒</span>
              <div>
                <div style={{ fontWeight: '600' }}>Secure Escrow</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Multi-sig protection</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '2rem' }}>👤</span>
              <div>
                <div style={{ fontWeight: '600' }}>Anonymous</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Privacy-first</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '2rem' }}>⚡</span>
              <div>
                <div style={{ fontWeight: '600' }}>Instant</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Crypto payments</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Categories Section */}
        <section style={{ marginBottom: '80px' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            textAlign: 'center', 
            marginBottom: '40px',
            color: '#333'
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
              fontSize: '2.5rem', 
              color: '#333',
              margin: 0
            }}>
              ✨ Newest Listings
            </h2>
            <Link 
              to="/marketplace/products" 
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '1.1rem'
              }}
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
          background: '#f8f9fa', 
          padding: '60px 40px', 
          borderRadius: '12px',
          marginBottom: '80px'
        }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            textAlign: 'center', 
            marginBottom: '50px',
            color: '#333'
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
                fontSize: '3rem', 
                marginBottom: '20px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                1️⃣
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#333' }}>
                Browse & Discover
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Explore unique products from anonymous sellers. Use advanced filters to find exactly what you're looking for.
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '20px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                2️⃣
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#333' }}>
                Secure Purchase
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Pay with DOT or KSM cryptocurrency. Your funds are held in escrow until you confirm delivery.
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '20px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                3️⃣
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#333' }}>
                Enjoy & Review
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Receive your item and leave a review. Help build the community reputation system.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section style={{ 
          textAlign: 'center', 
          padding: '60px 40px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px',
          marginBottom: '40px'
        }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
            Ready to Start Selling?
          </h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9 }}>
            Join thousands of anonymous sellers in the Web3 marketplace
          </p>
          <Link 
            to="/marketplace/sell" 
            style={{
              display: 'inline-block',
              background: 'white',
              color: '#667eea',
              padding: '15px 30px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '1.1rem',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            List Your First Item
          </Link>
        </section>
      </div>
    </div>
  );
};

export default MarketplaceHomePage;
