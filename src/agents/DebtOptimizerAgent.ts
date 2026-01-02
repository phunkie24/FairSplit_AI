import { BaseAgent } from './base/Agent';
import { roundTo } from '@/lib/utils';

export interface Debt {
  from: string; // User ID who owes
  to: string;   // User ID who is owed
  amount: number;
}

export interface DebtOptimizeInput {
  debts: Debt[];
  minimumAmount?: number; // Forgive debts below this amount
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

export interface DebtOptimizeOutput {
  originalTransactions: number;
  optimizedTransactions: number;
  transactions: Transaction[];
  saved: number; // Number of transactions saved
  totalAmount: number;
  balances: Record<string, number>; // Net position for each person
}

interface NetPosition {
  person: string;
  balance: number;
}

export class DebtOptimizerAgent extends BaseAgent<DebtOptimizeInput, DebtOptimizeOutput> {
  constructor() {
    super('DebtOptimizer');
  }

  protected async execute(input: DebtOptimizeInput): Promise<DebtOptimizeOutput> {
    const { debts, minimumAmount = 0.5 } = input;

    if (debts.length === 0) {
      return {
        originalTransactions: 0,
        optimizedTransactions: 0,
        transactions: [],
        saved: 0,
        totalAmount: 0,
        balances: {},
      };
    }

    // Calculate net positions for each person
    const netPositions = this.calculateNetPositions(debts);

    // Apply minimum amount threshold (forgiveness)
    const filteredPositions = netPositions.filter(
      np => Math.abs(np.balance) >= minimumAmount
    );

    // Optimize using greedy algorithm
    const optimizedTransactions = this.optimizeDebts(filteredPositions);

    // Calculate total amount
    const totalAmount = optimizedTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Build balances object
    const balances: Record<string, number> = {};
    netPositions.forEach(np => {
      balances[np.person] = roundTo(np.balance, 2);
    });

    return {
      originalTransactions: debts.length,
      optimizedTransactions: optimizedTransactions.length,
      transactions: optimizedTransactions,
      saved: debts.length - optimizedTransactions.length,
      totalAmount: roundTo(totalAmount, 2),
      balances,
    };
  }

  /**
   * Calculate net position for each person
   * Positive = owed money, Negative = owes money
   */
  private calculateNetPositions(debts: Debt[]): NetPosition[] {
    const positions = new Map<string, number>();

    // Process all debts
    for (const debt of debts) {
      // Person who owes (debtor) has negative balance
      positions.set(debt.from, (positions.get(debt.from) || 0) - debt.amount);
      
      // Person who is owed (creditor) has positive balance
      positions.set(debt.to, (positions.get(debt.to) || 0) + debt.amount);
    }

    // Convert to array and round
    return Array.from(positions.entries()).map(([person, balance]) => ({
      person,
      balance: roundTo(balance, 2),
    }));
  }

  /**
   * Optimize debts using greedy algorithm
   * This minimizes the number of transactions needed
   */
  private optimizeDebts(netPositions: NetPosition[]): Transaction[] {
    const transactions: Transaction[] = [];
    
    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors = netPositions
      .filter(np => np.balance > 0)
      .sort((a, b) => b.balance - a.balance); // Sort descending
    
    const debtors = netPositions
      .filter(np => np.balance < 0)
      .map(np => ({ ...np, balance: -np.balance })) // Make positive for easier calculation
      .sort((a, b) => b.balance - a.balance); // Sort descending

    let i = 0; // Creditor index
    let j = 0; // Debtor index

    // Greedy matching: match largest creditor with largest debtor
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      // Amount to settle is the minimum of what's owed and what's due
      const amount = Math.min(creditor.balance, debtor.balance);

      if (amount >= 0.01) { // Ignore very small amounts
        transactions.push({
          from: debtor.person,
          to: creditor.person,
          amount: roundTo(amount, 2),
        });
      }

      // Update balances
      creditor.balance = roundTo(creditor.balance - amount, 2);
      debtor.balance = roundTo(debtor.balance - amount, 2);

      // Move to next person if current one is settled
      if (creditor.balance === 0) i++;
      if (debtor.balance === 0) j++;
    }

    return transactions;
  }

  /**
   * Validate that optimized transactions preserve net positions
   */
  protected async validateOutput(output: DebtOptimizeOutput): Promise<void> {
    // Calculate net positions from optimized transactions
    const debtsFromOptimized: Debt[] = output.transactions.map(t => ({
      from: t.from,
      to: t.to,
      amount: t.amount,
    }));

    const newPositions = this.calculateNetPositions(debtsFromOptimized);
    const newBalances: Record<string, number> = {};
    newPositions.forEach(np => {
      newBalances[np.person] = np.balance;
    });

    // Check if balances match
    for (const [person, originalBalance] of Object.entries(output.balances)) {
      const newBalance = newBalances[person] || 0;
      const difference = Math.abs(originalBalance - newBalance);

      if (difference > 0.01) {
        throw new Error(
          `Balance mismatch for ${person}: ` +
          `original ${originalBalance}, optimized ${newBalance}`
        );
      }
    }
  }

  /**
   * Find circular debts (A owes B, B owes C, C owes A)
   * and eliminate them
   */
  detectCircularDebts(debts: Debt[]): {
    circular: Debt[][];
    remaining: Debt[];
  } {
    const circles: Debt[][] = [];
    const used = new Set<number>();

    // Build adjacency list
    const graph = new Map<string, Debt[]>();
    debts.forEach((debt, index) => {
      if (!graph.has(debt.from)) {
        graph.set(debt.from, []);
      }
      graph.get(debt.from)!.push({ ...debt, index } as any);
    });

    // DFS to find cycles
    const visited = new Set<string>();
    const path: Debt[] = [];

    const dfs = (person: string, start: string) => {
      if (visited.has(person)) {
        if (person === start && path.length >= 3) {
          circles.push([...path]);
        }
        return;
      }

      visited.add(person);
      const edges = graph.get(person) || [];

      for (const edge of edges) {
        if (!(edge as any).index || !used.has((edge as any).index)) {
          path.push(edge);
          dfs(edge.to, start);
          path.pop();
        }
      }

      visited.delete(person);
    };

    // Find all cycles
    for (const person of graph.keys()) {
      dfs(person, person);
    }

    // Mark circular debts as used
    circles.forEach(circle => {
      circle.forEach(debt => {
        used.add((debt as any).index);
      });
    });

    // Return remaining debts
    const remaining = debts.filter((_, index) => !used.has(index));

    return { circular: circles, remaining };
  }

  /**
   * Calculate fairness score based on distribution
   */
  calculateFairnessScore(debts: Debt[]): {
    giniCoefficient: number;
    fairnessScore: number; // 0-100
  } {
    const netPositions = this.calculateNetPositions(debts);
    const balances = netPositions.map(np => Math.abs(np.balance));

    if (balances.length === 0) {
      return { giniCoefficient: 0, fairnessScore: 100 };
    }

    // Calculate Gini coefficient
    const sorted = [...balances].sort((a, b) => a - b);
    const n = sorted.length;
    const mean = sorted.reduce((sum, val) => sum + val, 0) / n;

    if (mean === 0) {
      return { giniCoefficient: 0, fairnessScore: 100 };
    }

    let numerator = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        numerator += Math.abs(sorted[i] - sorted[j]);
      }
    }

    const gini = numerator / (2 * n * n * mean);
    
    // Convert to fairness score (0 = perfect inequality, 100 = perfect equality)
    const fairnessScore = roundTo((1 - gini) * 100, 1);

    return {
      giniCoefficient: roundTo(gini, 4),
      fairnessScore,
    };
  }
}
