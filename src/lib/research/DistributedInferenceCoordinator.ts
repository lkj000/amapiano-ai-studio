import { supabase } from "@/integrations/supabase/client";

export type NodeType = 'edge' | 'cloud';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface InferenceJob {
  id: string;
  type: string;
  status: JobStatus;
  priority: number;
  nodeType?: NodeType;
  inputData: any;
  outputData?: any;
  metrics?: {
    latency?: number;
    throughput?: number;
    costCents?: number;
  };
}

export interface NodeCapabilities {
  type: NodeType;
  id: string;
  available: boolean;
  currentLoad: number;
  maxLoad: number;
  estimatedLatency: number;
  costPerRequest: number;
}

export class DistributedInferenceCoordinator {
  private userId: string | null = null;
  private edgeNodes: Map<string, NodeCapabilities> = new Map();
  private cloudNodes: Map<string, NodeCapabilities> = new Map();
  
  constructor() {
    this.initializeNodes();
  }

  /**
   * Initialize edge and cloud nodes
   */
  private initializeNodes() {
    // Edge node (local browser)
    this.edgeNodes.set('edge-browser', {
      type: 'edge',
      id: 'edge-browser',
      available: true,
      currentLoad: 0,
      maxLoad: 4,
      estimatedLatency: 50,
      costPerRequest: 0
    });
    
    // Cloud nodes (Supabase functions)
    this.cloudNodes.set('cloud-primary', {
      type: 'cloud',
      id: 'cloud-primary',
      available: true,
      currentLoad: 0,
      maxLoad: 100,
      estimatedLatency: 200,
      costPerRequest: 0.001
    });
    
    this.cloudNodes.set('cloud-secondary', {
      type: 'cloud',
      id: 'cloud-secondary',
      available: true,
      currentLoad: 0,
      maxLoad: 100,
      estimatedLatency: 250,
      costPerRequest: 0.0008
    });
  }

  /**
   * Set current user ID
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Context-aware routing decision
   */
  private async routeJob(job: InferenceJob): Promise<NodeCapabilities> {
    const factors = {
      latencySensitive: job.priority > 5,
      costSensitive: job.priority < 3,
      complexityHigh: (job.inputData?.complexity || 'low') === 'high'
    };
    
    // Decision matrix
    if (factors.latencySensitive && !factors.complexityHigh) {
      // Route to edge for low latency
      const edgeNode = this.getBestNode(this.edgeNodes);
      if (edgeNode && edgeNode.currentLoad < edgeNode.maxLoad) {
        return edgeNode;
      }
    }
    
    if (factors.costSensitive && !factors.complexityHigh) {
      // Route to cheapest available node
      return this.getCheapestNode();
    }
    
    if (factors.complexityHigh) {
      // Route to cloud for complex tasks
      return this.getBestNode(this.cloudNodes) || this.getCheapestNode();
    }
    
    // Default: balance load
    return this.getBalancedNode();
  }

  /**
   * Get best node from a set based on load and latency
   */
  private getBestNode(
    nodes: Map<string, NodeCapabilities>
  ): NodeCapabilities | null {
    let best: NodeCapabilities | null = null;
    let bestScore = Infinity;
    
    for (const node of nodes.values()) {
      if (!node.available) continue;
      
      const loadFactor = node.currentLoad / node.maxLoad;
      const score = node.estimatedLatency * (1 + loadFactor);
      
      if (score < bestScore) {
        bestScore = score;
        best = node;
      }
    }
    
    return best;
  }

  /**
   * Get cheapest available node
   */
  private getCheapestNode(): NodeCapabilities {
    const allNodes = [
      ...Array.from(this.edgeNodes.values()),
      ...Array.from(this.cloudNodes.values())
    ];
    
    return allNodes
      .filter(n => n.available && n.currentLoad < n.maxLoad)
      .sort((a, b) => a.costPerRequest - b.costPerRequest)[0] 
      || allNodes[0];
  }

