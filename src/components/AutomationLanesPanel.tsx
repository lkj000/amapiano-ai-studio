import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Minus, RotateCcw, Zap, TrendingUp, Activity } from 'lucide-react';
import type { AutomationLane, AutomationPoint, DawTrackV2 } from '@/types/daw';

interface AutomationLanesPanelProps {
  track: DawTrackV2;
  currentTime: number;
  zoom: number;
  onClose: () => void;
  onUpdateAutomation: (trackId: string, lanes: AutomationLane[]) => void;
  onAddAutomationLane: (trackId: string, parameterName: string, parameterType: string) => void;
  onRemoveAutomationLane: (trackId: string, laneId: string) => void;
}

const automationParameters = [
  { name: 'Volume', type: 'volume', icon: Activity, color: 'bg-green-500' },
  { name: 'Pan', type: 'pan', icon: TrendingUp, color: 'bg-blue-500' },
  { name: 'Send 1', type: 'send', icon: Zap, color: 'bg-purple-500' },
  { name: 'Send 2', type: 'send', icon: Zap, color: 'bg-orange-500' },
];

export default function AutomationLanesPanel({ 
  track, 
  currentTime, 
  zoom, 
  onClose, 
  onUpdateAutomation,
  onAddAutomationLane,
  onRemoveAutomationLane 
}: AutomationLanesPanelProps) {
  const [selectedLane, setSelectedLane] = useState<string | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [tool, setTool] = useState<'select' | 'draw' | 'erase'>('select');
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    pointId: string | null;
    laneId: string | null;
    startX: number;
    startY: number;
  }>({ isDragging: false, pointId: null, laneId: null, startX: 0, startY: 0 });

  const timelineRef = useRef<HTMLDivElement>(null);

  const handleAddPoint = useCallback((laneId: string, x: number, y: number) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const time = ((x - rect.left) / rect.width) * 32; // 32 beats visible
    const value = 1 - ((y - rect.top) / rect.height); // Invert Y axis
    
    const lane = (track.automationLanes || []).find(l => l.id === laneId);
    if (!lane) return;

    const newPoint: AutomationPoint = {
      time: Math.max(0, Math.min(32, time)),
      value: Math.max(0, Math.min(1, value)),
      curve: 'linear'
    };

    const updatedLanes = (track.automationLanes || []).map(l => 
      l.id === laneId 
        ? { ...l, points: [...l.points, newPoint].sort((a, b) => a.time - b.time) }
        : l
    );

    onUpdateAutomation(track.id, updatedLanes);
  }, [track, onUpdateAutomation]);

  const handleErasePoint = useCallback((laneId: string, pointIndex: number) => {
    const updatedLanes = (track.automationLanes || []).map(lane => {
      if (lane.id === laneId) {
        const updatedPoints = [...lane.points];
        updatedPoints.splice(pointIndex, 1);
        return { ...lane, points: updatedPoints };
      }
      return lane;
    });

    onUpdateAutomation(track.id, updatedLanes);
    setSelectedPoints(prev => prev.filter(id => id !== `${laneId}_${pointIndex}`));
  }, [track, onUpdateAutomation]);

  const handleDeleteSelectedPoints = useCallback(() => {
    if (selectedPoints.length === 0) return;

    const updatedLanes = (track.automationLanes || []).map(lane => {
      const pointsToRemove = selectedPoints
        .filter(id => id.startsWith(`${lane.id}_`))
        .map(id => parseInt(id.split('_')[1]))
        .sort((a, b) => b - a); // Sort in reverse order to remove from end first

      let updatedPoints = [...lane.points];
      pointsToRemove.forEach(index => {
        if (index >= 0 && index < updatedPoints.length) {
          updatedPoints.splice(index, 1);
        }
      });

      return { ...lane, points: updatedPoints };
    });

    onUpdateAutomation(track.id, updatedLanes);
    setSelectedPoints([]);
  }, [track, onUpdateAutomation, selectedPoints]);

  const handlePointMouseDown = useCallback((e: React.MouseEvent, laneId: string, pointIndex: number) => {
    e.stopPropagation();
    
    setDragState({
      isDragging: true,
      pointId: `${laneId}_${pointIndex}`,
      laneId,
      startX: e.clientX,
      startY: e.clientY
    });
    
    if (!selectedPoints.includes(`${laneId}_${pointIndex}`)) {
      if (e.ctrlKey || e.metaKey) {
        setSelectedPoints(prev => [...prev, `${laneId}_${pointIndex}`]);
      } else {
        setSelectedPoints([`${laneId}_${pointIndex}`]);
      }
    }
  }, [selectedPoints]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.pointId || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    const timeChange = (deltaX / rect.width) * 32;
    const valueChange = -(deltaY / rect.height); // Invert Y

    const [laneId, pointIndexStr] = dragState.pointId.split('_');
    const pointIndex = parseInt(pointIndexStr);
    
    const updatedLanes = (track.automationLanes || []).map(lane => {
      if (lane.id === laneId) {
        const updatedPoints = [...lane.points];
        const point = updatedPoints[pointIndex];
        if (point) {
          updatedPoints[pointIndex] = {
            ...point,
            time: Math.max(0, Math.min(32, point.time + timeChange)),
            value: Math.max(0, Math.min(1, point.value + valueChange))
          };
        }
        return { ...lane, points: updatedPoints };
      }
      return lane;
    });

    onUpdateAutomation(track.id, updatedLanes);
  }, [dragState, track, onUpdateAutomation]);

  const handleMouseUp = useCallback(() => {
    setDragState({ isDragging: false, pointId: null, laneId: null, startX: 0, startY: 0 });
  }, []);

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelectedPoints();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelectedPoints]);

  const renderAutomationCurve = (lane: AutomationLane) => {
    if (lane.points.length === 0) return null;

    const points = lane.points.sort((a, b) => a.time - b.time);
    let pathData = '';

    points.forEach((point, index) => {
      const x = (point.time / 32) * 100; // Convert to percentage
      const y = (1 - point.value) * 100; // Invert Y and convert to percentage
      
      if (index === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        const prevPoint = points[index - 1];
        const prevX = (prevPoint.time / 32) * 100;
        const prevY = (1 - prevPoint.value) * 100;
        
        if (point.curve === 'exponential') {
          const cp1X = prevX + (x - prevX) * 0.5;
          const cp1Y = prevY;
          const cp2X = prevX + (x - prevX) * 0.5;
          const cp2Y = y;
          pathData += ` C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${x} ${y}`;
        } else {
          pathData += ` L ${x} ${y}`;
        }
      }
    });

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <path
          d={pathData}
          stroke={lane.color}
          strokeWidth="2"
          fill="none"
          className="drop-shadow-sm"
        />
      </svg>
    );
  };

  return (
    <Card className="fixed inset-4 z-50 bg-background flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Automation - {track.name}</CardTitle>
            <Badge variant="outline" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20">
              Version 2.0
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant={tool === 'select' ? 'default' : 'outline'}
                onClick={() => setTool('select')}
              >
                Select
              </Button>
              <Button 
                size="sm" 
                variant={tool === 'draw' ? 'default' : 'outline'}
                onClick={() => setTool('draw')}
              >
                Draw
              </Button>
              <Button 
                size="sm" 
                variant={tool === 'erase' ? 'default' : 'outline'}
                onClick={() => setTool('erase')}
              >
                Erase
              </Button>
            </div>
            
            <Select onValueChange={(value) => onAddAutomationLane(track.id, value, value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Add Lane" />
              </SelectTrigger>
              <SelectContent>
                {automationParameters.map(param => (
                  <SelectItem key={param.type} value={param.type}>
                    <div className="flex items-center gap-2">
                      <param.icon className="w-4 h-4" />
                      {param.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Lane Controls */}
          <div className="w-64 border-r bg-muted/10 overflow-y-auto">
            <div className="p-4 space-y-4">
              {(!track.automationLanes || track.automationLanes.length === 0) ? (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No automation lanes</p>
                  <p className="text-xs text-muted-foreground/70">Add lanes to automate parameters</p>
                </div>
              ) : (
                (track.automationLanes || []).map((lane) => {
                  const param = automationParameters.find(p => p.type === lane.parameterType);
                  const Icon = param?.icon || Activity;
                  
                  return (
                    <Card 
                      key={lane.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedLane === lane.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedLane(selectedLane === lane.id ? null : lane.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${param?.color || 'bg-gray-500'}`} />
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{lane.parameterName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={lane.isEnabled}
                              onCheckedChange={(enabled) => {
                const updatedLanes = (track.automationLanes || []).map(l =>
                  l.id === lane.id ? { ...l, isEnabled: enabled } : l
                );
                                onUpdateAutomation(track.id, updatedLanes);
                              }}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveAutomationLane(track.id, lane.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {lane.points.length} points
                        </div>
                        
                        {selectedLane === lane.id && lane.points.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="text-xs font-medium mb-1">Current Value</div>
                            <Slider
                              value={[lane.points[0]?.value || 0]}
                              max={1}
                              step={0.01}
                              className="w-full"
                              disabled
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Automation Timeline */}
          <div className="flex-1 overflow-auto">
            <div className="relative h-full" ref={timelineRef}>
              {/* Time ruler */}
              <div className="h-8 bg-muted/20 border-b flex sticky top-0 z-10">
                {Array.from({ length: 32 }, (_, i) => (
                  <div key={i} className="flex-1 text-xs text-center border-r border-border/30 py-1 text-muted-foreground">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Automation Lanes */}
              <div className="space-y-2 p-2">
                {(track.automationLanes || []).map((lane) => (
                  <div 
                    key={lane.id}
                    className={`relative h-24 bg-background border rounded cursor-pointer ${
                      selectedLane === lane.id ? 'ring-2 ring-primary' : ''
                    } ${!lane.isEnabled ? 'opacity-50' : ''}`}
                    onClick={(e) => {
                      if (tool === 'draw') {
                        handleAddPoint(lane.id, e.clientX, e.clientY);
                      } else if (tool === 'select') {
                        setSelectedPoints([]);
                      }
                    }}
                  >
                    {/* Grid lines */}
                    {Array.from({ length: 32 * 4 }, (_, i) => (
                      <div
                        key={i}
                        className={`absolute top-0 bottom-0 border-r ${
                          i % 4 === 0 ? 'border-border/30' : 'border-border/10'
                        }`}
                        style={{ left: `${(i / (32 * 4)) * 100}%` }}
                      />
                    ))}
                    
                    {/* Current time indicator */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary/80 z-10"
                      style={{ left: `${(currentTime / 32) * 100}%` }}
                    />

                    {/* Automation curve */}
                    {renderAutomationCurve(lane)}

                    {/* Automation points */}
                    {lane.points.map((point, pointIndex) => (
                      <div
                        key={pointIndex}
                        className={`absolute w-3 h-3 rounded-full border-2 border-white cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-20 ${
                          selectedPoints.includes(`${lane.id}_${pointIndex}`) 
                            ? 'bg-primary ring-2 ring-primary/50' 
                            : 'bg-primary/70 hover:bg-primary'
                        }`}
                        style={{
                          left: `${(point.time / 32) * 100}%`,
                          top: `${(1 - point.value) * 100}%`
                        }}
                        onMouseDown={(e) => {
                          if (tool === 'erase') {
                            e.stopPropagation();
                            handleErasePoint(lane.id, pointIndex);
                          } else {
                            handlePointMouseDown(e, lane.id, pointIndex);
                          }
                        }}
                      />
                    ))}

                    {/* Lane label */}
                    <div className="absolute top-2 left-2 text-xs font-medium text-muted-foreground bg-background/80 px-1 rounded">
                      {lane.parameterName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}