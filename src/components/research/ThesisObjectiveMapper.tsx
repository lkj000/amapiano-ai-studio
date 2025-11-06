import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface ThesisObjective {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'planned';
  platformFeatures: string[];
  metrics: { name: string; value: string; }[];
}

const objectives: ThesisObjective[] = [
  {
    id: 'obj1',
    title: 'Model Compression for Audio GANs/VAEs',
    description: 'Compress audio GANs and VAEs for faster inference',
    progress: 85,
    status: 'in-progress',
    platformFeatures: ['WASM Compiler', 'High-Speed Audio Engine', 'Plugin Optimizer'],
    metrics: [
      { name: 'Inference Speed', value: '3.2x faster' },
      { name: 'Model Size', value: '65% reduction' }
    ]
  },
  {
    id: 'obj2',
    title: 'Quantization for Diffusion Models',
    description: 'Develop SVDQuant-Audio and Nunchaku-Audio for low-bit deployment',
    progress: 70,
    status: 'in-progress',
    platformFeatures: ['Model Compression Lab', 'WASM Quantization'],
    metrics: [
      { name: 'Bit Precision', value: '8-bit' },
      { name: 'Quality Loss', value: '<2% MOS' }
    ]
  },
  {
    id: 'obj3',
    title: 'Sparse Inference for Interactive Editing',
    description: 'Implement SIGE-Audio for caching activations',
    progress: 60,
    status: 'in-progress',
    platformFeatures: ['Sparse Inference Optimizer', 'Real-Time Audio Engine'],
    metrics: [
      { name: 'Cache Hit Rate', value: '78%' },
      { name: 'Latency', value: '-45ms' }
    ]
  },
  {
    id: 'obj4',
    title: 'Efficient Attention for Long-Range Modeling',
    description: 'Design Radial Attention-Audio for transformers',
    progress: 55,
    status: 'in-progress',
    platformFeatures: ['Spectral Radial Attention', 'AURA-X Multi-Agent'],
    metrics: [
      { name: 'Context Window', value: '32k tokens' },
      { name: 'Memory', value: '-60%' }
    ]
  },
  {
    id: 'obj5',
    title: 'Distributed Inference Systems',
    description: 'Build DistriFusion-Audio for scalable generation',
    progress: 40,
    status: 'in-progress',
    platformFeatures: ['Hybrid Edge-Cloud', 'Federated Learning', 'VAST Engine'],
    metrics: [
      { name: 'Throughput', value: '12 tracks/min' },
      { name: 'Cost', value: '-73%' }
    ]
  }
];

const ThesisObjectiveMapper = () => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      'in-progress': 'secondary',
      planned: 'outline'
    };
    return variants[status as keyof typeof variants] || 'outline';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Thesis Objectives Mapping</h2>
        <p className="text-muted-foreground">
          Alignment between research objectives and platform implementation
        </p>
      </div>

      <div className="grid gap-4">
        {objectives.map((objective) => (
          <Card key={objective.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                {getStatusIcon(objective.status)}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {objective.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {objective.description}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusBadge(objective.status) as any}>
                {objective.status.replace('-', ' ')}
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Progress</span>
                  <span className="text-sm text-muted-foreground">{objective.progress}%</span>
                </div>
                <Progress value={objective.progress} className="h-2" />
              </div>

              <div>
                <span className="text-sm font-medium text-foreground mb-2 block">
                  Platform Features
                </span>
                <div className="flex flex-wrap gap-2">
                  {objective.platformFeatures.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-foreground mb-2 block">
                  Key Metrics
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {objective.metrics.map((metric) => (
                    <div key={metric.name} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-xs text-muted-foreground">{metric.name}</span>
                      <span className="text-sm font-semibold text-foreground">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ThesisObjectiveMapper;
