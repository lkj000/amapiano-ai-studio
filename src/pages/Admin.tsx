import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  Puzzle, 
  BarChart3,
  AlertTriangle,
  Crown
} from "lucide-react";
import { PluginApprovalPanel } from "@/components/admin/PluginApprovalPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const Admin: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState({
    pendingPlugins: 0,
    totalUsers: 0,
    totalPlugins: 0,
    approvedPlugins: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
    fetchStats();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
      toast({
        title: "Error",
        description: "Failed to verify admin access",
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      const [pendingPluginsResult, totalPluginsResult, profilesResult] = await Promise.all([
        supabase.from('web_plugins').select('id', { count: 'exact' }).eq('is_approved', false),
        supabase.from('web_plugins').select('id, is_approved', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' })
      ]);

      const approvedCount = totalPluginsResult.data?.filter(p => p.is_approved).length || 0;

      setStats({
        pendingPlugins: pendingPluginsResult.count || 0,
        totalUsers: profilesResult.count || 0,
        totalPlugins: totalPluginsResult.count || 0,
        approvedPlugins: approvedCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-red-600">Access Denied</CardTitle>
            <CardDescription>
              You don't have administrator privileges to access this area.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Crown className="w-10 h-10 text-primary" />
            Admin Dashboard
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Administrator
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage plugins, users, and platform operations
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Puzzle className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending Plugins</p>
                  <h3 className="text-2xl font-bold">{stats.pendingPlugins}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Plugins</p>
                  <h3 className="text-2xl font-bold">{stats.totalPlugins}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Approved Plugins</p>
                  <h3 className="text-2xl font-bold">{stats.approvedPlugins}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Tabs */}
        <Tabs defaultValue="plugins" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plugins" className="flex items-center gap-2">
              <Puzzle className="w-4 h-4" />
              Plugin Approval
              {stats.pendingPlugins > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                  {stats.pendingPlugins}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plugins" className="space-y-6">
            <PluginApprovalPanel />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user roles and permissions (Coming Soon)
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4" />
                <p>User management interface will be available in a future update</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>
                  View usage statistics and performance metrics (Coming Soon)
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                <p>Analytics dashboard will be available in a future update</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};