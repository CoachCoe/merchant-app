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
              <a href="https://drive.google.com/drive/folders/1S7tPG5i-ld8k9gPeNFnLuYfXByuz7JKa?usp=drive_link" target="_blank" rel="noopener noreferrer" style={{ color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'} onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}>Documentation</a><br/>
              <a href="https://github.com/CoachCoe/3Bay" target="_blank" rel="noopener noreferrer" style={{ color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'} onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}>GitHub</a><br/>
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
