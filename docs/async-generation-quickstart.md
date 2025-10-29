# Async Generation Quick Start

## How to Use Background Generation

### 1. Enable Async Mode
- Navigate to the cover letter generation section
- Check the "Generate in background (asynchronous)" checkbox
- This is enabled by default

### 2. Start Generation
- Fill in job details (auto-extracted from LinkedIn or manual entry)
- Optionally add custom instructions for specific sections
- Click "Generate Cover Letter"
- A notification will confirm the job has been queued

### 3. Track Progress
- The "Generation Jobs" panel appears at the top of the page
- Shows all your generation jobs with status icons:
  - ⏳ **Pending**: Waiting to start
  - ⚙️ **In Progress**: Currently generating
  - ✅ **Completed**: Ready to view
  - ❌ **Failed**: Error occurred
  - 🚫 **Cancelled**: Manually stopped

### 4. View Results
- When a job completes (✅), click "View Cover Letter"
- The cover letter opens in edit mode
- You can edit, preview, copy, or export as PDF

### 5. Clean Up
- Click "Delete" on completed or failed jobs to remove them
- Keeps your jobs panel organized

## Tips

- **Multiple Jobs**: Queue multiple cover letters for different positions
- **Background Work**: Continue browsing while generation runs
- **Progress Updates**: Panel refreshes every 2 seconds when jobs are active
- **Sync Mode**: Uncheck the async option for immediate generation (blocks UI)

## Troubleshooting

**Job stays in Pending**
- Check that your LLM provider is configured in Settings
- Ensure you have an active internet connection (for Gemini)

**Job fails immediately**
- Check the error message in the red box
- Verify your profile is complete
- Ensure job details are filled in

**Jobs panel is empty**
- Make sure you've created a profile first
- Try generating a cover letter to populate the panel

## Architecture Notes

All jobs are stored locally in browser storage and persist across sessions. The background script handles processing independently of the popup UI.
