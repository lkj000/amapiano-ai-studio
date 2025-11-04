import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  Download, 
  Users, 
  Clock, 
  Target, 
  Sparkles,
  PlayCircle,
  Save,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { privateSchoolPresets } from '@/data/amapiano-presets';

interface GhostProducerModeProps {
  onQuickGenerate: (preset: any, clientInfo: any) => void;
  className?: string;
}

export const GhostProducerMode = ({ onQuickGenerate, className }: GhostProducerModeProps) => {
  const [selectedArtist, setSelectedArtist] = useState('');
  const [targetDuration, setTargetDuration] = useState('3:00');
  const [clientName, setClientName] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('24h');

  const artistStyles = [
    { value: 'kelvin-momo', label: 'Kelvin Momo Style', preset: 'kelvin-momo-signature' },
    { value: 'kabza', label: 'Kabza De Small Style', preset: 'kabza-bounce' },
    { value: 'private-school', label: 'Private School Generic', preset: 'private-school-minimal' },
    { value: 'classic', label: 'Classic Amapiano', preset: 'classic-log-heavy' }
  ];

  const handleQuickStart = () => {
    if (!selectedArtist) {
      toast.error('Please select an artist style');
      return;
    }

    const artistStyle = artistStyles.find(a => a.value === selectedArtist);
    const preset = privateSchoolPresets.find(p => p.id === artistStyle?.preset);

    if (!preset) {
      toast.error('Preset not found');
      return;
    }

    const clientInfo = {
      name: clientName || 'Unnamed Client',
      targetDuration,
      deliveryTime,
      timestamp: new Date().toISOString()
    };

    onQuickGenerate(preset, clientInfo);
    toast.success(`🚀 Starting ${artistStyle?.label} production`, {
      description: `Target: ${targetDuration} | Delivery: ${deliveryTime}`
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Ghost Producer Mode
              <Badge variant="secondary" className="ml-2">
                <Clock className="w-3 h-3 mr-1" />
                Fast Track
              </Badge>
            </CardTitle>
            <CardDescription>
              Professional rapid production workflow for client projects
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Target className="w-3 h-3" />
              Avg. Delivery
            </div>
            <div className="text-lg font-bold text-foreground">2.5h</div>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="w-3 h-3" />
              Projects
            </div>
            <div className="text-lg font-bold text-foreground">127</div>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Sparkles className="w-3 h-3" />
              Quality
            </div>
            <div className="text-lg font-bold text-primary">98%</div>
          </div>
        </div>

        <Separator />

        {/* Client Info */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Client Name (Optional)</label>
          <Input
            placeholder="e.g., Blaq Diamond, Major Artist..."
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>

        {/* Artist Style Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Target Artist Style</label>
          <Select value={selectedArtist} onValueChange={setSelectedArtist}>
            <SelectTrigger>
              <SelectValue placeholder="Select style..." />
            </SelectTrigger>
            <SelectContent>
              {artistStyles.map(style => (
                <SelectItem key={style.value} value={style.value}>
                  {style.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration & Delivery */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Duration</label>
            <Select value={targetDuration} onValueChange={setTargetDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2:30">2:30</SelectItem>
                <SelectItem value="3:00">3:00</SelectItem>
                <SelectItem value="3:30">3:30</SelectItem>
                <SelectItem value="4:00">4:00</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Delivery Time</label>
            <Select value={deliveryTime} onValueChange={setDeliveryTime}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="4h">4 Hours</SelectItem>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="48h">48 Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleQuickStart}
            className="flex-1"
            size="lg"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Quick Start Production
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm">
            <Save className="w-3 h-3 mr-1" />
            Save Template
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-3 h-3 mr-1" />
            Export Stems
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-3 h-3 mr-1" />
            Send to Client
          </Button>
        </div>

        {/* Pro Tips */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground mb-2 font-medium">💡 Ghost Producer Tips:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Use presets as starting points, tweak to client taste</li>
            <li>• Keep stems organized for easy client revisions</li>
            <li>• Stock plugins are professional-grade, no VSTs needed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
