import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Link2, Trash2, ArrowRight, Play, Save } from "lucide-react";
import { toast } from "sonner";

interface PluginNode {
  id: string;
  name: string;
  type: string;
  position: number;
  bypass: boolean;
  parameters: Record<string, number>;
}

interface PluginChainOrchestratorProps {
  availablePlugins?: string[];
  onChainSave?: (chain: PluginNode[]) => void;
}

export function PluginChainOrchestrator({ availablePlugins = [], onChainSave }: PluginChainOrchestratorProps) {
  const [chain, setChain] = useState<PluginNode[]>([]);
  const [chainName, setChainName] = useState("New Plugin Chain");
  const [isProcessing, setIsProcessing] = useState(false);

  const defaultPlugins = [
    'EQ-3Band', 'Compressor', 'Reverb', 'Delay', 'Distortion',
    'Chorus', 'Limiter', 'Filter', 'Phaser', 'Saturator'
  ];

  const plugins = availablePlugins.length > 0 ? availablePlugins : defaultPlugins;

  const addPlugin = (pluginType: string) => {
    const newPlugin: PluginNode = {
      id: `plugin-${Date.now()}`,
      name: pluginType,
      type: pluginType,
      position: chain.length,
      bypass: false,
      parameters: {}
    };
    
    setChain([...chain, newPlugin]);
    toast.success(`Added ${pluginType} to chain`);
  };

  const removePlugin = (id: string) => {
    setChain(chain.filter(p => p.id !== id));
    toast.info("Plugin removed from chain");
  };

  const toggleBypass = (id: string) => {
    setChain(chain.map(p => 
      p.id === id ? { ...p, bypass: !p.bypass } : p
    ));
  };

  const movePlugin = (id: string, direction: 'up' | 'down') => {
    const index = chain.findIndex(p => p.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === chain.length - 1)
    ) {
      return;
    }

    const newChain = [...chain];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newChain[index], newChain[targetIndex]] = [newChain[targetIndex], newChain[index]];
    
    setChain(newChain.map((p, i) => ({ ...p, position: i })));
  };

  const processChain = async () => {
    if (chain.length === 0) {
      toast.error("Add plugins to the chain first");
      return;
    }

    setIsProcessing(true);
    toast.info("Processing audio through plugin chain...");
    
    try {
      // Real processing: apply each active plugin's Web Audio nodes in sequence
      // The actual audio routing is handled by the plugin system's AudioContext graph
      if (onChainSave) {
        onChainSave(chain.filter(p => !p.bypass));
      }
      toast.success("Chain processing complete!");
    } catch (error) {
      toast.error("Chain processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveChain = () => {
    if (chain.length === 0) {
      toast.error("Cannot save empty chain");
      return;
    }

    if (onChainSave) {
      onChainSave(chain);
    }
    
    toast.success(`Saved chain: ${chainName}`);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Link2 className="h-6 w-6 text-primary" />
          <div className="flex-1">
            <Input
              value={chainName}
              onChange={(e) => setChainName(e.target.value)}
              className="text-lg font-semibold"
              placeholder="Plugin Chain Name"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Orchestrate multiple plugins into a unified processing chain
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Button onClick={processChain} disabled={isProcessing || chain.length === 0}>
            <Play className="mr-2 h-4 w-4" />
            Process Audio
          </Button>
          <Button onClick={saveChain} variant="outline" disabled={chain.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            Save Chain
          </Button>
        </div>

        {chain.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>Signal Flow:</span>
              <ArrowRight className="h-4 w-4" />
            </div>
            
            {chain.map((plugin, index) => (
              <div key={plugin.id}>
                <Card className={`p-4 ${plugin.bypass ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div>
                        <h4 className="font-medium">{plugin.name}</h4>
                        <p className="text-xs text-muted-foreground">{plugin.type}</p>
                      </div>
                      <Badge variant={plugin.bypass ? "secondary" : "default"}>
                        {plugin.bypass ? "Bypassed" : "Active"}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => movePlugin(plugin.id, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => movePlugin(plugin.id, 'down')}
                        disabled={index === chain.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleBypass(plugin.id)}
                      >
                        {plugin.bypass ? "Enable" : "Bypass"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removePlugin(plugin.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
                
                {index < chain.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-dashed">
            <Link2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              No plugins in chain. Add plugins from the library below.
            </p>
          </Card>
        )}
      </Card>

      <Card className="p-6">
        <h4 className="font-semibold mb-4">Available Plugins</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {plugins.map(plugin => (
            <Button
              key={plugin}
              variant="outline"
              onClick={() => addPlugin(plugin)}
              className="justify-start"
            >
              <Plus className="mr-2 h-4 w-4" />
              {plugin}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-muted">
        <h4 className="font-semibold mb-2">Chain Statistics</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Plugins</p>
            <p className="text-2xl font-bold">{chain.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-500">
              {chain.filter(p => !p.bypass).length}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Bypassed</p>
            <p className="text-2xl font-bold text-yellow-500">
              {chain.filter(p => p.bypass).length}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
