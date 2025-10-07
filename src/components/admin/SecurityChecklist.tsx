/**
 * Security Checklist - Penetration Testing and Security Audit
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SecurityCheck {
  id: string;
  category: 'authentication' | 'authorization' | 'data' | 'api' | 'infrastructure';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'pass' | 'fail' | 'pending' | 'not-tested';
  lastTested?: Date;
}

const SECURITY_CHECKS: SecurityCheck[] = [
  // Authentication
  {
    id: 'auth-1',
    category: 'authentication',
    title: 'JWT Token Validation',
    description: 'Verify all protected endpoints validate JWT tokens correctly',
    severity: 'critical',
    status: 'pending',
  },
  {
    id: 'auth-2',
    category: 'authentication',
    title: 'Session Timeout',
    description: 'Ensure user sessions expire after inactivity',
    severity: 'high',
    status: 'pending',
  },
  {
    id: 'auth-3',
    category: 'authentication',
    title: 'Password Complexity',
    description: 'Verify password requirements meet security standards',
    severity: 'medium',
    status: 'pending',
  },
  
  // Authorization
  {
    id: 'authz-1',
    category: 'authorization',
    title: 'RLS Policy Validation',
    description: 'Test Row Level Security policies prevent unauthorized access',
    severity: 'critical',
    status: 'pending',
  },
  {
    id: 'authz-2',
    category: 'authorization',
    title: 'Role-Based Access Control',
    description: 'Verify admin routes are only accessible to admin users',
    severity: 'critical',
    status: 'pending',
  },
  {
    id: 'authz-3',
    category: 'authorization',
    title: 'API Rate Limiting',
    description: 'Confirm rate limits are enforced on all edge functions',
    severity: 'high',
    status: 'pending',
  },
  
  // Data Security
  {
    id: 'data-1',
    category: 'data',
    title: 'SQL Injection Prevention',
    description: 'Test for SQL injection vulnerabilities in database queries',
    severity: 'critical',
    status: 'pending',
  },
  {
    id: 'data-2',
    category: 'data',
    title: 'Data Encryption at Rest',
    description: 'Verify sensitive data is encrypted in the database',
    severity: 'high',
    status: 'pending',
  },
  {
    id: 'data-3',
    category: 'data',
    title: 'PII Data Protection',
    description: 'Ensure personally identifiable information is properly protected',
    severity: 'high',
    status: 'pending',
  },
  
  // API Security
  {
    id: 'api-1',
    category: 'api',
    title: 'CORS Configuration',
    description: 'Verify CORS headers are properly configured',
    severity: 'high',
    status: 'pending',
  },
  {
    id: 'api-2',
    category: 'api',
    title: 'API Key Exposure',
    description: 'Check for exposed API keys in client-side code',
    severity: 'critical',
    status: 'pending',
  },
  {
    id: 'api-3',
    category: 'api',
    title: 'Input Validation',
    description: 'Test edge functions validate and sanitize all inputs',
    severity: 'high',
    status: 'pending',
  },
  
  // Infrastructure
  {
    id: 'infra-1',
    category: 'infrastructure',
    title: 'HTTPS Enforcement',
    description: 'Ensure all traffic is encrypted via HTTPS',
    severity: 'critical',
    status: 'pending',
  },
  {
    id: 'infra-2',
    category: 'infrastructure',
    title: 'Dependency Vulnerabilities',
    description: 'Scan for known vulnerabilities in dependencies',
    severity: 'high',
    status: 'pending',
  },
  {
    id: 'infra-3',
    category: 'infrastructure',
    title: 'Error Message Sanitization',
    description: 'Verify error messages do not leak sensitive information',
    severity: 'medium',
    status: 'pending',
  },
];

export const SecurityChecklist = () => {
  const [checks, setChecks] = useState<SecurityCheck[]>(SECURITY_CHECKS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'All Checks' },
    { value: 'authentication', label: 'Authentication' },
    { value: 'authorization', label: 'Authorization' },
    { value: 'data', label: 'Data Security' },
    { value: 'api', label: 'API Security' },
    { value: 'infrastructure', label: 'Infrastructure' },
  ];

  const updateCheckStatus = (id: string, status: SecurityCheck['status']) => {
    setChecks(prev => prev.map(check => 
      check.id === id 
        ? { ...check, status, lastTested: new Date() }
        : check
    ));
    
    toast({
      title: "Status Updated",
      description: `Security check marked as ${status}`,
    });
  };

  const filteredChecks = selectedCategory === 'all' 
    ? checks 
    : checks.filter(c => c.category === selectedCategory);

  const totalChecks = filteredChecks.length;
  const passedChecks = filteredChecks.filter(c => c.status === 'pass').length;
  const failedChecks = filteredChecks.filter(c => c.status === 'fail').length;
  const completionRate = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'fail': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChecks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{passedChecks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{failedChecks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(0)}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Checklist
          </CardTitle>
          <CardDescription>
            Penetration testing and security audit checklist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(cat => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.value)}
                size="sm"
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Checklist */}
          <div className="space-y-4">
            {filteredChecks.map(check => (
              <div 
                key={check.id} 
                className="border border-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(check.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{check.title}</h4>
                        <Badge className={getSeverityColor(check.severity)}>
                          {check.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{check.description}</p>
                      {check.lastTested && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last tested: {check.lastTested.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateCheckStatus(check.id, 'pass')}
                    className="text-green-600 hover:text-green-700"
                  >
                    Pass
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateCheckStatus(check.id, 'fail')}
                    className="text-red-600 hover:text-red-700"
                  >
                    Fail
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateCheckStatus(check.id, 'pending')}
                  >
                    Mark Pending
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
