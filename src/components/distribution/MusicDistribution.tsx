import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Music, 
  Globe, 
  Calendar, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Disc3,
  Radio,
  Smartphone,
  Music2,
  PlayCircle,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';

interface StreamingPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  status: 'pending' | 'live' | 'processing' | 'error';
  estimatedDays: number;
}

interface ReleaseMetadata {
  title: string;
  artist: string;
  album: string;
  genre: string;
  subgenre: string;
  releaseDate: string;
  upcCode: string;
  isrcCode: string;
  copyright: string;
  recordLabel: string;
  description: string;
  lyrics: string;
  explicit: boolean;
  region: string;
}

const STREAMING_PLATFORMS: StreamingPlatform[] = [
  { id: 'spotify', name: 'Spotify', icon: <Disc3 className="w-5 h-5" />, enabled: true, status: 'pending', estimatedDays: 2 },
  { id: 'apple-music', name: 'Apple Music', icon: <Music className="w-5 h-5" />, enabled: true, status: 'pending', estimatedDays: 3 },
  { id: 'youtube-music', name: 'YouTube Music', icon: <PlayCircle className="w-5 h-5" />, enabled: true, status: 'pending', estimatedDays: 2 },
  { id: 'amazon-music', name: 'Amazon Music', icon: <Music2 className="w-5 h-5" />, enabled: true, status: 'pending', estimatedDays: 3 },
  { id: 'deezer', name: 'Deezer', icon: <Radio className="w-5 h-5" />, enabled: true, status: 'pending', estimatedDays: 2 },
  { id: 'tidal', name: 'Tidal', icon: <Disc3 className="w-5 h-5" />, enabled: false, status: 'pending', estimatedDays: 4 },
  { id: 'soundcloud', name: 'SoundCloud', icon: <Smartphone className="w-5 h-5" />, enabled: false, status: 'pending', estimatedDays: 1 },
  { id: 'tiktok', name: 'TikTok/CapCut', icon: <Share2 className="w-5 h-5" />, enabled: true, status: 'pending', estimatedDays: 2 },
];

const AMAPIANO_SUBGENRES = [
  'Private School',
  'Vocal House Amapiano',
  'Yanos',
  'Tech Amapiano',
  'Deep Amapiano',
  'Groove Amapiano',
  'Sgubhu',
  'Bacardi'
];

const SA_REGIONS = [
  'Gauteng (JHB/PTA)',
  'KwaZulu-Natal',
  'Western Cape',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape'
];

