/**
 * Category Carousel Component
 * Displays marketplace categories in a horizontal scrolling carousel
 */

import React from 'react';
import { Link } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  icon: string;
  productCount: number;
}

const CategoryCarousel: React.FC = () => {
  const categories: Category[] = [
    { id: 'electronics', name: 'Electronics', icon: '📱', productCount: 24 },
    { id: 'clothing', name: 'Clothing', icon: '👕', productCount: 18 },
    { id: 'books', name: 'Books', icon: '📚', productCount: 12 },
    { id: 'home', name: 'Home & Garden', icon: '🏠', productCount: 15 },
    { id: 'art', name: 'Art & Crafts', icon: '🎨', productCount: 8 },
    { id: 'sports', name: 'Sports', icon: '⚽', productCount: 6 },
    { id: 'jewelry', name: 'Jewelry', icon: '💎', productCount: 9 },
    { id: 'collectibles', name: 'Collectibles', icon: '🏆', productCount: 11 }
  ];

  return (
    <div className="category-carousel" style={{
      display: 'flex',
      gap: '20px',
      overflowX: 'auto',
      padding: '20px 0',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/marketplace/category/${category.id}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textDecoration: 'none',
            color: '#333',
            minWidth: '120px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            border: '1px solid #f0f0f0'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
            {category.icon}
          </div>
          <div style={{ 
            fontWeight: '600', 
            fontSize: '1rem',
            textAlign: 'center',
            marginBottom: '5px'
          }}>
            {category.name}
          </div>
          <div style={{ 
            fontSize: '0.8rem', 
            color: '#666',
            textAlign: 'center'
          }}>
            {category.productCount} items
          </div>
        </Link>
      ))}
    </div>
  );
};

export default CategoryCarousel;
