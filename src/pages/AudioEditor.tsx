import { User } from '@supabase/supabase-js';
import { WaveformVisualization } from '@/components/WaveformVisualization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Music2, 
  Layers, 
  Wand2, 
  Users, 
  Activity, 
  Mic, 
  Sparkles,
  FileAudio,
  Zap
} from 'lucide-react';

interface AudioEditorProps {
  user: User | null;
}

const AudioEditor = ({ user }: AudioEditorProps) => {
  const features = [
    {
      icon: Layers,
      title: "Batch Processing",
      description: "Apply effects to multiple files at once with progress tracking",
      color: "text-blue-500"
    },
    {
      icon: Users,
      title: "Real-Time Collaboration",
      description: "Work together with team members with synced playback",
      color: "text-green-500"
    },
    {
      icon: Wand2,
      title: "AI Mastering",
      description: "Automatic mastering with AI-analyzed optimal settings",
      color: "text-purple-500"
    },
    {
      icon: Mic,
      title: "Vocal Removal",
      description: "Extract instrumentals using phase cancellation",
      color: "text-pink-500"
    },
    {
      icon: Activity,
      title: "Spectrum Analyzer",
      description: "Advanced frequency visualization with customizable settings",
      color: "text-orange-500"
    },
    {
      icon: FileAudio,
      title: "MIDI Integration",
      description: "Connect MIDI devices for real-time audio playback",
      color: "text-cyan-500"
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Compact Top Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-primary">
                <Music2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Audio Editor</h1>
                <p className="text-xs text-muted-foreground">Professional audio editing workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" />
                AI-Powered
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Zap className="w-3 h-3" />
                Real-time
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full px-4 py-4">
          <div className="flex gap-4 h-full">
            {/* Left Sidebar - Features Overview */}
            <div className="w-64 flex-shrink-0 space-y-3 overflow-y-auto">
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={index}
                        className="group p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-2">
                          <Icon className={`w-4 h-4 mt-0.5 ${feature.color} group-hover:scale-110 transition-transform`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium mb-1">{feature.title}</h4>
                            <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                    <p>Upload audio files to start editing</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                    <p>Use toolbar for effects and processing</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                    <p>Enable collaboration to work with team</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                    <p>AI features analyze audio automatically</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Waveform Area */}
            <div className="flex-1 min-w-0">
              <Card className="h-full border-primary/20 shadow-elegant flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Music2 className="w-4 h-4 text-primary" />
                        Audio Workstation
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Upload files to access all editing features, batch processing, collaboration, and AI tools
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <WaveformVisualization />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioEditor;
