import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Zap, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BatchItem {
  id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  audioUrl?: string;
  error?: string;
}

export const BatchGenerator = () => {
  const { toast } = useToast();
  const [batchPrompts, setBatchPrompts] = useState("");
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const startBatchGeneration = async () => {
    const prompts = batchPrompts.split('\n').filter(p => p.trim());
    if (prompts.length === 0) {
      toast({
        title: "No Prompts",
        description: "Please enter at least one prompt",
        variant: "destructive",
      });
      return;
    }

    const items: BatchItem[] = prompts.map((prompt, i) => ({
      id: `batch-${Date.now()}-${i}`,
      prompt: prompt.trim(),
      status: 'pending'
    }));

    setBatchItems(items);
    setIsGenerating(true);
    setProgress(0);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      setBatchItems(prev => prev.map(it => 
        it.id === item.id ? { ...it, status: 'processing' } : it
      ));

      try {
        const { data, error } = await supabase.functions.invoke('generate-sample', {
          body: { 
            prompt: item.prompt,
            duration: 10,
            model: "chirp-v3-5"
          }
        });

        if (error) throw error;

        const audioUrl = Array.isArray(data.prediction.output) 
          ? data.prediction.output[0] 
          : data.prediction.output;

        setBatchItems(prev => prev.map(it => 
          it.id === item.id 
            ? { ...it, status: 'completed', audioUrl } 
            : it
        ));
      } catch (error) {
        console.error(`Error generating sample ${i + 1}:`, error);
        setBatchItems(prev => prev.map(it => 
          it.id === item.id 
            ? { ...it, status: 'error', error: 'Generation failed' } 
            : it
        ));
      }

      setProgress(((i + 1) / items.length) * 100);
    }

    setIsGenerating(false);
    toast({
      title: "Batch Complete",
      description: `Generated ${items.filter(i => i.status === 'completed').length} of ${items.length} samples`,
    });
  };

  const downloadAll = () => {
    batchItems.forEach((item, i) => {
      if (item.audioUrl) {
        const link = document.createElement('a');
        link.href = item.audioUrl;
        link.download = `batch-sample-${i + 1}.wav`;
        link.click();
      }
    });
  };

  const clearBatch = () => {
    setBatchItems([]);
    setBatchPrompts("");
    setProgress(0);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Batch Generation</h3>
        <div className="flex gap-2">
          {batchItems.length > 0 && (
            <>
              <Button onClick={downloadAll} variant="outline" size="sm" disabled={!batchItems.some(i => i.audioUrl)}>
                <Download className="h-4 w-4 mr-1" />
                Download All
              </Button>
              <Button onClick={clearBatch} variant="outline" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="batch-prompts">Prompts (one per line)</Label>
          <Textarea
            id="batch-prompts"
            placeholder="Enter prompts, one per line:&#10;Uplifting piano melody&#10;Deep bass drop&#10;Ambient forest sounds"
            value={batchPrompts}
            onChange={(e) => setBatchPrompts(e.target.value)}
            className="mt-2 min-h-32"
            disabled={isGenerating}
          />
        </div>

        <Button 
          onClick={startBatchGeneration} 
          disabled={isGenerating || !batchPrompts.trim()}
          className="w-full"
        >
          <Zap className="mr-2 h-4 w-4" />
          {isGenerating ? "Generating..." : "Start Batch Generation"}
        </Button>

        {isGenerating && (
          <div className="space-y-2">
            <Label>Progress</Label>
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}

        {batchItems.length > 0 && (
          <div className="space-y-2">
            <Label>Results ({batchItems.filter(i => i.status === 'completed').length}/{batchItems.length})</Label>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {batchItems.map((item, i) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.prompt}</p>
                    <p className={`text-xs ${
                      item.status === 'completed' ? 'text-green-500' :
                      item.status === 'error' ? 'text-destructive' :
                      item.status === 'processing' ? 'text-blue-500' :
                      'text-muted-foreground'
                    }`}>
                      {item.status === 'completed' ? '✓ Complete' :
                       item.status === 'error' ? `✗ ${item.error}` :
                       item.status === 'processing' ? '⟳ Generating...' :
                       '⋯ Pending'}
                    </p>
                  </div>
                  {item.audioUrl && (
                    <audio controls className="h-8">
                      <source src={item.audioUrl} type="audio/wav" />
                    </audio>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
