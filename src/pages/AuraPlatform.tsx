import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuraConductor } from '@/components/aura/AuraConductor';
import { StyleExchange } from '@/components/aura/StyleExchange';
import { AuraAcademy } from '@/components/aura/AuraAcademy';
import { PluginStore } from '@/components/aura/PluginStore';
import { CommunityHub } from '@/components/aura/CommunityHub';
import { User } from '@supabase/supabase-js';

interface AuraPlatformProps {
  user: User | null;
}

const AuraPlatform: React.FC<AuraPlatformProps> = ({ user }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="conductor" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="conductor">Aura Conductor</TabsTrigger>
              <TabsTrigger value="styles">Style Exchange</TabsTrigger>
              <TabsTrigger value="academy">Academy</TabsTrigger>
              <TabsTrigger value="plugins">Plugin Store</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
            </TabsList>

            <TabsContent value="conductor" className="mt-0">
              <AuraConductor user={user} />
            </TabsContent>

            <TabsContent value="styles" className="mt-0">
              <StyleExchange user={user} />
            </TabsContent>

            <TabsContent value="academy" className="mt-0">
              <AuraAcademy user={user} />
            </TabsContent>

            <TabsContent value="plugins" className="mt-0">
              <PluginStore user={user} />
            </TabsContent>

            <TabsContent value="community" className="mt-0">
              <CommunityHub user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AuraPlatform;