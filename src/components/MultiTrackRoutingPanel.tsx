import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRight, Volume2, Mic, Music, Send, Settings, 
  Plus, Trash2, X, ArrowDown, ArrowUp, RotateCcw,
  Cable, Headphones, Speaker
} from 'lucide-react';
import { toast } from 'sonner';
import type { DawTrack } from '@/types/daw';

interface MultiTrackRoutingPanelProps {
  tracks: DawTrack[];
  onClose: () => void;
  onRoutingChange: (routingConfig: AudioRoutingConfig) => void;
}

export interface AudioSend {
  id: string;
  fromTrackId: string;
  toTrackId: string;
  sendLevel: number; // 0-1
  preFader: boolean;
  isActive: boolean;
}

export interface AudioInput {
  id: string;
  name: string;
  type: 'hardware' | 'software';
  channels: number;
  isActive: boolean;
}

export interface AudioOutput {
  id: string;
  name: string;
  type: 'hardware' | 'software';
  channels: number;
  isActive: boolean;
}

export interface TrackRouting {
  trackId: string;
  inputSource: string; // AudioInput ID
  outputDestination: string; // AudioOutput ID
  sends: AudioSend[];
  receiveFromTracks: string[]; // Track IDs that send to this track
}

export interface AudioRoutingConfig {
  inputs: AudioInput[];
  outputs: AudioOutput[];
  trackRoutings: TrackRouting[];
  masterOutputs: string[]; // Output IDs for master bus
}

const defaultInputs: AudioInput[] = [
  { id: 'hw_input_1', name: 'Hardware Input 1-2', type: 'hardware', channels: 2, isActive: true },
  { id: 'hw_input_3', name: 'Hardware Input 3-4', type: 'hardware', channels: 2, isActive: true },
  { id: 'sw_input_1', name: 'Software Input 1', type: 'software', channels: 2, isActive: true },
];

const defaultOutputs: AudioOutput[] = [
  { id: 'hw_output_1', name: 'Hardware Output 1-2', type: 'hardware', channels: 2, isActive: true },
  { id: 'hw_output_3', name: 'Hardware Output 3-4', type: 'hardware', channels: 2, isActive: true },
  { id: 'hw_output_headphones', name: 'Headphones', type: 'hardware', channels: 2, isActive: true },
  { id: 'sw_output_1', name: 'Software Output 1', type: 'software', channels: 2, isActive: true },
];

