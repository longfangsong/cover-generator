/**
 * UserGuide Component
 * Help documentation for using the extension
 */

import React, { useState } from 'react';
import './UserGuide.css';

type Section = 'getting-started' | 'profile' | 'job-extraction' | 'generation' | 'export' | 'troubleshooting';

export const UserGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('getting-started');

  return (
    <div className="user-guide">
      <h3>User Guide</h3>
      
      <div className="guide-layout">
        <nav className="guide-nav">
          <button
            className={activeSection === 'getting-started' ? 'active' : ''}
            onClick={() => setActiveSection('getting-started')}
          >
            🚀 Getting Started
          </button>
          <button
            className={activeSection === 'profile' ? 'active' : ''}
            onClick={() => setActiveSection('profile')}
          >
            👤 Profile Setup
          </button>
          <button
            className={activeSection === 'job-extraction' ? 'active' : ''}
            onClick={() => setActiveSection('job-extraction')}
          >
            📄 Job Extraction
          </button>
          <button
            className={activeSection === 'generation' ? 'active' : ''}
            onClick={() => setActiveSection('generation')}
          >
            ✨ AI Generation
          </button>
          <button
            className={activeSection === 'export' ? 'active' : ''}
            onClick={() => setActiveSection('export')}
          >
            📥 Export & Save
          </button>
          <button
            className={activeSection === 'troubleshooting' ? 'active' : ''}
            onClick={() => setActiveSection('troubleshooting')}
          >
            🔧 Troubleshooting
          </button>
        </nav>

        <div className="guide-content">
          {activeSection === 'getting-started' && (
            <div className="guide-section">
              <h4>🚀 Getting Started</h4>
              <p>Welcome to the Cover Letter Generator! This tool helps you create professional, customized cover letters using AI.</p>
              
              <h5>Quick Setup (3 steps)</h5>
              <ol>
                <li><strong>Configure AI Provider</strong> - Go to Settings tab and choose either Ollama (local) or Gemini (cloud)</li>
                <li><strong>Create Profile</strong> - Fill in your work experience, skills, and education in the Profile tab</li>
                <li><strong>Extract Job Details</strong> - Navigate to a LinkedIn job posting and use the Job Details tab to extract information</li>
              </ol>

              <div className="tip">
                <strong>💡 Tip:</strong> Start with the Settings tab to configure your AI provider before creating your profile.
              </div>
            </div>
          )}

          {activeSection === 'profile' && (
            <div className="guide-section">
              <h4>👤 Profile Setup</h4>
              <p>Your profile is the foundation of your cover letters. Fill it out completely for best results.</p>
              
              <h5>Required Fields</h5>
              <ul>
                <li><strong>Name:</strong> Your full name</li>
                <li><strong>Experience:</strong> At least one work experience (company, title, dates, description)</li>
                <li><strong>Skills:</strong> Your key skills (up to 50)</li>
              </ul>

              <h5>Optional Fields</h5>
              <ul>
                <li><strong>Email & Phone:</strong> Contact information</li>
                <li><strong>Education:</strong> Degrees and certifications</li>
                <li><strong>Summary:</strong> Brief professional overview</li>
              </ul>

              <h5>Field Limits</h5>
              <ul>
                <li>Max 1000 words per experience description</li>
                <li>Max 15 experience entries</li>
                <li>Max 100 skills</li>
              </ul>

              <div className="tip">
                <strong>💡 Tip:</strong> You can also upload a resume PDF to auto-fill your profile (requires AI provider setup).
              </div>
            </div>
          )}

          {activeSection === 'job-extraction' && (
            <div className="guide-section">
              <h4>📄 Job Extraction</h4>
              <p>Automatically extract job details from LinkedIn postings.</p>
              
              <h5>How to Extract</h5>
              <ol>
                <li>Navigate to a LinkedIn job posting in your browser</li>
                <li>Click the extension icon to open the popup</li>
                <li>Go to the "Job Details" tab</li>
                <li>Click "Extract from Page"</li>
                <li>Review and edit any fields if needed</li>
              </ol>

              <h5>Extracted Fields</h5>
              <ul>
                <li><strong>Company:</strong> Hiring company name</li>
                <li><strong>Position:</strong> Job title</li>
                <li><strong>Description:</strong> Full job description</li>
              </ul>

              <div className="tip">
                <strong>💡 Tip:</strong> If extraction fails, you can manually enter job details. Click "Enter Manually" in the Job Details tab.
              </div>
            </div>
          )}

          {activeSection === 'generation' && (
            <div className="guide-section">
              <h4>✨ AI Generation</h4>
              <p>Generate customized cover letters using AI based on your profile and job details.</p>
              
              <h5>Before Generating</h5>
              <ul>
                <li>✅ AI provider configured in Settings</li>
                <li>✅ Profile completed with at least one experience</li>
                <li>✅ Job details extracted or entered</li>
              </ul>

              <h5>Generation Process</h5>
              <ol>
                <li>Go to the "Generate" tab</li>
                <li>Click "Generate Cover Letter"</li>
                <li>Wait 5-30 seconds for AI to generate content</li>
                <li>Review the four sections: Opening, About Me, Why Me, Why Company</li>
                <li>Click any section to edit it inline</li>
                <li>Changes are auto-saved</li>
              </ol>

              <h5>Rate Limiting</h5>
              <p>You can make up to 10 AI requests per minute to prevent API abuse.</p>

              <div className="tip">
                <strong>💡 Tip:</strong> Edit the generated content to add personal touches and make it more authentic.
              </div>
            </div>
          )}

          {activeSection === 'export' && (
            <div className="guide-section">
              <h4>📥 Export & Save</h4>
              <p>Save and export your generated cover letters.</p>
              
              <h5>Copy to Clipboard</h5>
              <ol>
                <li>After generating a cover letter, scroll to the preview section</li>
                <li>Click "Copy to Clipboard"</li>
                <li>Paste into any document or email</li>
              </ol>

              <h5>Export to PDF</h5>
              <ol>
                <li>Click "Export to PDF" button</li>
                <li>Wait for PDF generation</li>
                <li>File downloads as: CoverLetter_[Company]_[Date].pdf</li>
              </ol>

              <h5>Data Backup</h5>
              <p>In Settings, use "Export All Data" to backup your profiles and cover letters as a JSON file.</p>

              <div className="tip">
                <strong>💡 Tip:</strong> All your data is stored locally in your browser and never sent to external servers (except AI API calls).
              </div>
            </div>
          )}

          {activeSection === 'troubleshooting' && (
            <div className="guide-section">
              <h4>🔧 Troubleshooting</h4>
              
              <h5>Common Issues</h5>
              
              <div className="troubleshooting-item">
                <strong>❌ "Cannot connect to Ollama"</strong>
                <ul>
                  <li>Make sure Ollama is installed and running: <code>ollama serve</code></li>
                  <li>Check the endpoint in Settings (default: http://localhost:11434)</li>
                  <li>Verify the model is installed: <code>ollama list</code></li>
                </ul>
              </div>

              <div className="troubleshooting-item">
                <strong>❌ "Invalid API key" (Gemini)</strong>
                <ul>
                  <li>Get a valid API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></li>
                  <li>Make sure you copied the entire key without spaces</li>
                  <li>Click "Test Connection" to verify</li>
                </ul>
              </div>

              <div className="troubleshooting-item">
                <strong>❌ "Failed to extract job details"</strong>
                <ul>
                  <li>Make sure you're on a LinkedIn job posting page</li>
                  <li>Try refreshing the page and extracting again</li>
                  <li>Use "Enter Manually" as a fallback</li>
                </ul>
              </div>

              <div className="troubleshooting-item">
                <strong>❌ "Rate limit exceeded"</strong>
                <ul>
                  <li>Wait 60 seconds before making another AI request</li>
                  <li>Check remaining requests in Settings → Usage Statistics</li>
                </ul>
              </div>

              <div className="troubleshooting-item">
                <strong>❌ "PDF export failed"</strong>
                <ul>
                  <li>Use "Copy to Clipboard" instead and paste into a document</li>
                  <li>Check your internet connection</li>
                  <li>Try again in a few minutes</li>
                </ul>
              </div>

              <div className="tip">
                <strong>💡 Need more help?</strong> Check browser console (F12) for detailed error messages.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
