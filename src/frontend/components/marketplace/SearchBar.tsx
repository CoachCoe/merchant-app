/**
 * Marketplace Search Bar Component
 * Advanced search with filters and suggestions
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  showFilters?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search for products, sellers, or categories...",
  showFilters = false 
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    priceMin: '',
    priceMax: '',
    currency: 'DOT',
    condition: '',
    sellerReputation: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Mock suggestions - in real app, these would come from API
  const mockSuggestions = [
    'Digital Art',
    'NFTs',
    'Electronics',
    'Handmade Crafts',
    'Crypto Merchandise',
    'Software',
    'E-books',
    'Music'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 1) {
      const filteredSuggestions = mockSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    performSearch(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const performSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      const searchParams = new URLSearchParams({
        q: searchQuery.trim(),
        ...(filters.category && { category: filters.category }),
        ...(filters.priceMin && { priceMin: filters.priceMin }),
        ...(filters.priceMax && { priceMax: filters.priceMax }),
        ...(filters.currency && { currency: filters.currency }),
        ...(filters.condition && { condition: filters.condition }),
        ...(filters.sellerReputation && { sellerReputation: filters.sellerReputation })
      });

      navigate(`/marketplace/search?${searchParams.toString()}`);
      onSearch(searchQuery.trim());
    }
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      priceMin: '',
      priceMax: '',
      currency: 'DOT',
      condition: '',
      sellerReputation: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'DOT');

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <div style={{
          display: 'flex',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          border: '2px solid transparent',
          transition: 'border-color 0.2s ease'
        }}>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            style={{
              flex: 1,
              padding: '16px 20px',
              border: 'none',
              outline: 'none',
              fontSize: '1.1rem',
              background: 'transparent'
            }}
            onFocus={() => setShowSuggestions(query.length > 1)}
          />
          
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '16px 24px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: '600',
              transition: 'opacity 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            🔍 Search
          </button>
        </div>

        {showFilters && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{
                background: 'transparent',
                border: '1px solid #ddd',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: '#666'
              }}
            >
              {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </form>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 1000,
          marginTop: '4px'
        }}>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ color: '#333' }}>{suggestion}</span>
            </div>
          ))}
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && showAdvancedFilters && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 1000,
          marginTop: '4px',
          padding: '20px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600' }}>
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="">All Categories</option>
                <option value="digital-goods">Digital Goods</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="art-crafts">Art & Crafts</option>
                <option value="collectibles">Collectibles</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600' }}>
                Currency
              </label>
              <select
                value={filters.currency}
                onChange={(e) => setFilters({ ...filters, currency: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="DOT">DOT</option>
                <option value="KSM">KSM</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600' }}>
                Min Price
              </label>
              <input
                type="number"
                value={filters.priceMin}
                onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600' }}>
                Max Price
              </label>
              <input
                type="number"
                value={filters.priceMax}
                onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                placeholder="1000"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600' }}>
                Condition
              </label>
              <select
                value={filters.condition}
                onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="">Any Condition</option>
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600' }}>
                Min Seller Reputation
              </label>
              <input
                type="number"
                value={filters.sellerReputation}
                onChange={(e) => setFilters({ ...filters, sellerReputation: e.target.value })}
                placeholder="0"
                min="0"
                max="100"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
