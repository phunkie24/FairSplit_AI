import { prisma } from '@/lib/db';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  details?: any;
}

export interface Guardrail {
  name: string;
  validate(input: any): Promise<ValidationResult>;
}

export interface AgentExecutionMetrics {
  agentName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
  inputSize?: number;
  outputSize?: number;
}

export abstract class BaseAgent<TInput = any, TOutput = any> {
  protected name: string;
  protected guardrails: Guardrail[] = [];
  
  constructor(name: string) {
    this.name = name;
  }

  /**
   * Main execution method - must be implemented by subclasses
   */
  protected abstract execute(input: TInput): Promise<TOutput>;

  /**
   * Run the agent with guardrails and monitoring
   */
  async run(input: TInput, userId?: string): Promise<TOutput> {
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;
    let result: TOutput | undefined;

    try {
      // Pre-execution validation
      await this.validateInput(input);

      // Execute the agent
      result = await this.execute(input);

      // Post-execution validation
      await this.validateOutput(result);

      success = true;
      return result;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      console.error(`[${this.name}] Error:`, error);
      throw err;
    } finally {
      // Log metrics
      const endTime = Date.now();
      const metrics: AgentExecutionMetrics = {
        agentName: this.name,
        startTime,
        endTime,
        duration: endTime - startTime,
        success,
        error,
        inputSize: JSON.stringify(input).length,
        outputSize: result ? JSON.stringify(result).length : 0,
      };

      await this.logExecution(metrics, userId);
    }
  }

  /**
   * Add a guardrail to this agent
   */
  addGuardrail(guardrail: Guardrail): void {
    this.guardrails.push(guardrail);
  }

  /**
   * Validate input against all guardrails
   */
  protected async validateInput(input: TInput): Promise<void> {
    for (const guardrail of this.guardrails) {
      const result = await guardrail.validate(input);
      if (!result.valid) {
        throw new Error(`Input validation failed [${guardrail.name}]: ${result.reason}`);
      }
    }
  }

  /**
   * Validate output (can be overridden)
   */
  protected async validateOutput(output: TOutput): Promise<void> {
    // Default: no validation
    // Subclasses can override
  }

  /**
   * Log execution metrics
   */
  private async logExecution(metrics: AgentExecutionMetrics, userId?: string): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: `agent_execution_${this.name}`,
          resource: 'agents',
          metadata: metrics as any,
          success: metrics.success,
          errorMessage: metrics.error,
        },
      });
    } catch (err) {
      // Don't throw if logging fails
      console.error('Failed to log agent execution:', err);
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    initialDelayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts) {
          const delay = initialDelayMs * Math.pow(2, attempt - 1);
          console.log(`[${this.name}] Retry ${attempt}/${maxAttempts} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}
