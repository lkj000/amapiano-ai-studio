import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMIDIController } from "@/hooks/useMIDIController";
import { Music, Zap, Radio, AlertCircle, CheckCircle2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const MIDIPanel = () => {
  const { toast } = useToast();
  const {
    devices,
    connectedDevices,
    mappings,
    presets,
    activePreset,
    isLearningMode,
    lastMIDIMessage,
    startLearning,
    stopLearning,
    loadPreset,
    registerParameter,
    createMapping
  } = useMIDIController();
  
  const isEnabled = devices.length > 0;
  const isLearning = isLearningMode;
  const lastMessage = lastMIDIMessage;

  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [testValue, setTestValue] = useState(0);

  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) {
      setSelectedDevice(devices[0].id);
    }
  }, [devices, selectedDevice]);

  useEffect(() => {
    // Register a test parameter
    registerParameter('test.volume', (value) => {
      setTestValue(value);
    });
  }, [registerParameter]);

  const handleStartLearning = () => {
    if (!selectedDevice) {
      toast({
        title: "No Device Selected",
        description: "Please select a MIDI device first",
        variant: "destructive"
      });
      return;
    }

    startLearning();
    toast({
      title: "MIDI Learn Active",
      description: "Move a control on your MIDI device to map it",
    });
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      loadPreset(preset);
      toast({
        title: "Preset Loaded",
        description: `Loaded ${preset.name} mappings`,
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            <h3 className="text-lg font-semibold">MIDI Controller</h3>
          </div>
          {isEnabled ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Not Available
            </Badge>
          )}
        </div>

        {!isEnabled && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Web MIDI Not Available</AlertTitle>
            <AlertDescription>
              Your browser doesn't support Web MIDI API or no MIDI devices are connected.
              Connect a MIDI controller and refresh the page.
            </AlertDescription>
          </Alert>
        )}

        {isEnabled && (
          <>
            {/* Device selection */}
            <div className="space-y-4">
              <div>
                <Label>MIDI Device</Label>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a MIDI device" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map(device => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preset selection */}
              {presets.length > 0 && (
                <div>
                  <Label>Controller Preset</Label>
                  <Select 
                    value={activePreset?.id || ""} 
                    onValueChange={handleLoadPreset}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {presets.map(preset => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* MIDI Learn */}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <Label>MIDI Learn</Label>
                  {isLearning && (
                    <Badge variant="secondary" className="gap-1">
                      <Radio className="h-3 w-3 animate-pulse" />
                      Listening...
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {!isLearning ? (
                    <Button onClick={handleStartLearning} variant="outline" className="gap-2">
                      <Zap className="h-4 w-4" />
                      Start MIDI Learn
                    </Button>
                  ) : (
                    <Button onClick={stopLearning} variant="destructive" className="gap-2">
                      Stop Learning
                    </Button>
                  )}
                </div>
              </div>

              {/* Test value display */}
              <div className="pt-4 border-t">
                <Label>Test Parameter Value</Label>
                <div className="mt-2 p-4 bg-secondary rounded-lg">
                  <div className="text-2xl font-mono text-center">
                    {testValue.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Last MIDI message */}
              {lastMessage && (
                <div className="pt-4 border-t">
                  <Label>Last MIDI Message</Label>
                  <div className="mt-2 p-3 bg-secondary rounded-lg font-mono text-xs space-y-1">
                    <div>Type: {lastMessage.type}</div>
                    <div>Channel: {lastMessage.channel}</div>
                    <div>Note: {lastMessage.note}</div>
                    <div>Value: {lastMessage.value}</div>
                  </div>
                </div>
              )}

              {/* Active mappings */}
              {mappings.length > 0 && (
                <div className="pt-4 border-t">
                  <Label>Active Mappings ({mappings.length})</Label>
                  <div className="mt-2 space-y-2">
                    {mappings.map(mapping => (
                      <Card key={mapping.id} className="p-3 bg-secondary/50">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">{mapping.parameterPath}</span>
                          <Badge variant="outline">CC {mapping.controllerId}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Device info */}
              <div className="pt-4 border-t">
                <Label>Connected Devices ({devices.length})</Label>
                <div className="mt-2 space-y-2">
                  {devices.map(device => (
                    <Card key={device.id} className="p-3 bg-secondary/50">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{device.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {device.manufacturer} - {device.type}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
