# Async Cover Letter Generation Feature

## Overview
The cover letter generation now supports asynchronous background processing, allowing users to queue multiple generation jobs and track their progress without blocking the UI.

## Architecture

### 1. **Generation Job Model** (`src/models/GenerationJob.ts`)
- Tracks the state of each generation request
- Stores full profile and job details for background processing
- States: PENDING → IN_PROGRESS → COMPLETED/FAILED/CANCELLED
- Includes progress tracking (0-100%) and current step description

### 2. **Background Worker** (`src/services/generationWorker/index.ts`)
- `processGenerationJob(jobId)`: Processes a job asynchronously in the background script
- Updates job status and progress throughout the generation lifecycle
- Handles errors gracefully with detailed error messages
- `queueGenerationJob(job)`: Queues a new job for processing
- `cancelGenerationJob(jobId)`: Cancels an in-progress or pending job

### 3. **Storage Service Updates**
Added methods to `BrowserStorageService`:
- `saveGenerationJob(job)`: Persists job state
- `loadGenerationJob(id)`: Retrieves a specific job
- `listGenerationJobs(profileId?)`: Lists all jobs, optionally filtered by profile
- `deleteGenerationJob(id)`: Removes completed/failed jobs

### 4. **Background Script Integration** (`src/background.ts`)
- Listens for `START_GENERATION_JOB` messages
- Triggers `processGenerationJob()` for queued jobs
- Runs generation in background without blocking popup

### 5. **UI Components**

#### **GenerationJobsPanel** (`src/components/generation/GenerationJobsPanel.tsx`)
A new panel component that displays:
- All generation jobs (pending, in-progress, completed, failed)
- Real-time progress bars for active jobs
- Status icons and color-coded job cards
- "View Cover Letter" button for completed jobs
- "Delete" button for finished jobs
- Auto-refreshes every 2 seconds when active jobs exist

#### **Updated CoverLetterWorkflow**
- Added toggle for async vs synchronous generation
- Integrated GenerationJobsPanel at the top
- Queues jobs to background when async mode is enabled
- Allows viewing completed cover letters from the jobs panel

## User Flow

### Async Mode (Default)
1. User fills in job details and optionally adds custom instructions
2. User checks "Generate in background" checkbox (enabled by default)
3. User clicks "Generate Cover Letter"
4. Job is created and queued immediately
5. Background script processes the job asynchronously
6. User sees progress in the Generation Jobs panel
7. When complete, user can click "View Cover Letter" to see results

### Synchronous Mode (Optional)
1. User unchecks "Generate in background"
2. User clicks "Generate Cover Letter"
3. UI blocks until generation completes
4. Cover letter displays immediately upon completion

## Benefits

1. **Non-blocking UI**: Users can continue browsing or queue multiple jobs
2. **Progress Tracking**: Real-time visibility into generation status
3. **Job Management**: View, track, and manage multiple generation requests
4. **Error Handling**: Clear error messages for failed jobs
5. **Flexibility**: Toggle between async and sync modes based on preference

## Key Features

- **Progress Indicators**: Visual progress bars with step descriptions
- **Status Icons**: Quick visual identification of job states
  - ⏳ Pending
  - ⚙️ In Progress
  - ✅ Completed
  - ❌ Failed
  - 🚫 Cancelled
- **Auto-refresh**: Panel updates every 2 seconds when jobs are active
- **Time Stamps**: Relative time display (e.g., "5m ago", "2h ago")
- **Cleanup**: Delete completed/failed jobs to keep panel organized

## Technical Details

### Storage Schema
```typescript
interface GenerationJob {
  id: string;
  profileId: string;
  jobId: string;
  company: string;
  position: string;
  profile: UserProfile;        // Full data for background processing
  jobDetails: JobDetails;      // Full data for background processing
  status: GenerationJobStatus;
  config: GenerationJobConfig;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  coverLetterId?: string;
  error?: string;
  progress?: number;
  currentStep?: string;
}
```

### Message Protocol
```typescript
// Message sent from popup to background
{
  type: 'START_GENERATION_JOB',
  payload: { jobId: string }
}

// Response
{
  success: boolean,
  jobId: string
}
```

## Future Enhancements

1. **Job Cancellation**: Add UI button to cancel in-progress jobs
2. **Batch Processing**: Queue multiple jobs at once
3. **Retry Failed Jobs**: One-click retry for failed generations
4. **Job History**: Keep completed jobs for longer with archive feature
5. **Notifications**: Browser notifications when jobs complete
6. **Priority Queue**: Allow users to prioritize certain jobs
7. **Export Job Results**: Bulk export of multiple cover letters

## Migration Notes

- Existing synchronous generation flow remains fully functional
- New async mode is opt-in via checkbox
- No breaking changes to existing APIs
- Storage service extended with backward compatibility
