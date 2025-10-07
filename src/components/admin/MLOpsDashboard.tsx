/**
 * MLOps Dashboard - AI Model Performance Tracking and Analytics
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Brain, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ModelMetrics {
  model_name: string;
  total_usage: number;
  avg_generation_time: number;
  success_rate: number;
  total_cost: number;
  last_used: string;
}

export const MLOpsDashboard = () => {
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);
  const [totalGenerations, setTotalGenerations] = useState(0);

  useEffect(() => {
    fetchModelMetrics();
    const interval = setInterval(fetchModelMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchModelMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_model_usage')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Aggregate metrics by model
        const aggregated = data.reduce((acc: Record<string, any>, usage) => {
          const model = usage.model_name;
          if (!acc[model]) {
            acc[model] = {
              model_name: model,
              total_usage: 0,
              generation_times: [],
              successes: 0,
              total_cost: 0,
              last_used: usage.created_at,
            };
          }

          acc[model].total_usage++;
          if (usage.generation_time_ms) {
            acc[model].generation_times.push(usage.generation_time_ms);
          }
          if (usage.success) {
            acc[model].successes++;
          }
          acc[model].total_cost += usage.cost_cents / 100;

          return acc;
        }, {});

        const metrics: ModelMetrics[] = Object.values(aggregated).map((m: any) => ({
          model_name: m.model_name,
          total_usage: m.total_usage,
          avg_generation_time: m.generation_times.length > 0
            ? Math.round(m.generation_times.reduce((a: number, b: number) => a + b, 0) / m.generation_times.length)
            : 0,
          success_rate: (m.successes / m.total_usage) * 100,
          total_cost: m.total_cost,
          last_used: m.last_used,
        }));

        setModelMetrics(metrics);
        setTotalCost(metrics.reduce((sum, m) => sum + m.total_cost, 0));
        setTotalGenerations(metrics.reduce((sum, m) => sum + m.total_usage, 0));
      }
    } catch (error: any) {
      console.error('Error fetching model metrics:', error);
      toast({
        title: "Failed to Load Metrics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-500';
    if (rate >= 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getModelBadgeVariant = (modelName: string): "default" | "secondary" | "outline" => {
    if (modelName.includes('gemini')) return 'default';
    if (modelName.includes('gpt')) return 'secondary';
    return 'outline';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading MLOps metrics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGenerations}</div>
            <p className="text-xs text-muted-foreground">
              Across {modelMetrics.length} models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ${(totalGenerations > 0 ? totalCost / totalGenerations : 0).toFixed(4)} per generation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {modelMetrics.length > 0
                ? (modelMetrics.reduce((sum, m) => sum + m.success_rate, 0) / modelMetrics.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Overall model performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Model Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Model Performance Analytics
          </CardTitle>
          <CardDescription>
            Detailed metrics for each AI model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {modelMetrics.length === 0 ? (
              <p className="text-sm text-muted-foreground">No model usage data available</p>
            ) : (
              modelMetrics.map((model) => (
                <div key={model.model_name} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={getModelBadgeVariant(model.model_name)}>
                        {model.model_name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {model.total_usage} generations
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      ${model.total_cost.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Success Rate</p>
                      <p className={`font-semibold ${getPerformanceColor(model.success_rate)}`}>
                        {model.success_rate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Generation Time</p>
                      <p className="font-semibold">{model.avg_generation_time}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Used</p>
                      <p className="font-semibold">
                        {new Date(model.last_used).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {model.success_rate < 80 && (
                    <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Low success rate - model may need retraining or optimization</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