export default function MultiTrackRoutingPanel({ 
  tracks, 
  onClose, 
  onRoutingChange 
}: MultiTrackRoutingPanelProps) {
  const [routingConfig, setRoutingConfig] = useState<AudioRoutingConfig>({
    inputs: defaultInputs,
    outputs: defaultOutputs,
    trackRoutings: [],
    masterOutputs: ['hw_output_1']
  });
  
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'routing' | 'sends' | 'io'>('routing');

  // Initialize track routings
  useEffect(() => {
    const trackRoutings: TrackRouting[] = tracks.map(track => ({
      trackId: track.id,
      inputSource: track.type === 'audio' ? 'hw_input_1' : 'sw_input_1',
      outputDestination: 'hw_output_1',
      sends: [],
      receiveFromTracks: []
    }));

    setRoutingConfig(prev => ({
      ...prev,
      trackRoutings
    }));

    if (tracks.length > 0 && !selectedTrack) {
      setSelectedTrack(tracks[0].id);
    }
  }, [tracks, selectedTrack]);

  const getTrackRouting = useCallback((trackId: string): TrackRouting | undefined => {
    return routingConfig.trackRoutings.find(r => r.trackId === trackId);
  }, [routingConfig.trackRoutings]);

  const updateTrackRouting = useCallback((trackId: string, updates: Partial<TrackRouting>) => {
    setRoutingConfig(prev => ({
      ...prev,
      trackRoutings: prev.trackRoutings.map(routing => 
        routing.trackId === trackId 
          ? { ...routing, ...updates }
          : routing
      )
    }));
  }, []);

  const addSend = useCallback((fromTrackId: string, toTrackId: string) => {
    if (fromTrackId === toTrackId) {
      toast.error('Cannot send track to itself');
      return;
    }

    const sendId = `send_${Date.now()}`;
    const newSend: AudioSend = {
      id: sendId,
      fromTrackId,
      toTrackId,
      sendLevel: 0.5,
      preFader: false,
      isActive: true
    };

    // Add send to source track
    updateTrackRouting(fromTrackId, {
      sends: [...(getTrackRouting(fromTrackId)?.sends || []), newSend]
    });

    // Add receive reference to destination track
    const destRouting = getTrackRouting(toTrackId);
    if (destRouting) {
      updateTrackRouting(toTrackId, {
        receiveFromTracks: [...destRouting.receiveFromTracks, fromTrackId]
      });
    }

    toast.success('Send created successfully');
  }, [getTrackRouting, updateTrackRouting]);

  const removeSend = useCallback((sendId: string) => {
    const send = routingConfig.trackRoutings
      .flatMap(r => r.sends)
      .find(s => s.id === sendId);

    if (!send) return;

    // Remove send from source track
    updateTrackRouting(send.fromTrackId, {
      sends: getTrackRouting(send.fromTrackId)?.sends.filter(s => s.id !== sendId) || []
    });

    // Remove receive reference from destination track
    const destRouting = getTrackRouting(send.toTrackId);
    if (destRouting) {
      updateTrackRouting(send.toTrackId, {
        receiveFromTracks: destRouting.receiveFromTracks.filter(id => id !== send.fromTrackId)
      });
    }

    toast.success('Send removed');
  }, [routingConfig.trackRoutings, getTrackRouting, updateTrackRouting]);

  const updateSend = useCallback((sendId: string, updates: Partial<AudioSend>) => {
    setRoutingConfig(prev => ({
      ...prev,
      trackRoutings: prev.trackRoutings.map(routing => ({
        ...routing,
        sends: routing.sends.map(send => 
          send.id === sendId ? { ...send, ...updates } : send
        )
      }))
    }));
  }, []);

  const applyRoutingConfig = useCallback(() => {
    onRoutingChange(routingConfig);
    toast.success('Audio routing configuration applied');
  }, [routingConfig, onRoutingChange]);

  const resetRouting = useCallback(() => {
    setRoutingConfig(prev => ({
      ...prev,
      trackRoutings: tracks.map(track => ({
        trackId: track.id,
        inputSource: track.type === 'audio' ? 'hw_input_1' : 'sw_input_1',
        outputDestination: 'hw_output_1',
        sends: [],
        receiveFromTracks: []
      })),
      masterOutputs: ['hw_output_1']
    }));
    toast.success('Routing configuration reset');
  }, [tracks]);

  const selectedTrackRouting = selectedTrack ? getTrackRouting(selectedTrack) : null;
  const selectedTrackObj = tracks.find(t => t.id === selectedTrack);

  return (
    <Card className="fixed inset-4 z-50 bg-background flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <Cable className="h-5 w-5" />
              Multi-Track Audio Routing
            </CardTitle>
            <Badge variant="outline" className="bg-gradient-to-r from-green-500/20 to-blue-500/20">
              Advanced Routing
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <div className="flex-1 flex">
        {/* Track Selector */}
        <div className="w-64 border-r bg-muted/30">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm">Tracks</h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {tracks.map(track => (
                <Button
                  key={track.id}
                  variant={selectedTrack === track.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-left"
                  onClick={() => setSelectedTrack(track.id)}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: track.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{track.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {track.type === 'audio' ? <Mic className="h-3 w-3 inline mr-1" /> : <Music className="h-3 w-3 inline mr-1" />}
                        {track.type}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="flex-1 flex flex-col">
            <div className="border-b p-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="routing">Track Routing</TabsTrigger>
                <TabsTrigger value="sends">Sends ({routingConfig.trackRoutings.flatMap(r => r.sends).length})</TabsTrigger>
                <TabsTrigger value="io">I/O Configuration</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="routing" className="flex-1 m-0 p-6">
              {selectedTrackObj && selectedTrackRouting ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedTrackObj.color }}
                    />
                    <h2 className="text-lg font-semibold">{selectedTrackObj.name}</h2>
                    <Badge>{selectedTrackObj.type}</Badge>
                  </div>

                  {/* Input Routing */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <ArrowDown className="h-4 w-4" />
                      Audio Input
                    </h3>
                    <Select
                      value={selectedTrackRouting.inputSource}
                      onValueChange={(value) => updateTrackRouting(selectedTrack!, { inputSource: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {routingConfig.inputs.map(input => (
                          <SelectItem key={input.id} value={input.id}>
                            <div className="flex items-center gap-2">
                              {input.type === 'hardware' ? <Mic className="h-4 w-4" /> : <Music className="h-4 w-4" />}
                              {input.name} ({input.channels}ch)
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Output Routing */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <ArrowUp className="h-4 w-4" />
                      Audio Output
                    </h3>
                    <Select
                      value={selectedTrackRouting.outputDestination}
                      onValueChange={(value) => updateTrackRouting(selectedTrack!, { outputDestination: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {routingConfig.outputs.map(output => (
                          <SelectItem key={output.id} value={output.id}>
                            <div className="flex items-center gap-2">
                              {output.type === 'hardware' ? 
                                (output.name.toLowerCase().includes('headphone') ? 
                                  <Headphones className="h-4 w-4" /> : <Speaker className="h-4 w-4" />)
                                : <Volume2 className="h-4 w-4" />
                              }
                              {output.name} ({output.channels}ch)
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Send Creation */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Send to Track
                      </h3>
                      <Badge variant="outline">
                        {selectedTrackRouting.sends.length} active
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Select onValueChange={(toTrackId) => addSend(selectedTrack!, toTrackId)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select destination track..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tracks
                            .filter(track => track.id !== selectedTrack)
                            .map(track => (
                              <SelectItem key={track.id} value={track.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: track.color }}
                                  />
                                  {track.name}
                                </div>
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Existing Sends */}
                    {selectedTrackRouting.sends.length > 0 && (
                      <div className="space-y-2">
                        {selectedTrackRouting.sends.map(send => {
                          const destTrack = tracks.find(t => t.id === send.toTrackId);
                          return (
                            <div key={send.id} className="p-3 border rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="h-4 w-4" />
                                  <span className="text-sm font-medium">
                                    To: {destTrack?.name}
                                  </span>
                                  <Switch
                                    checked={send.isActive}
                                    onCheckedChange={(checked) => updateSend(send.id, { isActive: checked })}
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSend(send.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Send Level</span>
                                  <span>{Math.round(send.sendLevel * 100)}%</span>
                                </div>
                                <Slider
                                  value={[send.sendLevel]}
                                  onValueChange={([value]) => updateSend(send.id, { sendLevel: value })}
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  className="w-full"
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm">Pre-fader Send</span>
                                <Switch
                                  checked={send.preFader}
                                  onCheckedChange={(checked) => updateSend(send.id, { preFader: checked })}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Cable className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Select a Track</h3>
                    <p className="text-muted-foreground">
                      Choose a track from the sidebar to configure its routing
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sends" className="flex-1 m-0 p-6">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">All Active Sends</h2>
                  
                  {routingConfig.trackRoutings.flatMap(routing => 
                    routing.sends.map(send => {
                      const fromTrack = tracks.find(t => t.id === send.fromTrackId);
                      const toTrack = tracks.find(t => t.id === send.toTrackId);
                      
                      return (
                        <Card key={send.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: fromTrack?.color }}
                              />
                              <span className="font-medium">{fromTrack?.name}</span>
                              <ArrowRight className="h-4 w-4" />
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: toTrack?.color }}
                              />
                              <span className="font-medium">{toTrack?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={send.isActive ? 'default' : 'secondary'}>
                                {send.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSend(send.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span>Send Level</span>
                              <span>{Math.round(send.sendLevel * 100)}%</span>
                            </div>
                            <Slider
                              value={[send.sendLevel]}
                              onValueChange={([value]) => updateSend(send.id, { sendLevel: value })}
                              min={0}
                              max={1}
                              step={0.01}
                              className="w-full"
                            />
                            
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={send.isActive}
                                  onCheckedChange={(checked) => updateSend(send.id, { isActive: checked })}
                                />
                                <span className="text-sm">Active</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={send.preFader}
                                  onCheckedChange={(checked) => updateSend(send.id, { preFader: checked })}
                                />
                                <span className="text-sm">Pre-fader</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                  
                  {routingConfig.trackRoutings.flatMap(r => r.sends).length === 0 && (
                    <div className="text-center py-8">
                      <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Active Sends</h3>
                      <p className="text-muted-foreground">
                        Create sends between tracks in the Track Routing tab
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="io" className="flex-1 m-0 p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Audio Inputs */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Audio Inputs
                    </h3>
                    
                    <div className="space-y-2">
                      {routingConfig.inputs.map(input => (
                        <div key={input.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {input.type === 'hardware' ? <Mic className="h-4 w-4" /> : <Music className="h-4 w-4" />}
                            <div>
                              <div className="font-medium text-sm">{input.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {input.channels} channels • {input.type}
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={input.isActive}
                            onCheckedChange={(checked) => {
                              setRoutingConfig(prev => ({
                                ...prev,
                                inputs: prev.inputs.map(inp => 
                                  inp.id === input.id ? { ...inp, isActive: checked } : inp
                                )
                              }));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Audio Outputs */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <Speaker className="h-4 w-4" />
                      Audio Outputs
                    </h3>
                    
                    <div className="space-y-2">
                      {routingConfig.outputs.map(output => (
                        <div key={output.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {output.type === 'hardware' ? 
                              (output.name.toLowerCase().includes('headphone') ? 
                                <Headphones className="h-4 w-4" /> : <Speaker className="h-4 w-4" />)
                              : <Volume2 className="h-4 w-4" />
                            }
                            <div>
                              <div className="font-medium text-sm">{output.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {output.channels} channels • {output.type}
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={output.isActive}
                            onCheckedChange={(checked) => {
                              setRoutingConfig(prev => ({
                                ...prev,
                                outputs: prev.outputs.map(out => 
                                  out.id === output.id ? { ...out, isActive: checked } : out
                                )
                              }));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Master Output Configuration */}
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Master Output
                  </h3>
                  
                  <Select
                    value={routingConfig.masterOutputs[0] || ''}
                    onValueChange={(value) => {
                      setRoutingConfig(prev => ({
                        ...prev,
                        masterOutputs: [value]
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select master output..." />
                    </SelectTrigger>
                    <SelectContent>
                      {routingConfig.outputs.filter(output => output.isActive).map(output => (
                        <SelectItem key={output.id} value={output.id}>
                          <div className="flex items-center gap-2">
                            {output.type === 'hardware' ? 
                              output.name.toLowerCase().includes('headphone') ? 
                                <Headphones className="h-4 w-4" /> : <Speaker className="h-4 w-4" />
                              : <Volume2 className="h-4 w-4" />
                            }
                            {output.name} ({output.channels}ch)
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3 p-4 border-t">
            <Button variant="outline" onClick={resetRouting}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
            <Button onClick={applyRoutingConfig} className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Apply Routing Configuration
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
