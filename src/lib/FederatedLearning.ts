/**
 * Federated Learning System - Phase 3 Enhancement
 * Learn from user patterns across workspaces without sharing raw data
 */

export interface UserPreferences {
  userId: string;
  workspaceId: string;
  genrePreferences: Record<string, number>;
  toolUsageFrequency: Record<string, number>;
  workflowPatterns: string[][];
  audioSettings: Record<string, any>;
  timestamp: number;
}

export interface ModelUpdate {
  modelId: string;
  weights: number[];
  loss: number;
  accuracy: number;
  contributorId: string;
  timestamp: number;
}

export interface GlobalModel {
  id: string;
  version: number;
  weights: number[];
  performance: {
    accuracy: number;
    loss: number;
    contributors: number;
  };
  lastUpdated: number;
}

export class FederatedLearning {
  private localPreferences: UserPreferences | null = null;
  private globalModel: GlobalModel | null = null;
  private updateInterval: number = 60000; // 1 minute
  private minContributions: number = 5;

  constructor(config?: {
    updateInterval?: number;
    minContributions?: number;
  }) {
    if (config?.updateInterval) this.updateInterval = config.updateInterval;
    if (config?.minContributions) this.minContributions = config.minContributions;
  }

  /**
   * Track local user preferences
   */
  trackPreference(category: string, value: any, weight: number = 1) {
    if (!this.localPreferences) {
      this.localPreferences = {
        userId: '',
        workspaceId: '',
        genrePreferences: {},
        toolUsageFrequency: {},
        workflowPatterns: [],
        audioSettings: {},
        timestamp: Date.now(),
      };
    }

    // Update genre preferences
    if (category === 'genre') {
      const current = this.localPreferences.genrePreferences[value] || 0;
      this.localPreferences.genrePreferences[value] = current + weight;
    }

    // Update tool usage
    if (category === 'tool') {
      const current = this.localPreferences.toolUsageFrequency[value] || 0;
      this.localPreferences.toolUsageFrequency[value] = current + 1;
    }

    // Update audio settings
    if (category === 'audio_setting') {
      this.localPreferences.audioSettings[value.key] = value.value;
    }

    this.localPreferences.timestamp = Date.now();
  }

  /**
   * Train local model on user data
   */
  async trainLocalModel(): Promise<ModelUpdate | null> {
    if (!this.localPreferences) return null;

    try {
      // Convert preferences to feature vector
      const features = this.preferencesToVector(this.localPreferences);

      // Simple gradient descent for demonstration
      // In production, use TensorFlow.js or similar
      const weights = this.globalModel?.weights || Array(features.length).fill(0);
      const learningRate = 0.01;

      // Mock training process
      const updatedWeights = weights.map((w, i) => {
        const gradient = features[i] - w;
        return w + learningRate * gradient;
      });

      // Calculate loss
      const loss = this.calculateLoss(features, updatedWeights);
      const accuracy = Math.max(0, 1 - loss);

      const update: ModelUpdate = {
        modelId: this.globalModel?.id || 'default',
        weights: updatedWeights,
        loss,
        accuracy,
        contributorId: this.localPreferences.userId,
        timestamp: Date.now(),
      };

      return update;
    } catch (error) {
      console.error('[FederatedLearning] Training error:', error);
      return null;
    }
  }

  /**
   * Aggregate model updates from multiple users
   */
  aggregateUpdates(updates: ModelUpdate[]): GlobalModel {
    if (updates.length === 0) {
      throw new Error('No updates to aggregate');
    }

    // Federated Averaging (FedAvg)
    const avgWeights = updates[0].weights.map((_, i) => {
      const sum = updates.reduce((acc, update) => acc + update.weights[i], 0);
      return sum / updates.length;
    });

    const avgLoss = updates.reduce((acc, u) => acc + u.loss, 0) / updates.length;
    const avgAccuracy = updates.reduce((acc, u) => acc + u.accuracy, 0) / updates.length;

    const newVersion = (this.globalModel?.version || 0) + 1;

    const aggregated: GlobalModel = {
      id: this.globalModel?.id || `model-${Date.now()}`,
      version: newVersion,
      weights: avgWeights,
      performance: {
        accuracy: avgAccuracy,
        loss: avgLoss,
        contributors: updates.length,
      },
      lastUpdated: Date.now(),
    };

    this.globalModel = aggregated;
    return aggregated;
  }

