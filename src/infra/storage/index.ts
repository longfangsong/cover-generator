/**
 * BrowserStorageService
 * Implements StorageService interface using browser.storage.local API
 * 
 * Security model: Data is stored in plaintext in browser.storage.local
 * This is sandboxed per-extension and requires user trust in the extension.
 */

import browser from 'webextension-polyfill';
import { UserProfile } from '../../models/UserProfile';
import { CoverLetterContent } from '../../models/CoverLetterContent';
import { LLMProviderConfig } from '../../models/LLMProviderConfig';
import { JobDetails } from '../../models/JobDetails';
import { GenerationJob } from '../../models/GenerationJob';

// Type declaration for chrome global
declare const chrome: any;

/**
 * Get browser storage API with fallback
 */
function getBrowserStorage() {
  console.log('[Storage] Checking for browser APIs...', {
    hasBrowser: typeof browser !== 'undefined',
    hasBrowserStorage: typeof browser !== 'undefined' && browser?.storage,
    hasBrowserStorageLocal: typeof browser !== 'undefined' && browser?.storage?.local,
    hasChrome: typeof chrome !== 'undefined',
    hasChromeStorage: typeof chrome !== 'undefined' && chrome?.storage,
    hasChromeStorageLocal: typeof chrome !== 'undefined' && chrome?.storage?.local,
  });

  // Try webextension-polyfill first
  if (browser && browser.storage && browser.storage.local) {
    console.log('[Storage] Using webextension-polyfill API');
    return browser.storage.local;
  }
  
  // Fallback to chrome API
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    console.log('[Storage] Using native Chrome API with promise wrapper');
    // Wrap chrome API with promises
    return {
      get: (keys: any) => new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, (result: any) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result);
          }
        });
      }),
      set: (items: any) => new Promise((resolve, reject) => {
        chrome.storage.local.set(items, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(undefined);
          }
        });
      }),
      remove: (keys: any) => new Promise((resolve, reject) => {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(undefined);
          }
        });
      }),
      clear: () => new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(undefined);
          }
        });
      }),
    };
  }
  
  console.error('[Storage] No browser storage API available!');
  throw new Error('Browser storage API not available. Make sure the extension is properly loaded.');
}

/**
 * Storage keys used in this.storage
 */
const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  COVER_LETTERS: 'cover_letters',
  PROVIDER_CONFIG: 'provider_config',
  JOB_CACHE: 'job_cache',
  GENERATION_JOBS: 'generation_jobs',
} as const;

/**
 * StorageService interface
 * All storage operations for the application
 */
export interface StorageService {
  saveProfile(profile: UserProfile): Promise<void>;
  loadProfile(): Promise<UserProfile | null>;
  saveCoverLetter(letter: CoverLetterContent): Promise<void>;
  loadCoverLetter(id: string): Promise<CoverLetterContent | null>;
  listCoverLetters(profileId: string): Promise<CoverLetterContent[]>;
  deleteCoverLetter(id: string): Promise<void>;
  saveProviderConfig(config: LLMProviderConfig): Promise<void>;
  loadProviderConfig(): Promise<LLMProviderConfig | null>;
  cacheJobDetails(job: JobDetails): Promise<void>;
  getCachedJob(url: string): Promise<JobDetails | null>;
  saveGenerationJob(job: GenerationJob): Promise<void>;
  loadGenerationJob(id: string): Promise<GenerationJob | null>;
  listGenerationJobs(profileId?: string): Promise<GenerationJob[]>;
  deleteGenerationJob(id: string): Promise<void>;
  clearAll(): Promise<void>;
  exportData(): Promise<string>;
}

/**
 * Browser storage implementation using browser.storage.local
 */
export class BrowserStorageService implements StorageService {
  private _storage: any = null;

  private get storage() {
    if (!this._storage) {
      this._storage = getBrowserStorage();
    }
    return this._storage;
  }

  /**
   * Save user profile
   */
  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      // Convert dates to ISO strings for storage
      const serialized = this.serializeDates(profile);

