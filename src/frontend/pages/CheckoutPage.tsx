import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useWebSocket } from '../hooks/useWebSocket';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { lastMessage, isConnected } = useWebSocket();
  const [step, setStep] = useState<'customer' | 'payment' | 'processing' | 'complete'>('customer');
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '' });
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Handle WebSocket messages for payment status updates
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'transaction_confirmed':
          setStep('complete');
          setLoading(false);
          break;
        case 'payment_failure':
          setError(lastMessage.message || 'Payment failed');
          setLoading(false);
          break;
        case 'payment_qr':
          // QR code payment initiated
          break;
      }
    }
  }, [lastMessage]);

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name.trim() || !customerInfo.email.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setStep('payment');
  };

  const handlePaymentInitiate = async () => {
    if (!cart || cart.items.length === 0) {
      setError('Cart is empty');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create order first
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: customerInfo.name,
            email: customerInfo.email
          }
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();
      setOrder(orderData.data);

      // Initiate payment using existing payment system
      const paymentResponse = await fetch('/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cart.total / 100, // Convert cents to dollars
          merchantAddress: process.env.REACT_APP_MERCHANT_ADDRESS || 'EUfWfTP84xqpnd8GUpUAGWrvP7M6cHNJ2QT37RRYyEbWpei'
        })
      });

      if (!paymentResponse.ok) {
        throw new Error('Failed to initiate payment');
      }

      setStep('processing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initiation failed');
      setLoading(false);
    }
  };

  const handleComplete = () => {
    // Clear cart and redirect to order complete page
    clearCart();
    navigate(`/order-complete/${order?.id}`);
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <div className="alert alert-warning">
          <h3>Cart is Empty</h3>
          <p>Please add items to your cart before proceeding to checkout.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>Checkout</h1>

      {/* Progress Steps */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '40px',
        gap: '20px'
      }}>
        {['customer', 'payment', 'processing', 'complete'].map((stepName, index) => (
          <div key={stepName} style={{ 
            display: 'flex', 
            alignItems: 'center',
            opacity: step === stepName ? 1 : 0.5
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: step === stepName ? '#667eea' : '#e9ecef',
              color: step === stepName ? 'white' : '#6c757d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600'
            }}>
              {index + 1}
            </div>
            <span style={{ 
              marginLeft: '10px', 
              fontWeight: step === stepName ? '600' : '400',
              textTransform: 'capitalize'
            }}>
              {stepName}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
        {/* Main Content */}
        <div>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          {/* Customer Information Step */}
          {step === 'customer' && (
            <div className="card">
              <div className="card-header">
                <h3>Anonymous Checkout</h3>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                  <p style={{ margin: 0, color: '#0066cc' }}>
                    🔒 Your purchase is completely anonymous. No personal information required.
                  </p>
                </div>
                <form onSubmit={handleCustomerSubmit}>
                  <div className="form-group">
                    <label className="form-label">Email for Digital Delivery (Optional)</label>
                    <input
                      type="email"
                      className="form-control"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Only if you need digital delivery notifications"
                    />
                    <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                      This email will only be used for delivery and will not be shared with the seller.
                    </small>
                  </div>

                  <button type="submit" className="btn btn-primary">
                    Continue to Payment
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Payment Step */}
          {step === 'payment' && (
            <div className="card">
              <div className="card-header">
                <h3>Payment Method</h3>
              </div>
              <div className="card-body">
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <h4>💳 Crypto Payment</h4>
                  <p>Pay securely with DOT or KSM tokens</p>
                </div>

                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '20px', 
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <h5>Accepted Payment Methods:</h5>
                  <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem' }}>🔵</div>
                      <div style={{ fontWeight: '600' }}>DOT</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem' }}>🟡</div>
                      <div style={{ fontWeight: '600' }}>KSM</div>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  background: '#e3f2fd', 
                  padding: '15px', 
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    <strong>Payment Process:</strong><br/>
                    1. Click "Pay Now" to initiate payment<br/>
                    2. Use NFC tap or scan QR code with your wallet<br/>
                    3. Confirm transaction in your wallet app<br/>
                    4. Payment will be processed automatically
                  </p>
                </div>

                <button
                  onClick={handlePaymentInitiate}
                  disabled={loading || !isConnected}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  {loading ? 'Initiating Payment...' : 'Pay Now'}
                </button>

                {!isConnected && (
                  <div className="alert alert-warning" style={{ marginTop: '15px' }}>
                    <strong>Connection Issue:</strong> Unable to connect to payment system. Please check your connection and try again.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="card">
              <div className="card-header">
                <h3>Processing Payment</h3>
              </div>
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div className="payment-terminal">
                  <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⏳</div>
                  <div className="payment-amount">{formatPrice(cart.total)}</div>
                  <div className="payment-status">Waiting for payment...</div>
                  <p style={{ marginTop: '20px', opacity: 0.9 }}>
                    Please complete the payment using your crypto wallet.<br/>
                    You can use NFC tap or scan the QR code.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="card">
              <div className="card-header">
                <h3>Payment Successful!</h3>
              </div>
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
                <h4 style={{ color: '#28a745', marginBottom: '20px' }}>
                  Payment Confirmed
                </h4>
                <p style={{ marginBottom: '30px' }}>
                  Your order has been processed successfully.<br/>
                  You will receive a confirmation email shortly.
                </p>
                <button onClick={handleComplete} className="btn btn-primary">
                  View Order Details
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3>Order Summary</h3>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '20px' }}>
                {cart.items.map((item) => (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #e9ecef'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        {item.quantity} × {formatPrice(item.unitPrice)}
                      </div>
                    </div>
                    <div style={{ fontWeight: '600' }}>
                      {formatPrice(item.totalPrice)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="checkout-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax (8%):</span>
                  <span>{formatPrice(cart.tax)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
              </div>

              {customerInfo.name && (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <h5 style={{ marginBottom: '10px' }}>Customer Information</h5>
                  <div style={{ fontSize: '0.9rem' }}>
                    <div><strong>Name:</strong> {customerInfo.name}</div>
                    <div><strong>Email:</strong> {customerInfo.email}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
