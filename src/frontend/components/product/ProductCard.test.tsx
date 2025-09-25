import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from './ProductCard';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockProduct = {
  id: 'test-product-1',
  name: 'Test Product',
  description: 'A test product for testing',
  price: 1999,
  image: 'https://example.com/test-image.jpg',
  category: 'test-category',
  isActive: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render product information correctly', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('A test product for testing')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
  });

  it('should display product image with correct alt text', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);

    const image = screen.getByAltText('Test Product');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/test-image.jpg');
  });

  it('should handle missing image gracefully', () => {
    const productWithoutImage = { ...mockProduct, image: undefined };
    
    renderWithRouter(<ProductCard product={productWithoutImage} />);

    const image = screen.getByAltText('Test Product');
    expect(image).toHaveAttribute('src', '/placeholder-product.jpg');
  });

  it('should format price correctly', () => {
    const expensiveProduct = { ...mockProduct, price: 123456 };
    
    renderWithRouter(<ProductCard product={expensiveProduct} />);

    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });

  it('should show add to cart button', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    expect(addToCartButton).toBeInTheDocument();
  });

  it('should handle add to cart click', () => {
    const mockOnAddToCart = vi.fn();
    
    renderWithRouter(
      <ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />
    );

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct.id);
  });

  it('should show view details button', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);

    const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
    expect(viewDetailsButton).toBeInTheDocument();
  });

  it('should handle view details click', () => {
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
    
    renderWithRouter(<ProductCard product={mockProduct} />);

    const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
    fireEvent.click(viewDetailsButton);

    expect(mockNavigate).toHaveBeenCalledWith(`/products/${mockProduct.id}`);
  });

  it('should show out of stock message for inactive products', () => {
    const inactiveProduct = { ...mockProduct, isActive: false };
    
    renderWithRouter(<ProductCard product={inactiveProduct} />);

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('should disable buttons for inactive products', () => {
    const inactiveProduct = { ...mockProduct, isActive: false };
    
    renderWithRouter(<ProductCard product={inactiveProduct} />);

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    const viewDetailsButton = screen.getByRole('button', { name: /view details/i });

    expect(addToCartButton).toBeDisabled();
    expect(viewDetailsButton).toBeDisabled();
  });

  it('should handle long product names gracefully', () => {
    const longNameProduct = {
      ...mockProduct,
      name: 'This is a very long product name that should be truncated properly',
    };
    
    renderWithRouter(<ProductCard product={longNameProduct} />);

    expect(screen.getByText(longNameProduct.name)).toBeInTheDocument();
  });

  it('should handle missing description', () => {
    const productWithoutDescription = { ...mockProduct, description: undefined };
    
    renderWithRouter(<ProductCard product={productWithoutDescription} />);

    expect(screen.getByText('No description available')).toBeInTheDocument();
  });

  it('should apply correct CSS classes', () => {
    const { container } = renderWithRouter(<ProductCard product={mockProduct} />);

    const productCard = container.firstChild;
    expect(productCard).toHaveClass('product-card');
  });

  it('should be accessible', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);

    // Check for proper ARIA labels and roles
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Test Product');
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
