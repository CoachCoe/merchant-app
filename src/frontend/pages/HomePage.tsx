import React, { useState } from 'react';
import ProductList from '../components/product/ProductList';
import CategoryFilter from '../components/product/CategoryFilter';

const HomePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by ProductList component
  };

  return (
    <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: '80px',
        maxWidth: '800px',
        margin: '0 auto 80px'
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          marginBottom: '24px',
          fontWeight: '700',
          letterSpacing: '-0.03em',
          color: '#0f172a',
          lineHeight: '1.1'
        }}>
          Modern Web3 Commerce
        </h1>
        <p style={{
          fontSize: '1.25rem',
          marginBottom: '40px',
          color: '#64748b',
          lineHeight: '1.6',
          fontWeight: '400'
        }}>
          Decentralized marketplace powered by Polkadot. Buy and sell digital goods with cryptocurrency.
        </p>

        {/* Connect Wallet Button */}
        <button
          className="btn btn-primary"
          style={{
            marginBottom: '48px',
            padding: '16px 32px',
            fontSize: '1rem'
          }}
          onClick={() => alert('Wallet connection coming soon!')}
        >
          Connect Wallet
        </button>

        <div style={{
          display: 'flex',
          gap: '48px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: '48px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#0f172a',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontSize: '1.5rem'
            }}>🔒</div>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Secure</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#0f172a',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontSize: '1.5rem'
            }}>⚡</div>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Fast</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#0f172a',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontSize: '1.5rem'
            }}>🌐</div>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Decentralized</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div style={{ marginBottom: '48px' }}>
        <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '600px' }}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{
                flex: 1,
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '12px 16px',
                fontSize: '0.875rem'
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
              Search
            </button>
          </div>
        </form>

        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      {/* Products Section */}
      <div>
        <h2 style={{
          marginBottom: '32px',
          fontSize: '1.5rem',
          fontWeight: '700',
          letterSpacing: '-0.02em',
          color: '#0f172a'
        }}>
          {selectedCategory
            ? `${selectedCategory}`
            : searchQuery
            ? `Search: "${searchQuery}"`
            : 'All Products'
          }
        </h2>

        <ProductList
          category={selectedCategory || undefined}
          searchQuery={searchQuery || undefined}
        />
      </div>

      {/* Payment Info Section */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        padding: '48px',
        borderRadius: '20px',
        marginTop: '80px',
        textAlign: 'center'
      }}>
        <h3 style={{
          marginBottom: '32px',
          color: '#0f172a',
          fontSize: '1.25rem',
          fontWeight: '700',
          letterSpacing: '-0.01em'
        }}>
          Accepted Payment Methods
        </h3>
        <div style={{ display: 'flex', gap: '48px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
            }}>🔵</div>
            <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#0f172a' }}>DOT</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Polkadot</div>
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
            }}>🟡</div>
            <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#0f172a' }}>KSM</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Kusama</div>
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
            }}>📱</div>
            <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#0f172a' }}>QR Code</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Scan to Pay</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
