import DOMPurify from 'isomorphic-dompurify';
import { aiClient } from '@/lib/openai';

export interface PIIResult {
  hasPII: boolean;
  types: string[];
  redactedText?: string;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  details?: any;
}

export class SecurityLayer {
  /**
   * Sanitize user input to prevent XSS
   */
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // Strip all HTML tags
        ALLOWED_ATTR: [],
      });
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Detect PII in text
   */
  async detectPII(text: string): Promise<PIIResult> {
    const patterns = {
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b(\+\d{1,2}\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
      ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    };

    const detected: string[] = [];
    let redactedText = text;

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        detected.push(type);
        
        // Redact the matched patterns
        redactedText = redactedText.replace(pattern, match => {
          return '[REDACTED_' + type.toUpperCase() + ']';
        });
      }
    }

    return {
      hasPII: detected.length > 0,
      types: detected,
      redactedText: detected.length > 0 ? redactedText : undefined,
    };
  }

  /**
   * Detect prompt injection attempts
   */
  detectPromptInjection(input: string): boolean {
    const injectionPatterns = [
      /ignore\s+(previous|above|all)\s+instructions?/i,
      /you\s+are\s+now/i,
      /new\s+instructions?:/i,
      /system\s+prompt/i,
      /forget\s+(everything|all)/i,
      /<script>/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers
      /\beval\s*\(/i,
      /\bFunction\s*\(/i,
    ];

    return injectionPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Validate file type and size
   */
  validateFile(
    file: File,
    allowedTypes: string[],
    maxSizeMB: number = 10
  ): ValidationResult {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        reason: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
      };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        reason: `File too large. Maximum size: ${maxSizeMB}MB`,
      };
    }

    // Check for dangerous extensions in filename
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1'];
    const filename = file.name.toLowerCase();
    
    if (dangerousExtensions.some(ext => filename.endsWith(ext))) {
      return {
        valid: false,
        reason: 'Dangerous file extension detected',
      };
    }

    return { valid: true };
  }

  /**
   * Check content safety using OpenAI Moderation API
   */
  async checkContentSafety(content: string): Promise<ValidationResult> {
    try {
      if (!aiClient) {
        // Fallback: skip moderation if no AI client
        return { valid: true };
      }

      const response = await aiClient.moderations.create({
        input: content,
      });

      const result = response.results[0];

      if (result.flagged) {
        const flaggedCategories = Object.entries(result.categories)
          .filter(([_, flagged]) => flagged)
          .map(([category]) => category);

        return {
          valid: false,
          reason: 'Content violates safety policies',
          details: {
            categories: flaggedCategories,
            scores: result.category_scores,
          },
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Content safety check failed:', error);
      // Fail open in case of API errors
      return { valid: true };
    }
  }

  /**
   * Validate amount is reasonable
   */
  validateAmount(amount: number, maxAmount: number = 100000): ValidationResult {
    if (amount < 0) {
      return {
        valid: false,
        reason: 'Amount cannot be negative',
      };
    }

    if (amount > maxAmount) {
      return {
        valid: false,
        reason: `Amount exceeds maximum limit of $${maxAmount.toLocaleString()}`,
      };
    }

    if (!Number.isFinite(amount)) {
      return {
        valid: false,
        reason: 'Invalid amount',
      };
    }

    return { valid: true };
  }

  /**
   * Detect suspicious patterns in receipts
   */
  detectSuspiciousReceipt(receiptData: any): string[] {
    const warnings: string[] = [];

    // Check for unrealistic amounts
    if (receiptData.total > 10000) {
      warnings.push('Unusually high total amount');
    }

    // Check for future dates
    if (receiptData.date) {
      const receiptDate = new Date(receiptData.date);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (receiptDate > tomorrow) {
        warnings.push('Receipt date is in the future');
      }
    }

    // Check for mismatched totals
    if (receiptData.items && receiptData.items.length > 0) {
      const itemsTotal = receiptData.items.reduce(
        (sum: number, item: any) => sum + (item.price * (item.quantity || 1)),
        0
      );
      
      const expectedTotal = itemsTotal + (receiptData.tax || 0) + (receiptData.tip || 0);
      const difference = Math.abs(receiptData.total - expectedTotal);

      if (difference > receiptData.total * 0.1) {
        warnings.push('Total does not match sum of items (>10% difference)');
      }
    }

    return warnings;
  }

  /**
   * Hash sensitive data for logging
   */
  hashSensitiveData(data: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
  }

  /**
   * Redact sensitive fields from objects for logging
   */
  redactForLogging(obj: any, sensitiveFields: string[] = ['password', 'token', 'apiKey']): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const redacted: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactForLogging(value, sensitiveFields);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }
}

// Export singleton instance
export const security = new SecurityLayer();
