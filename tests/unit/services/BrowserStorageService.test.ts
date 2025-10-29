import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserStorageService } from '../../../src/services/storage/BrowserStorageService';
import { UserProfile } from '../../../src/models/UserProfile';
import { LLMProvider } from '../../../src/models/CoverLetterContent';

// Mock webextension-polyfill
const mockStorage: Record<string, any> = {};

vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      local: {
        get: vi.fn((keys: any) => {
          if (typeof keys === 'string') {
            return Promise.resolve({ [keys]: mockStorage[keys] });
          }
          return Promise.resolve(mockStorage);
        }),
        set: vi.fn((items: any) => {
          Object.assign(mockStorage, items);
          return Promise.resolve();
        }),
        clear: vi.fn(() => {
          Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
          return Promise.resolve();
        }),
      },
    },
  },
}));

describe('BrowserStorageService', () => {
  let service: BrowserStorageService;

  beforeEach(() => {
    // Reset mock storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    service = new BrowserStorageService();
  });

  describe('saveProfile and loadProfile', () => {
    it('should save and load a profile', async () => {
      const profile: UserProfile = {
        id: 'test-id',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        experience: [
          {
            id: 'exp-1',
            company: 'TechCorp',
            role: 'Software Engineer',
            startDate: new Date('2020-01-01'),
            endDate: new Date('2023-12-31'),
            description: 'Developed awesome software with React and TypeScript for web applications serving millions of users.',
          },
        ],
        skills: ['React', 'TypeScript', 'Node.js'],
        education: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await service.saveProfile(profile);
      const loaded = await service.loadProfile();

      expect(loaded).not.toBeNull();
      expect(loaded?.name).toBe(profile.name);
      expect(loaded?.skills).toEqual(profile.skills);
    });
  });

  describe('saveProviderConfig and loadProviderConfig', () => {
    it('should save and load provider config', async () => {
      const config = {
        providerId: LLMProvider.GEMINI,
        apiKey: 'test-api-key-123',
        model: 'gemini-pro',
        temperature: 0.7,
        maxTokens: 1024,
        updatedAt: new Date(),
      };

      await service.saveProviderConfig(config);
      const loaded = await service.loadProviderConfig();

      expect(loaded).not.toBeNull();
      expect(loaded?.providerId).toBe(config.providerId);
      expect(loaded?.model).toBe(config.model);
    });
  });

  describe('clearAll', () => {
    it('should clear all data', async () => {
      const profile: UserProfile = {
        id: 'test-id',
        name: 'John Doe',
        email: 'john@example.com',
        experience: [
          {
            id: 'exp-1',
            company: 'TechCorp',
            role: 'Software Engineer',
            startDate: new Date('2020-01-01'),
            description: 'Developed awesome software with React and TypeScript for web applications serving millions of users.',
          },
        ],
        skills: ['React'],
        education: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await service.saveProfile(profile);
      await service.clearAll();
      const loaded = await service.loadProfile();

      expect(loaded).toBeNull();
    });
  });
});
