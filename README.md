# Cover Letter Generator Browser Extension

A powerful browser extension that helps you create professional, AI-powered cover letters tailored to specific job postings. Extract job details from LinkedIn, leverage your profile, and generate customized cover letters in seconds.

## 🚀 Features

- **Profile Management**: Create and store your professional profile locally
- **PDF Resume Upload**: Auto-extract profile information from your resume using AI
- **Job Extraction**: Automatically extract job details from LinkedIn postings
- **AI-Powered Generation**: Generate customized cover letters using Ollama (local) or Gemini (cloud)
- **Inline Editing**: Edit any section of the generated cover letter
- **Export Options**: Copy to clipboard or export as formatted PDF
- **Offline Support**: View cached profiles and cover letters without internet
- **Privacy-First**: All data stored locally in your browser
- **Rate Limiting**: Built-in protection against API abuse (10 requests/minute)

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Browser: Chrome, Edge, or Firefox (Manifest V3 compatible)
- AI Provider (choose one):
  - **Ollama** (local, free): [Install Ollama](https://ollama.ai/)
  - **Gemini** (cloud, API key required): [Get API Key](https://aistudio.google.com/apikey)

## 🛠️ Installation

### For Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cover-generator
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm run dev
   ```

4. **Load extension in browser**
   - Open Chrome/Edge and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder from the project

### For Production

1. **Build the extension**
   ```bash
   pnpm run build
   ```

2. **Load the built extension**
   - The production build will be in the `dist/` folder
   - Follow the same steps as development to load it

## 🎯 Quick Start

### 1. Configure AI Provider

Choose your AI provider in the **Settings** tab:

#### Option A: Ollama (Local, Free)
```bash
# Install Ollama
# Visit https://ollama.ai/ for installation instructions

# Start Ollama server
ollama serve

# Pull a model (recommended: llama2, mistral, or mixtral)
ollama pull llama2
```

In the extension:
- Provider: Ollama
- Endpoint: `http://localhost:11434`
- Model: `llama2` (or your chosen model)
- Click "Test Connection" to verify

#### Option B: Gemini (Cloud, API Key Required)
1. Get API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. In the extension:
   - Provider: Gemini
   - API Key: Paste your key
   - Model: `gemini-2.5-flash` (default)
   - Click "Test Connection" to verify

### 2. Create Your Profile

Go to the **Profile** tab and either:
- **Manual Entry**: Fill in your information manually
- **PDF Upload**: Upload your resume PDF for auto-extraction

Required fields:
- Name
- At least one work experience
- At least one skill

### 3. Extract Job Details

1. Navigate to a LinkedIn job posting
2. Click the extension icon
3. Go to the **Job Details** tab
4. Click "Extract from Page"
5. Review and edit as needed

### 4. Generate Cover Letter

1. Go to the **Generate** tab
2. Click "Generate Cover Letter"
3. Wait 5-30 seconds for AI generation
4. Review the four sections:
   - Opening
   - About Me
   - Why Me
   - Why Company
5. Click any section to edit inline

### 5. Export Your Cover Letter

- **Copy to Clipboard**: Click button to copy formatted text
- **Export to PDF**: Download as professional PDF

## 📁 Project Structure

```
cover-generator/
├── src/
│   ├── components/         # React components
│   │   ├── profile/        # Profile creation & editing
│   │   ├── generation/     # Cover letter generation UI
│   │   ├── settings/       # LLM provider settings
│   │   ├── help/           # User guide
│   │   └── common/         # Shared components
│   ├── services/           # Business logic
│   │   ├── llm/            # LLM providers & prompts
│   │   ├── extraction/     # Job detail extraction
│   │   ├── storage/        # Browser storage
│   │   ├── pdf/            # PDF parsing & export
│   │   └── validation/     # Input validation
│   ├── models/             # TypeScript interfaces
│   ├── pages/              # Main popup page
│   └── utils/              # Utilities & helpers
├── tests/                  # Unit & E2E tests
├── public/                 # Static assets
└── specs/                  # Feature specifications
```

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests (requires built extension)
pnpm test:e2e
```

## 🔧 Development Scripts

```bash
pnpm run dev          # Start development server with hot reload
pnpm run build        # Build production version
pnpm run test         # Run unit tests
pnpm run test:e2e     # Run E2E tests
pnpm run lint         # Lint code
pnpm run type-check   # TypeScript type checking
```

## 🐛 Troubleshooting

### "Cannot connect to Ollama"
- Ensure Ollama is running: `ollama serve`
- Check the endpoint in Settings (default: `http://localhost:11434`)
- Verify your model is installed: `ollama list`

### "Invalid API key" (Gemini)
- Get a valid API key from [Google AI Studio](https://aistudio.google.com/apikey)
- Make sure you copied the entire key without spaces
- Click "Test Connection" to verify

### "Failed to extract job details"
- Ensure you're on a LinkedIn job posting page
- Try refreshing the page and extracting again
- Use "Enter Manually" as a fallback

### "Rate limit exceeded"
- Wait 60 seconds before making another AI request
- Check remaining requests in Settings → Usage Statistics

### "PDF export failed"
- Use "Copy to Clipboard" instead
- Check your internet connection
- Try again in a few minutes

## 🔒 Privacy & Security

- **Local Storage**: All data stored locally in your browser using `chrome.storage.local`
- **No Tracking**: No analytics or tracking of any kind
- **API Keys**: Encrypted in browser storage (where applicable)
- **Data Control**: Export or delete all your data anytime
- **No Backend**: No external servers except AI provider APIs

## 📊 Performance

- **Popup Load**: <200ms target
- **AI Generation**: <10s (90th percentile)
- **Job Extraction**: <2s
- **PDF Export**: <5s

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## 📝 License

[Add your license here]

## 🙏 Acknowledgments

- Built with React, TypeScript, and Vite
- AI providers: Ollama and Google Gemini
- PDF parsing: pdf.js
- Testing: Vitest and Playwright

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check the User Guide in the extension (Help tab)
- Review troubleshooting section above

---

**Note**: This project is under active development. Features and APIs may change.
