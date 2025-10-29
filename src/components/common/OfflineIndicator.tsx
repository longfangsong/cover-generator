/**
 * OfflineIndicator Component
 * Shows connection status and offline mode
 */

import React, { useState, useEffect } from 'react';
import './OfflineIndicator.css';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-indicator">
      <div className="offline-icon">📡</div>
      <div className="offline-text">
        <strong>Offline Mode</strong>
        <span>You can view cached profiles and cover letters</span>
      </div>
    </div>
  );
};
