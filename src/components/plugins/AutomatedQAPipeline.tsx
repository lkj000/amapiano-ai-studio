import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertCircle, Play, Shield, Zap, Code, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

interface QATest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  duration?: number;
  details?: string;
}

export function AutomatedQAPipeline() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tests, setTests] = useState<QATest[]>([
    {
      id: '1',
      name: 'Security Scan',
      description: 'Scanning for malicious code, vulnerabilities, and security issues',
      status: 'pending',
    },
    {
      id: '2',
      name: 'Performance Test',
      description: 'Testing CPU usage, memory footprint, and latency',
      status: 'pending',
    },
    {
      id: '3',
      name: 'Code Quality',
      description: 'Analyzing code structure, best practices, and patterns',
      status: 'pending',
    },
    {
      id: '4',
      name: 'API Compatibility',
      description: 'Verifying JUCE framework compatibility and API usage',
      status: 'pending',
    },
    {
      id: '5',
      name: 'Audio Processing',
      description: 'Testing audio quality, artifacts, and DSP correctness',
      status: 'pending',
    },
    {
      id: '6',
      name: 'UI/UX Validation',
      description: 'Checking parameter ranges, UI responsiveness, and accessibility',
      status: 'pending',
    },
  ]);

  const runQA = async () => {
    setIsRunning(true);
    setProgress(0);

    const updatedTests = [...tests];
    
    for (let i = 0; i < updatedTests.length; i++) {
      // Set test to running
      updatedTests[i] = { ...updatedTests[i], status: 'running' };
      setTests([...updatedTests]);
      
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Randomly pass/fail/warn for demo
      const outcomes: Array<'passed' | 'failed' | 'warning'> = ['passed', 'passed', 'passed', 'warning', 'failed'];
      const result = outcomes[Math.floor(Math.random() * outcomes.length)];
      
      updatedTests[i] = {
        ...updatedTests[i],
        status: result,
        duration: Math.random() * 3 + 0.5,
        details: result === 'failed' 
          ? 'Found critical issue that needs attention'
          : result === 'warning'
          ? 'Minor issue detected - review recommended'
          : 'All checks passed successfully',
      };
      
      setTests([...updatedTests]);
      setProgress(((i + 1) / updatedTests.length) * 100);
    }

    setIsRunning(false);
    
    const failedCount = updatedTests.filter(t => t.status === 'failed').length;
    const warningCount = updatedTests.filter(t => t.status === 'warning').length;
    
    if (failedCount > 0) {
      toast.error(`QA Pipeline Failed - ${failedCount} critical issues found`);
    } else if (warningCount > 0) {
      toast.warning(`QA Complete - ${warningCount} warnings to review`);
    } else {
      toast.success('All QA tests passed! Plugin ready for submission');
    }
  };

  const getStatusIcon = (status: QATest['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'running':
        return <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="h-4 w-4 border-2 border-muted rounded-full" />;
    }
  };

  const getStatusBadge = (status: QATest['status']) => {
    switch (status) {
      case 'passed':
        return <Badge variant="default" className="bg-green-600">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'warning':
        return <Badge variant="default" className="bg-yellow-600">Warning</Badge>;
      case 'running':
        return <Badge variant="secondary">Running...</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Automated QA Pipeline
            </CardTitle>
            <CardDescription>
              Run comprehensive quality assurance tests on your plugin
            </CardDescription>
          </div>
          <Button onClick={runQA} disabled={isRunning}>
            {isRunning ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-pulse" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run QA Tests
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Test Results */}
        <div className="space-y-3">
          {tests.map((test) => (
            <Card key={test.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getStatusIcon(test.status)}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{test.name}</h4>
                      {getStatusBadge(test.status)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {test.description}
                    </p>
                    
                    {test.details && (
                      <p className="text-xs text-muted-foreground">
                        {test.details}
                      </p>
                    )}
                    
                    {test.duration && (
                      <p className="text-xs text-muted-foreground">
                        Completed in {test.duration.toFixed(2)}s
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        {!isRunning && tests.some(t => t.status !== 'pending') && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {tests.filter(t => t.status === 'passed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {tests.filter(t => t.status === 'warning').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Warnings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {tests.filter(t => t.status === 'failed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <FileCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium">QA Pipeline Features</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>Automated security scanning for malicious code</li>
              <li>Performance benchmarking (CPU, memory, latency)</li>
              <li>Code quality analysis and best practice checks</li>
              <li>Audio processing validation and artifact detection</li>
              <li>API compatibility verification</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
