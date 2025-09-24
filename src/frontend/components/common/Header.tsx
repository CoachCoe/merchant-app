import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';

const Header: React.FC = () => {
  const { cart } = useCart();
  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <header className="header">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
              <h1>🛒 Crypto Merchant Store</h1>
            </Link>
            <p>Accept DOT & KSM payments for your products</p>
          </div>
          
          <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>
              Products
            </Link>
            <Link 
              to="/cart" 
              style={{ 
                color: 'white', 
                textDecoration: 'none', 
                fontWeight: '500',
                position: 'relative'
              }}
            >
              🛒 Cart
              {itemCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#ff4757',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600'
                }}>
                  {itemCount}
                </span>
              )}
            </Link>
            <Link to="/admin" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>
              ⚙️ Admin
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
