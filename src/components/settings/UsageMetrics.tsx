/**
 * UsageMetrics Component
 * Displays usage statistics for the extension
 */

import React, { useEffect, useState } from 'react';
import { BrowserStorageService } from '../../infra/storage/BrowserStorageService';
import './UsageMetrics.css';
import { globalRateLimiter } from '../../infra/llm/rateLimiter';

interface UsageStats {
  totalGenerations: number;
  totalProfiles: number;
  totalJobsExtracted: number;
  lastGeneration?: Date;
  storageUsed: number;
  storageLimit: number;
}

export const UsageMetrics: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [remainingRequests, setRemainingRequests] = useState(10);

  useEffect(() => {
    loadUsageStats();
    
    // Update remaining requests every second
    const interval = setInterval(() => {
      setRemainingRequests(globalRateLimiter.getRemainingRequests());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadUsageStats = async () => {
    try {
      setLoading(true);
      const storage = new BrowserStorageService();

      // Get profile first to get profileId
      const profile = await storage.loadProfile();
      
      // Get all cover letters (need profileId)
      const letters = profile ? await storage.listCoverLetters(profile.id) : [];

      // Count unique cached jobs by checking storage
      const cachedJobCount = 0; // We don't have a way to count all cached jobs easily

      // Estimate storage usage (in bytes)
      const allData = JSON.stringify({
        letters,
        profile,
      });
      const storageUsed = new Blob([allData]).size;

      // Get last generation date
      const lastGeneration = letters.length > 0
        ? new Date(Math.max(...letters.map(l => new Date(l.generatedAt).getTime())))
        : undefined;

      setStats({
        totalGenerations: letters.length,
        totalProfiles: profile ? 1 : 0,
        totalJobsExtracted: cachedJobCount,
        lastGeneration,
        storageUsed,
        storageLimit: 10 * 1024 * 1024, // 10MB typical browser storage limit
      });
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="usage-metrics">
        <h3>Usage Statistics</h3>
        <div className="loading">Loading statistics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="usage-metrics">
        <h3>Usage Statistics</h3>
        <div className="error">Failed to load statistics</div>
      </div>
    );
  }

  const storagePercentage = (stats.storageUsed / stats.storageLimit) * 100;

  return (
    <div className="usage-metrics">
      <h3>Usage Statistics</h3>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Cover Letters</div>
          <div className="metric-value">{stats.totalGenerations}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Profiles Created</div>
          <div className="metric-value">{stats.totalProfiles}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Jobs Extracted</div>
          <div className="metric-value">{stats.totalJobsExtracted}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Last Generation</div>
          <div className="metric-value metric-date">
            {stats.lastGeneration ? formatDate(stats.lastGeneration) : 'Never'}
          </div>
        </div>
      </div>

      <div className="rate-limit-section">
        <h4>Rate Limiting</h4>
        <div className="rate-limit-info">
          <div className="rate-limit-text">
            <span className="remaining-count">{remainingRequests}/10</span> requests remaining this minute
          </div>
          <div className="rate-limit-bar">
            <div 
              className="rate-limit-fill" 
              style={{ width: `${(remainingRequests / 10) * 100}%` }}
            />
          </div>
          {remainingRequests === 0 && (
            <div className="rate-limit-warning">
              Rate limit reached. Please wait before making more requests.
            </div>
          )}
        </div>
      </div>

      <div className="storage-section">
        <h4>Storage Usage</h4>
        <div className="storage-info">
          <div className="storage-text">
            {formatBytes(stats.storageUsed)} / {formatBytes(stats.storageLimit)}
            <span className="storage-percentage"> ({storagePercentage.toFixed(1)}%)</span>
          </div>
          <div className="storage-bar">
            <div 
              className={`storage-fill ${storagePercentage > 80 ? 'warning' : ''}`}
              style={{ width: `${Math.min(storagePercentage, 100)}%` }}
            />
          </div>
          {storagePercentage > 80 && (
            <div className="storage-warning">
              Storage usage is high. Consider deleting old cover letters.
            </div>
          )}
        </div>
      </div>

      <button 
        className="refresh-button" 
        onClick={loadUsageStats}
      >
        Refresh Statistics
      </button>
    </div>
  );
};
