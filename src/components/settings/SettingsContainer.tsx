/**
 * Settings Container
 * Combines all settings-related components with tabs
 */

import React, { useState } from 'react';
import { LLMProviderConfig } from '../../models/LLMProviderConfig';
import { ProviderSettings } from './ProviderSettings';
import { UsageMetrics } from './UsageMetrics';
import { DataManagement } from './DataManagement';
import './SettingsContainer.css';

type SettingsTab = 'provider' | 'metrics' | 'data';

interface SettingsContainerProps {
  config: LLMProviderConfig | null;
  onSave: (config: LLMProviderConfig) => Promise<void>;
  onValidate?: (config: LLMProviderConfig) => Promise<{ valid: boolean; error?: string }>;
}

export const SettingsContainer: React.FC<SettingsContainerProps> = ({
  config,
  onSave,
  onValidate,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('provider');

  return (
    <div className="settings-container">
      <div className="settings-tabs">
        <button
          className={activeTab === 'provider' ? 'active' : ''}
          onClick={() => setActiveTab('provider')}
        >
          ⚙️ Provider
        </button>
        <button
          className={activeTab === 'metrics' ? 'active' : ''}
          onClick={() => setActiveTab('metrics')}
        >
          📊 Usage
        </button>
        <button
          className={activeTab === 'data' ? 'active' : ''}
          onClick={() => setActiveTab('data')}
        >
          💾 Data
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'provider' && (
          <ProviderSettings
            config={config}
            onSave={onSave}
            onValidate={onValidate}
          />
        )}

        {activeTab === 'metrics' && <UsageMetrics />}

        {activeTab === 'data' && <DataManagement />}
      </div>
    </div>
  );
};
