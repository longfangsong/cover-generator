import { useState, useEffect } from 'react';
import { LLMSettings } from './llmSettings';
import { browserStorageService } from '@/infra/storage';
import { llmRegistry } from '@/infra/llm';
import { LLMProviderConfig } from '@/models/llmProviderConfig';

import { Alert } from '@/popup/components/ui/alert'; // keep for error alert
import { toast } from 'sonner';

import { Button } from '@/popup/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/popup/components/ui/card';

const storageService = browserStorageService;

export default function Settings() {
  const [config, setConfig] = useState<LLMProviderConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clearLoading, setClearLoading] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedConfig = await storageService.loadLLMSettings();
      setConfig(loadedConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      console.error('Failed to load provider config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    setClearLoading(true);
    setClearSuccess(false);
    setError(null);
    try {
      await storageService.clearAllData();
      setConfig(null);
      setClearSuccess(true);
      toast.success('All data cleared successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear data');
    } finally {
      setClearLoading(false);
    }
  };

  const handleSave = async (newConfig: LLMProviderConfig) => {
    try {
      await storageService.saveLLMSettings(newConfig);
      setConfig(newConfig);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save settings');
    }
  };

  const handleValidate = async (configToValidate: LLMProviderConfig): Promise<{ valid: boolean; error?: string }> => {
    try {
      // Get the provider from registry
      const provider = llmRegistry.get(configToValidate.providerId);

      // Build provider config
      const providerConfig = {
        apiKey: configToValidate.apiKey,
        endpoint: configToValidate.endpoint,
        model: configToValidate.model,
        temperature: configToValidate.temperature,
        maxTokens: configToValidate.maxTokens,
      };

      // Validate config
      const result = await provider.validateConfig(providerConfig);

      return {
        valid: result.valid,
        error: result.error,
      };
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : 'Validation failed',
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 mb-12">
      {error && (
        <Alert variant="destructive">
          <div className="text-sm">{error}</div>
        </Alert>
      )}

      <LLMSettings
        config={config}
        onSave={handleSave}
        onValidate={handleValidate}
      />

      <Card className="pt-4 flex justify-end">
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            variant="destructive"
            onClick={handleClearAll}
            disabled={clearLoading}
          >
            {clearLoading ? 'Clearing...' : 'Clear All Data'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}