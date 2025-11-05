import { PerformanceMonitoringDashboard } from '@/components/admin/PerformanceMonitoringDashboard';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Performance() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6 max-w-2xl mt-20">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              You need to sign in to access the Performance Monitoring dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                The Performance Monitoring dashboard requires authentication to:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Track your personal performance metrics</li>
                  <li>Store historical data for baseline calculations</li>
                  <li>Receive personalized alerts and notifications</li>
                  <li>Access cost tracking and billing information</li>
                </ul>
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/auth')} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <PerformanceMonitoringDashboard />;
}
