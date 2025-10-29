/**
 * Error types for PDF service operations
 */
export class GenerationError extends Error {
  constructor(
    message: string,
    public readonly code: GenerationErrorCode,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'GenerationError';
  }
}

export enum GenerationErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GENERATION_FAILED = 'GENERATION_FAILED',
  UNKNOWN = 'UNKNOWN',
}
