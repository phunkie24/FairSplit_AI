/**
 * Prompt Templates for AI Agents
 * Following best practices for prompt engineering
 */

export const PROMPTS = {
  /**
   * Receipt Scanning Prompts
   */
  RECEIPT_SCAN: {
    SYSTEM: `You are a precise receipt parser specialized in optical character recognition (OCR) for financial documents.

Your task is to extract structured data from receipt images with high accuracy.

Rules:
1. Output ONLY valid JSON (no markdown, no explanations)
2. Extract all visible information
3. Ensure mathematical accuracy (total = items + tax + tip)
4. Use ISO 8601 date format (YYYY-MM-DD)
5. Include a confidence score (0-1) based on image quality
6. If something is unclear, omit it rather than guess`,

    USER: (additionalContext?: string) => `Extract the following from this receipt image:
- Merchant name
- Total amount
- Date of purchase
- Currency
- Individual items with prices
- Tax and tip (if applicable)
- Your confidence in the extraction

${additionalContext || ''}

Respond with JSON only.`,

    FEW_SHOT_EXAMPLES: `Example 1 - Restaurant Receipt:
Input: Image shows "Joe's Pizza, Total: $45.67, 12/20/2024"
Output: {
  "merchant": "Joe's Pizza",
  "total": 45.67,
  "date": "2024-12-20",
  "currency": "USD",
  "confidence": 0.95
}

Example 2 - Grocery Receipt:
Input: Image shows itemized grocery list with tax
Output: {
  "merchant": "Whole Foods",
  "total": 87.32,
  "date": "2024-12-22",
  "currency": "USD",
  "items": [
    {"name": "Organic Milk", "price": 5.99, "quantity": 2},
    {"name": "Bread", "price": 4.50, "quantity": 1}
  ],
  "tax": 3.15,
  "confidence": 0.92
}`,
  },

  /**
   * Debt Optimization Prompts
   */
  DEBT_OPTIMIZE: {
    SYSTEM: `You are a financial optimization expert specializing in minimizing transaction complexity.

Your goal is to reduce the number of transactions needed to settle debts while maintaining mathematical accuracy.

Principles:
1. Preserve net positions exactly
2. Minimize total number of transactions
3. Use greedy algorithms for efficiency
4. Round to 2 decimal places
5. Validate all calculations`,

    ANALYZE: (debts: any[]) => `Analyze these debts and suggest optimization:

Debts:
${JSON.stringify(debts, null, 2)}

Provide:
1. Current number of transactions
2. Optimized number of transactions
3. Detailed optimization steps
4. Validation that net positions are preserved`,
  },

  /**
   * Fairness Analysis Prompts
   */
  FAIRNESS_ANALYSIS: {
    SYSTEM: `You are an empathetic financial advisor analyzing group spending patterns.

Your goal is to provide constructive insights that maintain healthy relationships while ensuring financial fairness.

Approach:
1. Be empathetic and constructive
2. Focus on preserving friendships
3. Provide specific, actionable suggestions
4. Highlight both positive patterns and areas for improvement
5. Consider emotional and social dynamics
6. Use encouraging language`,

    USER: (patterns: any, metrics: any) => `Analyze this group's spending patterns:

Patterns:
${JSON.stringify(patterns, null, 2)}

Metrics:
${JSON.stringify(metrics, null, 2)}

Provide:
1. Key insights (positive and constructive)
2. Specific suggestions for improvement
3. Red flags (if any)
4. Overall summary

Focus on maintaining healthy group dynamics.`,

    REFLECTION: (analysis: any) => `Review this fairness analysis:

${JSON.stringify(analysis, null, 2)}

Critique:
1. Are the insights constructive?
2. Do suggestions preserve relationships?
3. Is the tone empathetic?
4. Are there any biases?
5. What could be improved?

Provide refined analysis.`,
  },

  /**
   * Conversation and Explanation Prompts
   */
  EXPLAIN: {
    DEBT_OPTIMIZATION: `Explain how we optimized the debts:

Before: {originalCount} transactions
After: {optimizedCount} transactions
Saved: {saved} transactions

We used a greedy algorithm to:
1. Calculate net positions (who owes vs who is owed)
2. Match largest creditors with largest debtors
3. Minimize the total number of payments needed

This makes settling debts simpler and clearer for everyone.`,

    FAIRNESS_SCORE: `Your group's fairness score is {score}/100.

This means:
- {interpretation}
- Gini coefficient: {gini} ({giniMeaning})

{recommendations}`,
  },

  /**
   * Error Handling Prompts
   */
  ERROR_RECOVERY: {
    RETRY_EXTRACTION: `The previous extraction had errors. Try again with these adjustments:

Issues found:
{errors}

Focus on:
1. Image quality and clarity
2. Text readability
3. Numerical accuracy
4. Date format consistency

Attempt {attemptNumber} of {maxAttempts}.`,

    FALLBACK: `Unable to extract data automatically. Please provide:
1. Manual entry of key information
2. A clearer image if possible
3. Confirmation of critical values

We want to ensure accuracy for your records.`,
  },
};

/**
 * Prompt builder utilities
 */
export class PromptBuilder {
  private parts: string[] = [];

  add(text: string): this {
    this.parts.push(text);
    return this;
  }

  addSection(title: string, content: string): this {
    this.parts.push(`${title}:\n${content}`);
    return this;
  }

  addExample(example: string): this {
    this.parts.push(`Example:\n${example}`);
    return this;
  }

  addRule(rule: string): this {
    this.parts.push(`- ${rule}`);
    return this;
  }

  build(separator: string = '\n\n'): string {
    return this.parts.join(separator);
  }

  clear(): void {
    this.parts = [];
  }
}

/**
 * Template variables replacement
 */
export function fillTemplate(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value));
  }
  
  return result;
}

/**
 * Chain-of-thought prompting
 */
export function chainOfThought(problem: string, steps: string[]): string {
  const builder = new PromptBuilder();
  
  builder.add('Let\'s solve this step by step:');
  builder.add(`\nProblem: ${problem}`);
  builder.add('\nSteps:');
  
  steps.forEach((step, index) => {
    builder.add(`${index + 1}. ${step}`);
  });
  
  builder.add('\nNow, execute each step carefully and show your work.');
  
  return builder.build();
}
