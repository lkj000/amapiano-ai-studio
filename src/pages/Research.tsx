import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { GraduationCap, Activity, Database, Palette, Brain, Target, Zap, Shield, Package } from "lucide-react";
import ThesisResearchDashboard from "@/components/research/ThesisResearchDashboard";
import FederatedLearningPanel from "@/components/research/FederatedLearningPanel";
import PerformanceBenchmark from "@/components/research/PerformanceBenchmark";
import CulturalStyleCatalog from "@/components/research/CulturalStyleCatalog";
import ThesisObjectiveMapper from "@/components/research/ThesisObjectiveMapper";
import SparseInferenceOptimizer from "@/components/research/SparseInferenceOptimizer";
import AIEthicsPanel from "@/components/research/AIEthicsPanel";
import ModelCompressionLab from "@/components/research/ModelCompressionLab";
import { UnifiedAnalysisPanel } from '@/components/UnifiedAnalysisPanel';
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="objectives" className="gap-2">
              <Target className="w-4 h-4" />
              Objectives
            </TabsTrigger>
            <TabsTrigger value="sparse" className="gap-2">
              <Zap className="w-4 h-4" />
              Sparse Inference
            </TabsTrigger>
            <TabsTrigger value="compression" className="gap-2">
              <Package className="w-4 h-4" />
              Compression
            </TabsTrigger>
            <TabsTrigger value="ethics" className="gap-2">
              <Shield className="w-4 h-4" />
              Ethics
            </TabsTrigger>
            <TabsTrigger value="federated" className="gap-2">
              <Database className="w-4 h-4" />
              Federated
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="gap-2">
              <Activity className="w-4 h-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="cultural" className="gap-2">
              <Palette className="w-4 h-4" />
              Cultural
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <Brain className="w-4 h-4" />
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <ErrorBoundary fallback={<Card className="p-6"><p className="text-sm text-muted-foreground">Failed to load Overview. Please refresh.</p></Card>}>
              <ThesisResearchDashboard />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="objectives" className="mt-6">
            <ErrorBoundary fallback={<Card className="p-6"><p className="text-sm text-muted-foreground">Failed to load Objectives. Please refresh.</p></Card>}>
              <ThesisObjectiveMapper />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="sparse" className="mt-6">
            <ErrorBoundary fallback={<Card className="p-6"><p className="text-sm text-muted-foreground">Failed to load Sparse Inference. Please refresh.</p></Card>}>
              <SparseInferenceOptimizer />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="compression" className="mt-6">
            <ErrorBoundary fallback={<Card className="p-6"><p className="text-sm text-muted-foreground">Failed to load Compression Lab. Please refresh.</p></Card>}>
              <ModelCompressionLab />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="ethics" className="mt-6">
            <ErrorBoundary fallback={<Card className="p-6"><p className="text-sm text-muted-foreground">Failed to load Ethics Panel. Please refresh.</p></Card>}>
              <AIEthicsPanel />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="federated" className="mt-6">
            <ErrorBoundary fallback={<Card className="p-6"><p className="text-sm text-muted-foreground">Failed to load Federated Learning. Please refresh.</p></Card>}>
              <FederatedLearningPanel />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="benchmark" className="mt-6">
            <ErrorBoundary fallback={<Card className="p-6"><p className="text-sm text-muted-foreground">Failed to load Performance Benchmark. Please refresh.</p></Card>}>
              <PerformanceBenchmark />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="cultural" className="mt-6">
            <ErrorBoundary fallback={<Card className="p-6"><p className="text-sm text-muted-foreground">Failed to load Cultural Catalog. Please refresh.</p></Card>}>
              <CulturalStyleCatalog />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            <ErrorBoundary fallback={<Card className="p-6"><p className="text-sm text-muted-foreground">Failed to load Analysis. Please refresh.</p></Card>}>
              <Card className="p-6">
                <UnifiedAnalysisPanel 
                  showOptions={true}
                  onAnalysisComplete={(result) => {
                    console.log('Research analysis complete:', result);
                  }}
                />
              </Card>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Research;
