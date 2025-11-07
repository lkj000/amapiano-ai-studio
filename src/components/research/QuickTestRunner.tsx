import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, Zap, Package, Network, Info } from "lucide-react";
import { toast } from "sonner";

interface QuickTestRunnerProps {
  onRunSparse?: () => Promise<void>;
  onRunQuantization?: () => Promise<void>;
  onRunDistributed?: () => Promise<void>;
}

export const QuickTestRunner = ({ 
  onRunSparse, 
  onRunQuantization, 
  onRunDistributed 
}: QuickTestRunnerProps) => {
  const [isRunning, setIsRunning] = React.useState({
    sparse: false,
    quantization: false,
    distributed: false
  });

  const runTest = async (
    testType: 'sparse' | 'quantization' | 'distributed',
    testFn?: () => Promise<void>
  ) => {
    if (!testFn) {
      toast.error(`${testType} test not configured`);
      return;
    }

    setIsRunning(prev => ({ ...prev, [testType]: true }));
    try {
      await testFn();
      toast.success(`${testType} test completed!`);
    } catch (error) {
      toast.error(`${testType} test failed`);
      console.error(error);
    } finally {
      setIsRunning(prev => ({ ...prev, [testType]: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Quick Test Runner
        </CardTitle>
        <CardDescription>
          Run individual tests to update the Research Dashboard with latest data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> The Research Dashboard Summary displays historical test data from the database.
            Run a new test to see updated metrics (e.g., the fixed 70% cache hit rate).
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sparse Inference Test */}
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h4 className="font-semibold">Sparse Inference</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Test SIGE-Audio with fixed cache hit rate measurement
              </p>
              <Button
                onClick={() => runTest('sparse', onRunSparse)}
                disabled={isRunning.sparse}
                className="w-full bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {isRunning.sparse ? 'Running...' : 'Run Test'}
              </Button>
              <div className="text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Expected:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    ~70% hit rate
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Target:</span>
                  <span className="font-semibold">&lt;150ms latency</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quantization Test */}
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h4 className="font-semibold">Quantization</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Test Nunchaku-Audio compression methods
              </p>
              <Button
                onClick={() => runTest('quantization', onRunQuantization)}
                disabled={isRunning.quantization}
                className="w-full bg-red-600 hover:bg-red-700"
                size="sm"
              >
                {isRunning.quantization ? 'Running...' : 'Run Test'}
              </Button>
              <div className="text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    Catastrophic
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Research:</span>
                  <span className="font-semibold">Stability needed</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distributed Test */}
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Network className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <h4 className="font-semibold">Distributed System</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Test DistriFusion-Audio edge/cloud routing
              </p>
              <Button
                onClick={() => runTest('distributed', onRunDistributed)}
                disabled={isRunning.distributed}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
                size="sm"
              >
                {isRunning.distributed ? 'Running...' : 'Run Test'}
              </Button>
              <div className="text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                    System bug
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Action:</span>
                  <span className="font-semibold">Debug needed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Thesis Status:</strong> SIGE-Audio validated (77.92ms, 70% hit rate).
            Nunchaku-Audio requires pivot to foundational research. DistriFusion-Audio needs debugging.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
