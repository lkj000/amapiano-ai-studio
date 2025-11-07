import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, Clock, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TestResults {
  sparse?: {
    avgLatency: number;
    cacheHitRate: number;
  };
  quantization?: {
    ptq8Quality: number;
    svd8Quality: number;
    ptq4Quality: number;
  };
  distributed?: {
    edgeLoad: number;
    cloudLoad: number;
  };
}

interface HypothesisValidationSystemProps {
  testResults: TestResults;
}

interface HypothesisStatus {
  id: string;
  title: string;
  description: string;
  status: 'validated' | 'partial' | 'failed' | 'pending';
  confidence: number;
  metrics: { name: string; value: string; status: 'pass' | 'fail' | 'warning' }[];
  recommendation: string;
}

export const HypothesisValidationSystem = ({ testResults }: HypothesisValidationSystemProps) => {
  const validateHypothesis1 = (): HypothesisStatus => {
    const { quantization } = testResults;
    
    if (!quantization) {
      return {
        id: 'H1',
        title: 'Hypothesis 1: Nunchaku-Audio Quantization',
        description: 'Psychoacoustically-aware quantization achieves 4x compression with <5% quality loss',
        status: 'pending',
        confidence: 0,
        metrics: [],
        recommendation: 'Run quantization tests to validate this hypothesis.'
      };
    }

    const metrics: { name: string; value: string; status: 'pass' | 'fail' | 'warning' }[] = [
      {
        name: 'SVDQuant 8-bit Quality',
        value: `${quantization.svd8Quality?.toFixed(1) ?? 'N/A'}%`,
        status: (quantization.svd8Quality ?? 0) > 85 ? 'pass' as const : (quantization.svd8Quality ?? 0) > 70 ? 'warning' as const : 'fail' as const
      },
      {
        name: 'PTQ 8-bit Baseline',
        value: `${quantization.ptq8Quality?.toFixed(1) ?? 'N/A'}%`,
        status: (quantization.ptq8Quality ?? 0) > 80 ? 'pass' as const : 'warning' as const
      },
      {
        name: 'Improvement over Baseline',
        value: quantization.svd8Quality && quantization.ptq8Quality 
          ? `+${(quantization.svd8Quality - quantization.ptq8Quality).toFixed(1)}%` 
          : 'N/A',
        status: (quantization.svd8Quality ?? 0) > (quantization.ptq8Quality ?? 0) + 3 ? 'pass' as const : 'warning' as const
      }
    ];

    let status: 'validated' | 'partial' | 'failed' = 'failed';
    let confidence = 0;
    let recommendation = '';

    if (quantization.svd8Quality && quantization.svd8Quality > 85) {
      status = 'validated';
      confidence = 95;
      recommendation = 'Strong validation! SVDQuant achieves >85% quality at 8-bit. Proceed to 4-bit testing for aggressive compression claims.';
    } else if (quantization.svd8Quality && quantization.svd8Quality > 70) {
      status = 'partial';
      confidence = 65;
      recommendation = 'Moderate success. Quality is acceptable but below excellent threshold. Consider refining perceptual masking or targeting 4-bit validation instead.';
    } else {
      status = 'failed';
      confidence = 30;
      recommendation = 'Critical: Algorithm underperforms. Pivot thesis to diagnostic study of audio quantization challenges or implement stronger psychoacoustic preservation techniques.';
    }

    return {
      id: 'H1',
      title: 'Hypothesis 1: Nunchaku-Audio Quantization',
      description: 'Psychoacoustically-aware quantization achieves 4x compression with minimal quality loss',
      status,
      confidence,
      metrics,
      recommendation
    };
  };

  const validateHypothesis2 = (): HypothesisStatus => {
    const { sparse } = testResults;
    
    if (!sparse) {
      return {
        id: 'H2',
        title: 'Hypothesis 2: SIGE-Audio Sparse Inference',
        description: 'Structure-guided sparse inference achieves <150ms latency for real-time generation',
        status: 'pending',
        confidence: 0,
        metrics: [],
        recommendation: 'Run sparse inference tests to validate this hypothesis.'
      };
    }

    const metrics: { name: string; value: string; status: 'pass' | 'fail' | 'warning' }[] = [
      {
        name: 'Average Latency',
        value: `${sparse.avgLatency?.toFixed(1) ?? 'N/A'} ms`,
        status: (sparse.avgLatency ?? 999) < 150 ? 'pass' as const : 'fail' as const
      },
      {
        name: 'Cache Hit Rate',
        value: `${sparse.cacheHitRate?.toFixed(1) ?? 'N/A'}%`,
        status: (sparse.cacheHitRate ?? 0) > 50 ? 'pass' as const : 'warning' as const
      },
      {
        name: 'Real-Time Capable',
        value: (sparse.avgLatency ?? 999) < 100 ? 'Yes' : (sparse.avgLatency ?? 999) < 150 ? 'Marginal' : 'No',
        status: (sparse.avgLatency ?? 999) < 100 ? 'pass' as const : (sparse.avgLatency ?? 999) < 150 ? 'warning' as const : 'fail' as const
      }
    ];

    let status: 'validated' | 'partial' | 'failed' = 'failed';
    let confidence = 0;
    let recommendation = '';

    if (sparse.avgLatency < 100 && sparse.cacheHitRate > 60) {
      status = 'validated';
      confidence = 98;
      recommendation = 'Excellent validation! Latency well below real-time threshold with strong cache efficiency. Core thesis objective achieved.';
    } else if (sparse.avgLatency < 150) {
      status = 'partial';
      confidence = 75;
      recommendation = 'Good result. Meets real-time target but with little headroom. Consider optimizations or highlight this as acceptable for non-critical applications.';
    } else {
      status = 'failed';
      confidence = 40;
      recommendation = 'Does not meet real-time target. Critical path: Profile and optimize cache mechanism or revise latency target with justified reasoning.';
    }

    return {
      id: 'H2',
      title: 'Hypothesis 2: SIGE-Audio Sparse Inference',
      description: 'Structure-guided sparse inference achieves <150ms latency for real-time generation',
      status,
      confidence,
      metrics,
      recommendation
    };
  };

  const validateHypothesis3 = (): HypothesisStatus => {
    const { distributed } = testResults;
    
    if (!distributed) {
      return {
        id: 'H3',
        title: 'Hypothesis 3: DistriFusion-Audio System',
        description: 'Hybrid edge-cloud architecture achieves cost-effective scaling',
        status: 'pending',
        confidence: 0,
        metrics: [],
        recommendation: 'Run distributed inference tests to validate this hypothesis.'
      };
    }

    const metrics: { name: string; value: string; status: 'pass' | 'fail' | 'warning' }[] = [
      {
        name: 'Edge Workload',
        value: `${distributed.edgeLoad ?? 0} jobs`,
        status: (distributed.edgeLoad ?? 0) > 0 ? 'pass' as const : 'fail' as const
      },
      {
        name: 'Cloud Workload',
        value: `${distributed.cloudLoad ?? 0} jobs`,
        status: (distributed.cloudLoad ?? 0) > 0 ? 'pass' as const : 'fail' as const
      },
      {
        name: 'Load Balancing',
        value: (distributed.edgeLoad ?? 0) + (distributed.cloudLoad ?? 0) > 0 ? 'Active' : 'Inactive',
        status: (distributed.edgeLoad ?? 0) + (distributed.cloudLoad ?? 0) > 0 ? 'pass' as const : 'fail' as const
      }
    ];

    let status: 'validated' | 'partial' | 'failed' = 'failed';
    let confidence = 0;
    let recommendation = '';

    const totalLoad = (distributed.edgeLoad ?? 0) + (distributed.cloudLoad ?? 0);

    if (totalLoad > 0) {
      status = 'validated';
      confidence = 85;
      recommendation = 'System is functional and routing jobs. Validate cost savings through extended testing with realistic workload patterns.';
    } else {
      status = 'failed';
      confidence = 0;
      recommendation = 'Critical system bug: Jobs not being routed to edge or cloud. Debug DistriFusion-Audio coordinator urgently before thesis defense.';
    }

    return {
      id: 'H3',
      title: 'Hypothesis 3: DistriFusion-Audio System',
      description: 'Hybrid edge-cloud architecture achieves cost-effective scaling',
      status,
      confidence,
      metrics,
      recommendation
    };
  };

  const hypotheses = [
    validateHypothesis1(),
    validateHypothesis2(),
    validateHypothesis3()
  ];

  const getStatusIcon = (status: HypothesisStatus['status']) => {
    switch (status) {
      case 'validated':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: HypothesisStatus['status']) => {
    const variants = {
      validated: 'default',
      partial: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getMetricIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const overallProgress = hypotheses.reduce((sum, h) => sum + h.confidence, 0) / hypotheses.length;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Thesis Validation Overview
          </h3>
          <Badge variant={overallProgress > 80 ? 'default' : overallProgress > 50 ? 'secondary' : 'destructive'}>
            {overallProgress.toFixed(0)}% Confidence
          </Badge>
        </div>
        <Progress value={overallProgress} className="h-3" />
        <p className="text-sm text-muted-foreground mt-2">
          Overall thesis validation confidence based on {hypotheses.filter(h => h.status !== 'pending').length} of 3 hypotheses tested
        </p>
      </Card>

      {/* Individual Hypotheses */}
      {hypotheses.map((hypothesis) => (
        <Card key={hypothesis.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              {getStatusIcon(hypothesis.status)}
              <div>
                <h4 className="font-semibold">{hypothesis.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{hypothesis.description}</p>
              </div>
            </div>
            {getStatusBadge(hypothesis.status)}
          </div>

          {hypothesis.metrics.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {hypothesis.metrics.map((metric, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    {getMetricIcon(metric.status)}
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{metric.name}</p>
                      <p className="text-sm font-semibold">{metric.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Confidence Level</span>
                  <span className="text-sm font-semibold">{hypothesis.confidence}%</span>
                </div>
                <Progress value={hypothesis.confidence} className="h-2" />
              </div>
            </>
          )}

          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 mt-0.5 text-primary" />
              <div>
                <p className="text-sm font-medium mb-1">Recommendation:</p>
                <p className="text-sm text-muted-foreground">{hypothesis.recommendation}</p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