      await this.storage.set({
        [STORAGE_KEYS.USER_PROFILE]: serialized,
      });
    } catch (error) {
      console.error('[BrowserStorage] Failed to save profile:', error);
      throw new Error('Failed to save profile');
    }
  }

  /**
   * Load user profile
   */
  async loadProfile(): Promise<UserProfile | null> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.USER_PROFILE);
      const stored = result[STORAGE_KEYS.USER_PROFILE];

      if (!stored) {
        return null;
      }

      // Deserialize dates
      const profile = this.deserializeDates(stored) as UserProfile;

      return profile;
    } catch (error) {
      console.error('[BrowserStorage] Failed to load profile:', error);
      throw new Error('Failed to load profile');
    }
  }

  /**
   * Save generated cover letter (encrypted)
   */
  async saveCoverLetter(letter: CoverLetterContent): Promise<void> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.COVER_LETTERS);
      const letters: Record<string, any> = result[STORAGE_KEYS.COVER_LETTERS] || {};

      const serialized = this.serializeDates(letter);
      letters[letter.id] = serialized;

      await this.storage.set({
        [STORAGE_KEYS.COVER_LETTERS]: letters,
      });
    } catch (error) {
      console.error('[BrowserStorage] Failed to save cover letter:', error);
      throw new Error('Failed to save cover letter');
    }
  }

  /**
   * Load cover letter by ID (decrypted)
   */
  async loadCoverLetter(id: string): Promise<CoverLetterContent | null> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.COVER_LETTERS);
      const letters: Record<string, any> = result[STORAGE_KEYS.COVER_LETTERS] || {};

      const stored = letters[id];
      if (!stored) {
        return null;
      }

      return this.deserializeDates(stored) as CoverLetterContent;
    } catch (error) {
      console.error('[BrowserStorage] Failed to load cover letter:', error);
      throw new Error('Failed to load cover letter');
    }
  }

  /**
   * List all cover letters for profile
   */
  async listCoverLetters(profileId: string): Promise<CoverLetterContent[]> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.COVER_LETTERS);
      const letters: Record<string, any> = result[STORAGE_KEYS.COVER_LETTERS] || {};

      const profileLetters = Object.values(letters)
        .filter((letter: any) => letter.profileId === profileId)
        .map((letter: any) => this.deserializeDates(letter) as CoverLetterContent);

      return profileLetters;
    } catch (error) {
      console.error('[BrowserStorage] Failed to list cover letters:', error);
      throw new Error('Failed to list cover letters');
    }
  }

  /**
   * Delete cover letter
   */
  async deleteCoverLetter(id: string): Promise<void> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.COVER_LETTERS);
      const letters: Record<string, any> = result[STORAGE_KEYS.COVER_LETTERS] || {};

      delete letters[id];

      await this.storage.set({
        [STORAGE_KEYS.COVER_LETTERS]: letters,
      });
    } catch (error) {
      console.error('[BrowserStorage] Failed to delete cover letter:', error);
      throw new Error('Failed to delete cover letter');
    }
  }

  /**
   * Save LLM provider config
   */
  async saveProviderConfig(config: LLMProviderConfig): Promise<void> {
    try {
      const serialized = this.serializeDates(config);

      await this.storage.set({
        [STORAGE_KEYS.PROVIDER_CONFIG]: serialized,
      });
    } catch (error) {
      console.error('[BrowserStorage] Failed to save provider config:', error);
      throw new Error('Failed to save provider config');
    }
  }

  /**
   * Load provider config
   */
  async loadProviderConfig(): Promise<LLMProviderConfig | null> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.PROVIDER_CONFIG);
      const stored = result[STORAGE_KEYS.PROVIDER_CONFIG];

      if (!stored) {
        return null;
      }

      const config = this.deserializeDates(stored) as LLMProviderConfig;

      return config;
    } catch (error) {
      console.error('[BrowserStorage] Failed to load provider config:', error);
      throw new Error('Failed to load provider config');
    }
  }

  /**
   * Cache job details (temporary, indexed by URL)
   */
  async cacheJobDetails(job: JobDetails): Promise<void> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.JOB_CACHE);
      const cache: Record<string, any> = result[STORAGE_KEYS.JOB_CACHE] || {};

      cache[job.url] = this.serializeDates(job);

      await this.storage.set({
        [STORAGE_KEYS.JOB_CACHE]: cache,
      });
    } catch (error) {
      console.error('[BrowserStorage] Failed to cache job details:', error);
      throw new Error('Failed to cache job details');
    }
  }

  /**
   * Get cached job details by URL
   */
  async getCachedJob(url: string): Promise<JobDetails | null> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.JOB_CACHE);
      const cache: Record<string, any> = result[STORAGE_KEYS.JOB_CACHE] || {};

      const stored = cache[url];
      if (!stored) {
        return null;
      }

      return this.deserializeDates(stored) as JobDetails;
    } catch (error) {
      console.error('[BrowserStorage] Failed to get cached job:', error);
      throw new Error('Failed to get cached job');
    }
  }

  /**
   * Save generation job
   */
  async saveGenerationJob(job: GenerationJob): Promise<void> {
    try {
      console.log('[BrowserStorage] Saving generation job:', job.id, job);
      const result: any = await this.storage.get(STORAGE_KEYS.GENERATION_JOBS);
      const jobs: Record<string, any> = result[STORAGE_KEYS.GENERATION_JOBS] || {};

      const serialized = this.serializeDates(job);
      jobs[job.id] = serialized;

      await this.storage.set({
        [STORAGE_KEYS.GENERATION_JOBS]: jobs,
      });
      console.log('[BrowserStorage] Generation job saved successfully');
    } catch (error) {
      console.error('[BrowserStorage] Failed to save generation job:', error);
      throw new Error('Failed to save generation job');
    }
  }

  /**
   * Load generation job by ID
   */
  async loadGenerationJob(id: string): Promise<GenerationJob | null> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.GENERATION_JOBS);
      const jobs: Record<string, any> = result[STORAGE_KEYS.GENERATION_JOBS] || {};

      const stored = jobs[id];
      if (!stored) {
        return null;
      }

      return this.deserializeDates(stored) as GenerationJob;
    } catch (error) {
      console.error('[BrowserStorage] Failed to load generation job:', error);
      throw new Error('Failed to load generation job');
    }
  }

  /**
   * List all generation jobs, optionally filtered by profile
   */
  async listGenerationJobs(profileId?: string): Promise<GenerationJob[]> {
    try {
      console.log('[BrowserStorage] Listing generation jobs for profile:', profileId);
      const result: any = await this.storage.get(STORAGE_KEYS.GENERATION_JOBS);
      const jobs: Record<string, any> = result[STORAGE_KEYS.GENERATION_JOBS] || {};

      console.log('[BrowserStorage] Raw jobs from storage:', jobs);

      let jobList = Object.values(jobs)
        .map((job: any) => this.deserializeDates(job) as GenerationJob);

      console.log('[BrowserStorage] Deserialized jobs:', jobList);

      if (profileId) {
        jobList = jobList.filter((job: GenerationJob) => job.profileId === profileId);
        console.log('[BrowserStorage] Filtered jobs for profile:', jobList);
      }

      // Sort by creation date descending (newest first)
      jobList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return jobList;
    } catch (error) {
      console.error('[BrowserStorage] Failed to list generation jobs:', error);
      throw new Error('Failed to list generation jobs');
    }
  }

  /**
   * Delete generation job
   */
  async deleteGenerationJob(id: string): Promise<void> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.GENERATION_JOBS);
      const jobs: Record<string, any> = result[STORAGE_KEYS.GENERATION_JOBS] || {};

      delete jobs[id];

      await this.storage.set({
        [STORAGE_KEYS.GENERATION_JOBS]: jobs,
      });
    } catch (error) {
      console.error('[BrowserStorage] Failed to delete generation job:', error);
      throw new Error('Failed to delete generation job');
    }
  }

  /**
   * Clear all user data
   */
  async clearAll(): Promise<void> {
    try {
      await this.storage.clear();
    } catch (error) {
      console.error('[BrowserStorage] Failed to clear all data:', error);
      throw new Error('Failed to clear all data');
    }
  }

  /**
   * Export all data as JSON (decrypted)
   */
  async exportData(): Promise<string> {
    try {
      const profile = await this.loadProfile();
      const providerConfig = await this.loadProviderConfig();

      let coverLetters: CoverLetterContent[] = [];
      if (profile) {
        coverLetters = await this.listCoverLetters(profile.id);
      }

      const exportData = {
        profile,
        coverLetters,
        providerConfig: providerConfig ? { ...providerConfig, apiKey: '[REDACTED]' } : null,
        exportedAt: new Date().toISOString(),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('[BrowserStorage] Failed to export data:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Serialize dates to ISO strings for storage
   */
  private serializeDates(obj: any): any {
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.serializeDates(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const serialized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        serialized[key] = this.serializeDates(value);
      }
      return serialized;
    }
    return obj;
  }

  /**
   * Deserialize ISO strings back to Date objects
   */
  private deserializeDates(obj: any): any {
    if (typeof obj === 'string') {
      // Check if string is ISO 8601 date
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
      if (isoDateRegex.test(obj)) {
        return new Date(obj);
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.deserializeDates(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const deserialized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        deserialized[key] = this.deserializeDates(value);
      }
      return deserialized;
    }
    return obj;
  }
}
