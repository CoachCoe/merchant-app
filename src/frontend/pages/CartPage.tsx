import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';

const CartPage: React.FC = () => {
  const { cart, loading, error, updateCartItem, removeCartItem, clearCart } = useCart();

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeCartItem(itemId);
    } else {
      await updateCartItem(itemId, { quantity: newQuantity });
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  if (loading && !cart) {
    return (
      <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>Loading your cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="alert alert-error">
          <h3>Error Loading Cart</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <div style={{ padding: '60px 20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛒</div>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>Your Cart is Empty</h2>
          <p style={{ marginBottom: '30px', color: '#666', fontSize: '1.1rem' }}>
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link to="/" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#333' }}>Shopping Cart</h1>
        <button
          onClick={handleClearCart}
          className="btn btn-danger"
          disabled={loading}
        >
          Clear Cart
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
        {/* Cart Items */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3>Cart Items ({cart.items.length})</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {cart.items.map((item) => (
                <div key={item.id} className="cart-item">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="cart-item-image"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                    }}
                  />
                  
                  <div className="cart-item-details">
                    <div className="cart-item-name">{item.product.name}</div>
                    <div className="cart-item-price">{formatPrice(item.unitPrice)} each</div>
                  </div>
                  
                  <div className="cart-item-controls">
                    <div className="quantity-control">
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={loading}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 0;
                          handleQuantityChange(item.id, newQuantity);
                        }}
                        className="quantity-input"
                        min="0"
                        disabled={loading}
                      />
                      <button
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={loading}
                      >
                        +
                      </button>
                    </div>
                    
                    <div style={{ 
                      fontWeight: '600', 
                      color: '#667eea',
                      minWidth: '80px',
                      textAlign: 'right'
                    }}>
                      {formatPrice(item.totalPrice)}
                    </div>
                    
                    <button
                      onClick={() => removeCartItem(item.id)}
                      className="btn btn-danger"
                      style={{ padding: '8px 12px', fontSize: '14px' }}
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3>Order Summary</h3>
            </div>
            <div className="card-body">
              <div className="checkout-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax (8%):</span>
                  <span>{formatPrice(cart.tax)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
              </div>
              
              <div style={{ marginTop: '20px' }}>
                <Link 
                  to="/checkout" 
                  className="btn btn-primary"
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  Proceed to Checkout
                </Link>
              </div>
              
              <div style={{ marginTop: '15px' }}>
                <Link 
                  to="/" 
                  className="btn btn-outline"
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>

          {/* Payment Methods Info */}
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header">
              <h3>💳 Payment Methods</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', flex: '1', minWidth: '80px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>🔵</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>DOT</div>
                </div>
                <div style={{ textAlign: 'center', flex: '1', minWidth: '80px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>🟡</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>KSM</div>
                </div>
                <div style={{ textAlign: 'center', flex: '1', minWidth: '80px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>📱</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>NFC</div>
                </div>
                <div style={{ textAlign: 'center', flex: '1', minWidth: '80px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>📱</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>QR</div>
                </div>
              </div>
              <p style={{ 
                marginTop: '15px', 
                fontSize: '0.9rem', 
                color: '#666',
                textAlign: 'center'
              }}>
                Secure crypto payments with real-time transaction monitoring
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
