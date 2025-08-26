import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Volume2, Mic, Monitor, Zap, Database, Palette } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onOpenChange
}) => {
  const [bufferSize, setBufferSize] = React.useState([512]);
  const [sampleRate, setSampleRate] = React.useState('44100');
  const [autoSave, setAutoSave] = React.useState(true);
  const [audioDriver, setAudioDriver] = React.useState('wasapi');
  const [theme, setTheme] = React.useState('dark');
  const [cpuUsage, setCpuUsage] = React.useState([25]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>DAW Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="audio" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="midi">MIDI</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="audio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Audio Settings
                </CardTitle>
                <CardDescription>Configure audio input/output settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Audio Driver</Label>
                    <Select value={audioDriver} onValueChange={setAudioDriver}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wasapi">WASAPI</SelectItem>
                        <SelectItem value="asio">ASIO</SelectItem>
                        <SelectItem value="directsound">DirectSound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sample Rate</Label>
                    <Select value={sampleRate} onValueChange={setSampleRate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="44100">44.1 kHz</SelectItem>
                        <SelectItem value="48000">48 kHz</SelectItem>
                        <SelectItem value="88200">88.2 kHz</SelectItem>
                        <SelectItem value="96000">96 kHz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Buffer Size: {bufferSize[0]} samples</Label>
                  <Slider
                    value={bufferSize}
                    onValueChange={setBufferSize}
                    min={64}
                    max={2048}
                    step={64}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lower values = less latency, higher CPU usage
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="midi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  MIDI Settings
                </CardTitle>
                <CardDescription>Configure MIDI input/output devices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>MIDI Input Device</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select MIDI input device" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No device</SelectItem>
                      <SelectItem value="keyboard">USB MIDI Keyboard</SelectItem>
                      <SelectItem value="controller">MIDI Controller</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>MIDI Output Device</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select MIDI output device" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No device</SelectItem>
                      <SelectItem value="synth">Software Synthesizer</SelectItem>
                      <SelectItem value="external">External Device</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  General Settings
                </CardTitle>
                <CardDescription>General application preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-save projects</Label>
                    <p className="text-xs text-muted-foreground">Automatically save projects every 5 minutes</p>
                  </div>
                  <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                </div>
                
                <div>
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Default project template</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empty">Empty Project</SelectItem>
                      <SelectItem value="amapiano">Amapiano Template</SelectItem>
                      <SelectItem value="hip-hop">Hip-Hop Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Performance Settings
                </CardTitle>
                <CardDescription>Optimize performance and resource usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>CPU Usage Limit: {cpuUsage[0]}%</Label>
                  <Slider
                    value={cpuUsage}
                    onValueChange={setCpuUsage}
                    min={10}
                    max={90}
                    step={5}
                    className="mt-2"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable multi-threading</Label>
                    <p className="text-xs text-muted-foreground">Use multiple CPU cores for processing</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable GPU acceleration</Label>
                    <p className="text-xs text-muted-foreground">Use GPU for audio processing when available</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};