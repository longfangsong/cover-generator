/**
 * Utility formatters for dates, text, and other common formatting needs
 */

/**
 * Format a date to a readable string (e.g., "Jan 2020")
 */
export function formatDate(date: Date | undefined, includeCurrent = true): string {
  if (!date) {
    return includeCurrent ? 'Present' : '';
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
  };

  return date.toLocaleDateString('en-US', options);
}

/**
 * Format a date range (e.g., "Jan 2020 - Present" or "Jan 2020 - Dec 2023")
 */
export function formatDateRange(startDate: Date, endDate?: Date): string {
  const start = formatDate(startDate, false);
  const end = formatDate(endDate, true);
  return `${start} - ${end}`;
}

/**
 * Count words in a string (split on whitespace, count non-empty)
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Truncate text to a maximum word count
 */
export function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }
  return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Truncate text to a maximum character count
 */
export function truncateChars(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return text.slice(0, maxChars - 3) + '...';
}

/**
 * Format a list of strings with proper grammar (e.g., "A, B, and C")
 */
export function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  
  const allButLast = items.slice(0, -1).join(', ');
  const last = items[items.length - 1];
  return `${allButLast}, and ${last}`;
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Generate a filename-safe string from a company name and date
 * Format: CoverLetter_[CompanyName]_[Date].pdf
 */
export function generateFilename(companyName: string, extension = 'pdf'): string {
  // Remove special characters and spaces, replace with underscores
  const safeName = companyName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `CoverLetter_${safeName}_${date}.${extension}`;
}

/**
 * Format a phone number for display (basic formatting)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // Return as-is for other formats
  return phone;
}

/**
 * Format an email for display (lowercase)
 */
export function formatEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Format a duration in months (e.g., "2 years 3 months")
 */
export function formatDuration(startDate: Date, endDate?: Date): string {
  const end = endDate || new Date();
  const months = (end.getFullYear() - startDate.getFullYear()) * 12 +
    (end.getMonth() - startDate.getMonth());
  
  if (months < 1) {
    return 'Less than 1 month';
  }
  
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} year${years > 1 ? 's' : ''}`);
  }
  if (remainingMonths > 0) {
    parts.push(`${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`);
  }
  
  return parts.join(' ');
}

