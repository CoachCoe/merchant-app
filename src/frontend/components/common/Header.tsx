import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { QueryModeToggle } from './QueryModeToggle';

const Header: React.FC = () => {
  const { cart } = useCart();
  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <header className="header">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link to="/" style={{ textDecoration: 'none', color: '#0f172a' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
                3Bay Marketplace
              </h1>
            </Link>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              Web3 Marketplace
            </p>
          </div>

          <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <Link to="/" style={{
              color: '#64748b',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.875rem',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}>
              Products
            </Link>
            <Link to="/marketplace" style={{
              color: '#64748b',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.875rem',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}>
              Marketplace
            </Link>
            <Link
              to="/cart"
              style={{
                color: '#64748b',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.875rem',
                position: 'relative',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >
              Cart
              {itemCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-12px',
                  background: '#0f172a',
                  color: 'white',
                  borderRadius: '9999px',
                  width: '18px',
                  height: '18px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600'
                }}>
                  {itemCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
