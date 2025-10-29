import { JobExtractor } from '.';

/**
 * Registry for managing job extractors
 * Finds the appropriate extractor for a given URL
 */
export class ExtractorRegistry {
  private extractors: Map<string, JobExtractor> = new Map();

  /**
   * Register an extractor
   * @param extractor The extractor to register
   */
  register(extractor: JobExtractor): void {
    this.extractors.set(extractor.id, extractor);
  }

  /**
   * Get extractor by ID
   * @param id Extractor ID
   * @returns The extractor or undefined if not found
   */
  get(id: string): JobExtractor | undefined {
    return this.extractors.get(id);
  }

  /**
   * Find appropriate extractor for URL
   * @param url The URL to check
   * @returns The first matching extractor, or manual extractor as fallback
   */
  findExtractor(url: string): JobExtractor | undefined {
    // Try to find a matching extractor
    for (const extractor of this.extractors.values()) {
      if (extractor.canExtract(url)) {
        return extractor;
      }
    }

    // Return manual extractor as fallback
    return this.extractors.get('manual');
  }

  /**
   * Get all registered extractors
   * @returns Array of all extractors
   */
  getAll(): JobExtractor[] {
    return Array.from(this.extractors.values());
  }

  /**
   * Check if registry has any extractors
   */
  isEmpty(): boolean {
    return this.extractors.size === 0;
  }
}
