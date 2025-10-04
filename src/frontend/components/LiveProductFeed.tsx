/**
 * Live Product Feed - Real-time blockchain event listening
 *
 * Shows new products as they're registered on-chain in real-time
 */

import React, { useState, useEffect } from 'react';
import { useBlockchainContext } from '../hooks/useBlockchain';
import { getBlockchainService, OnChainProduct } from '../services/blockchainService';
import './LiveProductFeed.css';

interface LiveProduct {
  id: string;
  name: string;
  price: string;
  seller: string;
  category: string;
  timestamp: Date;
}

export const LiveProductFeed: React.FC = () => {
  const { isBlockchainReady, queryMode } = useBlockchainContext();
  const [liveProducts, setLiveProducts] = useState<LiveProduct[]>([]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!isBlockchainReady || queryMode !== 'direct') {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    const service = getBlockchainService();

    // Subscribe to ProductRegistered events
    const unsubscribe = service.onProductRegistered((product) => {
      console.log('🔴 New product registered on blockchain:', product);

      const liveProduct: LiveProduct = {
        id: product.id,
        name: product.name,
        price: product.priceHollar.toString(),
        seller: product.seller,
        category: product.category,
        timestamp: new Date()
      };

      setLiveProducts(prev => [liveProduct, ...prev].slice(0, 10)); // Keep latest 10

      // Show toast notification
      showToast(`New product: ${product.name}`);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      setIsListening(false);
    };
  }, [isBlockchainReady, queryMode]);

  const showToast = (message: string) => {
    // Simple toast notification (you can enhance this)
    const toast = document.createElement('div');
    toast.className = 'blockchain-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPrice = (price: string) => {
    return `${price} Hollar`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isBlockchainReady || queryMode !== 'direct') {
    return null; // Don't show if not in direct mode
  }

  return (
    <div className="live-product-feed">
      <div className="feed-header">
        <div className="feed-title">
          <span className={`live-indicator ${isListening ? 'active' : ''}`}>●</span>
          <h3>Live on Blockchain</h3>
        </div>
        <span className="feed-subtitle">
          {isListening ? 'Listening for new products...' : 'Waiting for connection...'}
        </span>
      </div>

      {liveProducts.length === 0 ? (
        <div className="feed-empty">
          <p>No new products yet</p>
          <small>New products will appear here in real-time when registered on-chain</small>
        </div>
      ) : (
        <div className="feed-items">
          {liveProducts.map((product, index) => (
            <div key={`${product.id}-${index}`} className="feed-item">
              <div className="feed-item-header">
                <span className="product-name">{product.name}</span>
                <span className="product-time">{formatTime(product.timestamp)}</span>
              </div>
              <div className="feed-item-details">
                <span className="product-price">{formatPrice(product.price)}</span>
                <span className="product-seller">by {formatAddress(product.seller)}</span>
              </div>
              <div className="feed-item-footer">
                <span className="product-category">{product.category}</span>
                <span className="new-badge">NEW</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
