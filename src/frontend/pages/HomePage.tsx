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
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 40px',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px', fontWeight: '700' }}>
          🛒 Crypto Merchant Store
        </h1>
        <p style={{ fontSize: '1.3rem', marginBottom: '30px', opacity: 0.9 }}>
          Shop with confidence using DOT and KSM cryptocurrency payments
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🔒</span>
            <span>Secure Payments</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <span>Instant Processing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🌐</span>
            <span>Decentralized</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div style={{ marginBottom: '40px' }}>
        <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', maxWidth: '500px' }}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary">
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
          marginBottom: '30px', 
          fontSize: '2rem',
          color: '#333'
        }}>
          {selectedCategory 
            ? `Products in ${selectedCategory}`
            : searchQuery 
            ? `Search results for "${searchQuery}"`
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
        background: '#f8f9fa',
        padding: '40px',
        borderRadius: '12px',
        marginTop: '60px',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#667eea' }}>
          💳 Accepted Payment Methods
        </h3>
        <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔵</div>
            <div style={{ fontWeight: '600' }}>DOT</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Polkadot</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🟡</div>
            <div style={{ fontWeight: '600' }}>KSM</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Kusama</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📱</div>
            <div style={{ fontWeight: '600' }}>NFC</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Tap to Pay</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📱</div>
            <div style={{ fontWeight: '600' }}>QR Code</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Scan to Pay</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
