/**
 * QueryModeToggle - Toggle between cached (server) and direct (blockchain) mode
 */

import React from 'react';
import { useQueryMode } from '../../hooks/useBlockchain';
import './QueryModeToggle.css';

export const QueryModeToggle: React.FC = () => {
  const { queryMode, toggleMode, canUseDirect } = useQueryMode();

  return (
    <div className="query-mode-toggle">
      <div className="toggle-container">
        <span className="toggle-label">
          <span className="toggle-icon">⚡</span>
          Cached
        </span>
        <button
          className={`toggle-switch ${queryMode === 'direct' ? 'active' : ''}`}
          onClick={toggleMode}
          disabled={!canUseDirect}
          title={
            canUseDirect
              ? `Switch to ${queryMode === 'cached' ? 'direct blockchain' : 'cached'} mode`
              : 'Blockchain not initialized - direct mode unavailable'
          }
        >
          <span className="toggle-slider"></span>
        </button>
        <span className="toggle-label">
          <span className="toggle-icon">🔗</span>
          Direct
        </span>
      </div>
      <div className="mode-description">
        {queryMode === 'cached' ? (
          <span className="mode-info">
            <strong>Fast Mode:</strong> Queries cached data from server (5-min TTL)
          </span>
        ) : (
          <span className="mode-info direct">
            <strong>Web3 Mode:</strong> Queries blockchain directly (trustless, slower)
          </span>
        )}
      </div>
      {!canUseDirect && (
        <div className="mode-warning">
          <span>⚠️ Direct mode requires blockchain connection</span>
        </div>
      )}
    </div>
  );
};
