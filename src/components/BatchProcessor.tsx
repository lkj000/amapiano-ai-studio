import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, 
  Plus, 
  X, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Download,
  FileText
} from "lucide-react";
import { toast } from "sonner";

interface BatchItem {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: any;
  error?: string;
  estimatedTime?: number;
  startTime?: number;
}

interface BatchProcessorProps {
  onBatchComplete: (results: BatchItem[]) => void;
  className?: string;
}

export const BatchProcessor = ({ onBatchComplete, className }: BatchProcessorProps) => {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [batchMode, setBatchMode] = useState<"analyze" | "generate">("analyze");

  const addUrlToBatch = () => {
    if (!newUrl.trim()) return;

    const newItem: BatchItem = {
      id: Math.random().toString(36).substr(2, 9),
      url: newUrl.trim(),
      status: 'pending',
      progress: 0,
      estimatedTime: batchMode === 'analyze' ? 120 : 180 // seconds
    };

    setBatchItems(prev => [...prev, newItem]);
    setNewUrl("");
    toast.success("URL added to batch queue");
  };

  const removeFromBatch = (id: string) => {
    setBatchItems(prev => prev.filter(item => item.id !== id));
  };

  const processItem = async (item: BatchItem) => {
    setBatchItems(prev => prev.map(i => 
      i.id === item.id 
        ? { ...i, status: 'processing' as const, startTime: Date.now(), progress: 10 } 
        : i
    ));

    try {
      const endpoint = batchMode === 'analyze' ? 'audio-analysis' : 'ai-music-generation';
      const body = batchMode === 'analyze' 
        ? { audio_url: item.url, analysis_type: 'full' }
        : { prompt: `Generate from: ${item.url}`, type: 'batch' };

      setBatchItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, progress: 40 } : i
      ));

      const { data, error } = await supabase.functions.invoke(endpoint, { body });

      if (error) throw error;

      setBatchItems(prev => prev.map(i => 
        i.id === item.id 
          ? { ...i, status: 'completed' as const, result: data, progress: 100 }
          : i
      ));
    } catch (err) {
      console.error(`Batch processing failed for ${item.id}:`, err);
      setBatchItems(prev => prev.map(i => 
        i.id === item.id 
          ? { ...i, status: 'error' as const, progress: 0 }
          : i
      ));
    }
  };

  const processBatch = async () => {
    if (batchItems.length === 0) {
      toast.error("Add URLs to process");
      return;
    }

    setIsProcessing(true);
    toast.info(`Starting batch ${batchMode}...`);

    // Process items in parallel (up to 3 concurrent)
    const chunks = [];
    for (let i = 0; i < batchItems.length; i += 3) {
      chunks.push(batchItems.slice(i, i + 3));
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk
          .filter(item => item.status === 'pending')
          .map(item => processItem(item))
      );
    }

    setIsProcessing(false);
    const completedResults = batchItems.filter(item => item.status === 'completed');
    onBatchComplete(completedResults);
    toast.success(`Batch processing completed! ${completedResults.length} items processed successfully.`);
  };

  const clearBatch = () => {
    setBatchItems([]);
    toast.info("Batch queue cleared");
  };

  const getStatusIcon = (status: BatchItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'processing':
        return <Play className="w-4 h-4 text-primary animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: BatchItem['status']) => {
    const variants = {
      pending: 'secondary' as const,
      processing: 'default' as const,
      completed: 'outline' as const,
      error: 'destructive' as const
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {status}
      </Badge>
    );
  };

  const estimatedTotalTime = batchItems
    .filter(item => item.status === 'pending')
    .reduce((total, item) => total + (item.estimatedTime || 0), 0);

  const completedCount = batchItems.filter(item => item.status === 'completed').length;
  const errorCount = batchItems.filter(item => item.status === 'error').length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Batch Processing
        </CardTitle>
        <CardDescription>
          Process multiple URLs simultaneously for efficient analysis or generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={batchMode} onValueChange={(value) => setBatchMode(value as typeof batchMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analyze">Batch Analysis</TabsTrigger>
            <TabsTrigger value="generate">Batch Generation</TabsTrigger>
          </TabsList>

          <TabsContent value={batchMode} className="space-y-4">
            {/* Add URL Input */}
            <div className="flex gap-2">
              <Input
                placeholder={`Enter ${batchMode === 'analyze' ? 'URL to analyze' : 'reference URL for generation'}...`}
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addUrlToBatch()}
              />
              <Button onClick={addUrlToBatch} disabled={!newUrl.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Batch Queue */}
            {batchItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">
                    Queue ({batchItems.length} items)
                  </h4>
                  <div className="flex gap-2">
                    {!isProcessing && (
                      <Button variant="outline" size="sm" onClick={clearBatch}>
                        Clear All
                      </Button>
                    )}
                    <Button 
                      onClick={processBatch}
                      disabled={isProcessing || batchItems.length === 0}
                      size="sm"
                      className="btn-glow"
                    >
                      {isProcessing ? (
                        <>
                          <Pause className="w-3 h-3 mr-1" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-1" />
                          Start Batch
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Progress Summary */}
                {isProcessing && (
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{completedCount}/{batchItems.length} completed</span>
                    </div>
                    <Progress 
                      value={(completedCount / batchItems.length) * 100} 
                      className="h-2" 
                    />
                    <div className="text-xs text-muted-foreground">
                      Estimated time remaining: {Math.ceil(estimatedTotalTime / 60)} minutes
                    </div>
                  </div>
                )}

                {/* Queue Items */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {batchItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0">
                        {getStatusIcon(item.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium truncate">
                            {item.url}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                        
                        {item.status === 'processing' && (
                          <div className="space-y-1">
                            <Progress value={item.progress} className="h-1" />
                            <div className="text-xs text-muted-foreground">
                              {item.progress}% complete
                            </div>
                          </div>
                        )}
                        
                        {item.error && (
                          <div className="text-xs text-destructive">
                            {item.error}
                          </div>
                        )}
                      </div>

                      {!isProcessing && item.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromBatch(item.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Results Summary */}
                {(completedCount > 0 || errorCount > 0) && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Batch Results</span>
                      <div className="flex gap-2">
                        {completedCount > 0 && (
                          <Button variant="outline" size="sm">
                            <Download className="w-3 h-3 mr-1" />
                            Export Results
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <FileText className="w-3 h-3 mr-1" />
                          View Report
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Completed:</span>
                        <span className="ml-2 text-green-600 font-medium">{completedCount}</span>
                      </div>
                      {errorCount > 0 && (
                        <div>
                          <span className="text-muted-foreground">Errors:</span>
                          <span className="ml-2 text-destructive font-medium">{errorCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {batchItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No items in batch queue</p>
                <p className="text-xs mt-1">
                  Add URLs above to start batch {batchMode}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};