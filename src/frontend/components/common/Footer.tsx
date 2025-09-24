import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="grid grid-3">
          <div>
            <h3>🛒 Crypto Merchant Store</h3>
            <p>
              Accept cryptocurrency payments for your products. 
              Secure, fast, and reliable payment processing with DOT and KSM tokens.
            </p>
          </div>
          
          <div>
            <h3>Payment Methods</h3>
            <p>
              • DOT (Polkadot)<br/>
              • KSM (Kusama)<br/>
              • NFC & QR Code Support<br/>
              • Real-time Transaction Monitoring
            </p>
          </div>
          
          <div>
            <h3>Support</h3>
            <p>
              Need help with your order or payment?<br/>
              Contact us for assistance with crypto payments.
            </p>
          </div>
        </div>
        
        <div style={{ 
          marginTop: '30px', 
          paddingTop: '20px', 
          borderTop: '1px solid #495057',
          textAlign: 'center',
          opacity: 0.7
        }}>
          <p>&copy; 2024 Crypto Merchant Store. Powered by Polkadot ecosystem.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
