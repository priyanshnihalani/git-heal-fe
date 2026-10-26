import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import type { TokenUsage } from '../../types';
import { api } from '../../services/api';
import { getUsageState } from '../../utils/tokenUtils';
import './LimitBanner.css';

export const LimitBanner: React.FC = () => {
  const [usage, setUsage] = useState<TokenUsage | null>(null);
  const [toastDismissed, setToastDismissed] = useState(false);

  useEffect(() => {
    // Check if 80% toast was dismissed today in localStorage
    const today = new Date().toISOString().split('T')[0];
    const dismissedDay = localStorage.getItem('githeal_toast_dismissed_date');
    if (dismissedDay === today) {
      setToastDismissed(true);
    }

    api.usage.getTokenUsage({ preset: 'today' }).then(setUsage);
    const unsub = api.usage.subscribeTokenUsage((data) => {
      setUsage(data);
    });
    return () => unsub();
  }, []);

  const handleDismissToast = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('githeal_toast_dismissed_date', today);
    setToastDismissed(true);
  };

  if (!usage) return null;

  const state = getUsageState(usage.used, usage.limit.daily);

  if (state === 'limit') {
    return (
      <div className="limit-banner" role="alert">
        <div className="limit-banner-content">
          <AlertTriangle size={16} className="limit-icon" aria-hidden="true" />
          <span className="limit-banner-text">
            <strong>Daily token limit reached.</strong> New failures are queued and resume at 00:00.
          </span>
        </div>
      </div>
    );
  }

  if (state === 'low' && !toastDismissed) {
    return (
      <div className="low-toast-banner" role="status" aria-live="polite">
        <div className="low-toast-content">
          <Info size={16} className="low-toast-icon" aria-hidden="true" />
          <span>You&rsquo;ve used 80% of today&rsquo;s AI tokens.</span>
        </div>
        <button
          type="button"
          className="btn-dismiss-toast"
          onClick={handleDismissToast}
          aria-label="Dismiss warning"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return null;
};

export default LimitBanner;
