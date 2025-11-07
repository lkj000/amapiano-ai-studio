import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDistributedInference } from "@/hooks/useDistributedInference";
import { useSparseInferenceCache } from "@/hooks/useSparseInferenceCache";
import { Play, Pause, RotateCw, CheckCircle2, XCircle, Clock, Bell, BellOff } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  id: string;
  hypothesis: string;
  testName: string;
  status: 'running' | 'passed' | 'failed' | 'pending';
  result?: string;
  duration?: number;
  timestamp: Date;
}

export const AutomatedTestSuite = () => {
  const { submitJob, isInitialized, stats: distriStats } = useDistributedInference();
  const { stats: cacheStats, processWithCache, getStats } = useSparseInferenceCache();
  
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [autoRun, setAutoRun] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [alertEmail, setAlertEmail] = useState('');
  const [lastAlertSent, setLastAlertSent] = useState<Date | null>(null);

  // Automated test runner
  useEffect(() => {
    if (!autoRun) return;

    const interval = setInterval(() => {
      runFullTestSuite();
    }, 300000); // Run every 5 minutes

    return () => clearInterval(interval);
  }, [autoRun, isInitialized]);

  const runFullTestSuite = async () => {
    if (!isInitialized) {
      toast.error('System not initialized');
      return;
    }

    setIsRunning(true);
    const startTime = Date.now();

    try {
      // Test 1: SIGE-Audio Latency Test
      await runTest({
        id: `sige-latency-${Date.now()}`,
        hypothesis: 'SIGE-Audio',
        testName: 'Sparse Inference Latency',
        status: 'running',
        timestamp: new Date()
      }, async () => {
        const testStart = Date.now();
        
        // Simulate cache processing test
        const testInput = new Float32Array(1000).fill(0.5);
        await processWithCache(
          'test-layer',
          testInput,
          async (input) => new Float32Array(input.length).fill(0.7)
        );
        
        const duration = Date.now() - testStart;
        
        if (duration < 1500) { // 150ms per operation
          return { status: 'passed' as const, result: `${duration}ms (Target: <1500ms)` };
        } else {
          return { status: 'failed' as const, result: `${duration}ms (Exceeded target)` };
        }
      });

      // Test 2: SIGE-Audio Cache Hit Rate
      await runTest({
        id: `sige-cache-${Date.now()}`,
        hypothesis: 'SIGE-Audio',
        testName: 'Cache Hit Rate',
        status: 'running',
        timestamp: new Date()
      }, async () => {
        // Create sparse data (70% zeros = 70% sparsity, above 30% threshold)
        const input = new Float32Array(1000);
        for (let i = 0; i < 300; i++) input[i] = 0.5; // 30% non-zero
        
        const layerId = 'cache-test-layer';
        
        // Create sparse output that will be cached
        const sparseOutput = new Float32Array(1000);
        for (let i = 0; i < 200; i++) sparseOutput[i] = 0.8; // 20% non-zero

        // First call - cache miss, stores sparse result
        await processWithCache(
          layerId,
          input,
          async () => sparseOutput
        );
        
        // Second call - should hit cache with same input
        await processWithCache(
          layerId,
          input,
          async () => sparseOutput
        );

        // Read latest stats
        const current = getStats();
        const percent = (current.hitRate || 0) * 100;
        
        if (percent >= 50) {
          return { status: 'passed' as const, result: `${percent.toFixed(1)}% (Target: >50%)` };
        } else {
          return { status: 'failed' as const, result: `${percent.toFixed(1)}% (Below target)` };
        }
      });

      // Test 3: DistriFusion Edge Routing
      await runTest({
        id: `distri-edge-${Date.now()}`,
        hypothesis: 'DistriFusion-Audio',
        testName: 'Edge Node Routing',
        status: 'running',
        timestamp: new Date()
      }, async () => {
        const jobId = await submitJob('test-edge', { complexity: 'low' }, 8);
        
        if (jobId) {
          return { status: 'passed' as const, result: `Job routed successfully` };
        } else {
          return { status: 'failed' as const, result: `Job routing failed` };
        }
      });

      // Test 4: DistriFusion Cloud Routing
      await runTest({
        id: `distri-cloud-${Date.now()}`,
        hypothesis: 'DistriFusion-Audio',
        testName: 'Cloud Node Routing',
        status: 'running',
        timestamp: new Date()
      }, async () => {
        const jobId = await submitJob('test-cloud', { complexity: 'high' }, 5);
        
        if (jobId) {
          return { status: 'passed' as const, result: `Job routed successfully` };
        } else {
          return { status: 'failed' as const, result: `Job routing failed` };
        }
      });

      // Test 5: System Load Distribution
      await runTest({
        id: `distri-load-${Date.now()}`,
        hypothesis: 'DistriFusion-Audio',
        testName: 'Load Distribution',
        status: 'running',
        timestamp: new Date()
      }, async () => {
        const edgeLoad = distriStats.edgeLoad;
        const cloudLoad = distriStats.cloudLoad;
        
        if (edgeLoad > 0 && cloudLoad > 0) {
          return { 
            status: 'passed' as const, 
            result: `Edge: ${edgeLoad}, Cloud: ${cloudLoad}` 
          };
        } else {
          return { 
            status: 'failed' as const, 
            result: `Imbalanced: Edge ${edgeLoad}, Cloud ${cloudLoad}` 
          };
        }
      });

      const totalDuration = Date.now() - startTime;
      const passed = testResults.filter(r => r.status === 'passed').length;
      const total = testResults.length;
      const successRate = (passed / total) * 100;

      toast.success(`Test suite completed: ${passed}/${total} passed in ${(totalDuration/1000).toFixed(1)}s`);
      
      // Check if alerts should be sent
      if (alertsEnabled && alertEmail && successRate < 95) {
        await sendAlert('test_failure', successRate);
      }
      
    } catch (error) {
      toast.error('Test suite failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRunning(false);
    }
  };

  const runTest = async (
    testInfo: TestResult,
    testFn: () => Promise<{ status: 'passed' | 'failed'; result: string }>
  ) => {
    // Add test as running
    setTestResults(prev => [testInfo, ...prev]);

    const startTime = Date.now();

    try {
      const { status, result } = await testFn();
      const duration = Date.now() - startTime;

      // Update test result
      setTestResults(prev => prev.map(t => 
        t.id === testInfo.id 
          ? { ...t, status, result, duration }
          : t
      ));
    } catch (error) {
      const duration = Date.now() - startTime;
      
      setTestResults(prev => prev.map(t => 
        t.id === testInfo.id 
          ? { 
              ...t, 
              status: 'failed' as const, 
              result: error instanceof Error ? error.message : 'Unknown error',
              duration 
            }
          : t
      ));
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-destructive" />;
      case 'running': return <RotateCw className="w-5 h-5 animate-spin text-primary" />;
      default: return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <Badge className="bg-green-500">Passed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'running': return <Badge variant="outline">Running...</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const sendAlert = async (alertType: 'test_failure' | 'metric_failure' | 'system_critical', successRate?: number) => {
    if (!alertEmail) {
      toast.error('Alert email not configured');
      return;
    }

    // Rate limit: don't send more than 1 alert per 10 minutes
    if (lastAlertSent && Date.now() - lastAlertSent.getTime() < 600000) {
      console.log('[Alert] Rate limited, skipping alert');
      return;
    }

    try {
      const failedTests = testResults
        .filter(t => t.status === 'failed')
        .slice(0, 10)
        .map(t => ({
          testName: t.testName,
          hypothesis: t.hypothesis,
          result: t.result || 'No result'
        }));

      const { data, error } = await supabase.functions.invoke('send-research-alert', {
        body: {
          alertType,
          successRate,
          failedTests,
          timestamp: new Date().toISOString(),
          recipientEmail: alertEmail
        }
      });

      if (error) throw error;

      setLastAlertSent(new Date());
      toast.success('Alert email sent successfully', {
        description: `Notification sent to ${alertEmail}`
      });
    } catch (error) {
      console.error('[Alert] Failed to send:', error);
      toast.error('Failed to send alert email');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Automated Thesis Test Suite</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Continuous validation of all thesis hypotheses
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            variant={alertsEnabled ? "default" : "outline"}
            size="sm"
          >
            {alertsEnabled ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
            {alertsEnabled ? 'Alerts On' : 'Alerts Off'}
          </Button>
          <Button
            onClick={() => setAutoRun(!autoRun)}
            variant={autoRun ? "default" : "outline"}
            disabled={!isInitialized}
          >
            {autoRun ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {autoRun ? 'Stop Auto-Run' : 'Start Auto-Run'}
          </Button>
          <Button
            onClick={runFullTestSuite}
            disabled={isRunning || !isInitialized}
          >
            <RotateCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            Run Tests
          </Button>
        </div>
      </div>

      {/* Alert Configuration */}
      {alertsEnabled && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground block mb-2">
                Alert Email (failures below 95%)
              </label>
              <input
                type="email"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>
            {lastAlertSent && (
              <div className="text-xs text-muted-foreground">
                Last alert: {lastAlertSent.toLocaleTimeString()}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Tests</p>
          <p className="text-3xl font-bold">{testResults.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Passed</p>
          <p className="text-3xl font-bold text-green-500">
            {testResults.filter(r => r.status === 'passed').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Failed</p>
          <p className="text-3xl font-bold text-destructive">
            {testResults.filter(r => r.status === 'failed').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Success Rate</p>
          <p className="text-3xl font-bold">
            {testResults.length > 0 
              ? ((testResults.filter(r => r.status === 'passed').length / testResults.filter(r => r.status !== 'running' && r.status !== 'pending').length) * 100).toFixed(0)
              : 0}%
          </p>
        </Card>
      </div>

      {/* Test Results */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Test Results</h4>
        <div className="space-y-3">
          {testResults.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No tests run yet. Click "Run Tests" to start validation.
            </p>
          ) : (
            testResults.map(test => (
              <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <p className="font-semibold">{test.testName}</p>
                    <p className="text-sm text-muted-foreground">
                      {test.hypothesis} • {test.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {test.result && (
                    <span className="text-sm text-muted-foreground">{test.result}</span>
                  )}
                  {test.duration && (
                    <span className="text-sm text-muted-foreground">
                      {(test.duration / 1000).toFixed(2)}s
                    </span>
                  )}
                  {getStatusBadge(test.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
