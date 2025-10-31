import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { GraduationCap, Activity, Database, Palette } from "lucide-react";
import ThesisResearchDashboard from "@/components/research/ThesisResearchDashboard";
import FederatedLearningPanel from "@/components/research/FederatedLearningPanel";
import PerformanceBenchmark from "@/components/research/PerformanceBenchmark";
import CulturalStyleCatalog from "@/components/research/CulturalStyleCatalog";

const Research = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  console.log('Research page rendering, activeTab:', activeTab);

  return (
    <div className="min-h-screen bg-background text-foreground pt-20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <GraduationCap className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Research & Development</h1>
            <p className="text-muted-foreground">
              Full-Stack Algorithm-System Co-Design for Efficient Music Generation
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="federated" className="gap-2">
              <Database className="w-4 h-4" />
              Federated Learning
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="gap-2">
              <Activity className="w-4 h-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="cultural" className="gap-2">
              <Palette className="w-4 h-4" />
              Cultural Catalog
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <ThesisResearchDashboard />
          </TabsContent>

          <TabsContent value="federated" className="mt-6">
            <FederatedLearningPanel />
          </TabsContent>

          <TabsContent value="benchmark" className="mt-6">
            <PerformanceBenchmark />
          </TabsContent>

          <TabsContent value="cultural" className="mt-6">
            <CulturalStyleCatalog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Research;
