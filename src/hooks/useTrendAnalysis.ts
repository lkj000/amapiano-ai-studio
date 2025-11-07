import { useState, useEffect } from "react";
import { useTestHistory } from "./useTestHistory";

interface DataPoint {
  timestamp: string;
  value: number;
}

interface TrendData {
  dataPoints: DataPoint[];
  mean: number;
  stdDev: number;
  min: number;
  max: number;
}

interface Anomaly {
  metricName: string;
  value: number;
  expectedRange: { min: number; max: number };
  deviation: number;
  severity: "low" | "medium" | "high";
  timestamp: string;
}

export const useTrendAnalysis = () => {
  const { history, isLoading } = useTestHistory();
  const [trends, setTrends] = useState<Record<string, TrendData>>({});
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  const calculateStats = (values: number[]) => {
    if (values.length === 0) return { mean: 0, stdDev: 0, min: 0, max: 0 };

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { mean, stdDev, min, max };
  };

  const detectAnomalies = (dataPoints: DataPoint[], metricName: string, stats: { mean: number; stdDev: number }) => {
    const detectedAnomalies: Anomaly[] = [];
    const threshold = 2; // Z-score threshold

    dataPoints.forEach((point) => {
      const zScore = Math.abs((point.value - stats.mean) / stats.stdDev);
      
      if (zScore > threshold) {
        const expectedRange = {
          min: stats.mean - threshold * stats.stdDev,
          max: stats.mean + threshold * stats.stdDev,
        };

        detectedAnomalies.push({
          metricName,
          value: point.value,
          expectedRange,
          deviation: point.value - stats.mean,
          severity: zScore > 3 ? "high" : zScore > 2.5 ? "medium" : "low",
          timestamp: point.timestamp,
        });
      }
    });

    return detectedAnomalies;
  };

  const analyzeTrends = () => {
    if (!history || history.length === 0) {
      setTrends({});
      setAnomalies([]);
      return;
    }

    const metricGroups: Record<string, DataPoint[]> = {};
    const allAnomalies: Anomaly[] = [];

    // Group metrics by type
    history.forEach((test) => {
      if (!test.summary_metrics) return;

      Object.entries(test.summary_metrics).forEach(([key, value]) => {
        if (typeof value === "number") {
          if (!metricGroups[key]) {
            metricGroups[key] = [];
          }
          metricGroups[key].push({
            timestamp: test.test_date,
            value,
          });
        }
      });
    });

    // Calculate trends and detect anomalies for each metric
    const trendData: Record<string, TrendData> = {};

    Object.entries(metricGroups).forEach(([metricName, dataPoints]) => {
      // Sort by timestamp
      const sortedPoints = dataPoints.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const values = sortedPoints.map((p) => p.value);
      const stats = calculateStats(values);

      trendData[metricName] = {
        dataPoints: sortedPoints,
        ...stats,
      };

      // Detect anomalies for this metric
      const metricAnomalies = detectAnomalies(sortedPoints, metricName, stats);
      allAnomalies.push(...metricAnomalies);
    });

    setTrends(trendData);
    setAnomalies(allAnomalies);
  };

  const refreshAnalysis = () => {
    analyzeTrends();
  };

  useEffect(() => {
    analyzeTrends();
  }, [history]);

  return {
    trends,
    anomalies,
    isLoading,
    refreshAnalysis,
  };
};
