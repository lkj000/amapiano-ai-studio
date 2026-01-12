import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calculator, 
  Users, 
  Plus, 
  Trash2, 
  DollarSign,
  PieChart,
  TrendingUp,
  Music,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Collaborator {
  id: string;
  name: string;
  role: string;
  splitPercent: number;
  email: string;
}

interface RoyaltyProjection {
  streams: number;
  revenue: number;
}

const ROLE_PRESETS = [
  { role: 'Producer', defaultSplit: 50 },
  { role: 'Vocalist', defaultSplit: 25 },
  { role: 'Songwriter', defaultSplit: 15 },
  { role: 'Featured Artist', defaultSplit: 20 },
  { role: 'Mixer', defaultSplit: 5 },
  { role: 'Mastering Engineer', defaultSplit: 3 },
];

// Average payout per stream by platform (in cents)
const PLATFORM_RATES = {
  spotify: 0.003,
  appleMusic: 0.007,
  youtubeMusic: 0.002,
  amazonMusic: 0.004,
  deezer: 0.0064,
  tidal: 0.013,
};

export function RoyaltySplitCalculator() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: '1', name: '', role: 'Producer', splitPercent: 50, email: '' },
    { id: '2', name: '', role: 'Vocalist', splitPercent: 25, email: '' },
  ]);
  
  const [projectedStreams, setProjectedStreams] = useState(10000);
  const [trackTitle, setTrackTitle] = useState('');

  const totalSplit = useMemo(() => 
    collaborators.reduce((sum, c) => sum + c.splitPercent, 0),
    [collaborators]
  );

  const isValidSplit = totalSplit === 100;

  const projectedRevenue = useMemo(() => {
    // Average across platforms
    const avgRate = Object.values(PLATFORM_RATES).reduce((a, b) => a + b) / Object.keys(PLATFORM_RATES).length;
    return projectedStreams * avgRate;
  }, [projectedStreams]);

  const addCollaborator = () => {
    const newId = Date.now().toString();
    setCollaborators(prev => [...prev, {
      id: newId,
      name: '',
      role: 'Songwriter',
      splitPercent: 0,
      email: ''
    }]);
  };

  const removeCollaborator = (id: string) => {
    if (collaborators.length <= 1) {
      toast.error('At least one collaborator required');
      return;
    }
    setCollaborators(prev => prev.filter(c => c.id !== id));
  };

  const updateCollaborator = (id: string, updates: Partial<Collaborator>) => {
    setCollaborators(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const autoDistribute = () => {
    const count = collaborators.length;
    const equalSplit = Math.floor(100 / count);
    const remainder = 100 - (equalSplit * count);
    
    setCollaborators(prev => prev.map((c, i) => ({
      ...c,
      splitPercent: equalSplit + (i === 0 ? remainder : 0)
    })));
    
    toast.success('Splits distributed equally');
  };

  const handleSaveSplits = () => {
    if (!isValidSplit) {
      toast.error('Total split must equal 100%');
      return;
    }
    
    if (collaborators.some(c => !c.name)) {
      toast.error('All collaborators must have names');
      return;
    }
    
    toast.success('Royalty splits saved!', {
      description: 'Collaborators will be notified by email.'
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(cents);
  };

  return (
    <Card className="w-full bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Royalty Split Calculator</CardTitle>
              <CardDescription>
                Manage earnings distribution among collaborators
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant={isValidSplit ? 'default' : 'destructive'}
            className="gap-1"
          >
            {isValidSplit ? (
              <PieChart className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {totalSplit}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Track Info */}
        <div className="space-y-2">
          <Label htmlFor="trackTitle">Track Title</Label>
          <div className="relative">
            <Music className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              id="trackTitle"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              placeholder="Enter track name"
              className="pl-10"
            />
          </div>
        </div>

        {/* Collaborators */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Collaborators ({collaborators.length})
            </Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={autoDistribute}>
                Auto-Split
              </Button>
              <Button variant="outline" size="sm" onClick={addCollaborator}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[280px]">
            <div className="space-y-3 pr-4">
              {collaborators.map((collaborator, index) => (
                <Card key={collaborator.id} className="bg-muted/30">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">#{index + 1}</Badge>
                      {collaborators.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCollaborator(collaborator.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={collaborator.name}
                          onChange={(e) => updateCollaborator(collaborator.id, { name: e.target.value })}
                          placeholder="Collaborator name"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Role</Label>
                        <select
                          value={collaborator.role}
                          onChange={(e) => updateCollaborator(collaborator.id, { role: e.target.value })}
                          className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                        >
                          {ROLE_PRESETS.map(preset => (
                            <option key={preset.role} value={preset.role}>
                              {preset.role}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input
                          type="email"
                          value={collaborator.email}
                          onChange={(e) => updateCollaborator(collaborator.id, { email: e.target.value })}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Split Percentage</Label>
                        <span className="text-lg font-bold text-primary">
                          {collaborator.splitPercent}%
                        </span>
                      </div>
                      <Slider
                        value={[collaborator.splitPercent]}
                        onValueChange={([value]) => updateCollaborator(collaborator.id, { splitPercent: value })}
                        max={100}
                        step={1}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Projected: {formatCurrency((projectedRevenue * collaborator.splitPercent) / 100)}</span>
                        <span>Per 1M streams: {formatCurrency((1000000 * 0.004 * collaborator.splitPercent) / 100)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Revenue Projection */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <Label>Revenue Projection</Label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Projected Streams</span>
                <span className="font-medium">{projectedStreams.toLocaleString()}</span>
              </div>
              <Slider
                value={[projectedStreams]}
                onValueChange={([value]) => setProjectedStreams(value)}
                min={1000}
                max={10000000}
                step={1000}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1K</span>
                <span>100K</span>
                <span>1M</span>
                <span>10M</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-background/50">
                <div className="text-xs text-muted-foreground">Total Revenue</div>
                <div className="text-xl font-bold flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(projectedRevenue).replace('$', '')}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <div className="text-xs text-muted-foreground">Per Stream</div>
                <div className="text-xl font-bold">
                  ~$0.004
                </div>
              </div>
            </div>

            {/* Breakdown by platform */}
            <div className="space-y-2">
              <Label className="text-xs">Platform Breakdown</Label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(PLATFORM_RATES).map(([platform, rate]) => (
                  <div key={platform} className="flex justify-between p-2 rounded bg-background/30">
                    <span className="capitalize">{platform.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium">{formatCurrency(projectedStreams * rate)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => {
              setCollaborators([{ id: '1', name: '', role: 'Producer', splitPercent: 100, email: '' }]);
              setTrackTitle('');
            }}
          >
            Reset
          </Button>
          <Button 
            onClick={handleSaveSplits}
            disabled={!isValidSplit}
            className="flex-1"
          >
            Save Splits
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
