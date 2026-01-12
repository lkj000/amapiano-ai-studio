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
  Package, 
  Upload, 
  DollarSign, 
  Tag, 
  Music,
  FileAudio,
  Image,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface SampleFile {
  id: string;
  name: string;
  type: 'loop' | 'oneshot' | 'midi';
  bpm?: number;
  key?: string;
  duration: number;
  size: number;
  file: File;
}

interface PackMetadata {
  name: string;
  description: string;
  category: string;
  subgenre: string;
  region: string;
  tags: string[];
  bpmRange: { min: number; max: number };
  keySignatures: string[];
  price: number;
  isExclusive: boolean;
  royaltyFree: boolean;
}

const CATEGORIES = [
  'Drums & Percussion',
  'Log Drums',
  'Bass',
  'Keys & Pads',
  'Vocals',
  'FX & Textures',
  'Full Loops',
  'Construction Kits'
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

const KEY_SIGNATURES = [
  'C major', 'C minor', 'D major', 'D minor', 'E major', 'E minor',
  'F major', 'F minor', 'G major', 'G minor', 'A major', 'A minor',
  'B major', 'B minor'
];

export function SamplePackPublisher() {
  const [step, setStep] = useState<'upload' | 'metadata' | 'pricing' | 'review'>('upload');
  const [samples, setSamples] = useState<SampleFile[]>([]);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newTag, setNewTag] = useState('');

  const [metadata, setMetadata] = useState<PackMetadata>({
    name: '',
    description: '',
    category: 'Log Drums',
    subgenre: 'Private School',
    region: 'Gauteng',
    tags: [],
    bpmRange: { min: 110, max: 120 },
    keySignatures: [],
    price: 1999, // cents
    isExclusive: false,
    royaltyFree: true
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newSamples: SampleFile[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      name: file.name.replace(/\.[^/.]+$/, ''),
      type: file.name.includes('.mid') ? 'midi' : 
            file.name.includes('loop') || file.name.includes('Loop') ? 'loop' : 'oneshot',
      duration: 0, // Would be extracted from audio
      size: file.size,
      file
    }));

    setSamples(prev => [...prev, ...newSamples]);
    toast.success(`${files.length} file(s) added`);
  };

  const handleArtworkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArtworkFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setArtworkPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeSample = (id: string) => {
    setSamples(prev => prev.filter(s => s.id !== id));
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    if (metadata.tags.includes(newTag.trim())) {
      toast.error('Tag already exists');
      return;
    }
    setMetadata(prev => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()]
    }));
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const toggleKeySignature = (key: string) => {
    setMetadata(prev => ({
      ...prev,
      keySignatures: prev.keySignatures.includes(key)
        ? prev.keySignatures.filter(k => k !== key)
        : [...prev.keySignatures, key]
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const totalSize = samples.reduce((sum, s) => sum + s.size, 0);
  const isReadyToPublish = samples.length > 0 && metadata.name && artworkFile;

  const handlePublish = async () => {
    if (!isReadyToPublish) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 200);

    try {
      await new Promise(resolve => setTimeout(resolve, 4500));
      
      toast.success('Sample pack published!', {
        description: 'Your pack is now available in the marketplace.'
      });
      
      // Reset form
      setSamples([]);
      setArtworkFile(null);
      setArtworkPreview(null);
      setStep('upload');
      setMetadata({
        name: '',
        description: '',
        category: 'Log Drums',
        subgenre: 'Private School',
        region: 'Gauteng',
        tags: [],
        bpmRange: { min: 110, max: 120 },
        keySignatures: [],
        price: 1999,
        isExclusive: false,
        royaltyFree: true
      });
    } catch (error) {
      toast.error('Upload failed', {
        description: 'Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Sample Pack Publisher</CardTitle>
              <CardDescription>
                Sell your Amapiano samples on the marketplace
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Star className="w-3 h-3" />
            Creator Program
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={step} onValueChange={(v) => setStep(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="metadata" disabled={samples.length === 0} className="gap-2">
              <Tag className="w-4 h-4" />
              Metadata
            </TabsTrigger>
            <TabsTrigger value="pricing" disabled={!metadata.name} className="gap-2">
              <DollarSign className="w-4 h-4" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!isReadyToPublish} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 mt-4">
            {/* Artwork Upload */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Pack Artwork</Label>
                <div 
                  className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                  onClick={() => document.getElementById('artwork-input')?.click()}
                >
                  {artworkPreview ? (
                    <img src={artworkPreview} alt="Artwork" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload<br />
                        <span className="text-xs">1400x1400px recommended</span>
                      </p>
                    </div>
                  )}
                </div>
                <input
                  id="artwork-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleArtworkUpload}
                />
              </div>

              {/* Sample Files */}
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Sample Files ({samples.length})</Label>
                  <Badge variant="secondary">{formatFileSize(totalSize)}</Badge>
                </div>
                
                <div 
                  className="h-48 rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => document.getElementById('samples-input')?.click()}
                >
                  <div className="text-center">
                    <FileAudio className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drop audio files here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      WAV, MP3, AIFF, MIDI supported
                    </p>
                  </div>
                </div>
                <input
                  id="samples-input"
                  type="file"
                  accept="audio/*,.mid,.midi"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* Sample List */}
            {samples.length > 0 && (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {samples.map(sample => (
                    <div 
                      key={sample.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-background">
                          {sample.type === 'midi' ? (
                            <Music className="w-4 h-4" />
                          ) : (
                            <FileAudio className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{sample.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {sample.type}
                            </Badge>
                            <span>{formatFileSize(sample.size)}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeSample(sample.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <Button 
              onClick={() => setStep('metadata')}
              disabled={samples.length === 0}
              className="w-full"
            >
              Continue to Metadata
            </Button>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="packName">Pack Name *</Label>
                  <Input
                    id="packName"
                    value={metadata.name}
                    onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Pretoria Log Drums Vol. 1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={metadata.description}
                    onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your sample pack..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={metadata.category}
                      onValueChange={(v) => setMetadata(prev => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Subgenre</Label>
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

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>BPM Range</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={metadata.bpmRange.min}
                      onChange={(e) => setMetadata(prev => ({
                        ...prev,
                        bpmRange: { ...prev.bpmRange, min: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-20"
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      value={metadata.bpmRange.max}
                      onChange={(e) => setMetadata(prev => ({
                        ...prev,
                        bpmRange: { ...prev.bpmRange, max: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">BPM</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Key Signatures</Label>
                  <div className="flex flex-wrap gap-1">
                    {KEY_SIGNATURES.map(key => (
                      <Badge
                        key={key}
                        variant={metadata.keySignatures.includes(key) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleKeySignature(key)}
                      >
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button variant="outline" onClick={addTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {metadata.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeTag(tag)} 
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={() => setStep('pricing')}
                disabled={!metadata.name}
                className="flex-1"
              >
                Continue to Pricing
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4 mt-4">
            <Card className="bg-muted/30">
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      value={metadata.price / 100}
                      onChange={(e) => setMetadata(prev => ({ 
                        ...prev, 
                        price: Math.round(parseFloat(e.target.value) * 100) || 0 
                      }))}
                      step="0.01"
                      min="0"
                      className="pl-10 text-lg"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You earn 70% ({formatPrice(metadata.price * 0.7)}) per sale
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="royaltyFree"
                      checked={metadata.royaltyFree}
                      onCheckedChange={(checked) => setMetadata(prev => ({
                        ...prev,
                        royaltyFree: !!checked
                      }))}
                    />
                    <Label htmlFor="royaltyFree" className="text-sm">
                      100% Royalty-Free License
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="exclusive"
                      checked={metadata.isExclusive}
                      onCheckedChange={(checked) => setMetadata(prev => ({
                        ...prev,
                        isExclusive: !!checked
                      }))}
                    />
                    <Label htmlFor="exclusive" className="text-sm">
                      Exclusive to Aura-X
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('metadata')}>
                Back
              </Button>
              <Button 
                onClick={() => setStep('review')}
                disabled={metadata.price === 0}
                className="flex-1"
              >
                Review Pack
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="review" className="space-y-4 mt-4">
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex gap-4">
                  {artworkPreview && (
                    <img 
                      src={artworkPreview} 
                      alt="Pack artwork" 
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{metadata.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      {metadata.description || 'No description'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge>{metadata.category}</Badge>
                      <Badge variant="outline">{metadata.subgenre}</Badge>
                      {metadata.royaltyFree && (
                        <Badge variant="secondary">Royalty-Free</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(metadata.price)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {samples.length} samples
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/30">
                <FileAudio className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-xl font-bold">{samples.length}</div>
                <div className="text-xs text-muted-foreground">Samples</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <Download className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-xl font-bold">{formatFileSize(totalSize)}</div>
                <div className="text-xs text-muted-foreground">Total Size</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <div className="text-xl font-bold">{formatPrice(metadata.price * 0.7)}</div>
                <div className="text-xs text-muted-foreground">Your Earnings</div>
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing...
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('pricing')}>
                Back
              </Button>
              <Button 
                onClick={handlePublish}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? 'Publishing...' : 'Publish to Marketplace'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
