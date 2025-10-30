/**
 * ProviderSettings Component
 * Configure LLM provider settings (provider, model, API key)
 */

import React, { useState, useEffect } from 'react';
import { LLMProviderConfig } from '../../../models/LLMProviderConfig';
import { LLMProviderEnum } from '../../../models/CoverLetterContent';
import './ProviderSettings.css';

interface ProviderSettingsProps {
  config: LLMProviderConfig | null;
  onSave: (config: LLMProviderConfig) => Promise<void>;
  onValidate?: (config: LLMProviderConfig) => Promise<{ valid: boolean; error?: string }>;
}

export const ProviderSettings: React.FC<ProviderSettingsProps> = ({
  config,
  onSave,
  onValidate
}) => {
  const [providerId, setProviderId] = useState<LLMProviderEnum>(config?.providerId || LLMProviderEnum.OLLAMA);
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [endpoint, setEndpoint] = useState(config?.endpoint || 'http://localhost:11434');
  const [model, setModel] = useState(
    config?.model || 
    (config?.providerId === LLMProviderEnum.GEMINI ? 'gemini-2.5-flash' : 'llama2')
  );
  const [temperature, setTemperature] = useState(config?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(config?.maxTokens || 8192);
  
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (config) {
      setProviderId(config.providerId);
      setApiKey(config.apiKey || '');
      setEndpoint(config.endpoint || 'http://localhost:11434');
      setModel(config.model);
      setTemperature(config.temperature || 0.7);
      setMaxTokens(config.maxTokens || 1024);
    }
  }, [config]);

  const handleProviderChange = (newProviderId: LLMProviderEnum) => {
    setProviderId(newProviderId);
    // Set default model for the provider
    if (newProviderId === LLMProviderEnum.OLLAMA) {
      setModel('llama2');
      setEndpoint('http://localhost:11434');
    } else {
      setModel('gemini-2.5-flash');
      setEndpoint('');
    }
  };

  const handleValidate = async () => {
    if (!onValidate) return;

    setValidating(true);
    setMessage(null);

    const newConfig: LLMProviderConfig = {
      providerId,
      apiKey: providerId === LLMProviderEnum.GEMINI ? apiKey : undefined,
      endpoint: providerId === LLMProviderEnum.OLLAMA ? endpoint : undefined,
      model,
      temperature,
      maxTokens,
      updatedAt: new Date(),
    };

    try {
      const result = await onValidate(newConfig);
      if (result.valid) {
        setMessage({ type: 'success', text: 'Configuration is valid!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Validation failed' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Validation failed'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const newConfig: LLMProviderConfig = {
      providerId,
      apiKey: providerId === LLMProviderEnum.GEMINI ? apiKey : undefined,
      endpoint: providerId === LLMProviderEnum.OLLAMA ? endpoint : undefined,
      model,
      temperature,
      maxTokens,
      updatedAt: new Date(),
    };

    try {
      await onSave(newConfig);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const requiresApiKey = providerId === LLMProviderEnum.GEMINI;
  const supportsCustomEndpoint = providerId === LLMProviderEnum.OLLAMA;

  return (
    <div className="provider-settings">
      <h2>LLM Provider Settings</h2>

      <div className="form-group">
        <label htmlFor="provider">Provider</label>
        <select
          id="provider"
          value={providerId}
          onChange={(e) => handleProviderChange(e.target.value as LLMProviderEnum)}
        >
          <option value={LLMProviderEnum.OLLAMA}>Ollama (Local)</option>
          <option value={LLMProviderEnum.GEMINI}>Google Gemini</option>
        </select>
      </div>

      {supportsCustomEndpoint && (
        <div className="form-group">
          <label htmlFor="endpoint">Endpoint</label>
          <input
            type="text"
            id="endpoint"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="http://localhost:11434"
          />
          <small>URL where Ollama is running</small>
        </div>
      )}

      {requiresApiKey && (
        <div className="form-group">
          <label htmlFor="apiKey">API Key *</label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API key"
            required
          />
          <small>
            Get your API key at{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
              Google AI Studio
            </a>
          </small>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="model">Model</label>
        <input
          type="text"
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={providerId === LLMProviderEnum.OLLAMA ? 'llama2' : 'gemini-2.5-flash'}
        />
        <small>
          {providerId === LLMProviderEnum.OLLAMA
            ? 'Model name installed in Ollama (e.g., llama2, mistral)'
            : 'Model name (e.g., gemini-2.5-flash, gemini-2.5-pro)'}
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="temperature">Temperature: {temperature}</label>
        <input
          type="range"
          id="temperature"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
        />
        <small>Controls randomness (0 = focused, 2 = creative)</small>
      </div>

      <div className="form-group">
        <label htmlFor="maxTokens">Max Tokens</label>
        <input
          type="number"
          id="maxTokens"
          min="512"
          max="8192"
          step="256"
          value={maxTokens}
          onChange={(e) => setMaxTokens(parseInt(e.target.value))}
        />
        <small>Maximum length of generated text (recommended: 4096-8192 for cover letters)</small>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="button-group">
        {onValidate && (
          <button
            onClick={handleValidate}
            disabled={validating || saving}
            className="button secondary"
          >
            {validating ? 'Validating...' : 'Test Connection'}
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving || validating}
          className="button primary"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};
