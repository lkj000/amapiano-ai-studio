import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Settings, Shield, Users, TrendingUp } from "lucide-react";

const FederatedLearningPanel = () => {
  const { toast } = useToast();
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [privacyBudget, setPrivacyBudget] = useState([3.0]);
  const [minParticipants, setMinParticipants] = useState([10]);
  const [enableDP, setEnableDP] = useState(true);

  const federatedMetrics = {
    activeNodes: 847,
    totalRounds: 156,
    currentRound: 123,
    avgLoss: 0.342,
    modelAccuracy: 94.2,
    privacyGuarantee: "ε=3.0, δ=1e-5",
    communicationCost: "42.3 MB/round",
  };

  const nodeDistribution = [
    { region: "South Africa", nodes: 423, contribution: 49.9 },
    { region: "Nigeria", nodes: 187, contribution: 22.1 },
    { region: "Kenya", nodes: 134, contribution: 15.8 },
    { region: "Ghana", nodes: 103, contribution: 12.2 },
  ];

  const startTraining = () => {
    setIsTraining(true);
    toast({
      title: "Federated Training Started",
      description: `Training across ${federatedMetrics.activeNodes} nodes with DP privacy`,
    });

    // Simulate training progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setTrainingProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsTraining(false);
        toast({
          title: "Training Round Complete",
          description: "Model updated with federated aggregation",
        });
      }
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AURA-X Federated Learning</CardTitle>
              <CardDescription>Privacy-preserving distributed music model training</CardDescription>
            </div>
            <Button
              onClick={startTraining}
              disabled={isTraining}
              className="gap-2"
            >
              {isTraining ? (
                <>
                  <Pause className="w-4 h-4" />
                  Training...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Round
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Training Progress */}
          {isTraining && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Training Progress</span>
                <span>{trainingProgress}%</span>
              </div>
              <Progress value={trainingProgress} />
            </div>
          )}

          {/* Privacy Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dp-toggle">Differential Privacy</Label>
                <p className="text-sm text-muted-foreground">
                  Add noise for privacy guarantee
                </p>
              </div>
              <Switch
                id="dp-toggle"
                checked={enableDP}
                onCheckedChange={setEnableDP}
              />
            </div>

            {enableDP && (
              <>
                <div className="space-y-2">
                  <Label>Privacy Budget (ε): {privacyBudget[0].toFixed(1)}</Label>
                  <Slider
                    value={privacyBudget}
                    onValueChange={setPrivacyBudget}
                    min={0.1}
                    max={10}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower values = stronger privacy, higher values = better accuracy
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Minimum Participants: {minParticipants[0]}</Label>
                  <Slider
                    value={minParticipants}
                    onValueChange={setMinParticipants}
                    min={5}
                    max={50}
                    step={5}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Nodes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{federatedMetrics.activeNodes}</div>
            <p className="text-xs text-muted-foreground">Participating devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Model Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{federatedMetrics.modelAccuracy}%</div>
            <Progress value={federatedMetrics.modelAccuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono">{federatedMetrics.privacyGuarantee}</div>
            <p className="text-xs text-muted-foreground mt-1">Differential privacy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Training Rounds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {federatedMetrics.currentRound}/{federatedMetrics.totalRounds}
            </div>
            <Progress value={(federatedMetrics.currentRound / federatedMetrics.totalRounds) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Node Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Node Distribution</CardTitle>
          <CardDescription>Federated learning participants by region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nodeDistribution.map((region, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{region.nodes} nodes</Badge>
                    <span className="font-medium">{region.region}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{region.contribution}%</span>
                </div>
                <Progress value={region.contribution} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Training Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Research Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Privacy Preservation</h4>
              <p className="text-sm text-muted-foreground">
                Differential privacy with ε={privacyBudget[0].toFixed(1)} ensures no individual
                training data can be extracted while maintaining {federatedMetrics.modelAccuracy}% accuracy.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Scalability</h4>
              <p className="text-sm text-muted-foreground">
                System scales to {federatedMetrics.activeNodes} concurrent participants with only{" "}
                {federatedMetrics.communicationCost} overhead per round.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <Users className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Cultural Diversity</h4>
              <p className="text-sm text-muted-foreground">
                Multi-regional training preserves cultural authenticity while preventing model bias
                through balanced aggregation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FederatedLearningPanel;
