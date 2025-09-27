import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Code, 
  User,
  Calendar,
  AlertTriangle,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PendingPlugin {
  id: string;
  developer_id: string;
  name: string;
  plugin_type: string;
  plugin_code: string;
  manifest_data: any;
  version: string;
  is_approved: boolean;
  created_at: string;
  developer_email?: string;
}

export const PluginApprovalPanel: React.FC = () => {
  const [pendingPlugins, setPendingPlugins] = useState<PendingPlugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<PendingPlugin | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPlugins();
  }, []);

  const fetchPendingPlugins = async () => {
    try {
      const { data, error } = await supabase
        .from('web_plugins')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingPlugins(data || []);
    } catch (error) {
      console.error('Error fetching pending plugins:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending plugins",
        variant: "destructive",
      });
    }
  };

  const approvePlugin = async (pluginId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('web_plugins')
        .update({ 
          is_approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', pluginId);

      if (error) throw error;

      await fetchPendingPlugins();
      setSelectedPlugin(null);
      
      toast({
        title: "Plugin Approved",
        description: "Plugin has been approved and is now available in the marketplace",
      });
    } catch (error) {
      console.error('Error approving plugin:', error);
      toast({
        title: "Error",
        description: "Failed to approve plugin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const rejectPlugin = async (pluginId: string) => {
    setLoading(true);
    try {
      // For now, we'll delete rejected plugins. In production, you might want to keep them with a "rejected" status
      const { error } = await supabase
        .from('web_plugins')
        .delete()
        .eq('id', pluginId);

      if (error) throw error;

      await fetchPendingPlugins();
      setSelectedPlugin(null);
      
      toast({
        title: "Plugin Rejected",
        description: "Plugin has been rejected and removed from the queue",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error rejecting plugin:', error);
      toast({
        title: "Error",
        description: "Failed to reject plugin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzePluginSecurity = (code: string) => {
    const securityConcerns = [];
    
    // Basic security checks
    if (code.includes('eval(') || code.includes('Function(')) {
      securityConcerns.push('Uses eval() or Function() - potential code injection risk');
    }
    if (code.includes('document.write') || code.includes('innerHTML')) {
      securityConcerns.push('Direct DOM manipulation detected');
    }
    if (code.includes('fetch(') && !code.includes('localhost')) {
      securityConcerns.push('Makes external network requests');
    }
    if (code.includes('localStorage') || code.includes('sessionStorage')) {
      securityConcerns.push('Accesses browser storage');
    }
    
    return securityConcerns;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="w-8 h-8 text-primary" />
            Plugin Approval Queue
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {pendingPlugins.length} Pending
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Review and approve community-submitted plugins for the marketplace
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plugin List */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Plugins ({pendingPlugins.length})</CardTitle>
            <CardDescription>
              Click on a plugin to review its code and details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingPlugins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                <p>No plugins pending approval</p>
              </div>
            ) : (
              pendingPlugins.map((plugin) => (
                <Card 
                  key={plugin.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPlugin?.id === plugin.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedPlugin(plugin)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{plugin.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Developer ID: {plugin.developer_id.slice(0, 8)}...
                          <Calendar className="w-4 h-4 ml-2" />
                          {new Date(plugin.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{plugin.plugin_type}</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Plugin Details */}
        <Card>
          <CardHeader>
            <CardTitle>Plugin Review</CardTitle>
            <CardDescription>
              {selectedPlugin ? `Reviewing: ${selectedPlugin.name}` : 'Select a plugin to review'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedPlugin ? (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <p className="text-sm text-muted-foreground">{selectedPlugin.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <p className="text-sm text-muted-foreground">{selectedPlugin.plugin_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Version</label>
                      <p className="text-sm text-muted-foreground">{selectedPlugin.version}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Submitted</label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedPlugin.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlugin.manifest_data?.description || 'No description provided'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Features</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedPlugin.manifest_data?.features?.map((feature: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="code" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Plugin Code</label>
                    <Textarea
                      value={selectedPlugin.plugin_code}
                      readOnly
                      rows={15}
                      className="font-mono text-xs"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  {(() => {
                    const concerns = analyzePluginSecurity(selectedPlugin.plugin_code);
                    return (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Security Analysis
                        </h4>
                        {concerns.length === 0 ? (
                          <div className="text-center py-4 text-green-600">
                            <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                            <p>No obvious security concerns detected</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {concerns.map((concern, index) => (
                              <div key={index} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                                <p className="text-sm text-red-800">{concern}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div>
                    <label className="text-sm font-medium mb-2 block">Review Notes</label>
                    <Textarea
                      placeholder="Add any notes about this plugin..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <div className="flex gap-2 mt-6">
                  <Button 
                    onClick={() => approvePlugin(selectedPlugin.id)}
                    disabled={loading}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Plugin
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => rejectPlugin(selectedPlugin.id)}
                    disabled={loading}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Plugin
                  </Button>
                </div>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4" />
                <p>Select a plugin from the list to begin review</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
