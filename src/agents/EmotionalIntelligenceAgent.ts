import { BaseAgent } from './base/Agent';
import { aiClient, MODELS } from '@/lib/openai';
import { calculateGini, roundTo } from '@/lib/utils';

export interface SpendingPattern {
  userId: string;
  userName: string;
  totalPaid: number;
  totalOwed: number;
  netPosition: number; // positive = owed money, negative = owes money
  transactionCount: number;
  avgTransactionSize: number;
}

export interface EmotionalAnalysisInput {
  patterns: SpendingPattern[];
  groupName?: string;
  timeframeDesc?: string; // e.g., "last 30 days"
}

export interface Insight {
  type: 'positive' | 'warning' | 'neutral' | 'suggestion';
  category: 'balance' | 'frequency' | 'amount' | 'general';
  message: string;
  severity?: number; // 1-5 for warnings
}

export interface Suggestion {
  type: 'rotation' | 'settlement' | 'communication' | 'forgiveness';
  priority: 'high' | 'medium' | 'low';
  message: string;
  actionable: boolean;
  targetUser?: string;
}

export interface EmotionalAnalysisOutput {
  fairnessScore: number; // 0-100
  giniCoefficient: number;
  insights: Insight[];
  suggestions: Suggestion[];
  summary: string;
  redFlags: string[];
}

const FAIRNESS_ANALYSIS_PROMPT = `You are an empathetic financial advisor analyzing group spending patterns. Your goal is to maintain healthy relationships while ensuring financial fairness.

Analyze the spending patterns and provide:
1. Key insights about the group's financial dynamics
2. Constructive suggestions to improve balance
3. Warnings about potential issues
4. Positive reinforcement for good practices

Be empathetic, constructive, and specific. Focus on preserving friendships.

Output format:
{
  "insights": [
    {
      "type": "positive|warning|neutral|suggestion",
      "category": "balance|frequency|amount|general",
      "message": "specific insight message",
      "severity": 1-5 (for warnings only)
    }
  ],
  "suggestions": [
    {
      "type": "rotation|settlement|communication|forgiveness",
      "priority": "high|medium|low",
      "message": "specific actionable suggestion",
      "actionable": true|false,
      "targetUser": "userId or null"
    }
  ],
  "summary": "brief overview",
  "redFlags": ["serious issues to address"]
}`;

export class EmotionalIntelligenceAgent extends BaseAgent<
  EmotionalAnalysisInput,
  EmotionalAnalysisOutput
