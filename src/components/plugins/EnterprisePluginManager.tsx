import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Shield, LineChart, Settings } from "lucide-react";

export function EnterprisePluginManager() {
  const [activeOrg, setActiveOrg] = useState("acme-audio");

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Enterprise Plugin Management</h3>
            <p className="text-sm text-muted-foreground">
              Organization-wide plugin deployment and licensing
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 bg-primary/10">
            <Users className="h-5 w-5 text-primary mb-2" />
            <div className="text-2xl font-bold">127</div>
            <div className="text-sm text-muted-foreground">Team Members</div>
          </Card>
          <Card className="p-4 bg-green-500/10">
            <Shield className="h-5 w-5 text-green-500 mb-2" />
            <div className="text-2xl font-bold">43</div>
            <div className="text-sm text-muted-foreground">Licensed Plugins</div>
          </Card>
          <Card className="p-4 bg-blue-500/10">
            <LineChart className="h-5 w-5 text-blue-500 mb-2" />
            <div className="text-2xl font-bold">1.2M</div>
            <div className="text-sm text-muted-foreground">Total Usage</div>
          </Card>
          <Card className="p-4 bg-purple-500/10">
            <Settings className="h-5 w-5 text-purple-500 mb-2" />
            <div className="text-2xl font-bold">8</div>
            <div className="text-sm text-muted-foreground">Deployments</div>
          </Card>
        </div>
      </Card>

      <Tabs defaultValue="licenses" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="licenses" className="space-y-4">
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Enterprise Licenses</h4>
            <div className="space-y-3">
              {['Studio Bundle Pro', 'Mastering Suite', 'Creative Effects Pack'].map(bundle => (
                <Card key={bundle} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">{bundle}</h5>
                      <p className="text-sm text-muted-foreground">Floating license • 50 seats</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-4">
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Deployment Configurations</h4>
            <p className="text-sm text-muted-foreground">
              Manage plugin deployments across workstations, servers, and cloud instances.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Usage Analytics</h4>
            <p className="text-sm text-muted-foreground">
              Track plugin usage, performance metrics, and ROI across your organization.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Security & Compliance</h4>
            <p className="text-sm text-muted-foreground">
              Security audits, compliance reports, and access control management.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
