import { useState, useEffect, lazy, Suspense } from 'react';
import { UserProfile } from '../../models/UserProfile';
import { JobDetails } from '../../models/JobDetails';
import { LLMProviderConfig } from '../../models/LLMProviderConfig';
import { BrowserStorageService } from '../../infra/storage';
import './Popup.css';

// Lazy load components for better initial load time
const ProfileForm = lazy(() => import('../components/profile/ProfileForm').then(m => ({ default: m.ProfileForm })));
const CoverLetterWorkflow = lazy(() => import('../components/generation/CoverLetterGenerationMerged').then(m => ({ default: m.CoverLetterWorkflow })));
const SettingsContainer = lazy(() => import('../components/settings/SettingsContainer').then(m => ({ default: m.SettingsContainer })));
const GenerationJobsPanel = lazy(() => import('../components/generation/GenerationJobsPanel').then(m => ({ default: m.GenerationJobsPanel })));

// Import loading skeleton immediately (it's small)
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { OfflineIndicator } from '../components/common/OfflineIndicator';
import { llmRegistry } from '../../infra/llm';

type Tab = 'profile' | 'generate' | 'jobs' | 'settings';

export default function Popup() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [providerConfig, setProviderConfig] = useState<LLMProviderConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [jobsRefreshTrigger, setJobsRefreshTrigger] = useState(0);

  const storageService = new BrowserStorageService();

  // Load profile and config on mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [loadedProfile, loadedConfig, cachedJob] = await Promise.all([
        storageService.loadProfile(),
        storageService.loadProviderConfig(),
        storageService.getCachedJob(window.location.href),
      ]);
      setProfile(loadedProfile);
      setProviderConfig(loadedConfig);
      
      // Initialize provider with saved config
      if (loadedConfig) {
        if (loadedConfig.providerId === 'Gemini' && loadedConfig.apiKey) {
          const provider = llmRegistry.get('gemini');
          if ('setApiKey' in provider) {
            (provider as any).setApiKey(loadedConfig.apiKey);
          }
        } else if (loadedConfig.providerId === 'Ollama' && loadedConfig.endpoint) {
          const provider = llmRegistry.get('ollama');
          if ('setEndpoint' in provider) {
            (provider as any).setEndpoint(loadedConfig.endpoint);
          }
        }
      }
      
      if (cachedJob) {
        setJobDetails(cachedJob);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const loadedProfile = await storageService.loadProfile();
      setProfile(loadedProfile);
    } catch (error) {
      console.error('Failed to load profile:', error);
      showToast('Failed to load profile', 'error');
    }
  };

  const handleSave = async (updatedProfile: UserProfile) => {
    try {
      await storageService.saveProfile(updatedProfile);
      setProfile(updatedProfile);
      showToast('Profile saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save profile:', error);
      showToast('Failed to save profile', 'error');
      throw error; // Re-throw so form can handle it
    }
  };

  const handleJobExtracted = (job: JobDetails) => {
    setJobDetails(job);
    showToast('Job details updated!', 'success');
  };

  const handleGenerationStarted = () => {
    setJobsRefreshTrigger(prev => prev + 1);
    showToast('Cover letter generation started!', 'success');
    // Switch to jobs tab to show progress
    setActiveTab('jobs');
  };

  const handleSaveProviderConfig = async (config: LLMProviderConfig) => {
    try {
      await storageService.saveProviderConfig(config);
      setProviderConfig(config);
      
      // Update provider instances with API key or endpoint
      if (config.providerId === 'Gemini' && config.apiKey) {
        const provider = llmRegistry.get('gemini');
        if ('setApiKey' in provider) {
          (provider as any).setApiKey(config.apiKey);
        }
      } else if (config.providerId === 'Ollama' && config.endpoint) {
        const provider = llmRegistry.get('ollama');
        if ('setEndpoint' in provider) {
          (provider as any).setEndpoint(config.endpoint);
        }
      }
      
      showToast('Provider settings saved!', 'success');
    } catch (error) {
      console.error('Failed to save provider config:', error);
      showToast('Failed to save settings', 'error');
      throw error;
    }
  };

  const handleValidateProviderConfig = async (config: LLMProviderConfig) => {
    try {
      // Determine provider ID from enum
      const providerId = config.providerId === 'Ollama' ? 'ollama' : 'gemini';
      const provider = llmRegistry.get(providerId);
      
      // Update provider configuration before validation
      if (config.providerId === 'Gemini' && config.apiKey) {
        if ('setApiKey' in provider) {
          (provider as any).setApiKey(config.apiKey);
        }
      } else if (config.providerId === 'Ollama' && config.endpoint) {
        if ('setEndpoint' in provider) {
          (provider as any).setEndpoint(config.endpoint);
        }
      }
      
      const result = await provider.validateConfig({
        apiKey: config.apiKey,
        endpoint: config.endpoint,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });

      return result;
    } catch (error) {
      console.error('Failed to validate provider config:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  if (isLoading) {
    return (
      <div className="popup-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <OfflineIndicator />
      <header className="popup-header">
        <h1>Cover Letter Generator</h1>
        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
            disabled={!profile || !providerConfig}
          >
            Generate
          </button>
          <button
            className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
            disabled={!profile}
          >
            Jobs
          </button>
          <button
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </nav>
      </header>

      <main className="popup-content">
        <Suspense fallback={<LoadingSkeleton type="form" />}>
          {activeTab === 'profile' && (
            <ProfileForm
              initialProfile={profile}
              onSave={handleSave}
            />
          )}

          {activeTab === 'generate' && (
            <CoverLetterWorkflow
              profile={profile}
              providerConfig={providerConfig}
              onJobExtracted={handleJobExtracted}
              onGenerationStarted={handleGenerationStarted}
            />
          )}

          {activeTab === 'jobs' && profile && (
            <GenerationJobsPanel
              profileId={profile.id}
              profile={profile}
              refreshTrigger={jobsRefreshTrigger}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsContainer
              config={providerConfig}
              onSave={handleSaveProviderConfig}
              onValidate={handleValidateProviderConfig}
            />
          )}
        </Suspense>
      </main>

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
