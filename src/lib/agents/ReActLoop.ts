/**
 * ReAct Loop Implementation
 * Reasoning + Acting cycle for autonomous agent behavior
 * Pattern: Thought → Action → Observation → Repeat
 */

export interface ThoughtProcess {
  thought: string;
  reasoning: string;
  confidence: number;
  nextAction: string | null;
}

export interface ActionResult {
  action: string;
  toolUsed: string;
  input: Record<string, any>;
  output: any;
  success: boolean;
  duration: number;
}

export interface Observation {
  result: ActionResult;
  interpretation: string;
  shouldContinue: boolean;
  nextThought: string | null;
}

export interface ReActState {
  goal: string;
  thoughts: ThoughtProcess[];
  actions: ActionResult[];
  observations: Observation[];
  isComplete: boolean;
  finalOutput: any;
  totalSteps: number;
  maxSteps: number;
}

export class ReActLoop {
  private state: ReActState;
  private tools: Map<string, (input: any) => Promise<any>>;
  private reasoningFn: (context: string) => Promise<ThoughtProcess>;
  private maxSteps: number;

  constructor(
    goal: string,
    tools: Map<string, (input: any) => Promise<any>>,
    reasoningFn: (context: string) => Promise<ThoughtProcess>,
    maxSteps: number = 10
  ) {
    this.tools = tools;
    this.reasoningFn = reasoningFn;
    this.maxSteps = maxSteps;
    this.state = {
      goal,
      thoughts: [],
      actions: [],
      observations: [],
      isComplete: false,
      finalOutput: null,
      totalSteps: 0,
      maxSteps
    };
  }

  async think(): Promise<ThoughtProcess> {
    const context = this.buildContext();
    const thought = await this.reasoningFn(context);
    this.state.thoughts.push(thought);
    return thought;
  }

  async act(thought: ThoughtProcess): Promise<ActionResult> {
    const startTime = Date.now();
    
    if (!thought.nextAction) {
      return {
        action: 'none',
        toolUsed: 'none',
        input: {},
        output: null,
        success: true,
        duration: 0
      };
    }

    const [toolName, ...inputParts] = thought.nextAction.split(':');
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      return {
        action: thought.nextAction,
        toolUsed: toolName,
        input: { raw: inputParts.join(':') },
        output: { error: `Tool '${toolName}' not found` },
        success: false,
        duration: Date.now() - startTime
      };
    }

    try {
      const input = this.parseInput(inputParts.join(':'));
      const output = await tool(input);
      
      const result: ActionResult = {
        action: thought.nextAction,
        toolUsed: toolName,
        input,
        output,
        success: true,
        duration: Date.now() - startTime
      };
      
      this.state.actions.push(result);
      return result;
    } catch (error: any) {
      const result: ActionResult = {
        action: thought.nextAction,
        toolUsed: toolName,
        input: { raw: inputParts.join(':') },
        output: { error: error.message },
        success: false,
        duration: Date.now() - startTime
      };
      
      this.state.actions.push(result);
      return result;
    }
  }

  observe(result: ActionResult): Observation {
    const interpretation = this.interpretResult(result);
    const shouldContinue = !this.isGoalAchieved(result) && 
                          this.state.totalSteps < this.maxSteps;
    
    const observation: Observation = {
      result,
      interpretation,
      shouldContinue,
      nextThought: shouldContinue ? this.generateNextThoughtPrompt(result) : null
    };
    
    this.state.observations.push(observation);
    return observation;
  }

  async run(): Promise<ReActState> {
    console.log(`[ReAct] Starting loop for goal: ${this.state.goal}`);
    
    while (!this.state.isComplete && this.state.totalSteps < this.maxSteps) {
      this.state.totalSteps++;
      
      // Think
      const thought = await this.think();
      console.log(`[ReAct] Step ${this.state.totalSteps} - Thought: ${thought.thought}`);
      
      if (!thought.nextAction) {
        this.state.isComplete = true;
        this.state.finalOutput = this.compileFinalOutput();
        break;
      }
      
      // Act
      const result = await this.act(thought);
      console.log(`[ReAct] Action: ${result.action} - Success: ${result.success}`);
      
      // Observe
      const observation = this.observe(result);
      
      if (!observation.shouldContinue) {
        this.state.isComplete = true;
        this.state.finalOutput = this.compileFinalOutput();
      }
    }
    
    if (this.state.totalSteps >= this.maxSteps && !this.state.isComplete) {
      console.log('[ReAct] Max steps reached, compiling partial output');
      this.state.isComplete = true;
      this.state.finalOutput = this.compileFinalOutput();
    }
    
    return this.state;
  }

  private buildContext(): string {
    const recentThoughts = this.state.thoughts.slice(-3);
    const recentActions = this.state.actions.slice(-3);
    const recentObservations = this.state.observations.slice(-3);
    
    return JSON.stringify({
      goal: this.state.goal,
      step: this.state.totalSteps,
      recentThoughts: recentThoughts.map(t => t.thought),
      recentActions: recentActions.map(a => ({ tool: a.toolUsed, success: a.success })),
      recentObservations: recentObservations.map(o => o.interpretation),
      availableTools: Array.from(this.tools.keys())
    });
  }

  private parseInput(inputStr: string): Record<string, any> {
    try {
      return JSON.parse(inputStr);
    } catch {
      return { query: inputStr.trim() };
    }
  }

  private interpretResult(result: ActionResult): string {
    if (!result.success) {
      return `Action failed: ${result.output?.error || 'Unknown error'}`;
    }
    
    const outputSummary = typeof result.output === 'string' 
      ? result.output.slice(0, 200)
      : JSON.stringify(result.output).slice(0, 200);
    
    return `${result.toolUsed} completed successfully: ${outputSummary}`;
  }

  private isGoalAchieved(result: ActionResult): boolean {
    // Check if the last action indicates completion
    if (result.toolUsed === 'complete' || result.toolUsed === 'finish') {
      return true;
    }
    
    // Check if output contains completion indicators
    if (result.output?.complete || result.output?.finished) {
      return true;
    }
    
    return false;
  }

  private generateNextThoughtPrompt(result: ActionResult): string {
    if (!result.success) {
      return `Previous action failed. How can we recover or try an alternative approach?`;
    }
    return `Based on the result of ${result.toolUsed}, what should we do next to achieve: ${this.state.goal}?`;
  }

  private compileFinalOutput(): any {
    return {
      goal: this.state.goal,
      achieved: this.state.isComplete,
      steps: this.state.totalSteps,
      actions: this.state.actions.map(a => ({
        tool: a.toolUsed,
        success: a.success,
        output: a.output
      })),
      summary: this.state.observations.map(o => o.interpretation).join(' → ')
    };
  }

  getState(): ReActState {
    return { ...this.state };
  }
}
