import React, { useState, useEffect } from 'react';
import { Category } from '../../../models/Category';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  selectedCategory, 
  onCategoryChange 
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();

        if (response.ok) {
          setCategories(data.data.categories);
        } else {
          console.error('Failed to fetch categories:', data.message);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        flexWrap: 'wrap',
        marginBottom: '20px'
      }}>
        <div style={{
          background: '#e9ecef',
          padding: '8px 16px',
          borderRadius: '20px',
          color: '#6c757d'
        }}>
          Loading categories...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      gap: '10px', 
      flexWrap: 'wrap',
      marginBottom: '20px'
    }}>
      <button
        onClick={() => onCategoryChange(null)}
        style={{
          background: selectedCategory === null ? '#667eea' : '#e9ecef',
          color: selectedCategory === null ? 'white' : '#495057',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontWeight: '500',
          transition: 'all 0.3s ease'
        }}
      >
        All Products
      </button>
      
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          style={{
            background: selectedCategory === category.id ? '#667eea' : '#e9ecef',
            color: selectedCategory === category.id ? 'white' : '#495057',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
