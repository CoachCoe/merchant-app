import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { Product } from '../../models/Product';
import { SellerReputation } from '../components/SellerReputation';
import '../styles/SellerReputation.css';

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart, loading: cartLoading } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/products/${id}`);
        const data = await response.json();

        if (response.ok) {
          setProduct(data.data);
        } else {
          setError(data.message || 'Product not found');
        }
      } catch (err) {
        setError('Failed to load product');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addToCart({
        productId: product.id,
        quantity: quantity,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="alert alert-error">
          <h3>Product Not Found</h3>
          <p>{error || 'The product you are looking for does not exist.'}</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '15px' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" style={{ color: '#667eea', textDecoration: 'none' }}>
          ← Back to Products
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* Product Image */}
        <div>
          <div className="card">
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: '100%',
                height: '400px',
                objectFit: 'cover',
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/400x400?text=No+Image';
              }}
            />
          </div>
        </div>

        {/* Product Details */}
        <div>
          <div className="card">
            <div className="card-body">
              <div style={{ marginBottom: '20px' }}>
                <span style={{
                  background: '#e9ecef',
                  color: '#495057',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {product.category}
                </span>
              </div>

              <h1 style={{
                fontSize: '2.5rem',
                marginBottom: '15px',
                color: '#333'
              }}>
                {product.name}
              </h1>

              {product.sellerWalletAddress && (
                <div style={{ marginBottom: '20px' }}>
                  <SellerReputation
                    sellerWalletAddress={product.sellerWalletAddress}
                    compact={false}
                  />
                </div>
              )}

              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                color: '#667eea',
                marginBottom: '30px'
              }}>
                {formatPrice(product.price)}
              </div>

              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px' }}>Description</h3>
                <p style={{ 
                  lineHeight: '1.6',
                  color: '#666',
                  fontSize: '1.1rem'
                }}>
                  {product.description}
                </p>
              </div>

              {product.isActive ? (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <label className="form-label">Quantity</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="quantity-btn"
                        style={{ width: '40px', height: '40px' }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="quantity-input"
                        style={{ width: '80px', textAlign: 'center' }}
                        min="1"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="quantity-btn"
                        style={{ width: '40px', height: '40px' }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={cartLoading}
                    className="btn btn-primary"
                    style={{ 
                      width: '100%', 
                      padding: '15px',
                      fontSize: '1.1rem',
                      marginBottom: '15px'
                    }}
                  >
                    {cartLoading ? 'Adding to Cart...' : `Add to Cart - ${formatPrice(product.price * quantity)}`}
                  </button>

                  <Link 
                    to="/cart" 
                    className="btn btn-outline"
                    style={{ width: '100%', textAlign: 'center' }}
                  >
                    View Cart
                  </Link>
                </div>
              ) : (
                <div className="alert alert-warning">
                  <h4>Out of Stock</h4>
                  <p>This product is currently unavailable.</p>
                </div>
              )}

              {/* Payment Methods Info */}
              <div style={{ 
                marginTop: '30px', 
                padding: '20px', 
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <h4 style={{ marginBottom: '15px', color: '#667eea' }}>
                  💳 Accepted Payment Methods
                </h4>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>🔵</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>DOT</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>🟡</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>KSM</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>📱</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>NFC</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
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
                  Secure crypto payments with real-time monitoring
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