  /**
   * Get node with balanced load
   */
  private getBalancedNode(): NodeCapabilities {
    const allNodes = [
      ...Array.from(this.edgeNodes.values()),
      ...Array.from(this.cloudNodes.values())
    ];
    
    return allNodes
      .filter(n => n.available)
      .sort((a, b) => {
        const loadA = a.currentLoad / a.maxLoad;
        const loadB = b.currentLoad / b.maxLoad;
        return loadA - loadB;
      })[0] || allNodes[0];
  }

  /**
   * Submit inference job
   */
  async submitJob(
    type: string,
    inputData: any,
    priority: number = 5
  ): Promise<string> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }
    
    // Create job in database
    const { data, error } = await supabase
      .from('distributed_inference_jobs')
      .insert({
        user_id: this.userId,
        job_type: type,
        status: 'pending',
        priority,
        input_data: inputData
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Route and execute
    this.executeJob(data.id);
    
    return data.id;
  }

  /**
   * Execute job on selected node
   */
  private async executeJob(jobId: string) {
    // Get job details
    const { data: job, error } = await supabase
      .from('distributed_inference_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error || !job) {
      console.error('Failed to fetch job:', error);
      return;
    }
    
    // Route to best node
    const node = await this.routeJob({
      id: job.id,
      type: job.job_type,
      status: job.status as JobStatus,
      priority: job.priority,
      inputData: job.input_data
    });
    
    // Update job with node assignment
    await supabase
      .from('distributed_inference_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        [node.type === 'edge' ? 'edge_node_id' : 'cloud_node_id']: node.id
      })
      .eq('id', jobId);
    
    // Update node load
    node.currentLoad++;
    
    try {
      const startTime = Date.now();
      
      // Execute based on node type
      const result = node.type === 'edge' 
        ? await this.executeOnEdge(job.input_data)
        : await this.executeOnCloud(job.input_data, node.id);
      
      const latency = Date.now() - startTime;
      
      // Update job with results
      await supabase
        .from('distributed_inference_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          output_data: result,
          metrics: {
            latency,
            costCents: node.costPerRequest * 100
          }
        })
        .eq('id', jobId);
      
    } catch (error) {
      await supabase
        .from('distributed_inference_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', jobId);
    } finally {
      node.currentLoad--;
    }
  }

  /**
   * Execute inference on edge node (browser)
   */
  private async executeOnEdge(inputData: any): Promise<any> {
    // Simulate edge processing
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      processed: true,
      location: 'edge',
      timestamp: Date.now(),
      data: inputData
    };
  }

  /**
   * Execute inference on cloud node
   */
  private async executeOnCloud(inputData: any, nodeId: string): Promise<any> {
    // Simulate cloud processing (higher latency than edge)
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100));
    
    return {
      processed: true,
      location: 'cloud',
      nodeId,
      timestamp: Date.now(),
      data: inputData
    };
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<InferenceJob | null> {
    const { data, error } = await supabase
      .from('distributed_inference_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error) return null;
    
    return {
      id: data.id,
      type: data.job_type,
      status: data.status as JobStatus,
      priority: data.priority,
      inputData: data.input_data,
      outputData: data.output_data,
      metrics: data.metrics as { latency?: number; throughput?: number; costCents?: number; } | undefined
    };
  }

  /**
   * Get coordinator statistics
   */
  getStats() {
    const edgeLoad = Array.from(this.edgeNodes.values())
      .reduce((sum, n) => sum + n.currentLoad, 0);
    const cloudLoad = Array.from(this.cloudNodes.values())
      .reduce((sum, n) => sum + n.currentLoad, 0);
    
    return {
      totalNodes: this.edgeNodes.size + this.cloudNodes.size,
      edgeNodes: this.edgeNodes.size,
      cloudNodes: this.cloudNodes.size,
      edgeLoad,
      cloudLoad,
      totalLoad: edgeLoad + cloudLoad
    };
  }
}
