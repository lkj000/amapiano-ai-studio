import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Database,
  Star,
  Heart,
  Zap
} from 'lucide-react';
import { useModelAnalytics, ModelDriftData } from '@/hooks/useModelAnalytics';
import { cn } from '@/lib/utils';

interface ModelPerformanceDashboardProps {
  modelVersion?: string;
  className?: string;
}

export function ModelPerformanceDashboard({ 
  modelVersion = 'si-v1.0-base',
  className 
}: ModelPerformanceDashboardProps) {
  const [driftData, setDriftData] = useState<ModelDriftData[]>([]);
  const [groundTruthCount, setGroundTruthCount] = useState(0);
  
  const {
    performanceData,
    isLoading,
    fetchPerformanceData,
    detectModelDrift,
    getGroundTruthData
  } = useModelAnalytics();

  useEffect(() => {
    loadAnalytics();
  }, [modelVersion]);

  const loadAnalytics = async () => {
    await fetchPerformanceData(modelVersion);
    const drift = await detectModelDrift(modelVersion);
    setDriftData(drift);
    const groundTruth = await getGroundTruthData(4, modelVersion);
    setGroundTruthCount(groundTruth.length);
  };

  const currentModelData = performanceData.find(p => p.modelVersion === modelVersion);
  const hasDrift = driftData.some(d => d.driftDetected);

  const MetricCard = ({ 
    icon: Icon, 
    label, 
    value, 
    subValue,
    trend,
    color = 'primary'
  }: { 
    icon: any; 
    label: string; 
    value: string | number; 
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'primary' | 'green' | 'yellow' | 'red';
  }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50"
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={cn(
          'h-5 w-5',
          color === 'primary' && 'text-primary',
          color === 'green' && 'text-green-500',
          color === 'yellow' && 'text-yellow-500',
          color === 'red' && 'text-red-500'
        )} />
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs',
            trend === 'up' && 'text-green-500',
            trend === 'down' && 'text-red-500',
            trend === 'neutral' && 'text-muted-foreground'
          )}>
            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3" />}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {subValue && <div className="text-xs text-primary mt-1">{subValue}</div>}
    </motion.div>
  );

  return (
    <Card className={cn('border-primary/20', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              AI Model Performance
            </CardTitle>
            <CardDescription>
              Real-time analytics for the SI Neural Core flywheel
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{modelVersion}</Badge>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={loadAnalytics}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Drift Alert */}
        {hasDrift && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30"
          >
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div className="flex-1">
              <div className="font-medium text-yellow-500">Model Drift Detected</div>
              <div className="text-sm text-muted-foreground">
                Recent authenticity ratings have dropped below baseline. Consider retraining.
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-yellow-500/50">
              Retrain
            </Button>
          </motion.div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={Star}
            label="Avg Cultural Rating"
            value={currentModelData?.avgCulturalRating?.toFixed(1) || '--'}
            subValue="out of 5.0"
            trend={currentModelData?.avgCulturalRating && currentModelData.avgCulturalRating >= 4 ? 'up' : 'neutral'}
            color={currentModelData?.avgCulturalRating && currentModelData.avgCulturalRating >= 4 ? 'green' : 'primary'}
          />
          <MetricCard
            icon={Zap}
            label="Avg Swing Rating"
            value={currentModelData?.avgSwingRating?.toFixed(1) || '--'}
            subValue="out of 5.0"
            trend={currentModelData?.avgSwingRating && currentModelData.avgSwingRating >= 4 ? 'up' : 'neutral'}
          />
          <MetricCard
            icon={Heart}
            label="Favorites"
            value={currentModelData?.favoriteCount || 0}
            subValue={`${currentModelData?.totalFeedback || 0} total`}
            color="red"
          />
          <MetricCard
            icon={Database}
            label="Ground Truth"
            value={groundTruthCount}
            subValue="training samples"
            color="green"
          />
        </div>

        {/* Quality Distribution */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">High-Quality Feedback Ratio</span>
            <span className="text-sm text-primary">
              {currentModelData?.highQualityCount || 0} / {currentModelData?.totalFeedback || 0}
            </span>
          </div>
          <Progress 
            value={
              currentModelData?.totalFeedback 
                ? (currentModelData.highQualityCount / currentModelData.totalFeedback) * 100 
                : 0
            } 
            className="h-2"
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Ratings of 4+ stars become Ground Truth for retraining
          </div>
        </div>

        {/* Performance Timeline */}
        {driftData.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium">Performance Timeline (7 days)</div>
            <div className="flex gap-1">
              {driftData.slice(0, 7).reverse().map((day, index) => (
                <motion.div
                  key={day.period}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div 
                    className={cn(
                      'w-full rounded-t transition-all',
                      day.driftDetected ? 'bg-yellow-500' : 'bg-primary'
                    )}
                    style={{ height: `${Math.max(20, (day.avgCulturalRating / 5) * 60)}px` }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(day.period).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Flywheel Status */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="h-5 w-5 text-primary" />
              </motion.div>
            </div>
            <div>
              <div className="font-medium">AI-Native Flywheel Active</div>
              <div className="text-sm text-muted-foreground">
                Continuously learning from community feedback
              </div>
            </div>
          </div>
          <Badge variant="default" className="bg-green-500">
            Online
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
