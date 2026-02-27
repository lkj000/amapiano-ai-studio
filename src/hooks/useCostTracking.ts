/**
 * Cost Tracking Hook
 *
 * Tracks and monitors generation costs:
 * - Per-generation cost calculation
 * - Budget management
 * - Cost trends and forecasting
 * - Cost optimization suggestions
 * - Persistent storage via Supabase generation_costs table
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CostMetrics {
  totalCost: number;
  todayCost: number;
  weekCost: number;
  monthCost: number;
  avgCostPerGeneration: number;
  totalGenerations: number;
  budget: number;
  budgetRemaining: number;
  budgetUsedPercent: number;
  estimatedMonthlyTotal: number;
}

export interface CostEntry {
  id: string;
  timestamp: number;
  cost: number;
  generationType: string;
  duration: number;
  method: 'wasm' | 'js';
}

// Cost per second of generated audio
const COST_PER_SECOND = {
  wasm: 0.001, // $0.001/second with WASM (optimized)
  js: 0.0029,  // $0.0029/second with JavaScript (2.9x more expensive)
};

export function useCostTracking(initialBudget: number = 1000) {
  const [entries, setEntries] = useState<CostEntry[]>([]);
  const [budget, setBudget] = useState(initialBudget);

  // Load cost history from Supabase on mount
  const loadCostHistory = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('generation_costs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('[useCostTracking] Failed to load cost history:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const loaded: CostEntry[] = data.map((row: any) => ({
          id: row.id ?? `db-${row.created_at}`,
          timestamp: new Date(row.created_at).getTime(),
          cost: row.cost_usd ?? 0,
          generationType: row.operation ?? 'standard',
          duration: row.tokens_used ?? 0,
          method: 'js' as const,
        }));
        setEntries(loaded);
      }
    } catch (err) {
      console.warn('[useCostTracking] Error loading cost history (non-blocking):', err);
    }
  }, []);

  useEffect(() => {
    loadCostHistory();
  }, [loadCostHistory]);

  const recordCost = useCallback(async (
    duration: number, // in seconds
    method: 'wasm' | 'js',
    generationType: string = 'standard'
  ) => {
    const cost = duration * COST_PER_SECOND[method];

    const entry: CostEntry = {
      id: `cost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      cost,
      generationType,
      duration,
      method,
    };

    setEntries(prev => [...prev, entry]);

    // Persist to Supabase — non-blocking, failures must not break the UI
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userId) {
        const { error } = await supabase.from('generation_costs').insert({
          user_id: userId,
          model: method,
          tokens_used: duration,
          cost_usd: cost,
          operation: generationType,
          created_at: new Date().toISOString(),
        });
        if (error) {
          console.warn('[useCostTracking] Failed to persist cost entry:', error.message);
        }
      }
    } catch (err) {
      console.warn('[useCostTracking] Error persisting cost entry (non-blocking):', err);
    }

    return entry;
  }, []);

  const getMetrics = useCallback((): CostMetrics => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
    const todayCost = entries
      .filter(e => e.timestamp >= oneDayAgo)
      .reduce((sum, e) => sum + e.cost, 0);
    const weekCost = entries
      .filter(e => e.timestamp >= oneWeekAgo)
      .reduce((sum, e) => sum + e.cost, 0);
    const monthCost = entries
      .filter(e => e.timestamp >= oneMonthAgo)
      .reduce((sum, e) => sum + e.cost, 0);

    const totalGenerations = entries.length;
    const avgCostPerGeneration = totalGenerations > 0 ? totalCost / totalGenerations : 0;
    const budgetRemaining = budget - totalCost;
    const budgetUsedPercent = (totalCost / budget) * 100;

    // Estimate monthly total based on current trend
    const daysInMonth = 30;
    const avgDailyCost = totalGenerations > 0
      ? entries
          .filter(e => e.timestamp >= now - 7 * 24 * 60 * 60 * 1000)
          .reduce((sum, e) => sum + e.cost, 0) / 7
      : 0;
    const estimatedMonthlyTotal = avgDailyCost * daysInMonth;

    return {
      totalCost,
      todayCost,
      weekCost,
      monthCost,
      avgCostPerGeneration,
      totalGenerations,
      budget,
      budgetRemaining,
      budgetUsedPercent,
      estimatedMonthlyTotal,
    };
  }, [entries, budget]);

  const getCostTrend = useCallback((days: number = 30) => {
    const now = Date.now();
    const startTime = now - days * 24 * 60 * 60 * 1000;

    const dailyCosts: { [key: string]: number } = {};

    entries
      .filter(e => e.timestamp >= startTime)
      .forEach(entry => {
        const date = new Date(entry.timestamp).toISOString().split('T')[0];
        dailyCosts[date] = (dailyCosts[date] || 0) + entry.cost;
      });

    return Object.entries(dailyCosts)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries]);

  const getSavingsFromWASM = useCallback(() => {
    const wasmEntries = entries.filter(e => e.method === 'wasm');
    const jsCost = wasmEntries.reduce(
      (sum, e) => sum + (e.duration * COST_PER_SECOND.js),
      0
    );
    const actualCost = wasmEntries.reduce((sum, e) => sum + e.cost, 0);
    const savings = jsCost - actualCost;
    const savingsPercent = jsCost > 0 ? (savings / jsCost) * 100 : 0;

    return {
      savings,
      savingsPercent,
      wasmGenerations: wasmEntries.length,
    };
  }, [entries]);

  const getOptimizationSuggestions = useCallback(() => {
    const metrics = getMetrics();
    const suggestions: string[] = [];

    const wasmPercent = entries.filter(e => e.method === 'wasm').length / entries.length * 100;

    if (wasmPercent < 50) {
      suggestions.push(
        `Enable WASM acceleration for 65% cost reduction (currently ${wasmPercent.toFixed(0)}% WASM-accelerated)`
      );
    }

    if (metrics.budgetUsedPercent > 80) {
      suggestions.push(
        `Budget at ${metrics.budgetUsedPercent.toFixed(0)}% - consider increasing budget or optimizing generation parameters`
      );
    }

    if (metrics.estimatedMonthlyTotal > budget) {
      const overage = metrics.estimatedMonthlyTotal - budget;
      suggestions.push(
        `Projected monthly overage: $${overage.toFixed(2)}. Current trend will exceed budget.`
      );
    }

    const avgDuration = entries.reduce((sum, e) => sum + e.duration, 0) / entries.length;
    if (avgDuration > 180) {
      suggestions.push(
        `Average generation duration is ${avgDuration.toFixed(0)}s. Consider shorter durations to reduce costs.`
      );
    }

    return suggestions;
  }, [entries, budget, getMetrics]);

  return {
    recordCost,
    getMetrics,
    getCostTrend,
    getSavingsFromWASM,
    getOptimizationSuggestions,
    loadCostHistory,
    budget,
    setBudget,
    entries,
    costPerSecond: COST_PER_SECOND,
  };
}
