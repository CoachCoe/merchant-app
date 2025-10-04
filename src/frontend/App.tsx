import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderComplete from './pages/OrderComplete';
import MarketplaceHomePage from './pages/MarketplaceHomePage';
import { CartProvider } from './hooks/useCart';
import { WebSocketProvider } from './hooks/useWebSocket';
import { BlockchainProvider, useBlockchainInit } from './hooks/useBlockchain';

/**
 * AppContent - Main app with blockchain initialization
 */
function AppContent() {
  useBlockchainInit(); // Auto-initialize blockchain on mount

  return (
    <div className="App">
      <Header />
      <main style={{ minHeight: 'calc(100vh - 200px)' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-complete/:orderId" element={<OrderComplete />} />

          <Route path="/marketplace" element={<MarketplaceHomePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#0f172a',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e5e7eb',
            borderRadius: '50%',
            borderTopColor: '#0f172a',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '20px',
            margin: '0 auto 20px'
          }}></div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', letterSpacing: '-0.01em' }}>
            3Bay Marketplace
          </div>
        </div>
      </div>
    );
  }

  return (
    <BlockchainProvider>
      <WebSocketProvider>
        <CartProvider>
          <Router>
            <AppContent />
          </Router>
        </CartProvider>
      </WebSocketProvider>
    </BlockchainProvider>
  );
}

export default App;
