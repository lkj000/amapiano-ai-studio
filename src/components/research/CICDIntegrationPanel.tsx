import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Download, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const CICDIntegrationPanel = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState({
    runSparse: true,
    runQuantization: true,
    runDistributed: true,
    schedule: "0 2 * * *",
    notifyEmail: "",
    slackWebhook: "",
  });
  const [copied, setCopied] = useState(false);

  const generateGitHubAction = () => {
    return `name: Research Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '${config.schedule}'
  workflow_dispatch:

jobs:
  research-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Research Tests
        run: |
          npm run test:research
        env:
          SUPABASE_URL: \${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: \${{ secrets.SUPABASE_KEY }}
          ${config.notifyEmail ? `NOTIFY_EMAIL: ${config.notifyEmail}` : ''}
          ${config.slackWebhook ? `SLACK_WEBHOOK: \${{ secrets.SLACK_WEBHOOK }}` : ''}
      
      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: research-test-results
          path: test-results/
          retention-days: 30
      
      - name: Notify on Failure
        if: failure() && '${config.notifyEmail}'
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.gmail.com
          server_port: 465
          username: \${{ secrets.EMAIL_USERNAME }}
          password: \${{ secrets.EMAIL_PASSWORD }}
          subject: Research Tests Failed
          to: ${config.notifyEmail}
          from: GitHub Actions
          body: Research tests failed. Check the workflow run for details.
`;
  };

  const generateTestScript = () => {
    return `#!/usr/bin/env node
/**
 * Research Test Runner for CI/CD
 * Runs configured research tests and reports results
 */

const tests = [];
${config.runSparse ? "tests.push('sparse-inference');" : ''}
${config.runQuantization ? "tests.push('model-quantization');" : ''}
${config.runDistributed ? "tests.push('distributed-inference');" : ''}

async function runTests() {
  console.log('Starting research tests:', tests);
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  for (const test of tests) {
    try {
      console.log(\`Running \${test}...\`);
      // Add your test execution logic here
      results.passed++;
      results.tests.push({ name: test, status: 'passed' });
    } catch (error) {
      console.error(\`Test \${test} failed:\`, error);
      results.failed++;
      results.tests.push({ name: test, status: 'failed', error: error.message });
    }
  }
  
  console.log('Test Results:', JSON.stringify(results, null, 2));
  
  if (results.failed > 0) {
    process.exit(1);
  }
}

runTests();
`;
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Configuration has been copied successfully",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded",
      description: `${filename} has been downloaded`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">CI/CD Integration</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate GitHub Actions workflow to automate research tests in your CI/CD pipeline
        </p>
      </Card>

      {/* Configuration */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Test Configuration</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sparse">Run Sparse Inference Tests</Label>
            <Switch
              id="sparse"
              checked={config.runSparse}
              onCheckedChange={(checked) =>
                setConfig({ ...config, runSparse: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="quantization">Run Quantization Tests</Label>
            <Switch
              id="quantization"
              checked={config.runQuantization}
              onCheckedChange={(checked) =>
                setConfig({ ...config, runQuantization: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="distributed">Run Distributed Inference Tests</Label>
            <Switch
              id="distributed"
              checked={config.runDistributed}
              onCheckedChange={(checked) =>
                setConfig({ ...config, runDistributed: checked })
              }
            />
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <div>
            <Label htmlFor="schedule">Cron Schedule</Label>
            <Input
              id="schedule"
              value={config.schedule}
              onChange={(e) => setConfig({ ...config, schedule: e.target.value })}
              placeholder="0 2 * * *"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default: Daily at 2 AM UTC
            </p>
          </div>
          <div>
            <Label htmlFor="email">Notification Email</Label>
            <Input
              id="email"
              type="email"
              value={config.notifyEmail}
              onChange={(e) => setConfig({ ...config, notifyEmail: e.target.value })}
              placeholder="your-email@example.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="slack">Slack Webhook (Optional)</Label>
            <Input
              id="slack"
              value={config.slackWebhook}
              onChange={(e) => setConfig({ ...config, slackWebhook: e.target.value })}
              placeholder="https://hooks.slack.com/..."
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* GitHub Actions Workflow */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">GitHub Actions Workflow</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(generateGitHubAction())}
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="ml-2">Copy</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(generateGitHubAction(), "research-tests.yml")}
            >
              <Download className="w-4 h-4" />
              <span className="ml-2">Download</span>
            </Button>
          </div>
        </div>
        <Textarea
          value={generateGitHubAction()}
          readOnly
          className="font-mono text-xs h-96"
        />
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Setup Instructions:</strong>
          </p>
          <ol className="text-xs text-blue-800 dark:text-blue-200 list-decimal list-inside mt-2 space-y-1">
            <li>Create <code>.github/workflows/research-tests.yml</code> in your repository</li>
            <li>Paste the generated workflow configuration</li>
            <li>Add required secrets in GitHub repository settings</li>
            <li>Push to trigger the workflow</li>
          </ol>
        </div>
      </Card>

      {/* Test Script */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Test Runner Script</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(generateTestScript())}
            >
              <Copy className="w-4 h-4" />
              <span className="ml-2">Copy</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(generateTestScript(), "run-research-tests.js")}
            >
              <Download className="w-4 h-4" />
              <span className="ml-2">Download</span>
            </Button>
          </div>
        </div>
        <Textarea
          value={generateTestScript()}
          readOnly
          className="font-mono text-xs h-64"
        />
      </Card>
    </div>
  );
};

export default CICDIntegrationPanel;