export function MusicDistribution() {
  const [platforms, setPlatforms] = useState<StreamingPlatform[]>(STREAMING_PLATFORMS);
  const [releaseStep, setReleaseStep] = useState<'metadata' | 'platforms' | 'review' | 'submit'>('metadata');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [metadata, setMetadata] = useState<ReleaseMetadata>({
    title: '',
    artist: '',
    album: '',
    genre: 'Amapiano',
    subgenre: 'Private School',
    releaseDate: '',
    upcCode: '',
    isrcCode: '',
    copyright: '',
    recordLabel: '',
    description: '',
    lyrics: '',
    explicit: false,
    region: 'Gauteng (JHB/PTA)'
  });

  const togglePlatform = (platformId: string) => {
    setPlatforms(prev => prev.map(p => 
      p.id === platformId ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const handleSubmitRelease = async () => {
    setIsSubmitting(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    try {
      await new Promise(resolve => setTimeout(resolve, 5500));
      
      // Update platform statuses
      setPlatforms(prev => prev.map(p => 
        p.enabled ? { ...p, status: 'processing' } : p
      ));

      toast.success('Release submitted!', {
        description: 'Your track is being distributed to selected platforms.'
      });
      
      setReleaseStep('submit');
    } catch (error) {
      toast.error('Submission failed', {
        description: 'Please try again or contact support.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const enabledPlatforms = platforms.filter(p => p.enabled);
  const isMetadataComplete = metadata.title && metadata.artist && metadata.releaseDate;

  return (
    <Card className="w-full bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Music Distribution</CardTitle>
              <CardDescription>
                Release to 150+ streaming platforms worldwide
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            100% Royalty-Free
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={releaseStep} onValueChange={(v) => setReleaseStep(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metadata" className="gap-2">
              <Music className="w-4 h-4" />
              Metadata
            </TabsTrigger>
            <TabsTrigger value="platforms" disabled={!isMetadataComplete} className="gap-2">
              <Globe className="w-4 h-4" />
              Platforms
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!isMetadataComplete} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Review
            </TabsTrigger>
            <TabsTrigger value="submit" disabled={releaseStep !== 'submit'} className="gap-2">
              <Upload className="w-4 h-4" />
              Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metadata" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Track Title *</Label>
                  <Input
                    id="title"
                    value={metadata.title}
                    onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter track title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artist">Artist Name *</Label>
                  <Input
                    id="artist"
                    value={metadata.artist}
                    onChange={(e) => setMetadata(prev => ({ ...prev, artist: e.target.value }))}
                    placeholder="Primary artist name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="album">Album/EP Name</Label>
                  <Input
                    id="album"
                    value={metadata.album}
                    onChange={(e) => setMetadata(prev => ({ ...prev, album: e.target.value }))}
                    placeholder="Album or EP title (optional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Select
                      value={metadata.genre}
                      onValueChange={(v) => setMetadata(prev => ({ ...prev, genre: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Amapiano">Amapiano</SelectItem>
                        <SelectItem value="Afrobeats">Afrobeats</SelectItem>
                        <SelectItem value="House">House</SelectItem>
                        <SelectItem value="Gqom">Gqom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subgenre">Subgenre</Label>
                    <Select
                      value={metadata.subgenre}
                      onValueChange={(v) => setMetadata(prev => ({ ...prev, subgenre: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AMAPIANO_SUBGENRES.map(sg => (
                          <SelectItem key={sg} value={sg}>{sg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Release Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="releaseDate">Release Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="releaseDate"
                      type="date"
                      value={metadata.releaseDate}
                      onChange={(e) => setMetadata(prev => ({ ...prev, releaseDate: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Regional Origin</Label>
                  <Select
                    value={metadata.region}
                    onValueChange={(v) => setMetadata(prev => ({ ...prev, region: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SA_REGIONS.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recordLabel">Record Label</Label>
                  <Input
                    id="recordLabel"
                    value={metadata.recordLabel}
                    onChange={(e) => setMetadata(prev => ({ ...prev, recordLabel: e.target.value }))}
                    placeholder="Self-released or label name"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="explicit"
                    checked={metadata.explicit}
                    onCheckedChange={(checked) => setMetadata(prev => ({ ...prev, explicit: !!checked }))}
                  />
                  <Label htmlFor="explicit" className="text-sm">
                    Contains explicit content
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label>Upload Files</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-20 flex-col gap-1" asChild>
                      <label>
                        <Upload className="w-5 h-5" />
                        <span className="text-xs">Audio File</span>
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-1" asChild>
                      <label>
                        <Upload className="w-5 h-5" />
                        <span className="text-xs">Artwork</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setArtworkFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </Button>
                  </div>
                  {audioFile && (
                    <Badge variant="secondary" className="text-xs">
                      🎵 {audioFile.name}
                    </Badge>
                  )}
                  {artworkFile && (
                    <Badge variant="secondary" className="text-xs">
                      🖼️ {artworkFile.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tell the story behind your track..."
                rows={3}
              />
            </div>

            <Button 
              onClick={() => setReleaseStep('platforms')}
              disabled={!isMetadataComplete}
              className="w-full"
            >
              Continue to Platform Selection
            </Button>
          </TabsContent>

          <TabsContent value="platforms" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Select platforms for distribution ({enabledPlatforms.length} selected)
                </p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setPlatforms(prev => prev.map(p => ({ ...p, enabled: true })))}
                >
                  Select All
                </Button>
              </div>

              <ScrollArea className="h-[300px]">
                <div className="grid gap-2">
                  {platforms.map(platform => (
                    <div
                      key={platform.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        platform.enabled 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'bg-muted/30 border-border'
                      }`}
                      onClick={() => togglePlatform(platform.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={platform.enabled} />
                        <div className="p-2 rounded-md bg-background">
                          {platform.icon}
                        </div>
                        <span className="font-medium">{platform.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        ~{platform.estimatedDays} days
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setReleaseStep('metadata')}>
                  Back
                </Button>
                <Button 
                  onClick={() => setReleaseStep('review')}
                  disabled={enabledPlatforms.length === 0}
                  className="flex-1"
                >
                  Review Release
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="review" className="mt-4">
            <div className="space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-2">Track Information</h4>
                      <dl className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Title:</dt>
                          <dd className="font-medium">{metadata.title || '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Artist:</dt>
                          <dd className="font-medium">{metadata.artist || '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Genre:</dt>
                          <dd className="font-medium">{metadata.genre} / {metadata.subgenre}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Region:</dt>
                          <dd className="font-medium">{metadata.region}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Release Date:</dt>
                          <dd className="font-medium">{metadata.releaseDate || '-'}</dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Distribution</h4>
                      <div className="flex flex-wrap gap-1">
                        {enabledPlatforms.map(p => (
                          <Badge key={p.id} variant="secondary" className="text-xs">
                            {p.name}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {enabledPlatforms.length} platforms selected
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isSubmitting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setReleaseStep('platforms')}>
                  Back
                </Button>
                <Button 
                  onClick={handleSubmitRelease}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Release'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="submit" className="mt-4">
            <div className="space-y-4">
              <div className="text-center py-6">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Release Submitted!</h3>
                <p className="text-muted-foreground">
                  Your track is being processed and distributed.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Distribution Status</h4>
                {platforms.filter(p => p.enabled).map(platform => (
                  <div 
                    key={platform.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-background">
                        {platform.icon}
                      </div>
                      <span>{platform.name}</span>
                    </div>
                    <Badge 
                      variant={platform.status === 'live' ? 'default' : 'secondary'}
                      className="gap-1"
                    >
                      {platform.status === 'processing' && <Clock className="w-3 h-3" />}
                      {platform.status === 'live' && <CheckCircle2 className="w-3 h-3" />}
                      {platform.status === 'error' && <AlertCircle className="w-3 h-3" />}
                      {platform.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
