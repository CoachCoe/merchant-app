import { useEffect, useState } from 'react';

interface SellerReputationProps {
  sellerWalletAddress: string;
  compact?: boolean;
}

interface ReputationData {
  walletAddress: string;
  transactionCount: number;
  totalVolume: number;
  averageValue: number;
  recentActivityCount: number;
  firstSaleDate: string | null;
  lastSaleDate: string | null;
}

export function SellerReputation({ sellerWalletAddress, compact = false }: SellerReputationProps) {
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerWalletAddress) {
      setLoading(false);
      return;
    }

    fetch(`/api/sellers/${sellerWalletAddress}/reputation`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch reputation');
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setReputation(data.data);
        } else {
          setError(data.message || 'Failed to load reputation');
        }
      })
      .catch(err => {
        console.error('Error fetching seller reputation:', err);
        setError('Unable to load seller reputation');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sellerWalletAddress]);

  if (loading) {
    return (
      <div className="seller-reputation loading">
        <span className="spinner">⏳</span>
      </div>
    );
  }

  if (error || !reputation) {
    return null;
  }

  const getReputationBadge = (count: number) => {
    if (count === 0) return { icon: '🆕', label: 'New Seller', color: 'gray' };
    if (count < 5) return { icon: '⭐', label: 'Emerging', color: 'blue' };
    if (count < 20) return { icon: '⭐⭐', label: 'Established', color: 'green' };
    if (count < 50) return { icon: '⭐⭐⭐', label: 'Trusted', color: 'purple' };
    return { icon: '👑', label: 'Elite', color: 'gold' };
  };

  const badge = getReputationBadge(reputation.transactionCount);

  const formatHollar = (amount: number) => {
    return (amount / 1000000).toFixed(2); // Convert micro-Hollar to Hollar
  };

  if (compact) {
    return (
      <div className="seller-reputation compact">
        <span className={`reputation-badge badge-${badge.color}`}>
          {badge.icon} {reputation.transactionCount} sales
        </span>
      </div>
    );
  }

  return (
    <div className="seller-reputation detailed">
      <div className="reputation-header">
        <span className={`reputation-badge badge-${badge.color}`}>
          {badge.icon} {badge.label}
        </span>
        <span className="transaction-count">
          {reputation.transactionCount} completed transactions
        </span>
      </div>

      <div className="reputation-stats">
        <div className="stat">
          <div className="stat-label">Total Sales Volume</div>
          <div className="stat-value">{formatHollar(reputation.totalVolume)} USDt</div>
        </div>

        <div className="stat">
          <div className="stat-label">Average Sale</div>
          <div className="stat-value">{formatHollar(reputation.averageValue)} USDt</div>
        </div>

        <div className="stat">
          <div className="stat-label">Recent Activity (30d)</div>
          <div className="stat-value">{reputation.recentActivityCount} sales</div>
        </div>
      </div>

      {reputation.firstSaleDate && (
        <div className="seller-since">
          Selling since {new Date(reputation.firstSaleDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
