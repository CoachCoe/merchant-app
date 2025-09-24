import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Cart, CartItem, AddToCartRequest, UpdateCartItemRequest } from '../../models/Cart';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addToCart: (request: AddToCartRequest) => Promise<void>;
  updateCartItem: (itemId: string, request: UpdateCartItemRequest) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API request failed');
    }

    return response.json();
  };

  const refreshCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall('/api/cart');
      setCart(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
      console.error('Error refreshing cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (request: AddToCartRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      setCart(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to cart');
      console.error('Error adding to cart:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId: string, request: UpdateCartItemRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(request),
      });
      setCart(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cart item');
      console.error('Error updating cart item:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeCartItem = async (itemId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      setCart(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove cart item');
      console.error('Error removing cart item:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall('/api/cart/clear', {
        method: 'POST',
      });
      setCart(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
      console.error('Error clearing cart:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const value: CartContextType = {
    cart,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
