/**
 * Rate Limiter for LLM requests
 * Implements token bucket algorithm to prevent API abuse
 * Max 10 requests per minute
 */

interface RequestRecord {
  timestamp: number;
}

export class RateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private requests: RequestRecord[] = [];

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request can be made
   * @returns true if request is allowed, false if rate limited
   */
  canMakeRequest(): boolean {
    this.cleanupOldRequests();
    return this.requests.length < this.maxRequests;
  }

  /**
   * Record a request being made
   * @throws Error if rate limit exceeded
   */
  recordRequest(): void {
    this.cleanupOldRequests();
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = Math.ceil((oldestRequest.timestamp + this.windowMs - Date.now()) / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
    }

    this.requests.push({ timestamp: Date.now() });
  }

  /**
   * Get remaining requests in current window
   */
  getRemainingRequests(): number {
    this.cleanupOldRequests();
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * Get time until next request is available (in ms)
   */
  getTimeUntilNextRequest(): number {
    this.cleanupOldRequests();
    
    if (this.requests.length < this.maxRequests) {
      return 0;
    }

    const oldestRequest = this.requests[0];
    return Math.max(0, oldestRequest.timestamp + this.windowMs - Date.now());
  }

  /**
   * Remove requests outside the current time window
   */
  private cleanupOldRequests(): void {
    const now = Date.now();
    this.requests = this.requests.filter(
      (record) => now - record.timestamp < this.windowMs
    );
  }

  /**
   * Reset the rate limiter (useful for testing)
   */
  reset(): void {
    this.requests = [];
  }
}

// Singleton instance for global rate limiting
export const globalRateLimiter = new RateLimiter(10, 60000);
