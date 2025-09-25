import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from './useCart';

// Mock fetch
global.fetch = vi.fn();

// Mock WebSocket
global.WebSocket = vi.fn(() => ({
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN,
})) as any;

describe('useCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.cart).toEqual({
      id: '',
      items: [],
      total: 0,
      itemCount: 0,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load cart from API', async () => {
    const mockCart = {
      id: 'test-cart-id',
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          productName: 'Test Product',
          productPrice: 1999,
          quantity: 2,
          subtotal: 3998,
        },
      ],
      total: 3998,
      itemCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockCart }),
    } as Response);

    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.loadCart();
    });

    expect(result.current.cart.id).toBe('test-cart-id');
    expect(result.current.cart.items).toHaveLength(1);
    expect(result.current.cart.total).toBe(3998);
    expect(result.current.loading).toBe(false);
  });

  it('should handle API errors when loading cart', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.loadCart();
    });

    expect(result.current.error).toBe('Failed to load cart');
    expect(result.current.loading).toBe(false);
  });

  it('should add item to cart', async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 'test-cart-id',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            productName: 'Test Product',
            productPrice: 1999,
            quantity: 1,
            subtotal: 1999,
          },
        ],
        total: 1999,
        itemCount: 1,
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.addToCart('product-1', 1);
    });

    expect(result.current.cart.items).toHaveLength(1);
    expect(result.current.cart.total).toBe(1999);
    expect(fetch).toHaveBeenCalledWith('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'product-1', quantity: 1 }),
    });
  });

  it('should update item quantity', async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 'test-cart-id',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            productName: 'Test Product',
            productPrice: 1999,
            quantity: 3,
            subtotal: 5997,
          },
        ],
        total: 5997,
        itemCount: 3,
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.updateQuantity('item-1', 3);
    });

    expect(result.current.cart.items[0].quantity).toBe(3);
    expect(result.current.cart.total).toBe(5997);
    expect(fetch).toHaveBeenCalledWith('/api/cart/items/item-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: 3 }),
    });
  });

  it('should remove item from cart', async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 'test-cart-id',
        items: [],
        total: 0,
        itemCount: 0,
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.removeFromCart('item-1');
    });

    expect(result.current.cart.items).toHaveLength(0);
    expect(result.current.cart.total).toBe(0);
    expect(fetch).toHaveBeenCalledWith('/api/cart/items/item-1', {
      method: 'DELETE',
    });
  });

  it('should clear entire cart', async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 'test-cart-id',
        items: [],
        total: 0,
        itemCount: 0,
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.clearCart();
    });

    expect(result.current.cart.items).toHaveLength(0);
    expect(result.current.cart.total).toBe(0);
    expect(fetch).toHaveBeenCalledWith('/api/cart/clear', {
      method: 'POST',
    });
  });

  it('should handle network errors gracefully', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.addToCart('product-1', 1);
    });

    expect(result.current.error).toBe('Failed to add item to cart');
  });

  it('should handle API error responses', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, message: 'Invalid product ID' }),
    } as Response);

    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.addToCart('invalid-product', 1);
    });

    expect(result.current.error).toBe('Invalid product ID');
  });

  it('should set loading state during operations', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(fetch).mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addToCart('product-1', 1);
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => ({ success: true, data: { items: [], total: 0, itemCount: 0 } }),
      });
      await promise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('should calculate item count correctly', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.setCart({
        id: 'test-cart',
        items: [
          { id: '1', productId: 'p1', productName: 'Product 1', productPrice: 1000, quantity: 2, subtotal: 2000 },
          { id: '2', productId: 'p2', productName: 'Product 2', productPrice: 1500, quantity: 1, subtotal: 1500 },
        ],
        total: 3500,
        itemCount: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    expect(result.current.cart.itemCount).toBe(3);
  });
});
