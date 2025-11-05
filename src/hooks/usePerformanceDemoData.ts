/**
 * Performance Demo Data Generator Hook
 * 
 * Automatically populates performance metrics with realistic sample data
 * for demonstration and testing purposes
 */

import { useCallback, useEffect, useState } from 'react';
import { useRealtimePerformanceMonitoring } from './useRealtimePerformanceMonitoring';

const DEMO_DATA_KEY = 'performance-demo-data-generated';
const DEMO_ONBOARDING_KEY = 'performance-onboarding-completed';

export function usePerformanceDemoData() {
  const { recordMetric, metrics } = useRealtimePerformanceMonitoring();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if we should show onboarding on first visit
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(DEMO_ONBOARDING_KEY);
    const hasDemoData = localStorage.getItem(DEMO_DATA_KEY);
    
    // Show onboarding if no data and haven't completed onboarding
    if (!hasCompletedOnboarding && !hasDemoData && metrics.length === 0) {
      setShowOnboarding(true);
    }
  }, [metrics.length]);

  const generateDemoData = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      console.log('[Demo Data] Generating sample performance metrics...');
      
      // Generate 50 sample metrics over the past 7 days
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      for (let i = 0; i < 50; i++) {
        // Distribute metrics over the past week
        const daysAgo = Math.floor(Math.random() * 7);
        const timestamp = now - (daysAgo * oneDay);
        
        // Generate realistic latency values (50-400ms)
        const baseLatency = 120 + Math.random() * 200;
        const latency = Math.max(50, Math.min(400, baseLatency + (Math.random() - 0.5) * 100));
        
        // WASM is generally faster
        const method = Math.random() > 0.3 ? 'wasm' : 'js';
        const finalLatency = method === 'wasm' ? latency * 0.4 : latency;
        
        // Generate CPU usage (30-90%)
        const cpu = 30 + Math.random() * 60;
        
        // Generate throughput (10-50 generations per batch)
        const throughput = Math.floor(10 + Math.random() * 40);
        
        // Generate cost based on method and duration
        const duration = finalLatency / 1000; // Convert to seconds
        const costPerSecond = method === 'wasm' ? 0.001 : 0.0029;
        const cost = duration * costPerSecond;
        
        // Record all metrics
        await Promise.all([
          recordMetric('latency', finalLatency, method, {
            timestamp,
            generation_id: `demo_${i}`,
            demo: true
          }),
          recordMetric('cpu', cpu, method, {
            timestamp,
            generation_id: `demo_${i}`,
            demo: true
          }),
          recordMetric('throughput', throughput, method, {
            timestamp,
            generation_id: `demo_${i}`,
            demo: true
          }),
          recordMetric('cost', cost, method, {
            timestamp,
            generation_id: `demo_${i}`,
            demo: true
          })
        ]);
        
        // Small delay to avoid overwhelming the database
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Mark demo data as generated
      localStorage.setItem(DEMO_DATA_KEY, 'true');
      
      console.log('[Demo Data] Successfully generated 50 sample metrics');
    } catch (error) {
      console.error('[Demo Data] Error generating demo data:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [recordMetric]);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(DEMO_ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(DEMO_ONBOARDING_KEY);
    setShowOnboarding(true);
  }, []);

  const clearDemoData = useCallback(() => {
    localStorage.removeItem(DEMO_DATA_KEY);
    console.log('[Demo Data] Demo data flag cleared');
  }, []);

  const hasDemoData = localStorage.getItem(DEMO_DATA_KEY) === 'true';
  const hasCompletedOnboarding = localStorage.getItem(DEMO_ONBOARDING_KEY) === 'true';

  return {
    generateDemoData,
    isGenerating,
    hasDemoData,
    clearDemoData,
    showOnboarding,
    completeOnboarding,
    hasCompletedOnboarding,
    resetOnboarding,
  };
}
