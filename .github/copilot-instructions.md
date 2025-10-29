# Copilot usage instructions

- Do NOT run build or test commands unless explicitly asked to do so.
  - If you need a build or tests run, wait for a direct command like "run build" or "run tests".

- Do NOT generate an automatic summary of what you have done after every chat.
  - Provide summaries only when specifically requested.

These instructions are project-level preferences to avoid unexpected side effects during development.

## Active Technologies
- TypeScript 5.6.3, React 18.2.0 (001-cover-letter-generation)
- Browser local storage (encrypted) via `chrome.storage.local` API for user profiles, settings, and cached data (001-cover-letter-generation)
- TypeScript 5.6.3, targeting ESNext + React 18.2.0, uuid 13.0.0, vite-plugin-web-extension 4.0.0 (002-arbetsformedlingen-extractor)
- Browser chrome.storage.local API for cached job details (encrypted) (002-arbetsformedlingen-extractor)
- Vitest 4.0.3 for unit testing, jsdom 27.0.1 for DOM testing

## Recent Changes
- 001-cover-letter-generation: Added TypeScript 5.6.3, React 18.2.0
- 002-arbetsformedlingen-extractor: Implemented Arbetsförmedlingen job extractor with comprehensive test coverage (42 tests)
