/**
 * Background Generation Worker
 * Handles async cover letter generation in the background script
 */

import { GenerationJob, GenerationJobStatus, updateJobStatus } from '../../models/GenerationJob';
import { UserProfile } from '../../models/UserProfile';
import { JobDetails } from '../../models/JobDetails';
import { BrowserStorageService } from '../../infra/storage';
import { generateCoverLetter } from '../coverLetterGeneration';
import { llmRegistry } from '../../infra/llm';
import { LLMProviderEnum } from '../../models/CoverLetterContent';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GenerationWorker');
const storageService = new BrowserStorageService();

/**
 * Start processing a generation job in the background
 */
export async function processGenerationJob(jobId: string): Promise<void> {
  console.log('[GenerationWorker] Starting generation job:', jobId);
  logger.info('Starting generation job', { jobId });
  
  try {
    // Load the job
    console.log('[GenerationWorker] Loading job from storage...');
    let job = await storageService.loadGenerationJob(jobId);
    if (!job) {
      console.error('[GenerationWorker] Job not found:', jobId);
      logger.error('Job not found', undefined, { jobId });
      return;
    }
    console.log('[GenerationWorker] Job loaded:', job);

    // Update status to in progress
    console.log('[GenerationWorker] Updating job status to IN_PROGRESS');
    job = updateJobStatus(job, GenerationJobStatus.IN_PROGRESS, {
      progress: 10,
      currentStep: 'Loading configuration...',
    });
    await storageService.saveGenerationJob(job);
    console.log('[GenerationWorker] Job status updated');

    // Load provider config
    console.log('[GenerationWorker] Loading provider config...');
    const providerConfig = await storageService.loadProviderConfig();
    if (!providerConfig) {
      console.error('[GenerationWorker] Provider config not found');
      job = updateJobStatus(job, GenerationJobStatus.FAILED, {
        error: 'LLM provider not configured',
      });
      await storageService.saveGenerationJob(job);
      return;
    }
    console.log('[GenerationWorker] Provider config loaded:', providerConfig);

    job = updateJobStatus(job, GenerationJobStatus.IN_PROGRESS, {
      progress: 30,
      currentStep: 'Preparing generation request...',
    });
    await storageService.saveGenerationJob(job);

    // Get LLM provider
    const providerId = providerConfig.providerId === LLMProviderEnum.OLLAMA ? 'ollama' : 'gemini';
    const provider = llmRegistry.get(providerId);
    console.log('[GenerationWorker] Using provider:', providerId);

    // Configure the provider with the API key/endpoint from config
    console.log('[GenerationWorker] Configuring provider...');
    if (providerId === 'gemini') {
      const geminiProvider = provider as any; // Cast to access setApiKey
      if (geminiProvider.setApiKey && providerConfig.apiKey) {
        geminiProvider.setApiKey(providerConfig.apiKey);
        console.log('[GenerationWorker] Gemini API key configured');
      } else {
        console.error('[GenerationWorker] No API key in provider config!');
        job = updateJobStatus(job, GenerationJobStatus.FAILED, {
          error: 'Gemini API key not found in configuration',
        });
        await storageService.saveGenerationJob(job);
        return;
      }
    } else if (providerId === 'ollama') {
      const ollamaProvider = provider as any;
      if (ollamaProvider.setEndpoint && providerConfig.endpoint) {
        ollamaProvider.setEndpoint(providerConfig.endpoint);
        console.log('[GenerationWorker] Ollama endpoint configured:', providerConfig.endpoint);
      }
    }

    job = updateJobStatus(job, GenerationJobStatus.IN_PROGRESS, {
      progress: 50,
      currentStep: 'Generating cover letter...',
    });
    await storageService.saveGenerationJob(job);

    // Generate cover letter
    console.log('[GenerationWorker] Starting cover letter generation...');
    const result = await generateCoverLetter(
      provider,
      job.profile,
      job.jobDetails,
      {
        instructions: job.config.instructions,
        saveToStorage: true,
        model: job.config.model || providerConfig.model,
        temperature: job.config.temperature ?? providerConfig.temperature,
        maxTokens: job.config.maxTokens ?? providerConfig.maxTokens,
      }
    );

    if (!result.success) {
      console.error('[GenerationWorker] Generation failed:', result.error);
      job = updateJobStatus(job, GenerationJobStatus.FAILED, {
        error: result.error || 'Generation failed',
      });
      await storageService.saveGenerationJob(job);
      return;
    }

    // Update job with success
    console.log('[GenerationWorker] Generation successful, updating job...');
    job = updateJobStatus(job, GenerationJobStatus.COMPLETED, {
      progress: 100,
      coverLetterId: result.content!.id,
      currentStep: 'Completed',
    });
    await storageService.saveGenerationJob(job);

    console.log('[GenerationWorker] Job completed successfully:', jobId, result.content!.id);
    logger.info('Generation job completed successfully', { jobId, coverLetterId: result.content!.id });
    
  } catch (error) {
    console.error('[GenerationWorker] Error processing job:', error);
    logger.error('Failed to process generation job', error as Error, { jobId });
    
    const job = await storageService.loadGenerationJob(jobId);
    if (job) {
      const updatedJob = updateJobStatus(job, GenerationJobStatus.FAILED, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      await storageService.saveGenerationJob(updatedJob);
    }
  }
}

/**
 * Queue a new generation job
 */
export async function queueGenerationJob(job: GenerationJob): Promise<void> {
  logger.info('Queueing generation job', { jobId: job.id, company: job.company, position: job.position });
  
  // Save the job
  await storageService.saveGenerationJob(job);
  
  // Trigger background processing
  // This will be called from the background script
}

/**
 * Cancel a generation job
 */
export async function cancelGenerationJob(jobId: string): Promise<void> {
  logger.info('Cancelling generation job', { jobId });
  
  const job = await storageService.loadGenerationJob(jobId);
  if (!job) {
    logger.warn('Job not found for cancellation', { jobId });
    return;
  }

  if (job.status === GenerationJobStatus.COMPLETED || job.status === GenerationJobStatus.FAILED) {
    logger.warn('Cannot cancel completed or failed job', { jobId, status: job.status });
    return;
  }

  const updatedJob = updateJobStatus(job, GenerationJobStatus.CANCELLED);
  await storageService.saveGenerationJob(updatedJob);
}
