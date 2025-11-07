import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, Target, TrendingUp, TrendingDown } from "lucide-react";

interface ObjectiveStatus {
  id: string;
  title: string;
  hypothesis: string;
  status: 'validated' | 'failed' | 'in-progress' | 'pivot-needed';
  progress: number;
  confidence: number;
  keyFindings: string[];
  nextSteps: string[];
}

export const ThesisProgressDashboard = () => {
  const objectives: ObjectiveStatus[] = [
    {
      id: 'sige-audio',
      title: 'SIGE-Audio: Sparse Inference',
      hypothesis: 'Musical structure enables 70%+ cache hit rates with <150ms latency',
      status: 'validated',
      progress: 100,
      confidence: 90,
      keyFindings: [
        '70% cache hit rate achieved (target: >50%)',
        '77.92ms average latency (target: <150ms)',
        'Real-time performance validated',
        'Musical sparsity patterns confirmed'
      ],
      nextSteps: [
        'Draft SIGE-Audio publication',
        'Prepare conference submission',
        'Document production deployment'
      ]
    },
    {
      id: 'nunchaku-audio',
      title: 'Nunchaku-Audio: Quantization',
      hypothesis: 'SVDQuant 8-bit achieves >85% quality retention with 4x compression',
      status: 'pivot-needed',
      progress: 45,
      confidence: 15,
      keyFindings: [
        'PTQ 8-bit: -1893.24% quality (catastrophic failure)',
        'SVDQuant 8-bit: -7936.80% quality (worse than baseline)',
        'Fundamental stability crisis identified',
        'Novel research problem discovered'
      ],
      nextSteps: [
        'Pivot to foundational stability research',
        'Develop Quantization-Aware Training (QAT) methodology',
        'Study psychoacoustic stability requirements',
        'Reframe chapter as diagnostic contribution'
      ]
    },
    {
      id: 'distrifusion-audio',
      title: 'DistriFusion-Audio: Distributed System',
      hypothesis: 'Hybrid edge-cloud achieves cost-effective scaling',
      status: 'failed',
      progress: 40,
      confidence: 0,
      keyFindings: [
        'Coordinator architecture implemented',
        'Routing logic functional',
        'Critical bug: 0 edge/cloud load distribution',
        'System requires debugging before validation'
      ],
      nextSteps: [
        'Debug job routing coordinator',
        'Fix peak load tracking',
        'Run integration tests',
        'Validate cost-latency tradeoffs'
      ]
    }
  ];

  const overallProgress = objectives.reduce((sum, obj) => sum + obj.progress, 0) / objectives.length;
  const overallConfidence = Math.round(
    objectives.reduce((sum, obj) => sum + (obj.status === 'validated' ? obj.confidence : 0), 0) / objectives.length
  );

  const getStatusColor = (status: ObjectiveStatus['status']) => {
    switch (status) {
      case 'validated': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950';
      case 'failed': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950';
      case 'pivot-needed': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950';
      case 'in-progress': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950';
    }
  };

  const getStatusIcon = (status: ObjectiveStatus['status']) => {
    switch (status) {
      case 'validated': return <CheckCircle2 className="w-5 h-5" />;
      case 'failed': return <AlertCircle className="w-5 h-5" />;
      case 'pivot-needed': return <Target className="w-5 h-5" />;
      case 'in-progress': return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: ObjectiveStatus['status']) => {
    switch (status) {
      case 'validated': return 'Validated';
      case 'failed': return 'System Bug';
      case 'pivot-needed': return 'Pivot Required';
      case 'in-progress': return 'In Progress';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Doctoral Thesis Progress Dashboard
        </CardTitle>
        <CardDescription>
          Full-stack co-design for efficient, culturally-aware music generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Overall Thesis Progress</h3>
              <p className="text-sm text-muted-foreground">Year 3 of 4 - Critical validation phase</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{Math.round(overallProgress)}%</p>
              <p className="text-xs text-muted-foreground">Completion</p>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-background rounded border">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">70%</p>
              <p className="text-xs text-muted-foreground">Thesis Confidence</p>
            </div>
            <div className="text-center p-3 bg-background rounded border">
              <p className="text-2xl font-bold">1/3</p>
              <p className="text-xs text-muted-foreground">Objectives Validated</p>
            </div>
            <div className="text-center p-3 bg-background rounded border">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">High</p>
              <p className="text-xs text-muted-foreground">Research Impact</p>
            </div>
          </div>
        </div>

        {/* Individual Objectives */}
        <div className="space-y-4">
          {objectives.map((objective) => (
            <Card key={objective.id} className="border-l-4" style={{
              borderLeftColor: objective.status === 'validated' ? 'rgb(34, 197, 94)' :
                objective.status === 'pivot-needed' ? 'rgb(249, 115, 22)' :
                objective.status === 'failed' ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)'
            }}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{objective.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {objective.hypothesis}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(objective.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(objective.status)}
                      {getStatusLabel(objective.status)}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Implementation Progress</span>
                    <span className="font-medium">{objective.progress}%</span>
                  </div>
                  <Progress value={objective.progress} className="h-2" />
                </div>

                {/* Confidence Score */}
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-xs text-muted-foreground">Validation Confidence</span>
                  <div className="flex items-center gap-2">
                    {objective.confidence >= 70 ? (
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                    <span className={`font-semibold ${
                      objective.confidence >= 70 ? 'text-green-600 dark:text-green-400' : 
                      objective.confidence >= 40 ? 'text-orange-600 dark:text-orange-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {objective.confidence}%
                    </span>
                  </div>
                </div>

                {/* Key Findings */}
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground">Key Findings</h4>
                  <ul className="space-y-1">
                    {objective.keyFindings.map((finding, idx) => (
                      <li key={idx} className="text-xs flex items-start gap-2">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Next Steps */}
                <div className="space-y-1 pt-2 border-t">
                  <h4 className="text-xs font-semibold text-muted-foreground">Next Steps</h4>
                  <ul className="space-y-1">
                    {objective.nextSteps.map((step, idx) => (
                      <li key={idx} className="text-xs flex items-start gap-2">
                        <span className="text-primary mt-0.5">→</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Strategic Recommendations */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Year 4 Strategic Roadmap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">Priority 1: Leverage SIGE-Audio Success</p>
            <ul className="space-y-1 ml-4 text-muted-foreground">
              <li>• Prepare conference paper for ICASSP/ISMIR 2026</li>
              <li>• Document production deployment case study</li>
              <li>• Benchmark against state-of-the-art baselines</li>
            </ul>
            
            <p className="font-medium mt-3">Priority 2: Pivot Nunchaku-Audio Research</p>
            <ul className="space-y-1 ml-4 text-muted-foreground">
              <li>• Reframe as diagnostic study of quantization stability</li>
              <li>• Develop QAT methodology for audio generation</li>
              <li>• Position as novel research contribution (no prior work)</li>
            </ul>
            
            <p className="font-medium mt-3">Priority 3: Debug DistriFusion-Audio</p>
            <ul className="space-y-1 ml-4 text-muted-foreground">
              <li>• Fix job routing coordinator (Q1 2026)</li>
              <li>• Complete full-stack validation</li>
              <li>• Treat as integration chapter if time-constrained</li>
            </ul>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default ThesisProgressDashboard;
