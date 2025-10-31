/**
 * Background Generation Worker
 * Handles async cover letter generation in the background script
 */

import { UserProfile } from '../../models/userProfile';
import { JobDetails } from '../../models/jobDetails';
import { Task, Status } from '../../models/generationTask';
import { BrowserStorageService, browserStorageService } from '../../infra/storage';
import { LLMProvider, llmRegistry } from '../../infra/llm';
import { CoverLetterContent, CoverLetterState, LLMProviderEnum } from '../../models/coverLetterContent';
import { createLogger } from '../../utils/logger';
import { COVER_LETTER_SCHEMA } from '@/infra/llm/schemas';
import { buildPrompt } from '../coverLetterGeneration/prompt';
import { GenerationOptions, GenerationResult, parseLLMResponse } from '../coverLetterGeneration';
import { wakeupPDFService } from '../pdfExporter';

const logger = createLogger('GenerationWorker');
const storageService = browserStorageService;

/**
 * Generate cover letter using LLM provider
 */
export async function generateCoverLetter(
  provider: LLMProvider,
  profile: UserProfile,
  job: JobDetails,
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  try {
    logger.info('Starting cover letter generation', {
      profileId: profile.id,
      jobId: job.id,
      company: job.company,
      position: job.title,
    });

    // Build prompt
    const prompt = buildPrompt(profile, job, options.instructions);

    // Call LLM with model from options
    const response = await provider.generate({
      prompt,
      model: options.model || 'gemini-2.5-flash', // Use model from options or default
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 8192,
      timeout: 30000,
      responseSchema: COVER_LETTER_SCHEMA, // Use cover letter schema for structured output
    });

    // Parse response
    const sections = parseLLMResponse(response.content);
    if (!sections) {
      logger.error('Failed to parse LLM response', undefined, {
        responseLength: response.content.length,
        model: response.model
      });
      return new Error('Failed to parse cover letter sections from LLM response');
    }

    logger.info('Successfully generated cover letter', {
      profileId: profile.id,
      jobId: job.id,
      model: response.model,
      usage: response.usage,
    });

    // Create cover letter content
    const llmProviderEnum = provider.id === 'ollama' ? LLMProviderEnum.OLLAMA : LLMProviderEnum.GEMINI;

    const coverLetter: CoverLetterContent = {
      id: crypto.randomUUID(),
      profileId: profile.id,
      jobId: job.id,
      position: job.title,
      addressee: sections.addressee,
      opening: sections.opening,
      aboutMe: sections.aboutMe,
      whyMe: sections.whyMe,
      whyCompany: sections.whyCompany,
      generatedAt: new Date(),
      llmProvider: llmProviderEnum,
      llmModel: response.model,
      state: CoverLetterState.GENERATED,
    };

    const storage = new BrowserStorageService();
    await storage.saveCoverLetter(coverLetter);

    return coverLetter;
  } catch (error) {
    logger.error('Failed to generate cover letter', error as Error, {
      profileId: profile.id,
      jobId: job.id,
    });

    let errorMessage = 'An unexpected error occurred during generation.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Error(errorMessage);
  }
}

/**
 * CoverLetterGenerationService
 * Processes generation tasks on-demand when they arrive
 */
export class CoverLetterGenerationService {
  private isProcessing = false;
  private taskQueue: Task[] = [];

  /**
   * Notify the service that a new task has arrived
   * This will start processing if not already processing
   */
  async addToQueue(task: Task): Promise<void> {
    await wakeupPDFService();
    logger.info('New task arrived', {
      taskId: task.id,
      company: task.company,
      position: task.position,
    });

    this.taskQueue.push(task);
    this.processQueue();
  }

  /**
   * Process all tasks in the queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.taskQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        if (task) {
          await this.processTask(task);
        }
      }
    } catch (error) {
      logger.error('Error processing task queue', error as Error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single generation task
   */
  private async processTask(task: Task): Promise<void> {
    try {
      // Mark task as in progress
      const updatedTask: Task = {
        ...task,
        status: Status.IN_PROGRESS,
        startedAt: new Date(),
      };

      await storageService.saveGenerationTask(updatedTask);

      // Get LLM provider
      const providerConfig = await storageService.loadLLMSettings();
      if (!providerConfig) {
        throw new Error('No LLM provider configured');
      }

      const provider = llmRegistry.get(providerConfig.providerId);
      if (!provider) {
        throw new Error(`LLM provider '${providerConfig.providerId}' not found`);
      }

      logger.info('Starting cover letter generation', {
        taskId: task.id,
        provider: providerConfig.providerId,
        model: providerConfig.model,
      });

      // Generate cover letter
      const result = await generateCoverLetter(
        provider,
        task.profile,
        task.jobDetails,
        {
          model: task.config.model || providerConfig.model,
          temperature: task.config.temperature,
          maxTokens: task.config.maxTokens,
          instructions: task.config.instructions,
          saveToStorage: true,
        }
      );

      if (result instanceof Error) {
        throw result;
      }

      // Mark task as completed
      const completedTask: Task = {
        ...updatedTask,
        status: Status.COMPLETED,
        completedAt: new Date(),
        coverLetterId: result.id,
      };

      await storageService.saveGenerationTask(completedTask);

      logger.info('Task completed successfully', {
        taskId: task.id,
        coverLetterId: result.id,
      });
    } catch (error) {
      logger.error('Task processing failed', error as Error, { taskId: task.id });

      // Mark task as failed
      const failedTask: Task = {
        ...task,
        status: Status.FAILED,
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      await storageService.saveGenerationTask(failedTask);
    }
  }
}

/**
 * Singleton instance of the generation service
 */
export const coverLetterGenerationService = new CoverLetterGenerationService();
coverLetterGenerationService.processQueue();