import { BaseAgent } from './base/Agent';
import { aiClient, getVisionModel } from '@/lib/openai';
import { getCached, setCached } from '@/lib/redis';
import { generateHash } from '@/lib/utils';
import { z } from 'zod';

// Zod schema for receipt data validation
export const ReceiptDataSchema = z.object({
  merchant: z.string().optional(),
  total: z.number().positive(),
  date: z.string(),
  currency: z.string().default('USD'),
  items: z.array(
    z.object({
      name: z.string(),
      price: z.number(),
      quantity: z.number().int().positive().default(1),
      category: z.string().optional(),
    })
  ).optional(),
  tax: z.number().optional(),
  tip: z.number().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type ReceiptData = z.infer<typeof ReceiptDataSchema>;

export interface ReceiptScanInput {
  imageUrl: string;
  useCache?: boolean;
}

export interface ReceiptScanOutput extends ReceiptData {
  rawResponse: string;
  processingTime: number;
  cached: boolean;
}

const RECEIPT_EXTRACTION_PROMPT = `You are a precise receipt parser. Analyze the receipt image and extract the following information:

1. Merchant name (if visible)
2. Total amount (required)
3. Date of purchase (in ISO 8601 format: YYYY-MM-DD)
4. Currency (default to USD if not specified)
5. Individual items with their names and prices (if itemized)
6. Tax amount (if shown separately)
7. Tip amount (if applicable)

CRITICAL RULES:
- Output ONLY valid JSON, no markdown, no code blocks, no explanations
- Ensure the total matches the sum of items + tax + tip (within small rounding tolerance)
- Use standardized date format (YYYY-MM-DD)
- If you cannot read something clearly, omit it rather than guessing
- For items, extract as many as visible
- Set confidence score (0-1) based on image quality

Example output format:
{
  "merchant": "Olive Garden",
  "total": 87.45,
  "date": "2024-12-20",
  "currency": "USD",
  "items": [
    {"name": "Fettuccine Alfredo", "price": 18.99, "quantity": 1},
    {"name": "Caesar Salad", "price": 9.99, "quantity": 1}
  ],
  "tax": 4.50,
  "tip": 15.00,
  "confidence": 0.95
}`;

export class ReceiptScannerAgent extends BaseAgent<ReceiptScanInput, ReceiptScanOutput> {
  constructor() {
    super('ReceiptScanner');
  }

  protected async execute(input: ReceiptScanInput): Promise<ReceiptScanOutput> {
    const startTime = Date.now();
    const { imageUrl, useCache = true } = input;

    // Check cache first
    if (useCache) {
      const cacheKey = `receipt:${generateHash(imageUrl)}`;
      const cached = await getCached<ReceiptScanOutput>(cacheKey);
      
      if (cached) {
        console.log(`[${this.name}] Cache hit for ${imageUrl}`);
        return { ...cached, cached: true };
      }
    }

    // Call GPT-4 Vision with retry logic
    const result = await this.retryWithBackoff(async () => {
      return await this.extractReceiptData(imageUrl);
    }, 3, 1000);

    // Validate the result
    const validated = ReceiptDataSchema.parse(result);

    // Prepare output
    const output: ReceiptScanOutput = {
      ...validated,
      rawResponse: JSON.stringify(result),
      processingTime: Date.now() - startTime,
      cached: false,
    };

    // Cache the result for 7 days
    if (useCache) {
      const cacheKey = `receipt:${generateHash(imageUrl)}`;
      await setCached(cacheKey, output, 7 * 24 * 60 * 60);
    }

    return output;
  }

  /**
   * Extract receipt data using Vision AI (OpenAI GPT-4o or Ollama LLaVA)
   */
  private async extractReceiptData(imageUrl: string): Promise<ReceiptData> {
    try {
      if (!aiClient) {
        throw new Error('No AI client configured. Set OPENAI_API_KEY or configure Ollama.');
      }

      const visionModel = getVisionModel();
      console.log(`[ReceiptScanner] Using model: ${visionModel}`);

      const response = await aiClient.chat.completions.create({
        model: visionModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: RECEIPT_EXTRACTION_PROMPT,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high', // Use high detail for better OCR
                },
              },
            ],
          },
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from GPT-4 Vision');
      }

      // Parse JSON response (remove markdown if present)
      const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return parsed;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Receipt extraction failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate output to ensure data integrity
   */
  protected async validateOutput(output: ReceiptScanOutput): Promise<void> {
    // Check if total matches items + tax + tip
    if (output.items && output.items.length > 0) {
      const itemsTotal = output.items.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0);

      const calculatedTotal = itemsTotal + (output.tax || 0) + (output.tip || 0);
      const difference = Math.abs(output.total - calculatedTotal);

      // Allow 5% tolerance for rounding errors
      const tolerance = output.total * 0.05;

      if (difference > tolerance) {
        console.warn(
          `[${this.name}] Total mismatch: Receipt shows ${output.total}, ` +
          `calculated ${calculatedTotal.toFixed(2)} (difference: ${difference.toFixed(2)})`
        );
      }
    }

    // Ensure date is valid
    const date = new Date(output.date);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${output.date}`);
    }

    // Ensure date is not in the future
    if (date > new Date()) {
      console.warn(`[${this.name}] Receipt date is in the future: ${output.date}`);
    }
  }

  /**
   * Self-consistency check by running extraction multiple times
   */
  async extractWithConsistency(
    imageUrl: string,
    runs: number = 3
  ): Promise<ReceiptScanOutput> {
    const results = await Promise.all(
      Array(runs)
        .fill(null)
        .map(() => this.execute({ imageUrl, useCache: false }))
    );

    // Use majority voting for each field
    const consensus = this.findConsensus(results);
    
    return consensus;
  }

  /**
   * Find consensus across multiple extractions
   */
  private findConsensus(results: ReceiptScanOutput[]): ReceiptScanOutput {
    // For now, return the result with highest confidence
    // TODO: Implement proper majority voting
    return results.reduce((best, current) => {
      const bestConf = best.confidence || 0;
      const currentConf = current.confidence || 0;
      return currentConf > bestConf ? current : best;
    });
  }
}
