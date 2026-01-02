import { BaseAgent } from './Agent';

export interface Task {
  id: string;
  type: string;
  input: any;
  dependencies?: string[]; // IDs of tasks that must complete first
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  output?: any;
  error?: string;
  duration: number;
}

export interface OrchestrationResult {
  success: boolean;
  results: TaskResult[];
  totalDuration: number;
  errors: string[];
}

export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private taskQueue: Task[] = [];
  private results: Map<string, TaskResult> = new Map();

  /**
   * Register an agent
   */
  registerAgent(type: string, agent: BaseAgent): void {
    this.agents.set(type, agent);
  }

  /**
   * Add a task to the queue
   */
  addTask(task: Task): void {
    this.taskQueue.push(task);
  }

  /**
   * Execute all tasks in the queue with dependency resolution
   */
  async execute(userId?: string): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    this.results.clear();

    try {
      // Sort tasks by dependencies (topological sort)
      const sorted = this.topologicalSort(this.taskQueue);

      // Execute tasks in order
      for (const task of sorted) {
        const taskStartTime = Date.now();
        
        try {
          // Check if dependencies are satisfied
          if (task.dependencies) {
            const dependenciesMet = task.dependencies.every(depId => {
              const result = this.results.get(depId);
              return result && result.success;
            });

            if (!dependenciesMet) {
              throw new Error(`Dependencies not satisfied for task ${task.id}`);
            }
          }

          // Get the appropriate agent
          const agent = this.agents.get(task.type);
          if (!agent) {
            throw new Error(`No agent registered for type: ${task.type}`);
          }

          // Prepare input (include dependency results if needed)
          const input = this.prepareInput(task);

          // Execute agent
          const output = await agent.run(input, userId);

          // Store result
          this.results.set(task.id, {
            taskId: task.id,
            success: true,
            output,
            duration: Date.now() - taskStartTime,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Task ${task.id}: ${errorMessage}`);

          this.results.set(task.id, {
            taskId: task.id,
            success: false,
            error: errorMessage,
            duration: Date.now() - taskStartTime,
          });
        }
      }

      return {
        success: errors.length === 0,
        results: Array.from(this.results.values()),
        totalDuration: Date.now() - startTime,
        errors,
      };
    } finally {
      // Clear queue after execution
      this.taskQueue = [];
    }
  }

  /**
   * Get result of a specific task
   */
  getTaskResult(taskId: string): TaskResult | undefined {
    return this.results.get(taskId);
  }

  /**
   * Prepare input by merging task input with dependency outputs
   */
  private prepareInput(task: Task): any {
    if (!task.dependencies || task.dependencies.length === 0) {
      return task.input;
    }

    const dependencyOutputs: Record<string, any> = {};
    
    for (const depId of task.dependencies) {
      const result = this.results.get(depId);
      if (result && result.success) {
        dependencyOutputs[depId] = result.output;
      }
    }

    return {
      ...task.input,
      dependencies: dependencyOutputs,
    };
  }

  /**
   * Topological sort for task execution order
   */
  private topologicalSort(tasks: Task[]): Task[] {
    const sorted: Task[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (task: Task) => {
      if (visited.has(task.id)) return;
      
      if (visiting.has(task.id)) {
        throw new Error(`Circular dependency detected involving task ${task.id}`);
      }

      visiting.add(task.id);

      if (task.dependencies) {
        for (const depId of task.dependencies) {
          const depTask = tasks.find(t => t.id === depId);
          if (depTask) {
            visit(depTask);
          }
        }
      }

      visiting.delete(task.id);
      visited.add(task.id);
      sorted.push(task);
    };

    for (const task of tasks) {
      visit(task);
    }

    return sorted;
  }

  /**
   * Clear all registered agents and results
   */
  clear(): void {
    this.agents.clear();
    this.taskQueue = [];
    this.results.clear();
  }
}

// Singleton instance
export const orchestrator = new AgentOrchestrator();
