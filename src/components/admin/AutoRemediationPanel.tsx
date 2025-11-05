import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Settings, Zap, AlertTriangle, CheckCircle, Play } from "lucide-react";

interface RemediationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  autoExecute: boolean;
}

export const AutoRemediationPanel = () => {
  const [rules, setRules] = useState<RemediationRule[]>([
    {
      id: 'high-latency',
      name: 'High Latency Response',
      trigger: 'Latency > 500ms for 3 consecutive measurements',
      action: 'Switch to WASM acceleration and clear cache',
      enabled: true,
      autoExecute: false
    },
    {
      id: 'high-cpu',
      name: 'High CPU Usage',
      trigger: 'CPU > 90% for 5 minutes',
      action: 'Throttle non-critical processes',
      enabled: true,
      autoExecute: false
    },
    {
      id: 'cost-threshold',
      name: 'Cost Threshold Exceeded',
      trigger: 'Daily cost > $50',
      action: 'Send alert and reduce generation frequency',
      enabled: true,
      autoExecute: true
    },
    {
      id: 'memory-leak',
      name: 'Memory Leak Detection',
      trigger: 'Memory usage increasing > 10% per hour',
      action: 'Force garbage collection and restart workers',
      enabled: false,
      autoExecute: false
    },
    {
      id: 'anomaly-cluster',
      name: 'Anomaly Clustering',
      trigger: '3+ critical anomalies in 10 minutes',
      action: 'Trigger system health check and notify admins',
      enabled: true,
      autoExecute: true
    }
  ]);

  const [lastExecution, setLastExecution] = useState<{ [key: string]: Date }>({});

  const toggleRule = (id: string) => {
    setRules(rules.map(rule =>
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
    toast.success(`Rule ${rules.find(r => r.id === id)?.name} ${rules.find(r => r.id === id)?.enabled ? 'disabled' : 'enabled'}`);
  };

  const toggleAutoExecute = (id: string) => {
    setRules(rules.map(rule =>
      rule.id === id ? { ...rule, autoExecute: !rule.autoExecute } : rule
    ));
    toast.success(`Auto-execute ${rules.find(r => r.id === id)?.autoExecute ? 'disabled' : 'enabled'}`);
  };

  const executeRemediation = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    toast.info(`Executing: ${rule.name}`);

    try {
      // Simulate remediation execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      setLastExecution(prev => ({
        ...prev,
        [ruleId]: new Date()
      }));

      toast.success(`${rule.name} executed successfully`);
    } catch (error) {
      toast.error(`Failed to execute ${rule.name}`);
      console.error(error);
    }
  };

  const enabledCount = rules.filter(r => r.enabled).length;
  const autoExecuteCount = rules.filter(r => r.autoExecute).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Auto-Remediation
            </CardTitle>
            <CardDescription>
              Automated responses to performance issues
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">
              {enabledCount}/{rules.length} Enabled
            </Badge>
            <Badge className="bg-blue-500">
              <Zap className="h-3 w-3 mr-1" />
              {autoExecuteCount} Auto
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Auto-remediation can help resolve issues automatically, but use caution with auto-execute enabled.
            Test rules manually before enabling auto-execution.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{rule.name}</h4>
                    {rule.enabled && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">Trigger:</span> {rule.trigger}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Action:</span> {rule.action}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                    <Label className="text-sm">Enabled</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.autoExecute}
                      onCheckedChange={() => toggleAutoExecute(rule.id)}
                      disabled={!rule.enabled}
                    />
                    <Label className="text-sm">Auto-Execute</Label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {lastExecution[rule.id] && (
                    <span className="text-xs text-muted-foreground">
                      Last: {lastExecution[rule.id].toLocaleTimeString()}
                    </span>
                  )}
                  <Button
                    onClick={() => executeRemediation(rule.id)}
                    disabled={!rule.enabled}
                    variant="outline"
                    size="sm"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Execute
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Alert className="bg-blue-500/10 border-blue-500/20">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>Tip:</strong> Test remediation rules manually first before enabling auto-execution.
            Monitor the execution history to ensure rules are working as expected.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
