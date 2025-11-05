/**
 * Performance Alerts Hook
 * 
 * Monitors system performance and generates alerts for:
 * - High latency
 * - Resource exhaustion
 * - Budget overruns
 * - System health issues
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface PerformanceAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  timestamp: number;
  acknowledged: boolean;
}

export interface AlertThresholds {
  latencyWarning: number;
  latencyCritical: number;
  cpuWarning: number;
  cpuCritical: number;
  costWarning: number;
  costCritical: number;
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  latencyWarning: 300,
  latencyCritical: 500,
  cpuWarning: 70,
  cpuCritical: 85,
  costWarning: 80, // % of budget
  costCritical: 95,
};

export function usePerformanceAlerts(thresholds: Partial<AlertThresholds> = {}) {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<PerformanceAlert[]>([]);
  const config = { ...DEFAULT_THRESHOLDS, ...thresholds };

  const createAlert = useCallback((
    severity: PerformanceAlert['severity'],
    title: string,
    description: string
  ) => {
    const alert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      severity,
      title,
      description,
      timestamp: Date.now(),
      acknowledged: false,
    };

    setAlerts(prev => {
      // Check if similar alert already exists
      const exists = prev.some(a => 
        a.title === title && 
        a.severity === severity && 
        !a.acknowledged
      );
      
      if (exists) return prev;
      return [...prev, alert];
    });

    setAlertHistory(prev => [...prev.slice(-99), alert]);

    // Show toast notification
    const toastFn = severity === 'critical' ? toast.error : 
                    severity === 'warning' ? toast.warning : 
                    toast.info;
    
    toastFn(title, { description });

    return alert;
  }, []);

  const checkLatency = useCallback((latency: number) => {
    if (latency >= config.latencyCritical) {
      createAlert(
        'critical',
        'Critical Latency',
        `Generation latency (${latency.toFixed(0)}ms) is critically high. Target: 180ms`
      );
    } else if (latency >= config.latencyWarning) {
      createAlert(
        'warning',
        'High Latency',
        `Generation latency (${latency.toFixed(0)}ms) exceeds target. Consider enabling WASM acceleration.`
      );
    }
  }, [config, createAlert]);

  const checkCPU = useCallback((cpuLoad: number) => {
    if (cpuLoad >= config.cpuCritical) {
      createAlert(
        'critical',
        'Critical CPU Load',
        `CPU load at ${cpuLoad.toFixed(0)}%. System may be unstable. Consider scaling.`
      );
    } else if (cpuLoad >= config.cpuWarning) {
      createAlert(
        'warning',
        'High CPU Load',
        `CPU load at ${cpuLoad.toFixed(0)}%. Monitor system performance.`
      );
    }
  }, [config, createAlert]);

  const checkCost = useCallback((currentCost: number, budget: number) => {
    const percentage = (currentCost / budget) * 100;
    
    if (percentage >= config.costCritical) {
      createAlert(
        'critical',
        'Budget Critical',
        `Costs at ${percentage.toFixed(0)}% of budget ($${currentCost.toFixed(2)}/$${budget.toFixed(2)})`
      );
    } else if (percentage >= config.costWarning) {
      createAlert(
        'warning',
        'Budget Warning',
        `Costs at ${percentage.toFixed(0)}% of budget ($${currentCost.toFixed(2)}/$${budget.toFixed(2)})`
      );
    }
  }, [config, createAlert]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const getActiveAlerts = useCallback(() => {
    return alerts.filter(a => !a.acknowledged);
  }, [alerts]);

  const getCriticalAlerts = useCallback(() => {
    return alerts.filter(a => a.severity === 'critical' && !a.acknowledged);
  }, [alerts]);

  return {
    alerts: getActiveAlerts(),
    allAlerts: alerts,
    alertHistory,
    criticalAlerts: getCriticalAlerts(),
    checkLatency,
    checkCPU,
    checkCost,
    acknowledgeAlert,
    dismissAlert,
    clearAllAlerts,
    thresholds: config,
  };
}
