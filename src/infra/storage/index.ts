/**
 * BrowserStorageService
 * Implements StorageService interface using browser.storage.local API
 * 
 * Security model: Data is stored in plaintext in browser.storage.local
 * This is sandboxed per-extension and requires user trust in the extension.
 */

import browser from 'webextension-polyfill';
import { UserProfile } from '../../models/userProfile';
import { LLMProviderConfig } from '../../models/llmProviderConfig';
import { JobDetails } from '../../models/jobDetails';
import { Task } from '../../models/generationTask';
import { CoverLetterContent } from '@/models/coverLetterContent';

// Type declaration for chrome global
declare const chrome: any;

/**
 * Get browser storage API with fallback
 */
function getBrowserStorage() {
  // Try webextension-polyfill first
  if (browser && browser.storage && browser.storage.local) {
    return browser.storage.local;
  }

  // Fallback to chrome API
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
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
  PROVIDER_CONFIG: 'provider_config',
  GENERATION_TASKS: 'generation_tasks',
  COVER_LETTERS: 'cover_letters',
} as const;


/**
 * Browser storage implementation using browser.storage.local
 */
export class BrowserStorageService {
  private _storage: any = null;

  private get storage() {
    if (!this._storage) {
      this._storage = getBrowserStorage();
    }
    return this._storage;
  }

  public onChange(listener: (changes: any, areaName: string) => void) {
    this._storage.onChanged.addListener(listener);
  }

  /**
   * Save user profile
   */
  async saveProfile(profile: UserProfile): Promise<void> {
    try {
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

      const profile = this.deserializeDates(stored) as UserProfile;

      return profile;
    } catch (error) {
      console.error('[BrowserStorage] Failed to load profile:', error);
      throw new Error('Failed to load profile');
    }
  }

  /**
   * Load provider config
   */
  async loadLLMSettings(): Promise<LLMProviderConfig | null> {
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
 * Save LLM provider config
 */
  async saveLLMSettings(config: LLMProviderConfig): Promise<void> {
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
   * Save generation task
   */
  async saveGenerationTask(task: Task): Promise<void> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.GENERATION_TASKS);
      const tasks: Record<string, any> = result[STORAGE_KEYS.GENERATION_TASKS] || {};

      const serialized = this.serializeDates(task);
      tasks[task.id] = serialized;

      await this.storage.set({
        [STORAGE_KEYS.GENERATION_TASKS]: tasks,
      });
    } catch (error) {
      throw new Error('Failed to save generation job');
    }
  }

  /**
 * List all generation jobs, optionally filtered by profile
 */
  async listGenerationTasks(profileId?: string): Promise<Task[]> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.GENERATION_TASKS);
      const tasks: Record<string, any> = result[STORAGE_KEYS.GENERATION_TASKS] || {};

      let taskList = Object.values(tasks)
        .map((task: any) => this.deserializeDates(task) as Task);

      console.log('[BrowserStorage] Deserialized jobs:', taskList);

      if (profileId) {
        taskList = taskList.filter((task: Task) => task.profileId === profileId);
      }

      // Sort by creation date descending (newest first)
      taskList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return taskList;
    } catch (error) {
      throw new Error('Failed to list generation jobs');
    }
  }

  /**
   * Save cover letter
   */
  async saveCoverLetter(coverLetter: CoverLetterContent): Promise<void> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.COVER_LETTERS);
      const letters: Record<string, any> = result[STORAGE_KEYS.COVER_LETTERS] || {};

      const serialized = this.serializeDates(coverLetter);
      letters[coverLetter.id] = serialized;

      await this.storage.set({
        [STORAGE_KEYS.COVER_LETTERS]: letters,
      });
    } catch (error) {
      console.error('[BrowserStorage] Failed to save cover letter:', error);
      throw new Error('Failed to save cover letter');
    }
  }

  /**
   * Load cover letter by ID
   */
  async loadCoverLetter(letterId: string): Promise<CoverLetterContent | null> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.COVER_LETTERS);
      const letters: Record<string, any> = result[STORAGE_KEYS.COVER_LETTERS] || {};
      console.log(letters);
      const stored = letters[letterId];
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
 * List all cover letters
 */
  async listCoverLetters(): Promise<Record<string, CoverLetterContent>> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.COVER_LETTERS);
      const letters: Record<string, any> = result[STORAGE_KEYS.COVER_LETTERS] || {};

      // Deserialize dates for each cover letter
      const deserializedLetters: Record<string, CoverLetterContent> = {};
      for (const [key, value] of Object.entries(letters)) {
        deserializedLetters[key] = this.deserializeDates(value) as CoverLetterContent;
      }

      return deserializedLetters;
    } catch (error) {
      console.error('[BrowserStorage] Failed to list cover letters:', error);
      throw new Error('Failed to list cover letters');
    }
  }

  /**
 * Delete a generation task by ID
 */
  async deleteGenerationTask(taskId: string): Promise<void> {
    try {
      const result: any = await this.storage.get(STORAGE_KEYS.GENERATION_TASKS);
      const tasks: Record<string, any> = result[STORAGE_KEYS.GENERATION_TASKS] || {};

      if (tasks[taskId]) {
        delete tasks[taskId];

        await this.storage.set({
          [STORAGE_KEYS.GENERATION_TASKS]: tasks,
        });
      } else {
        console.warn(`[BrowserStorage] Task with ID ${taskId} does not exist.`);
      }
    } catch (error) {
      console.error('[BrowserStorage] Failed to delete generation task:', error);
      throw new Error('Failed to delete generation task');
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

export const browserStorageService = new BrowserStorageService();