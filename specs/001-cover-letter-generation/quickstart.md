# Quickstart Guide: Core Cover Letter Generation

**Feature**: 001-cover-letter-generation  
**Date**: 2025-10-27  
**Purpose**: Get developers up and running with the feature implementation

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **pnpm**: 8.0.0 or higher (or npm 9.0.0+)
- **Browser**: Chrome or Firefox (latest stable)
- **Ollama** (optional): For local LLM testing - download from <https://ollama.ai>
- **Gemini API Key** (optional): For Gemini testing - get from <https://makersuite.google.com>

## Initial Setup

### 1. Install Dependencies

```bash
# Navigate to project root
cd /Users/longfangsong/Projects/cover-generator

# Install all dependencies
pnpm install

# Add new dependencies for this feature
pnpm add pdfjs-dist @types/pdfjs-dist
pnpm add @google/generative-ai
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
pnpm add -D playwright @playwright/test
pnpm add -D msw
```

### 2. Configure TypeScript

Verify `tsconfig.json` has strict mode enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 3. Set Up Testing

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/', 'dist/'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  }
});
```

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },
  tabs: {
    sendMessage: vi.fn(),
    query: vi.fn()
  }
} as any;

// Setup MSW server for API mocking
export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 4. Set Up Playwright

```bash
# Initialize Playwright
pnpm create playwright

# Install browsers
pnpm playwright install
```

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
```

## Development Workflow

### Running the Extension Locally

```bash
# Build the extension in development mode
pnpm dev

# In another terminal, watch for changes
pnpm run build --watch
```

Load the extension in Chrome:

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` directory

### Running Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run integration tests
pnpm test:integration

# Run E2E tests (extension must be built first)
pnpm build
pnpm test:e2e

# Run specific test file
pnpm test src/services/llm/ollama.test.ts
```

### Code Quality Checks

```bash
# Type checking
pnpm tsc --noEmit

# Linting (if configured)
pnpm lint

# Format code
pnpm format
```

## Testing Different LLM Providers

### Ollama (Local)

1. Install Ollama from <https://ollama.ai>
2. Pull a model:

   ```bash
   ollama pull llama2
   ```

3. Verify it's running:

   ```bash
   curl http://localhost:11434/api/tags
   ```

4. In the extension settings, select "Ollama" and model "llama2"

### Gemini (Cloud)

1. Get API key from <https://makersuite.google.com/app/apikey>
2. In extension settings:
   - Select "Gemini"
   - Enter API key
   - Model: "gemini-pro"

## Testing Job Extraction

### LinkedIn