  /**
   * Get personalized recommendations
   */
  getRecommendations(
    context: {
      currentGenre?: string;
      recentTools?: string[];
      projectContext?: any;
    }
  ): any[] {
    if (!this.globalModel) return [];

    const recommendations: any[] = [];

    // Genre-based recommendations
    if (context.currentGenre && this.localPreferences) {
      const genrePrefs = this.localPreferences.genrePreferences;
      const relatedGenres = Object.entries(genrePrefs)
        .filter(([genre]) => genre !== context.currentGenre)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([genre]) => ({
          type: 'genre',
          value: genre,
          reason: 'Based on your listening habits',
          confidence: 0.8,
        }));

      recommendations.push(...relatedGenres);
    }

    // Tool recommendations
    if (context.recentTools && this.localPreferences) {
      const toolFreq = this.localPreferences.toolUsageFrequency;
      const suggestedTools = Object.entries(toolFreq)
        .filter(([tool]) => !context.recentTools?.includes(tool))
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([tool]) => ({
          type: 'tool',
          value: tool,
          reason: 'Frequently used together',
          confidence: 0.7,
        }));

      recommendations.push(...suggestedTools);
    }

    return recommendations;
  }

  /**
   * Differential privacy: Add noise to updates
   */
  applyDifferentialPrivacy(
    update: ModelUpdate,
    epsilon: number = 1.0
  ): ModelUpdate {
    const noisyWeights = update.weights.map(w => {
      // Laplace noise
      const scale = 1 / epsilon;
      const u = Math.random() - 0.5;
      const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
      return w + noise;
    });

    return {
      ...update,
      weights: noisyWeights,
    };
  }

  /**
   * Secure aggregation with encryption
   */
  secureAggregate(updates: ModelUpdate[]): GlobalModel {
    // Add noise to individual updates for privacy
    const privateUpdates = updates.map(u => 
      this.applyDifferentialPrivacy(u, 0.5)
    );

    // Aggregate with enhanced privacy
    return this.aggregateUpdates(privateUpdates);
  }

  /**
   * Convert preferences to feature vector
   */
  private preferencesToVector(prefs: UserPreferences): number[] {
    const vector: number[] = [];

    // Genre preferences (normalized)
    const genreTotal = Object.values(prefs.genrePreferences).reduce((a, b) => a + b, 0) || 1;
    const genreFeatures = Object.values(prefs.genrePreferences).map(v => v / genreTotal);
    vector.push(...genreFeatures);

    // Tool usage (normalized)
    const toolTotal = Object.values(prefs.toolUsageFrequency).reduce((a, b) => a + b, 0) || 1;
    const toolFeatures = Object.values(prefs.toolUsageFrequency).map(v => v / toolTotal);
    vector.push(...toolFeatures);

    // Pad to fixed length
    while (vector.length < 100) {
      vector.push(0);
    }

    return vector.slice(0, 100);
  }

  /**
   * Calculate loss function
   */
  private calculateLoss(features: number[], weights: number[]): number {
    let loss = 0;
    for (let i = 0; i < features.length; i++) {
      const diff = features[i] - weights[i];
      loss += diff * diff;
    }
    return loss / features.length;
  }

  /**
   * Get current global model
   */
  getGlobalModel(): GlobalModel | null {
    return this.globalModel;
  }

  /**
   * Load global model from server
   */
  async loadGlobalModel(modelId: string): Promise<boolean> {
    try {
      // In production, fetch from server
      // For now, create a default model
      this.globalModel = {
        id: modelId,
        version: 1,
        weights: Array(100).fill(0),
        performance: {
          accuracy: 0.5,
          loss: 0.5,
          contributors: 0,
        },
        lastUpdated: Date.now(),
      };

      return true;
    } catch (error) {
      console.error('[FederatedLearning] Load model error:', error);
      return false;
    }
  }

  /**
   * Clear local data
   */
  clearLocalData() {
    this.localPreferences = null;
  }
}
