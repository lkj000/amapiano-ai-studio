/**
 * Learning System Database Client
 * 
 * Handles all database operations for the Level 5 learning system.
 * Tracks production sessions, user feedback, training examples, and model versions.
 */

import { supabase } from '@/integrations/supabase/client';
import type { AudioFeatures, TrainingLabel } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductionSession {
  id: string;
  user_id: string;
  request_data: Record<string, unknown>;
  generation_params: Record<string, unknown>;
  audio_url: string | null;
  quality_score: number | null;
  authenticity_score: number | null;
  passed_threshold: boolean;
  attempts: number;
  total_duration_ms: number | null;
  model_version: string;
  genre: string;
  region: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface UserFeedback {
  id: string;
  session_id: string;
  user_id: string;
  rating: number;
  feedback_type: string;
  issues: string[];
  comments: string | null;
  created_at: string;
}

export interface TrainingExample {
  id: string;
  session_id: string | null;
  audio_url: string;
  is_positive: boolean;
  quality_score: number | null;
  features: Record<string, unknown>;
  labels: Record<string, unknown>;
  source: string;
  validated_by: string | null;
  created_at: string;
}

export interface ModelVersion {
  id: string;
  version_name: string;
  base_model: string;
  training_config: Record<string, unknown>;
  metrics: Record<string, unknown>;
  checkpoint_url: string | null;
  status: string;
  training_examples_count: number;
  epochs_completed: number;
  is_active: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface LearningMetric {
  id: string;
  metric_date: string;
  metric_type: string;
  metric_value: number;
  sample_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RetrainingTrigger {
  id: string;
  trigger_reason: string;
  quality_threshold: number | null;
  current_quality: number | null;
  positive_examples: number;
  negative_examples: number;
  triggered_at: string;
  resolved_at: string | null;
  model_version_id: string | null;
}

// ============================================================================
// PRODUCTION SESSIONS
// ============================================================================

/**
 * Create a new production session
 */
export async function createSession(params: {
  userId: string;
  genre: string;
  region?: string;
  requestData: Record<string, unknown>;
  generationParams: Record<string, unknown>;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('production_sessions')
    .insert([{
      user_id: params.userId,
      genre: params.genre,
      region: params.region,
      request_data: params.requestData as unknown as Record<string, never>,
      generation_params: params.generationParams as unknown as Record<string, never>
    }])
    .select('id')
    .single();

  if (error) {
    console.error('[LearningDB] Failed to create session:', error);
    return null;
  }

  return data.id;
}

/**
 * Update session with generation results
 */
export async function updateSession(
  sessionId: string,
  updates: {
    audioUrl?: string;
    qualityScore?: number;
    authenticityScore?: number;
    passedThreshold?: boolean;
    attempts?: number;
    totalDurationMs?: number;
    modelVersion?: string;
  }
): Promise<boolean> {
  const updateData: Record<string, unknown> = {};
  
  if (updates.audioUrl !== undefined) updateData.audio_url = updates.audioUrl;
  if (updates.qualityScore !== undefined) updateData.quality_score = updates.qualityScore;
  if (updates.authenticityScore !== undefined) updateData.authenticity_score = updates.authenticityScore;
  if (updates.passedThreshold !== undefined) updateData.passed_threshold = updates.passedThreshold;
  if (updates.attempts !== undefined) updateData.attempts = updates.attempts;
  if (updates.totalDurationMs !== undefined) updateData.total_duration_ms = updates.totalDurationMs;
  if (updates.modelVersion !== undefined) updateData.model_version = updates.modelVersion;
  
  if (updates.audioUrl || updates.passedThreshold !== undefined) {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('production_sessions')
    .update(updateData)
    .eq('id', sessionId);

  if (error) {
    console.error('[LearningDB] Failed to update session:', error);
    return false;
  }

  return true;
}

/**
 * Get recent sessions for a user
 */
export async function getUserSessions(
  userId: string,
  limit = 50
): Promise<ProductionSession[]> {
  const { data, error } = await supabase
    .from('production_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[LearningDB] Failed to get sessions:', error);
    return [];
  }

  return data as ProductionSession[];
}

// ============================================================================
// USER FEEDBACK
// ============================================================================

/**
 * Submit user feedback for a session
 */
export async function submitFeedback(params: {
  sessionId: string;
  userId: string;
  rating: number;
  feedbackType?: string;
  issues?: string[];
  comments?: string;
}): Promise<boolean> {
  const { error } = await supabase
    .from('user_feedback')
    .insert({
      session_id: params.sessionId,
      user_id: params.userId,
      rating: params.rating,
      feedback_type: params.feedbackType || 'rating',
      issues: params.issues || [],
      comments: params.comments
    });

  if (error) {
    console.error('[LearningDB] Failed to submit feedback:', error);
    return false;
  }

  // Auto-create training example based on feedback
  if (params.rating >= 4) {
    await createPositiveExample(params.sessionId);
  } else if (params.rating <= 2) {
    await createNegativeExample(params.sessionId, params.issues);
  }

  return true;
}

/**
 * Get feedback for a session
 */
export async function getSessionFeedback(sessionId: string): Promise<UserFeedback[]> {
  const { data, error } = await supabase
    .from('user_feedback')
    .select('*')
    .eq('session_id', sessionId);

  if (error) {
    console.error('[LearningDB] Failed to get feedback:', error);
    return [];
  }

  return data as UserFeedback[];
}

// ============================================================================
// TRAINING EXAMPLES
// ============================================================================

/**
 * Create a positive training example from a successful session
 */
async function createPositiveExample(sessionId: string): Promise<boolean> {
  // Get session data
  const { data: session, error: sessionError } = await supabase
    .from('production_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session?.audio_url) {
    return false;
  }

  const { error } = await supabase
    .from('training_examples')
    .insert({
      session_id: sessionId,
      audio_url: session.audio_url,
      is_positive: true,
      quality_score: session.quality_score,
      features: session.generation_params,
      labels: { genre: session.genre, region: session.region },
      source: 'user_feedback'
    });

  if (error) {
    console.error('[LearningDB] Failed to create positive example:', error);
    return false;
  }

  return true;
}

/**
 * Create a negative training example from a failed session
 */
async function createNegativeExample(
  sessionId: string,
  issues?: string[]
): Promise<boolean> {
  // Get session data
  const { data: session, error: sessionError } = await supabase
    .from('production_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session?.audio_url) {
    return false;
  }

  const { error } = await supabase
    .from('training_examples')
    .insert({
      session_id: sessionId,
      audio_url: session.audio_url,
      is_positive: false,
      quality_score: session.quality_score,
      features: session.generation_params,
      labels: { 
        genre: session.genre, 
        region: session.region,
        issues: issues || []
      },
      source: 'user_feedback'
    });

  if (error) {
    console.error('[LearningDB] Failed to create negative example:', error);
    return false;
  }

  return true;
}

/**
 * Add training example directly
 */
export async function addTrainingExample(params: {
  audioUrl: string;
  isPositive: boolean;
  qualityScore?: number;
  features: AudioFeatures;
  labels: Partial<TrainingLabel>;
  source?: string;
  sessionId?: string;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('training_examples')
    .insert({
      session_id: params.sessionId,
      audio_url: params.audioUrl,
      is_positive: params.isPositive,
      quality_score: params.qualityScore,
      features: params.features as unknown as Record<string, never>,
      labels: params.labels as unknown as Record<string, never>,
      source: params.source || 'auto'
    })
    .select('id')
    .single();

  if (error) {
    console.error('[LearningDB] Failed to add training example:', error);
    return null;
  }

  return data.id;
}

/**
 * Get training examples for model training
 */
export async function getTrainingExamples(params: {
  isPositive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<TrainingExample[]> {
  let query = supabase
    .from('training_examples')
    .select('*')
    .order('created_at', { ascending: false });

  if (params.isPositive !== undefined) {
    query = query.eq('is_positive', params.isPositive);
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  if (params.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 100) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[LearningDB] Failed to get training examples:', error);
    return [];
  }

  return data as TrainingExample[];
}

/**
 * Get training example counts
 */
export async function getExampleCounts(): Promise<{
  positive: number;
  negative: number;
  total: number;
}> {
  const { count: positiveCount } = await supabase
    .from('training_examples')
    .select('*', { count: 'exact', head: true })
    .eq('is_positive', true);

  const { count: negativeCount } = await supabase
    .from('training_examples')
    .select('*', { count: 'exact', head: true })
    .eq('is_positive', false);

  return {
    positive: positiveCount || 0,
    negative: negativeCount || 0,
    total: (positiveCount || 0) + (negativeCount || 0)
  };
}

// ============================================================================
// MODEL VERSIONS
// ============================================================================

/**
 * Create a new model version
 */
export async function createModelVersion(params: {
  versionName: string;
  baseModel?: string;
  trainingConfig: Record<string, unknown>;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('model_versions')
    .insert([{
      version_name: params.versionName,
      base_model: params.baseModel || 'facebook/musicgen-melody',
      training_config: params.trainingConfig as unknown as Record<string, never>,
      status: 'training'
    }])
    .select('id')
    .single();

  if (error) {
    console.error('[LearningDB] Failed to create model version:', error);
    return null;
  }

  return data.id;
}

/**
 * Update model version status
 */
export async function updateModelVersion(
  versionId: string,
  updates: {
    status?: string;
    metrics?: Record<string, unknown>;
    checkpointUrl?: string;
    epochsCompleted?: number;
    trainingExamplesCount?: number;
    isActive?: boolean;
  }
): Promise<boolean> {
  const updateData: Record<string, unknown> = {};
  
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.metrics !== undefined) updateData.metrics = updates.metrics;
  if (updates.checkpointUrl !== undefined) updateData.checkpoint_url = updates.checkpointUrl;
  if (updates.epochsCompleted !== undefined) updateData.epochs_completed = updates.epochsCompleted;
  if (updates.trainingExamplesCount !== undefined) updateData.training_examples_count = updates.trainingExamplesCount;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
  
  if (updates.status === 'complete') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('model_versions')
    .update(updateData)
    .eq('id', versionId);

  if (error) {
    console.error('[LearningDB] Failed to update model version:', error);
    return false;
  }

  return true;
}

/**
 * Get active model version
 */
export async function getActiveModelVersion(): Promise<ModelVersion | null> {
  const { data, error } = await supabase
    .from('model_versions')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error) {
    return null;
  }

  return data as ModelVersion;
}

/**
 * Get all model versions
 */
export async function getModelVersions(): Promise<ModelVersion[]> {
  const { data, error } = await supabase
    .from('model_versions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[LearningDB] Failed to get model versions:', error);
    return [];
  }

  return data as ModelVersion[];
}

// ============================================================================
// LEARNING METRICS
// ============================================================================

/**
 * Record a learning metric
 */
export async function recordMetric(params: {
  metricType: string;
  metricValue: number;
  sampleCount?: number;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const { error } = await supabase
    .from('learning_metrics')
    .upsert([{
      metric_date: new Date().toISOString().split('T')[0],
      metric_type: params.metricType,
      metric_value: params.metricValue,
      sample_count: params.sampleCount || 1,
      metadata: (params.metadata || {}) as unknown as Record<string, never>
    }], {
      onConflict: 'metric_date,metric_type'
    });

  if (error) {
    console.error('[LearningDB] Failed to record metric:', error);
    return false;
  }

  return true;
}

/**
 * Get learning metrics history
 */
export async function getMetricsHistory(
  metricType: string,
  days = 30
): Promise<LearningMetric[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('learning_metrics')
    .select('*')
    .eq('metric_type', metricType)
    .gte('metric_date', startDate.toISOString().split('T')[0])
    .order('metric_date', { ascending: true });

  if (error) {
    console.error('[LearningDB] Failed to get metrics history:', error);
    return [];
  }

  return data as LearningMetric[];
}

// ============================================================================
// RETRAINING TRIGGERS
// ============================================================================

/**
 * Create a retraining trigger
 */
export async function createRetrainingTrigger(params: {
  triggerReason: string;
  qualityThreshold?: number;
  currentQuality?: number;
  positiveExamples: number;
  negativeExamples: number;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('retraining_triggers')
    .insert({
      trigger_reason: params.triggerReason,
      quality_threshold: params.qualityThreshold,
      current_quality: params.currentQuality,
      positive_examples: params.positiveExamples,
      negative_examples: params.negativeExamples
    })
    .select('id')
    .single();

  if (error) {
    console.error('[LearningDB] Failed to create retraining trigger:', error);
    return null;
  }

  return data.id;
}

/**
 * Check if retraining is needed
 */
export async function checkRetrainingNeeded(): Promise<{
  needed: boolean;
  reason?: string;
  positiveExamples: number;
  negativeExamples: number;
}> {
  const counts = await getExampleCounts();
  
  // Thresholds for retraining
  const MIN_POSITIVE = 100;
  const MIN_NEGATIVE = 50;
  const MIN_TOTAL = 200;
  
  let reason: string | undefined;
  
  if (counts.total >= MIN_TOTAL && counts.positive >= MIN_POSITIVE && counts.negative >= MIN_NEGATIVE) {
    // Check for pending triggers
    const { data: triggers } = await supabase
      .from('retraining_triggers')
      .select('*')
      .is('resolved_at', null)
      .order('triggered_at', { ascending: false })
      .limit(1);
    
    if (!triggers || triggers.length === 0) {
      reason = 'Sufficient training examples accumulated';
    }
  }
  
  return {
    needed: !!reason,
    reason,
    positiveExamples: counts.positive,
    negativeExamples: counts.negative
  };
}

/**
 * Get system learning statistics
 */
export async function getLearningStats(): Promise<{
  totalSessions: number;
  totalFeedback: number;
  totalExamples: number;
  averageQuality: number;
  acceptanceRate: number;
  modelVersions: number;
}> {
  // Get session count
  const { count: sessionCount } = await supabase
    .from('production_sessions')
    .select('*', { count: 'exact', head: true });

  // Get feedback count
  const { count: feedbackCount } = await supabase
    .from('user_feedback')
    .select('*', { count: 'exact', head: true });

  // Get example counts
  const exampleCounts = await getExampleCounts();

  // Get average quality from recent sessions
  const { data: recentSessions } = await supabase
    .from('production_sessions')
    .select('quality_score, passed_threshold')
    .not('quality_score', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);

  let avgQuality = 0;
  let acceptanceRate = 0;
  
  if (recentSessions && recentSessions.length > 0) {
    const qualitySum = recentSessions.reduce((sum, s) => sum + (s.quality_score || 0), 0);
    avgQuality = qualitySum / recentSessions.length;
    
    const passedCount = recentSessions.filter(s => s.passed_threshold).length;
    acceptanceRate = passedCount / recentSessions.length;
  }

  // Get model version count
  const { count: modelCount } = await supabase
    .from('model_versions')
    .select('*', { count: 'exact', head: true });

  return {
    totalSessions: sessionCount || 0,
    totalFeedback: feedbackCount || 0,
    totalExamples: exampleCounts.total,
    averageQuality: avgQuality,
    acceptanceRate,
    modelVersions: modelCount || 0
  };
}
