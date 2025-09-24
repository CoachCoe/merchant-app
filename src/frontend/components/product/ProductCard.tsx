import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../../models/Product';
import { useCart } from '../../hooks/useCart';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, loading } = useCart();

  const handleAddToCart = async () => {
    try {
      await addToCart({
        productId: product.id,
        quantity: 1,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="card fade-in">
      <div style={{ position: 'relative' }}>
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/300x200?text=No+Image';
          }}
        />
        {!product.isActive && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#dc3545',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            Out of Stock
          </div>
        )}
      </div>
      
      <div className="card-body">
        <h3 style={{ marginBottom: '10px', fontSize: '1.2rem' }}>
          {product.name}
        </h3>
        
        <p style={{ 
          color: '#666', 
          marginBottom: '15px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {product.description}
        </p>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <span style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#667eea' 
          }}>
            {formatPrice(product.price)}
          </span>
          
          <span style={{
            background: '#e9ecef',
            color: '#495057',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {product.category}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link 
            to={`/product/${product.id}`}
            className="btn btn-outline"
            style={{ flex: 1, textAlign: 'center' }}
          >
            View Details
          </Link>
          
          <button
            onClick={handleAddToCart}
            disabled={!product.isActive || loading}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            {loading ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
