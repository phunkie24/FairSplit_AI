import { Guardrail, ValidationResult } from '@/agents/base/Agent';
import { security } from '@/security/SecurityLayer';
import { z, ZodSchema } from 'zod';

/**
 * Content Safety Guardrail
 * Checks for harmful or inappropriate content
 */
export class ContentGuardrail implements Guardrail {
  name = 'ContentSafety';

  async validate(input: any): Promise<ValidationResult> {
    // Extract text content from input
    const text = this.extractText(input);
    
    if (!text) {
      return { valid: true };
    }

    // Check for prompt injection
    if (security.detectPromptInjection(text)) {
      return {
        valid: false,
        reason: 'Potential prompt injection detected',
      };
    }

    // Check content safety using OpenAI
    const safetyCheck = await security.checkContentSafety(text);
    
    return safetyCheck;
  }

  private extractText(input: any): string {
    if (typeof input === 'string') {
      return input;
    }

    if (typeof input === 'object' && input !== null) {
      const texts: string[] = [];
      
      for (const value of Object.values(input)) {
        if (typeof value === 'string') {
          texts.push(value);
        }
      }
      
      return texts.join(' ');
    }

    return '';
  }
}

/**
 * PII Detection Guardrail
 * Prevents processing of personally identifiable information
 */
export class PIIGuardrail implements Guardrail {
  name = 'PIIDetection';

  async validate(input: any): Promise<ValidationResult> {
    const text = JSON.stringify(input);
    const piiResult = await security.detectPII(text);

    if (piiResult.hasPII) {
      return {
        valid: false,
        reason: 'Input contains personally identifiable information (PII)',
        details: {
          types: piiResult.types,
          message: 'Remove sensitive data before processing',
        },
      };
    }

    return { valid: true };
  }
}

/**
 * Schema Validation Guardrail
 * Validates input against a Zod schema
 */
export class SchemaGuardrail implements Guardrail {
  name = 'SchemaValidation';

  constructor(private schema: ZodSchema, private schemaName: string = 'input') {
    this.name = `SchemaValidation:${schemaName}`;
  }

  async validate(input: any): Promise<ValidationResult> {
    try {
      this.schema.parse(input);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          reason: `Invalid ${this.schemaName} format`,
          details: error.errors,
        };
      }

      return {
        valid: false,
        reason: 'Validation failed',
      };
    }
  }
}

/**
 * Business Logic Guardrail
 * Enforces business rules
 */
export class BusinessLogicGuardrail implements Guardrail {
  name = 'BusinessLogic';

  async validate(input: any): Promise<ValidationResult> {
    // Check amount limits
    if (input.amount !== undefined) {
      const amountCheck = security.validateAmount(input.amount);
      if (!amountCheck.valid) {
        return amountCheck;
      }
    }

    // Check array sizes
    if (input.debts && Array.isArray(input.debts)) {
      if (input.debts.length === 0) {
        return {
          valid: false,
          reason: 'At least one debt is required',
        };
      }

      if (input.debts.length > 1000) {
        return {
          valid: false,
          reason: 'Too many debts (max 1000)',
        };
      }
    }

    // Check receipt data
    if (input.total !== undefined && input.items) {
      const warnings = security.detectSuspiciousReceipt(input);
      
      if (warnings.length > 0) {
        console.warn('[BusinessLogicGuardrail] Warnings:', warnings);
        // Allow but log warnings
      }
    }

    return { valid: true };
  }
}

/**
 * Output Validation Guardrail
 * Ensures AI outputs are safe and valid
 */
export class OutputGuardrail implements Guardrail {
  name = 'OutputValidation';

  async validate(output: any): Promise<ValidationResult> {
    if (!output || typeof output !== 'object') {
      return {
        valid: false,
        reason: 'Invalid output structure',
      };
    }

    // Check for data leakage
    const outputText = JSON.stringify(output);
    const piiResult = await security.detectPII(outputText);

    if (piiResult.hasPII) {
      return {
        valid: false,
        reason: 'Output contains PII - potential data leakage',
        details: { types: piiResult.types },
      };
    }

    // Check for injection attempts in output
    if (security.detectPromptInjection(outputText)) {
      return {
        valid: false,
        reason: 'Output contains suspicious patterns',
      };
    }

    // Validate numeric outputs
    if (output.amount !== undefined) {
      if (!Number.isFinite(output.amount) || output.amount < 0) {
        return {
          valid: false,
          reason: 'Invalid amount in output',
        };
      }
    }

    return { valid: true };
  }
}

/**
 * Rate Limit Guardrail
 * Prevents abuse through rate limiting
 */
export class RateLimitGuardrail implements Guardrail {
  name = 'RateLimit';
  private requests = new Map<string, number[]>();

  constructor(
    private maxRequests: number = 30,
    private windowMs: number = 60000 // 1 minute
  ) {}

  async validate(input: any): Promise<ValidationResult> {
    const identifier = input.userId || input.ipAddress || 'anonymous';
    const now = Date.now();

    // Get request history
    const history = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validHistory = history.filter(timestamp => now - timestamp < this.windowMs);
    
    // Check if limit exceeded
    if (validHistory.length >= this.maxRequests) {
      return {
        valid: false,
        reason: `Rate limit exceeded. Maximum ${this.maxRequests} requests per ${this.windowMs / 1000} seconds`,
        details: {
          remaining: 0,
          resetAt: new Date(validHistory[0] + this.windowMs),
        },
      };
    }

    // Add current request
    validHistory.push(now);
    this.requests.set(identifier, validHistory);

    return { 
      valid: true,
      details: {
        remaining: this.maxRequests - validHistory.length,
      },
    };
  }
}

/**
 * Timeout Guardrail
 * Ensures operations complete within time limits
 */
export class TimeoutGuardrail implements Guardrail {
  name = 'Timeout';

  constructor(private timeoutMs: number = 30000) {} // 30 seconds default

  async validate(input: any): Promise<ValidationResult> {
    // This guardrail doesn't validate input
    // It's used by wrapping execution with timeout
    return { valid: true };
  }

  /**
   * Wrap a promise with timeout
   */
  async withTimeout<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), this.timeoutMs)
      ),
    ]);
  }
}

// Export commonly used guardrail combinations
export const createStandardGuardrails = (): Guardrail[] => [
  new ContentGuardrail(),
  new BusinessLogicGuardrail(),
];

export const createStrictGuardrails = (): Guardrail[] => [
  new ContentGuardrail(),
  new PIIGuardrail(),
  new BusinessLogicGuardrail(),
  new OutputGuardrail(),
];
