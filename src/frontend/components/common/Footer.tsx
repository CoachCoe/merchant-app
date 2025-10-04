import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="grid grid-3">
          <div>
            <h3>3Bay</h3>
            <p>
              Modern Web3 marketplace for digital goods.
              Powered by Polkadot and built for the decentralized future.
            </p>
          </div>

          <div>
            <h3>Features</h3>
            <p style={{ lineHeight: '2' }}>
              On-chain verification<br/>
              Decentralized storage<br/>
              Privacy-preserving<br/>
              Censorship resistant
            </p>
          </div>

          <div>
            <h3>Connect</h3>
            <p style={{ lineHeight: '2' }}>
              Documentation<br/>
              GitHub<br/>
              Support<br/>
              Twitter
            </p>
          </div>
        </div>

        <div style={{
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: '0.875rem'
        }}>
          <p>&copy; 2025 3Bay. Built on Polkadot.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
