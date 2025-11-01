import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Headphones, Radio, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface DAWConfig {
  id: string;
  name: string;
  icon: any;
  supported: boolean;
  status: 'ready' | 'testing' | 'planned';
  formats: string[];
}

export function DAWIntegrationHub() {
  const daws: DAWConfig[] = [
    {
      id: 'ableton',
      name: 'Ableton Live',
      icon: Music,
      supported: true,
      status: 'ready',
      formats: ['VST3', 'AU', 'Max4Live']
    },
    {
      id: 'logic',
      name: 'Logic Pro',
      icon: Headphones,
      supported: true,
      status: 'ready',
      formats: ['AU', 'VST3']
    },
    {
      id: 'fl-studio',
      name: 'FL Studio',
      icon: Radio,
      supported: true,
      status: 'testing',
      formats: ['VST3', 'Native']
    },
    {
      id: 'reaper',
      name: 'Reaper',
      icon: Music,
      supported: true,
      status: 'ready',
      formats: ['VST3', 'AU', 'JS']
    },
    {
      id: 'pro-tools',
      name: 'Pro Tools',
      icon: Headphones,
      supported: true,
      status: 'testing',
      formats: ['AAX', 'VST3']
    },
    {
      id: 'cubase',
      name: 'Cubase',
      icon: Radio,
      supported: true,
      status: 'ready',
      formats: ['VST3', 'AU']
    }
  ];

  const downloadIntegration = (daw: DAWConfig) => {
    toast.success(`Downloading ${daw.name} integration package...`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500/10 text-green-500';
      case 'testing': return 'bg-yellow-500/10 text-yellow-500';
      case 'planned': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Music className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">DAW Integration Hub</h3>
            <p className="text-sm text-muted-foreground">
              Native integrations for popular Digital Audio Workstations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-primary/10">
            <div className="text-2xl font-bold">{daws.filter(d => d.status === 'ready').length}</div>
            <div className="text-sm text-muted-foreground">Ready</div>
          </Card>
          <Card className="p-4 bg-yellow-500/10">
            <div className="text-2xl font-bold">{daws.filter(d => d.status === 'testing').length}</div>
            <div className="text-sm text-muted-foreground">In Testing</div>
          </Card>
          <Card className="p-4 bg-blue-500/10">
            <div className="text-2xl font-bold">{daws.length}</div>
            <div className="text-sm text-muted-foreground">Total DAWs</div>
          </Card>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {daws.map(daw => {
          const Icon = daw.icon;
          return (
            <Card key={daw.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{daw.name}</h4>
                    <Badge className={getStatusColor(daw.status)}>
                      {daw.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Supported Formats:</p>
                  <div className="flex flex-wrap gap-2">
                    {daw.formats.map(format => (
                      <Badge key={format} variant="outline">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => downloadIntegration(daw)}
                    disabled={daw.status === 'planned'}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Docs
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 bg-muted">
        <h4 className="font-semibold mb-2">Integration Features</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Automatic plugin discovery and installation
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Preset synchronization across DAWs
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Native automation mapping
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Project-specific plugin configurations
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Cloud sync for settings and presets
          </li>
        </ul>
      </Card>
    </div>
  );
}