> {
  constructor() {
    super('EmotionalIntelligence');
  }

  protected async execute(input: EmotionalAnalysisInput): Promise<EmotionalAnalysisOutput> {
    const { patterns, groupName = 'the group', timeframeDesc = 'recently' } = input;

    // Calculate metrics
    const metrics = this.calculateMetrics(patterns);

    // Generate AI insights
    const aiAnalysis = await this.generateAIInsights(patterns, metrics, groupName, timeframeDesc);

    // Combine with rule-based insights
    const ruleBasedInsights = this.generateRuleBasedInsights(patterns, metrics);

    // Merge and deduplicate
    const allInsights = [...(aiAnalysis.insights || []), ...ruleBasedInsights];
    const allSuggestions = [...(aiAnalysis.suggestions || [])];

    // Generate summary if not provided
    const summary = aiAnalysis.summary || this.generateSummary(patterns, metrics);

    return {
      fairnessScore: metrics.fairnessScore,
      giniCoefficient: metrics.giniCoefficient,
      insights: allInsights,
      suggestions: allSuggestions,
      summary,
      redFlags: aiAnalysis.redFlags || [],
    };
  }

  /**
   * Calculate fairness metrics
   */
  private calculateMetrics(patterns: SpendingPattern[]) {
    const netPositions = patterns.map(p => Math.abs(p.netPosition));
    const giniCoefficient = calculateGini(netPositions);
    const fairnessScore = roundTo((1 - giniCoefficient) * 100, 1);

    const totalSpent = patterns.reduce((sum, p) => sum + p.totalPaid, 0);
    const avgPerPerson = totalSpent / patterns.length;
    const maxImbalance = Math.max(...netPositions);
    const minImbalance = Math.min(...netPositions);

    // Calculate frequency metrics
    const totalTransactions = patterns.reduce((sum, p) => sum + p.transactionCount, 0);
    const avgTransactionsPerPerson = totalTransactions / patterns.length;

    return {
      giniCoefficient,
      fairnessScore,
      totalSpent,
      avgPerPerson,
      maxImbalance,
      minImbalance,
      totalTransactions,
      avgTransactionsPerPerson,
    };
  }

  /**
   * Generate AI-powered insights using GPT-4
   */
  private async generateAIInsights(
    patterns: SpendingPattern[],
    metrics: any,
    groupName: string,
    timeframeDesc: string
  ): Promise<Partial<EmotionalAnalysisOutput>> {
    try {
      const prompt = this.buildAnalysisPrompt(patterns, metrics, groupName, timeframeDesc);

      if (!aiClient) {
        // Fallback to basic analysis if no AI client
        return { insights: [], suggestions: [] };
      }

      const response = await aiClient.chat.completions.create({
        model: MODELS.GPT4_TURBO,
        messages: [
          {
            role: 'system',
            content: FAIRNESS_ANALYSIS_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from GPT-4');
      }

      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      console.error(`[${this.name}] AI insights failed, using fallback:`, error);
      return {
        insights: [],
        suggestions: [],
        summary: '',
        redFlags: [],
      };
    }
  }

  /**
   * Build the analysis prompt
   */
  private buildAnalysisPrompt(
    patterns: SpendingPattern[],
    metrics: any,
    groupName: string,
    timeframeDesc: string
  ): string {
    const patternsDesc = patterns
      .map(
        p =>
          `- ${p.userName}: Paid $${p.totalPaid.toFixed(2)}, ` +
          `Owes $${p.totalOwed.toFixed(2)}, ` +
          `Net: ${p.netPosition >= 0 ? '+' : ''}$${p.netPosition.toFixed(2)}, ` +
          `${p.transactionCount} transactions`
      )
      .join('\n');

    return `Analyze the spending patterns for "${groupName}" over ${timeframeDesc}:

Spending Patterns:
${patternsDesc}

Group Metrics:
- Total spent: $${metrics.totalSpent.toFixed(2)}
- Average per person: $${metrics.avgPerPerson.toFixed(2)}
- Fairness score: ${metrics.fairnessScore}/100
- Gini coefficient: ${metrics.giniCoefficient.toFixed(4)}
- Maximum imbalance: $${metrics.maxImbalance.toFixed(2)}

Provide insights and suggestions in JSON format.`;
  }

  /**
   * Generate rule-based insights
   */
  private generateRuleBasedInsights(patterns: SpendingPattern[], metrics: any): Insight[] {
    const insights: Insight[] = [];

    // Check for extreme imbalances
    const highPayers = patterns.filter(p => p.totalPaid > metrics.avgPerPerson * 1.5);
    const lowPayers = patterns.filter(p => p.totalPaid < metrics.avgPerPerson * 0.5);

    if (highPayers.length > 0) {
      highPayers.forEach(p => {
        insights.push({
          type: 'warning',
          category: 'balance',
          message: `${p.userName} has paid significantly more than average (${roundTo(
            (p.totalPaid / metrics.avgPerPerson - 1) * 100,
            0
          )}% above average)`,
          severity: 3,
        });
      });
    }

    if (lowPayers.length > 0 && lowPayers.length < patterns.length) {
      lowPayers.forEach(p => {
        insights.push({
          type: 'neutral',
          category: 'balance',
          message: `${p.userName} has paid less than average. Consider rotating who pays next time.`,
        });
      });
    }

    // Check fairness score
    if (metrics.fairnessScore >= 80) {
      insights.push({
        type: 'positive',
        category: 'general',
        message: 'The group maintains excellent spending balance! Keep it up.',
      });
    } else if (metrics.fairnessScore < 60) {
      insights.push({
        type: 'warning',
        category: 'balance',
        message: 'Spending imbalance detected. Consider discussing expense sharing.',
        severity: 4,
      });
    }

    // Check for consistent payer
    const consistentPayer = patterns.find(
      p => p.transactionCount > metrics.avgTransactionsPerPerson * 2
    );
    
    if (consistentPayer) {
      insights.push({
        type: 'suggestion',
        category: 'frequency',
        message: `${consistentPayer.userName} has been paying for most expenses. ` +
          `Consider letting others take turns to keep things balanced.`,
      });
    }

    // Check for unsettled debts
    const largeDebtors = patterns.filter(p => p.netPosition < -50);
    if (largeDebtors.length > 0) {
      largeDebtors.forEach(p => {
        insights.push({
          type: 'warning',
          category: 'amount',
          message: `${p.userName} owes $${Math.abs(p.netPosition).toFixed(2)}. ` +
            `Consider settling soon to avoid accumulation.`,
          severity: 2,
        });
      });
    }

    return insights;
  }

  /**
   * Generate summary
   */
  private generateSummary(patterns: SpendingPattern[], metrics: any): string {
    const fairnessDesc =
      metrics.fairnessScore >= 80
        ? 'excellent balance'
        : metrics.fairnessScore >= 60
        ? 'reasonable balance'
        : 'significant imbalance';

    return `The group shows ${fairnessDesc} with a fairness score of ${metrics.fairnessScore}/100. ` +
      `Total spending is $${metrics.totalSpent.toFixed(2)} across ${patterns.length} members.`;
  }

  /**
   * Detect potential friendship issues
   */
  detectRedFlags(patterns: SpendingPattern[]): string[] {
    const redFlags: string[] = [];

    // Check for extreme imbalances
    const maxNet = Math.max(...patterns.map(p => Math.abs(p.netPosition)));
    if (maxNet > 500) {
      redFlags.push('Large outstanding balance detected - may cause friction');
    }

    // Check for one person always paying
    const totalTransactions = patterns.reduce((sum, p) => sum + p.transactionCount, 0);
    const dominantPayer = patterns.find(
      p => p.transactionCount / totalTransactions > 0.7
    );
    
    if (dominantPayer) {
      redFlags.push(
        `${dominantPayer.userName} paying for 70%+ of expenses - ensure this is intentional`
      );
    }

    // Check for zero contributions
    const nonContributors = patterns.filter(p => p.totalPaid === 0 && p.totalOwed > 20);
    if (nonContributors.length > 0) {
      redFlags.push('Some members have not contributed - consider discussing expectations');
    }

    return redFlags;
  }
}