1. Navigate to any LinkedIn job posting (e.g., <https://linkedin.com/jobs/view/123456>)
2. Click the extension icon
3. Verify extracted fields: company, title, description, skills

### Indeed

1. Navigate to any Indeed job posting (e.g., <https://indeed.com/viewjob?jk=abc123>)
2. Click the extension icon
3. Verify extraction

### Manual Fallback

1. Navigate to any non-supported job site
2. Click extension icon
3. Verify manual input form appears

## Project Structure Refresher

```text
src/
├── models/                 # Data models (UserProfile, JobDetails, etc.)
│   ├── UserProfile.ts
│   ├── JobDetails.ts
│   └── CoverLetterContent.ts
│
├── services/
│   ├── llm/               # LLM provider implementations
│   │   ├── providers/
│   │   │   ├── OllamaProvider.ts
│   │   │   └── GeminiProvider.ts
│   │   ├── LLMRegistry.ts
│   │   └── index.ts
│   │
│   ├── extraction/        # Job site extractors
│   │   ├── platforms/
│   │   │   ├── LinkedInExtractor.ts
│   │   │   ├── IndeedExtractor.ts
│   │   │   ├── GlassdoorExtractor.ts
│   │   │   └── ManualExtractor.ts
│   │   ├── ExtractorRegistry.ts
│   │   └── index.ts
│   │
│   ├── storage/           # Storage with encryption
│   │   ├── BrowserStorageService.ts
│   │   ├── encryption.ts
│   │   └── index.ts
│   │
│   ├── pdf/              # PDF parsing and export
│   │   ├── PDFParser.ts
│   │   ├── PDFExporter.ts
│   │   └── index.ts
│   │
│   └── validation/        # Field validation
│       ├── ProfileValidator.ts
│       └── RateLimiter.ts
│
├── components/            # React UI components
│   ├── profile/
│   │   ├── ProfileForm.tsx
│   │   ├── ExperienceEditor.tsx
│   │   └── PDFUpload.tsx
│   │
│   ├── generation/
│   │   ├── GenerationView.tsx
│   │   ├── CoverLetterEditor.tsx
│   │   └── ExportButtons.tsx
│   │
│   └── settings/
│       ├── SettingsPanel.tsx
│       └── ProviderConfig.tsx
│
├── content/              # Content scripts for extraction
│   ├── content.ts
│   └── extractors.ts
│
├── background.ts         # Background service worker
├── popup.tsx            # Popup entry point
└── manifest.json        # Extension manifest

tests/
├── unit/                # Unit tests (mirror src/ structure)
├── integration/         # Integration tests (LLM, extraction)
├── e2e/                # Playwright E2E tests
└── mocks/              # MSW handlers and test fixtures
```

## Common Development Tasks

### Add a New LLM Provider

1. Create provider file: `src/services/llm/providers/NewProvider.ts`
2. Implement `LLMProvider` interface
3. Register in `src/services/llm/LLMRegistry.ts`
4. Add tests: `tests/unit/services/llm/NewProvider.test.ts`
5. Update settings UI to show new provider

### Add a New Job Platform Extractor

1. Create extractor: `src/services/extraction/platforms/NewPlatform.ts`
2. Implement `JobExtractor` interface with URL patterns and selectors
3. Register in `src/services/extraction/ExtractorRegistry.ts`
4. Add tests with mock DOM: `tests/unit/services/extraction/NewPlatform.test.ts`

### Debug Extension

1. Build extension: `pnpm build`
2. Load in Chrome (see above)
3. Open DevTools for popup: Right-click extension icon → Inspect
4. View console logs: `chrome://extensions/` → "Errors" button
5. Inspect background worker: Extensions page → "Service worker" link

### Update Manifest Permissions

Edit `src/manifest.json`:

```json
{
  "manifest_version": 3,
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": [
    "https://www.linkedin.com/*",
    "https://www.indeed.com/*",
    "https://www.glassdoor.com/*"
  ]
}
```

Rebuild after changes: `pnpm build`

## Troubleshooting

### "Module not found" errors

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Extension not loading

- Check `dist/manifest.json` exists after build
- Verify no TypeScript errors: `pnpm tsc --noEmit`
- Check Chrome extension console for errors

### Tests failing

- Ensure MSW server is set up in `tests/setup.ts`
- Check chrome API mocks are defined
- Run single test to isolate: `pnpm test path/to/test.ts`

### Ollama connection issues

```bash
# Check Ollama is running
ollama list

# Check endpoint is accessible
curl http://localhost:11434/api/tags

# Check firewall isn't blocking localhost:11434
```

## Next Steps

After completing this quickstart:

1. Review `spec.md` for feature requirements
2. Review `data-model.md` for entity definitions
3. Review `contracts/service-contracts.md` for interfaces
4. Begin implementing with tests-first approach (see `tasks.md` when available)

## Resources

- **TypeScript Docs**: <https://www.typescriptlang.org/docs/>
- **React Docs**: <https://react.dev>
- **Chrome Extensions**: <https://developer.chrome.com/docs/extensions>
- **Vitest**: <https://vitest.dev>
- **Playwright**: <https://playwright.dev>
- **PDF.js**: <https://mozilla.github.io/pdf.js/>
- **Ollama API**: <https://github.com/ollama/ollama/blob/main/docs/api.md>
- **Gemini API**: <https://ai.google.dev/docs>
