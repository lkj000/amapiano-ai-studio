/**
 * Training Dataset Management Page
 * 
 * Browse, upload, and annotate training samples for ML models
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BulkAudioUploader } from '@/components/training/BulkAudioUploader';
import { TrainingSampleCard } from '@/components/training/TrainingSampleCard';
import { toast } from 'sonner';
import { useModalApi } from '@/hooks/useModalApi';
import { 
  Database, 
  Upload, 
  Search, 
  Filter,
  BarChart3,
  Play,
  Loader2,
  Music2,
  Brain,
  CheckCircle2,
  Clock,
  Sparkles,
  StopCircle
} from 'lucide-react';

interface TrainingSample {
  id: string;
  filename: string;
  storage_path: string;
  duration_seconds: number | null;
  bpm: number | null;
  key_signature: string | null;
  subgenre: string | null;
  region: string | null;
  mood: string[] | null;
  tags: string[] | null;
  authenticity_score: number | null;
  quality_rating: number | null;
  is_verified: boolean;
  annotation_notes: string | null;
  processing_status: string;
  stems_separated: boolean;
  created_at: string;
}

interface DatasetStats {
  total: number;
  verified: number;
  pending: number;
  analyzed: number;
  withStems: number;
  avgAuthenticityScore: number;
  byRegion: Record<string, number>;
  bySubgenre: Record<string, number>;
}

export default function TrainingDataset() {
  const [samples, setSamples] = useState<TrainingSample[]>([]);
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState<string>('');
  const [filterSubgenre, setFilterSubgenre] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterVerified, setFilterVerified] = useState<string>('');
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 });
  const [analyzeAborted, setAnalyzeAborted] = useState(false);
  
  const { analyzeAudio } = useModalApi();

  const fetchSamples = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('training_samples')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('filename', `%${searchQuery}%`);
      }
      if (filterRegion) {
        query = query.eq('region', filterRegion);
      }
      if (filterSubgenre) {
        query = query.eq('subgenre', filterSubgenre);
      }
      if (filterStatus) {
        query = query.eq('processing_status', filterStatus);
      }
      if (filterVerified === 'verified') {
        query = query.eq('is_verified', true);
      } else if (filterVerified === 'unverified') {
        query = query.eq('is_verified', false);
      }

      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      setSamples(data || []);
    } catch (error) {
      toast.error('Failed to load samples');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filterRegion, filterSubgenre, filterStatus, filterVerified]);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('training_samples')
        .select('*');

      if (error) throw error;

      const samples = data || [];
      const byRegion: Record<string, number> = {};
      const bySubgenre: Record<string, number> = {};
      let totalAuthScore = 0;
      let authScoreCount = 0;

      samples.forEach(s => {
        if (s.region) {
          byRegion[s.region] = (byRegion[s.region] || 0) + 1;
        }
        if (s.subgenre) {
          bySubgenre[s.subgenre] = (bySubgenre[s.subgenre] || 0) + 1;
        }
        if (s.authenticity_score !== null) {
          totalAuthScore += s.authenticity_score;
          authScoreCount++;
        }
      });

      setStats({
        total: samples.length,
        verified: samples.filter(s => s.is_verified).length,
        pending: samples.filter(s => s.processing_status === 'pending').length,
        analyzed: samples.filter(s => s.processing_status === 'analyzed' || s.processing_status === 'complete').length,
        withStems: samples.filter(s => s.stems_separated).length,
        avgAuthenticityScore: authScoreCount > 0 ? totalAuthScore / authScoreCount : 0,
        byRegion,
        bySubgenre
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchSamples();
    fetchStats();
  }, [fetchSamples, fetchStats]);

  const handleUploadComplete = (sampleIds: string[]) => {
    fetchSamples();
    fetchStats();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterRegion('');
    setFilterSubgenre('');
    setFilterStatus('');
    setFilterVerified('');
  };

  const hasFilters = searchQuery || filterRegion || filterSubgenre || filterStatus || filterVerified;

  const handleAnalyzeAll = async () => {
    const pendingSamples = samples.filter(s => s.processing_status === 'pending' || s.processing_status !== 'analyzed');
    
    if (pendingSamples.length === 0) {
      toast.info('All samples are already analyzed');
      return;
    }
    
    setIsAnalyzingAll(true);
    setAnalyzeAborted(false);
    setAnalyzeProgress({ current: 0, total: pendingSamples.length });
    
    toast.info(`Starting batch analysis of ${pendingSamples.length} samples...`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < pendingSamples.length; i++) {
      if (analyzeAborted) {
        toast.info('Batch analysis stopped');
        break;
      }
      
      const sample = pendingSamples[i];
      setAnalyzeProgress({ current: i + 1, total: pendingSamples.length });
      
      try {
        // Get the audio URL from storage
        const { data: urlData } = await supabase.storage
          .from('training-audio')
          .getPublicUrl(sample.storage_path);
        
        if (urlData?.publicUrl) {
          const result = await analyzeAudio(urlData.publicUrl);
          
          if (result?.success) {
            // Update sample with analysis results
            await supabase
              .from('training_samples')
              .update({
                bpm: result.bpm || null,
                key_signature: result.key ? `${result.key} ${result.scale || ''}`.trim() : null,
                processing_status: 'analyzed',
                authenticity_score: result.danceability || null
              })
              .eq('id', sample.id);
            
            successCount++;
          } else {
            failCount++;
          }
        }
      } catch (error) {
        console.error(`Failed to analyze ${sample.filename}:`, error);
        failCount++;
      }
    }
    
    setIsAnalyzingAll(false);
    setAnalyzeProgress({ current: 0, total: 0 });
    
    if (!analyzeAborted) {
      toast.success(`Batch analysis complete: ${successCount} successful, ${failCount} failed`);
    }
    
    fetchSamples();
    fetchStats();
  };

  const handleStopAnalysis = () => {
    setAnalyzeAborted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Database className="h-7 w-7" />
              Training Dataset
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your Amapiano ML training data
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stats && (
              <>
                <Badge variant="outline" className="gap-1">
                  <Music2 className="h-3 w-3" />
                  {stats.total} Samples
                </Badge>
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {stats.verified} Verified
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {stats.pending} Pending
                </Badge>
              </>
            )}
            {isAnalyzingAll ? (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleStopAnalysis}
                className="gap-2"
              >
                <StopCircle className="h-4 w-4" />
                Stop ({analyzeProgress.current}/{analyzeProgress.total})
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleAnalyzeAll}
                disabled={samples.length === 0}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Analyze All
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="browse" className="gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Browse</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Statistics</span>
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-4">
            {/* Filters */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Input
                      placeholder="Search filename..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <Select value={filterRegion || "all"} onValueChange={v => setFilterRegion(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      <SelectItem value="gauteng">Gauteng</SelectItem>
                      <SelectItem value="kwazulu-natal">KwaZulu-Natal</SelectItem>
                      <SelectItem value="western-cape">Western Cape</SelectItem>
                      <SelectItem value="eastern-cape">Eastern Cape</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterSubgenre || "all"} onValueChange={v => setFilterSubgenre(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Subgenre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subgenres</SelectItem>
                      <SelectItem value="private_school">Private School</SelectItem>
                      <SelectItem value="dust">Dust</SelectItem>
                      <SelectItem value="kabza_style">Kabza Style</SelectItem>
                      <SelectItem value="vocal_deep">Vocal Deep</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="sgija">Sgija</SelectItem>
                      <SelectItem value="bacardi">Bacardi</SelectItem>
                      <SelectItem value="piano_hub">Piano Hub</SelectItem>
                      <SelectItem value="three_step">Three Step</SelectItem>
                      <SelectItem value="soweto_groove">Soweto Groove</SelectItem>
                      <SelectItem value="durban_tech">Durban Tech</SelectItem>
                      <SelectItem value="kwaito_fusion">Kwaito Fusion</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                      <SelectItem value="afro_tech">Afro Tech</SelectItem>
                      <SelectItem value="experimental">Experimental</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus || "all"} onValueChange={v => setFilterStatus(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="analyzed">Analyzed</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterVerified || "all"} onValueChange={v => setFilterVerified(v === "all" ? "" : v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Verification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="verified">Verified Only</SelectItem>
                      <SelectItem value="unverified">Needs Verification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {hasFilters && (
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {samples.length} results
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Samples Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : samples.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <Music2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No samples found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasFilters ? 'Try adjusting your filters' : 'Upload some training audio to get started'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {samples.map(sample => (
                  <TrainingSampleCard
                    key={sample.id}
                    sample={sample}
                    onUpdate={fetchSamples}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <BulkAudioUploader onUploadComplete={handleUploadComplete} />
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            {stats ? (
              <>
                {/* Overview Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-4xl font-bold">{stats.total}</p>
                        <p className="text-sm text-muted-foreground mt-1">Total Samples</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-green-500">{stats.verified}</p>
                        <p className="text-sm text-muted-foreground mt-1">Verified</p>
                        <Progress 
                          value={stats.total > 0 ? (stats.verified / stats.total) * 100 : 0} 
                          className="h-2 mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-4xl font-bold">{stats.withStems}</p>
                        <p className="text-sm text-muted-foreground mt-1">With Stems</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-4xl font-bold">
                          {(stats.avgAuthenticityScore * 100).toFixed(0)}%
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Avg. Authenticity</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Regional Distribution */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Regional Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.byRegion)
                        .sort((a, b) => b[1] - a[1])
                        .map(([region, count]) => (
                          <div key={region}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm capitalize">{region.replace('-', ' ')}</span>
                              <span className="text-sm font-medium">{count}</span>
                            </div>
                            <Progress 
                              value={(count / stats.total) * 100} 
                              className="h-2"
                            />
                          </div>
                        ))}
                      {Object.keys(stats.byRegion).length === 0 && (
                        <p className="text-sm text-muted-foreground">No regional data yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Subgenre Distribution */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Subgenre Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stats.bySubgenre)
                        .sort((a, b) => b[1] - a[1])
                        .map(([subgenre, count]) => (
                          <Badge key={subgenre} variant="secondary" className="gap-1">
                            {subgenre.replace('-', ' ')}
                            <span className="bg-background/50 px-1.5 py-0.5 rounded text-xs">
                              {count}
                            </span>
                          </Badge>
                        ))}
                      {Object.keys(stats.bySubgenre).length === 0 && (
                        <p className="text-sm text-muted-foreground">No subgenre data yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
