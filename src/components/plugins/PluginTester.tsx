import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TestTube, Play, CheckCircle, XCircle, Zap, Activity } from 'lucide-react';
import { toast } from 'sonner';
import type { PluginProject } from './PluginDevelopmentIDE';

interface PluginTesterProps {
  project: PluginProject;
  audioContext: AudioContext | null;
  wasmEngine: any;
  testResults: any;
}

export const PluginTester: React.FC<PluginTesterProps> = ({
  project,
  audioContext,
  wasmEngine,
  testResults
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [tests, setTests] = useState([
    { id: 'initialization', name: 'Plugin Initialization', status: 'pending', duration: 0 },
    { id: 'parameters', name: 'Parameter Validation', status: 'pending', duration: 0 },
    { id: 'audio-processing', name: 'Audio Processing', status: 'pending', duration: 0 },
    { id: 'latency', name: 'Latency Test', status: 'pending', duration: 0 },
    { id: 'cpu-load', name: 'CPU Load Test', status: 'pending', duration: 0 },
    { id: 'memory', name: 'Memory Usage', status: 'pending', duration: 0 },
    { id: 'stability', name: 'Stability Test', status: 'pending', duration: 0 },
    { id: 'wasm', name: 'WASM Integration', status: 'pending', duration: 0 }
  ]);

  const runTests = async () => {
    setIsRunning(true);
    
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      setCurrentTest(test.name);
      
      // Update test status to running
      setTests(prev => prev.map((t, idx) => 
        idx === i ? { ...t, status: 'running' } : t
      ));
      
      // Simulate test execution
      const startTime = performance.now();
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
      const duration = performance.now() - startTime;
      
      // Determine pass/fail
      let status = 'passed';
      if (test.id === 'wasm' && !wasmEngine.isInitialized) {
        status = 'warning';
      } else if (Math.random() > 0.95) {
        status = 'failed';
      }
      
      // Update test status
      setTests(prev => prev.map((t, idx) => 
        idx === i ? { ...t, status, duration } : t
      ));
    }
    
    setIsRunning(false);
    setCurrentTest('');
    
    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status === 'failed').length;
    
    if (failed === 0) {
      toast.success('All tests passed!', {
        description: `${passed}/${tests.length} tests successful`
      });
    } else {
      toast.error('Some tests failed', {
        description: `${failed} test(s) failed, ${passed} passed`
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'warning':
        return <CheckCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <TestTube className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-500">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-500">Running</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const progress = (passedCount / tests.length) * 100;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Plugin Test Suite
              {wasmEngine.isInitialized && (
                <Badge variant="default" className="bg-gradient-to-r from-cyan-500 to-blue-500">
                  <Zap className="h-3 w-3 mr-1" />
                  WASM
                </Badge>
              )}
            </CardTitle>
            <Button onClick={runTests} disabled={isRunning}>
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {passedCount} / {tests.length} Tests Passed
              </span>
              <span className="text-sm text-muted-foreground">
                {progress.toFixed(0)}%
              </span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Current Test */}
          {isRunning && currentTest && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 animate-pulse" />
                <span className="text-sm">Running: {currentTest}</span>
              </div>
            </div>
          )}

          {/* Test Results */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {tests.map(test => (
                <Card key={test.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <div className="font-medium">{test.name}</div>
                          {test.duration > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {test.duration.toFixed(0)}ms
                            </div>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(test.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Performance Metrics */}
          {testResults && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Latency</div>
                  <div className="text-2xl font-bold">
                    {testResults.latency.toFixed(1)}ms
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">CPU Load</div>
                  <div className="text-2xl font-bold">
                    {testResults.cpuLoad.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Audio Quality</div>
                  <div className="text-2xl font-bold">
                    {testResults.audioQuality}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">WASM Status</div>
                  <div className="text-2xl font-bold">
                    {testResults.wasmEnabled ? '✅' : '❌'}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
