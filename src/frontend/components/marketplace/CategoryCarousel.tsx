/**
 * Category Carousel Component
 * Displays categories in a horizontal scrolling carousel
 */

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  productCount?: number;
  color: string;
}

const CategoryCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const categories: Category[] = [
    {
      id: 'digital-goods',
      name: 'Digital Goods',
      description: 'Software, NFTs, digital art',
      icon: '💾',
      productCount: 156,
      color: '#667eea'
    },
    {
      id: 'electronics',
      name: 'Electronics',
      description: 'Gadgets and tech accessories',
      icon: '📱',
      productCount: 89,
      color: '#764ba2'
    },
    {
      id: 'art-crafts',
      name: 'Art & Crafts',
      description: 'Handmade and creative items',
      icon: '🎨',
      productCount: 234,
      color: '#f093fb'
    },
    {
      id: 'clothing',
      name: 'Fashion',
      description: 'Apparel and accessories',
      icon: '👕',
      productCount: 178,
      color: '#4facfe'
    },
    {
      id: 'collectibles',
      name: 'Collectibles',
      description: 'Rare and unique items',
      icon: '🏆',
      productCount: 67,
      color: '#43e97b'
    },
    {
      id: 'books-media',
      name: 'Books & Media',
      description: 'Educational and entertainment',
      icon: '📚',
      productCount: 123,
      color: '#fa709a'
    },
    {
      id: 'crypto-merchandise',
      name: 'Crypto Merch',
      description: 'Blockchain-themed items',
      icon: '₿',
      productCount: 45,
      color: '#ffecd2'
    },
    {
      id: 'services',
      name: 'Services',
      description: 'Digital and consulting services',
      icon: '🛠️',
      productCount: 78,
      color: '#a8edea'
    }
  ];

  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = 280; // Card width + gap
      const scrollPosition = index * cardWidth;
      scrollRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
      setCurrentIndex(index);
    }
  };

  const scrollLeft = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    scrollToIndex(newIndex);
  };

  const scrollRight = () => {
    const newIndex = Math.min(categories.length - 1, currentIndex + 1);
    scrollToIndex(newIndex);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Navigation Arrows */}
      <button
        onClick={scrollLeft}
        disabled={currentIndex === 0}
        style={{
          position: 'absolute',
          left: '-20px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'white',
          border: '2px solid #e0e0e0',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
          opacity: currentIndex === 0 ? 0.5 : 1,
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          if (currentIndex > 0) {
            e.currentTarget.style.background = '#f8f9fa';
            e.currentTarget.style.borderColor = '#667eea';
          }
        }}
        onMouseOut={(e) => {
          if (currentIndex > 0) {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#e0e0e0';
          }
        }}
      >
        <span style={{ fontSize: '1.2rem', color: '#666' }}>‹</span>
      </button>

      <button
        onClick={scrollRight}
        disabled={currentIndex >= categories.length - 1}
        style={{
          position: 'absolute',
          right: '-20px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'white',
          border: '2px solid #e0e0e0',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: currentIndex >= categories.length - 1 ? 'not-allowed' : 'pointer',
          opacity: currentIndex >= categories.length - 1 ? 0.5 : 1,
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          if (currentIndex < categories.length - 1) {
            e.currentTarget.style.background = '#f8f9fa';
            e.currentTarget.style.borderColor = '#667eea';
          }
        }}
        onMouseOut={(e) => {
          if (currentIndex < categories.length - 1) {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#e0e0e0';
          }
        }}
      >
        <span style={{ fontSize: '1.2rem', color: '#666' }}>›</span>
      </button>

      {/* Category Cards */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '20px',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          padding: '20px 0',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        onScroll={(e) => {
          const scrollLeft = e.currentTarget.scrollLeft;
          const cardWidth = 280;
          const newIndex = Math.round(scrollLeft / cardWidth);
          setCurrentIndex(newIndex);
        }}
      >
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      {/* Dots Indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '20px'
      }}>
        {categories.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              border: 'none',
              background: index === currentIndex ? '#667eea' : '#e0e0e0',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
};

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <Link
      to={`/marketplace/category/${category.id}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        minWidth: '260px',
        flexShrink: 0
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px 20px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '2px solid transparent',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
          e.currentTarget.style.borderColor = category.color;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
          e.currentTarget.style.borderColor = 'transparent';
        }}
      >
        {/* Background Gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${category.color}, ${category.color}88)`
          }}
        />

        {/* Category Icon */}
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '15px',
            display: 'block'
          }}
        >
          {category.icon}
        </div>

        {/* Category Name */}
        <h3
          style={{
            fontSize: '1.3rem',
            fontWeight: '700',
            marginBottom: '8px',
            color: '#333'
          }}
        >
          {category.name}
        </h3>

        {/* Category Description */}
        <p
          style={{
            fontSize: '0.9rem',
            color: '#666',
            marginBottom: '15px',
            lineHeight: '1.4'
          }}
        >
          {category.description}
        </p>

        {/* Product Count */}
        {category.productCount && (
          <div
            style={{
              background: '#f8f9fa',
              color: '#666',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600',
              display: 'inline-block'
            }}
          >
            {category.productCount} items
          </div>
        )}

        {/* Hover Effect */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: category.color,
            transform: 'scaleX(0)',
            transition: 'transform 0.3s ease',
            transformOrigin: 'left'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scaleX(1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scaleX(0)';
          }}
        />
      </div>
    </Link>
  );
};

export default CategoryCarousel;
