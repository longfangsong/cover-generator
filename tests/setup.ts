import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Setup MSW server for API mocking
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

// Mock Chrome Extension APIs
(global as any).chrome = {
  storage: {
    local: {
      get: vi.fn((keys, callback) => {
        callback?.({});
        return Promise.resolve({});
      }),
      set: vi.fn((items, callback) => {
        callback?.();
        return Promise.resolve();
      }),
      remove: vi.fn((keys, callback) => {
        callback?.();
        return Promise.resolve();
      }),
      clear: vi.fn((callback) => {
        callback?.();
        return Promise.resolve();
      }),
    },
  },
  runtime: {
    sendMessage: vi.fn((message, callback) => {
      callback?.({});
      return Promise.resolve({});
    }),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn((queryInfo, callback) => {
      callback?.([]);
      return Promise.resolve([]);
    }),
    sendMessage: vi.fn((tabId, message, callback) => {
      callback?.({});
      return Promise.resolve({});
    }),
  },
} as any;

// Mock Web Crypto API for encryption tests
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      generateKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      digest: vi.fn(),
      importKey: vi.fn(),
      exportKey: vi.fn(),
    },
    getRandomValues: vi.fn((arr: Uint8Array) => {
      // Fill with pseudo-random values for testing
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    randomUUID: vi.fn(() => {
      // Generate a simple UUID for testing
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }),
  },
});
