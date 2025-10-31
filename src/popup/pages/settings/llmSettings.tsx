/**
 * LLMSettings Component
 * Configure LLM provider settings (provider, model, API key)
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/popup/components/ui/button';
import { Input } from '@/popup/components/ui/input';
import { Label } from '@/popup/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/popup/components/ui/select';
import { Slider } from '@/popup/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/popup/components/ui/card';
import { Spinner } from '@/popup/components/ui/spinner';
import { LLMProviderConfig, LLM_CONFIG_CONSTRAINTS } from '@/models/llmProviderConfig';
import { LLMProviderEnum } from '@/models/coverLetterContent';

interface LLMSettingsProps {
  config: LLMProviderConfig | null;
  onSave: (config: LLMProviderConfig) => Promise<void>;
  onValidate?: (config: LLMProviderConfig) => Promise<{ valid: boolean; error?: string }>;
}

export function LLMSettings({
  config,
  onSave,
  onValidate
}: LLMSettingsProps) {
  const [providerId, setProviderId] = useState<LLMProviderEnum>(
    config?.providerId || LLMProviderEnum.OLLAMA
  );
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [endpoint, setEndpoint] = useState(
    config?.endpoint || LLM_CONFIG_CONSTRAINTS.OLLAMA_DEFAULT_ENDPOINT
  );
  const [model, setModel] = useState(
    config?.model || 
    (config?.providerId === LLMProviderEnum.GEMINI ? 'gemini-2.5-flash' : 'llama2')
  );
  const [temperature, setTemperature] = useState(
    config?.temperature || LLM_CONFIG_CONSTRAINTS.TEMPERATURE_DEFAULT
  );
  const [maxTokens, setMaxTokens] = useState(
    config?.maxTokens || LLM_CONFIG_CONSTRAINTS.MAX_TOKENS_DEFAULT
  );
  
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (config) {
      setProviderId(config.providerId);
      setApiKey(config.apiKey || '');
      setEndpoint(config.endpoint || LLM_CONFIG_CONSTRAINTS.OLLAMA_DEFAULT_ENDPOINT);
      setModel(config.model);
      setTemperature(config.temperature || LLM_CONFIG_CONSTRAINTS.TEMPERATURE_DEFAULT);
      setMaxTokens(config.maxTokens || LLM_CONFIG_CONSTRAINTS.MAX_TOKENS_DEFAULT);
    }
  }, [config]);

  const handleProviderChange = (newProviderId: LLMProviderEnum) => {
    setProviderId(newProviderId);
    // Set default model for the provider
    if (newProviderId === LLMProviderEnum.OLLAMA) {
      setModel('llama2');
      setEndpoint(LLM_CONFIG_CONSTRAINTS.OLLAMA_DEFAULT_ENDPOINT);
    } else {
      setModel('gemini-2.5-flash');
      setEndpoint('');
    }
  };

  const handleValidate = async () => {
    if (!onValidate) return;

    setValidating(true);

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
        toast.success('Configuration is valid!');
      } else {
        toast.error(result.error || 'Validation failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

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
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const requiresApiKey = providerId === LLMProviderEnum.GEMINI;
  const supportsCustomEndpoint = providerId === LLMProviderEnum.OLLAMA;

  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM Provider Settings</CardTitle>
        <CardDescription>
          Configure your language model provider and generation parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Select
            value={providerId}
            onValueChange={(value) => handleProviderChange(value as LLMProviderEnum)}
          >
            <SelectTrigger id="provider">
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LLMProviderEnum.OLLAMA}>Ollama (Local)</SelectItem>
              <SelectItem value={LLMProviderEnum.GEMINI}>Google Gemini</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {supportsCustomEndpoint && (
          <div className="space-y-2">
            <Label htmlFor="endpoint">Endpoint</Label>
            <Input
              id="endpoint"
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="http://localhost:11434"
            />
            <p className="text-xs text-muted-foreground">
              URL where Ollama is running
            </p>
          </div>
        )}

        {requiresApiKey && (
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              API Key <span className="text-destructive">*</span>
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              required
            />
            <p className="text-xs text-muted-foreground">
              Get your (free) API key at{' '}
              <a 
                href="https://aistudio.google.com/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
            </p>
            <p className="text-xs text-warning-foreground mt-1">
              <strong>Reminder:</strong> By using Gemini, you agree to send your information to Google.
              <br />
              If you have privacy concerns, consider using Ollama with local models.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={providerId === LLMProviderEnum.OLLAMA ? 'llama2' : 'gemini-2.5-flash'}
          />
          <p className="text-xs text-muted-foreground">
            {providerId === LLMProviderEnum.OLLAMA
              ? 'Model name installed in Ollama (e.g., llama2, mistral)'
              : 'Model name (e.g., gemini-2.5-flash, gemini-2.5-pro)'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="temperature">
            Temperature: {temperature.toFixed(1)}
          </Label>
          <Slider
            id="temperature"
            min={LLM_CONFIG_CONSTRAINTS.TEMPERATURE_MIN}
            max={LLM_CONFIG_CONSTRAINTS.TEMPERATURE_MAX}
            step={0.1}
            value={[temperature]}
            onValueChange={(value) => setTemperature(value[0])}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Controls randomness (0 = focused, 2 = creative)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxTokens">Max Tokens</Label>
          <Input
            id="maxTokens"
            type="number"
            min={LLM_CONFIG_CONSTRAINTS.MAX_TOKENS_MIN}
            max={LLM_CONFIG_CONSTRAINTS.MAX_TOKENS_MAX}
            step={256}
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            Maximum length of generated text (recommended: 4096-16384 for cover letters)
          </p>
        </div>

        <div className="flex gap-2">
          {onValidate && (
            <Button
              onClick={handleValidate}
              disabled={validating || saving}
              variant="outline"
            >
              {validating ? (
                <>
                  <Spinner className="mr-2" />
                  Validating...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || validating}
          >
            {saving ? (
              <>
                <Spinner className="mr-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}