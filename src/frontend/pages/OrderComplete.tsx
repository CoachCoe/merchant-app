import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Order } from '../../models/Order';

const OrderComplete: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();

        if (response.ok) {
          setOrder(data.data);
        } else {
          setError(data.message || 'Order not found');
        }
      } catch (err) {
        setError('Failed to load order details');
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="alert alert-error">
          <h3>Order Not Found</h3>
          <p>{error || 'The order you are looking for does not exist.'}</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '15px' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      {/* Success Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
        <h1 style={{ color: '#28a745', marginBottom: '10px' }}>
          Order Confirmed!
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>
          Thank you for your purchase. Your order has been processed successfully.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
        {/* Order Details */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3>Order Details</h3>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span><strong>Order Number:</strong></span>
                  <span style={{ fontFamily: 'monospace' }}>{order.orderNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span><strong>Order Date:</strong></span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span><strong>Payment Status:</strong></span>
                  <span style={{ 
                    color: order.paymentStatus === 'completed' ? '#28a745' : '#ffc107',
                    fontWeight: '600'
                  }}>
                    {order.paymentStatus.toUpperCase()}
                  </span>
                </div>
                {order.completedAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span><strong>Completed:</strong></span>
                    <span>{formatDate(order.completedAt)}</span>
                  </div>
                )}
              </div>

              {order.customer && (
                <div style={{ 
                  marginBottom: '20px', 
                  padding: '15px', 
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <h4 style={{ marginBottom: '10px' }}>Customer Information</h4>
                  {order.customer.name && (
                    <div><strong>Name:</strong> {order.customer.name}</div>
                  )}
                  {order.customer.email && (
                    <div><strong>Email:</strong> {order.customer.email}</div>
                  )}
                </div>
              )}

              {order.transactionHash && (
                <div style={{ 
                  marginBottom: '20px', 
                  padding: '15px', 
                  background: '#e3f2fd',
                  borderRadius: '8px'
                }}>
                  <h4 style={{ marginBottom: '10px' }}>Transaction Details</h4>
                  <div style={{ fontSize: '0.9rem' }}>
                    <div><strong>Transaction Hash:</strong></div>
                    <div style={{ 
                      fontFamily: 'monospace', 
                      wordBreak: 'break-all',
                      background: 'white',
                      padding: '8px',
                      borderRadius: '4px',
                      marginTop: '5px'
                    }}>
                      {order.transactionHash}
                    </div>
                    {order.chainId && (
                      <div style={{ marginTop: '10px' }}>
                        <strong>Chain:</strong> {order.chainId}
                      </div>
                    )}
                    {order.tokenUsed && (
                      <div>
                        <strong>Token:</strong> {order.tokenUsed}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px' }}>
                <Link to="/" className="btn btn-primary">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3>Order Summary</h3>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '20px' }}>
                {order.cart.items.map((item) => (
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
                  <span>{formatPrice(order.cart.subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax (8%):</span>
                  <span>{formatPrice(order.cart.tax)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>{formatPrice(order.cart.total)}</span>
                </div>
              </div>

              {/* Payment Methods Used */}
              <div style={{ 
                marginTop: '20px', 
                padding: '15px', 
                  background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <h5 style={{ marginBottom: '10px' }}>Payment Method</h5>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {order.tokenUsed === 'DOT' && <span style={{ fontSize: '1.5rem' }}>🔵</span>}
                  {order.tokenUsed === 'KSM' && <span style={{ fontSize: '1.5rem' }}>🟡</span>}
                  <span style={{ fontWeight: '600' }}>
                    {order.tokenUsed || 'Crypto Payment'}
                  </span>
                </div>
                <p style={{ 
                  marginTop: '10px', 
                  fontSize: '0.9rem', 
                  color: '#666',
                  margin: '10px 0 0 0'
                }}>
                  Secure blockchain transaction completed
                </p>
              </div>
            </div>
          </div>

          {/* Support Info */}
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header">
              <h3>Need Help?</h3>
            </div>
            <div className="card-body">
              <p style={{ marginBottom: '15px' }}>
                If you have any questions about your order or need assistance, please contact us.
              </p>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                <div><strong>Order ID:</strong> {order.id}</div>
                <div><strong>Order Number:</strong> {order.orderNumber}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderComplete;
