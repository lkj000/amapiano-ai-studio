
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Track } from '@/types/daw';

interface AutomationLane {
  id: string;
  trackId: string;
  parameter: string;
  points: AutomationPoint[];
  isVisible: boolean;
  color: string;
}

interface AutomationPoint {
  time: number;
  value: number;
}

interface AutomationLanesPanelProps {
  tracks: Track[];
  onAutomationChange?: (trackId: string, parameter: string, value: number) => void;
}

export default function AutomationLanesPanel({ 
  tracks, 
  onAutomationChange 
}: AutomationLanesPanelProps) {
  const [automationLanes, setAutomationLanes] = useState<AutomationLane[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [selectedParameter, setSelectedParameter] = useState<string>('');

  const availableParameters = [
    'Volume',
    'Pan',
    'Filter Cutoff',
    'Filter Resonance',
    'Reverb Send',
    'Delay Send'
  ];

  const addAutomationLane = () => {
    if (!selectedTrack || !selectedParameter) return;

    const newLane: AutomationLane = {
      id: `automation_${Date.now()}`,
      trackId: selectedTrack,
      parameter: selectedParameter,
      points: [
        { time: 0, value: 0.5 },
        { time: 4, value: 0.7 }
      ],
      isVisible: true,
      color: 'hsl(var(--primary))'
    };

    setAutomationLanes(prev => [...prev, newLane]);
  };

  const removeAutomationLane = (laneId: string) => {
    setAutomationLanes(prev => prev.filter(lane => lane.id !== laneId));
  };

  const toggleLaneVisibility = (laneId: string) => {
    setAutomationLanes(prev => 
      prev.map(lane => 
        lane.id === laneId 
          ? { ...lane, isVisible: !lane.isVisible }
          : lane
      )
    );
  };

  const updateAutomationValue = (laneId: string, pointIndex: number, value: number) => {
    setAutomationLanes(prev => 
      prev.map(lane => {
        if (lane.id === laneId) {
          const updatedPoints = [...lane.points];
          updatedPoints[pointIndex] = { ...updatedPoints[pointIndex], value: value / 100 };
          
          // Trigger callback
          if (onAutomationChange) {
            onAutomationChange(lane.trackId, lane.parameter, value / 100);
          }
          
          return { ...lane, points: updatedPoints };
        }
        return lane;
      })
    );
  };

  return (
    <div className="h-full bg-background border-l border-border overflow-hidden">
      <Card className="h-full rounded-none border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Automation</CardTitle>
          
          {/* Add Automation Controls */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select Track" />
                </SelectTrigger>
                <SelectContent>
                  {tracks.map((track) => (
                    <SelectItem key={track.id} value={track.id}>
                      {track.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedParameter} onValueChange={setSelectedParameter}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Parameter" />
                </SelectTrigger>
                <SelectContent>
                  {availableParameters.map((param) => (
                    <SelectItem key={param} value={param}>
                      {param}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={addAutomationLane}
              disabled={!selectedTrack || !selectedParameter}
              className="w-full h-8"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Automation Lane
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-3">
          {automationLanes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <div className="text-sm">No automation lanes created</div>
              <div className="text-xs mt-1">Select a track and parameter above to get started</div>
            </div>
          ) : (
            automationLanes.map((lane) => {
              const track = tracks.find(t => t.id === lane.trackId);
              return (
                <Card key={lane.id} className="border border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {track?.name} - {lane.parameter}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLaneVisibility(lane.id)}
                          className="h-6 w-6 p-0"
                        >
                          {lane.isVisible ? (
                            <Eye className="w-3 h-3" />
                          ) : (
                            <EyeOff className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAutomationLane(lane.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {lane.isVisible && (
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {lane.points.map((point, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="text-xs text-muted-foreground w-12">
                              {point.time.toFixed(1)}s
                            </div>
                            <div className="flex-1">
                              <Slider
                                value={[point.value * 100]}
                                onValueChange={([value]) => updateAutomationValue(lane.id, index, value)}
                                max={100}
                                step={1}
                                className="w-full"
                              />
                            </div>
                            <div className="text-xs text-muted-foreground w-12">
                              {Math.round(point.value * 100)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
