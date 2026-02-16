/**
 * Sample Browser Component
 * Real sample discovery with Supabase storage and audio playback
 */

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Music, 
  Search, 
  Download, 
  Play,
  Pause,
  Heart,
  Clock,
  Disc3,
  Drum,
  Piano,
  Mic,
  Waves,
  Folder,
  TrendingUp,
  Sparkles,
  Volume2,
  Upload,
  Plus,
  Loader2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useSampleLibrary, Sample } from '@/hooks/useSampleLibrary';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { SampleActions } from './SampleActions';

const CATEGORIES = [
  { name: 'All', icon: Music },
  { name: 'Log Drums', icon: Disc3 },
  { name: 'Drums', icon: Drum },
  { name: 'Percussion', icon: Waves },
  { name: 'Bass', icon: Volume2 },
  { name: 'Keys', icon: Piano },
  { name: 'Synths', icon: Sparkles },
  { name: 'Vocals', icon: Mic },
  { name: 'MIDI', icon: Music },
];

const BPM_RANGES = ['All', '100-110', '110-115', '115-120', '120-130'];
const KEY_FILTERS = ['All', 'C', 'D', 'E', 'F', 'G', 'A', 'B'];

export function SampleBrowser() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bpmRange, setBpmRange] = useState('All');
  const [keyFilter, setKeyFilter] = useState('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Upload form state
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Drums');
  const [uploadType, setUploadType] = useState<'loop' | 'oneshot' | 'midi'>('oneshot');
  const [uploadBpm, setUploadBpm] = useState<number | undefined>();
  const [uploadKey, setUploadKey] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadIsPublic, setUploadIsPublic] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { samples, isLoading, uploadSample, toggleFavorite, deleteSample, downloadSample, uploadProgress } = useSampleLibrary();
  const audioPlayer = useAudioPlayer();

  const filteredSamples = samples.filter(sample => {
    const matchesSearch = sample.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sample.pack_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      sample.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || sample.category === selectedCategory;
    
    let matchesBpm = true;
    if (bpmRange !== 'All' && sample.bpm) {
      const [min, max] = bpmRange.split('-').map(Number);
      matchesBpm = sample.bpm >= min && sample.bpm <= max;
    }
    
    const matchesKey = keyFilter === 'All' || (sample.key_signature?.startsWith(keyFilter));
    
    return matchesSearch && matchesCategory && matchesBpm && matchesKey;
  });

  const handlePlay = useCallback(async (sample: Sample) => {
    if (audioPlayer.currentTrackId === sample.id && audioPlayer.isPlaying) {
      audioPlayer.pause();
    } else {
      await audioPlayer.play(sample.audio_url, sample.id);
    }
  }, [audioPlayer]);

  const handleUpload = async () => {
    if (!uploadFile || !uploadName) {
      toast.error('Please provide a name and file');
      return;
    }

    await uploadSample.mutateAsync({
      file: uploadFile,
      name: uploadName,
      category: uploadCategory,
      sampleType: uploadType,
      bpm: uploadBpm,
      keySignature: uploadKey || undefined,
      isPublic: uploadIsPublic,
    });

    // Reset form
    setUploadName('');
    setUploadFile(null);
    setUploadBpm(undefined);
    setUploadKey('');
    setIsUploadOpen(false);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) return `${mins}:${secs.toString().padStart(2, '0')}`;
    return `${secs.toFixed(1)}s`;
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = CATEGORIES.find(c => c.name === categoryName);
    return category ? category.icon : Music;
  };

  return (
    <Card className="w-full bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Music className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Sample Browser</CardTitle>
              <CardDescription>
                Discover & upload Amapiano samples
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Folder className="w-3 h-3" />
              {samples.length} Samples
            </Badge>
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Sample</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sample Name</Label>
                    <Input
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="e.g., Log Drum Hit 01"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={uploadCategory} onValueChange={setUploadCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.filter(c => c.name !== 'All').map(cat => (
                            <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={uploadType} onValueChange={(v) => setUploadType(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oneshot">One-shot</SelectItem>
                          <SelectItem value="loop">Loop</SelectItem>
                          <SelectItem value="midi">MIDI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>BPM (optional)</Label>
                      <Input
                        type="number"
                        value={uploadBpm || ''}
                        onChange={(e) => setUploadBpm(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="115"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Key (optional)</Label>
                      <Input
                        value={uploadKey}
                        onChange={(e) => setUploadKey(e.target.value)}
                        placeholder="C minor"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Audio File</Label>
                    <input
                      type="file"
                      accept="audio/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadFile ? uploadFile.name : 'Choose audio file...'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="public"
                      checked={uploadIsPublic}
                      onChange={(e) => setUploadIsPublic(e.target.checked)}
                    />
                    <Label htmlFor="public">Make sample public</Label>
                  </div>

                  {uploadProgress > 0 && (
                    <Progress value={uploadProgress} className="h-2" />
                  )}

                  <Button
                    onClick={handleUpload}
                    disabled={uploadSample.isPending || !uploadFile || !uploadName}
                    className="w-full"
                  >
                    {uploadSample.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Sample
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map(category => {
            const Icon = category.icon;
            return (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.name)}
                className="gap-1 whitespace-nowrap"
              >
                <Icon className="w-3 h-3" />
                {category.name}
              </Button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search samples..."
              className="pl-10"
            />
          </div>
          <Select value={bpmRange} onValueChange={setBpmRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="BPM" />
            </SelectTrigger>
            <SelectContent>
              {BPM_RANGES.map(range => (
                <SelectItem key={range} value={range}>{range === 'All' ? 'All BPM' : `${range} BPM`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={keyFilter} onValueChange={setKeyFilter}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Key" />
            </SelectTrigger>
            <SelectContent>
              {KEY_FILTERS.map(key => (
                <SelectItem key={key} value={key}>{key === 'All' ? 'All Keys' : key}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Sample List */}
        {!isLoading && (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredSamples.map(sample => {
                const CategoryIcon = getCategoryIcon(sample.category);
                const isPlaying = audioPlayer.currentTrackId === sample.id && audioPlayer.isPlaying;
                
                return (
                  <div 
                    key={sample.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isPlaying ? 'bg-primary/10' : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    {/* Play Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-10 h-10 rounded-full"
                      onClick={() => handlePlay(sample)}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>

                    {/* Waveform Placeholder / Progress */}
                    <div className="w-20 h-8 bg-muted rounded overflow-hidden flex items-center justify-center relative">
                      {isPlaying && audioPlayer.duration > 0 && (
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-primary/30"
                          style={{ width: `${(audioPlayer.currentTime / audioPlayer.duration) * 100}%` }}
                        />
                      )}
                      <div className="flex gap-0.5 items-end h-full py-1 relative z-10">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div 
                            key={i}
                            className={`w-1 rounded-full transition-all ${
                              isPlaying ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'
                            }`}
                            style={{ height: `${20 + Math.random() * 60}%` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{sample.name}</span>
                        {sample.is_public && (
                          <Badge className="text-xs bg-green-500/20 text-green-600 h-4">PUBLIC</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{sample.pack_name || 'My Samples'}</span>
                        <span>•</span>
                        <Badge variant="outline" className="h-4 text-xs gap-1">
                          <CategoryIcon className="w-2 h-2" />
                          {sample.category}
                        </Badge>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                      {sample.bpm && (
                        <span className="w-12 text-center">{sample.bpm} BPM</span>
                      )}
                      {sample.key_signature && (
                        <span className="w-12 text-center">{sample.key_signature}</span>
                      )}
                      <span className="w-10 text-center flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(sample.duration_seconds)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite.mutate(sample.id)}
                      >
                        <Heart 
                          className={`w-4 h-4 ${sample.is_favorite ? 'text-red-500 fill-red-500' : ''}`} 
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadSample(sample)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <SampleActions sample={sample} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSample.mutate(sample.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredSamples.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No samples found</p>
                <p className="text-sm">Upload your first sample or adjust filters</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsUploadOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Sample
                </Button>
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
