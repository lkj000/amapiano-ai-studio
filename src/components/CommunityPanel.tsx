import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, Share2, Heart, Download, Upload, Users, Music, 
  Headphones, Star, MessageCircle, ThumbsUp, Bookmark,
  TrendingUp, Clock, Award, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CommunityPanelProps {
  onClose: () => void;
}

interface CommunityProject {
  id: string;
  title: string;
  artist: string;
  avatar: string;
  bpm: number;
  key: string;
  genre: string;
  likes: number;
  downloads: number;
  comments: number;
  duration: string;
  previewUrl?: string;
  tags: string[];
  uploadedAt: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

interface Sample {
  id: string;
  name: string;
  artist: string;
  bpm?: number;
  key?: string;
  category: string;
  downloads: number;
  likes: number;
  duration: string;
  tags: string[];
}

export default function CommunityPanel({ onClose }: CommunityPanelProps) {
  const [selectedTab, setSelectedTab] = useState('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    setIsLoading(true);
    try {
      // Load real community posts from social_posts
      const { data: posts } = await supabase
        .from('social_posts')
        .select('*, profiles:creator_id(display_name, avatar_url)')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(20);

      if (posts) {
        setProjects(posts.map(post => ({
          id: post.id,
          title: post.title,
          artist: (post as any).profiles?.display_name || 'Unknown Artist',
          avatar: (post as any).profiles?.avatar_url || '',
          bpm: (post.generation_params as any)?.bpm ?? 0,
          key: (post.generation_params as any)?.key ?? '',
          genre: post.genre_tags?.[0] || 'Amapiano',
          likes: post.like_count || 0,
          downloads: post.share_count || 0,
          comments: post.comment_count || 0,
          duration: post.duration_seconds ? `${Math.floor(post.duration_seconds / 60)}:${(post.duration_seconds % 60).toString().padStart(2, '0')}` : '0:00',
          previewUrl: post.preview_url || post.audio_url,
          tags: post.genre_tags || [],
          uploadedAt: new Date(post.created_at).toLocaleDateString(),
        })));
      }

      // Load real samples from generated_samples
      const { data: sampleData } = await supabase
        .from('generated_samples')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (sampleData) {
        setSamples(sampleData.map(s => ({
          id: s.id,
          name: s.sample_type,
          artist: 'Community',
          bpm: s.bpm ?? undefined,
          key: s.key_signature ?? undefined,
          category: s.sample_type,
          downloads: 0,
          likes: 0,
          duration: '0:08',
          tags: [s.sample_type, s.region || 'global'].filter(Boolean),
        })));
      }
    } catch (error) {
      console.error('Failed to load community data:', error);
      toast.error('Failed to load community data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = (projectId: string) => {
    toast.success('Liked project!');
  };

  const handleDownload = (projectId: string, type: 'project' | 'sample') => {
    toast.success(`${type === 'project' ? 'Project' : 'Sample'} download started!`);
  };

  const handleShare = (title: string) => {
    navigator.clipboard.writeText(`Check out this amazing track: ${title}`);
    toast.success('Share link copied to clipboard!');
  };

  const ProjectCard = ({ project }: { project: CommunityProject }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={project.avatar} />
            <AvatarFallback>{project.artist[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{project.title}</h3>
            <p className="text-xs text-muted-foreground">{project.artist}</p>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleShare(project.title)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2 mb-3">
          {project.bpm > 0 && <Badge variant="secondary" className="text-xs">{project.bpm} BPM</Badge>}
          {project.key && <Badge variant="secondary" className="text-xs">{project.key}</Badge>}
          <Badge variant="outline" className="text-xs">{project.genre}</Badge>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {project.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {project.duration}
          </span>
          <span>{project.uploadedAt}</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <button 
            onClick={() => handleLike(project.id)}
            className={`flex items-center gap-1 hover:text-primary transition-colors ${
              project.isLiked ? 'text-primary' : ''
            }`}
          >
            <Heart className={`w-3 h-3 ${project.isLiked ? 'fill-current' : ''}`} />
            {project.likes}
          </button>
          
          <button 
            onClick={() => handleDownload(project.id, 'project')}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Download className="w-3 h-3" />
            {project.downloads}
          </button>
          
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {project.comments}
          </span>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2"
          >
            <Bookmark className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const SampleCard = ({ sample }: { sample: Sample }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{sample.name}</h3>
            <p className="text-xs text-muted-foreground">{sample.artist}</p>
          </div>
          <Badge variant="secondary" className="text-xs">{sample.category}</Badge>
        </div>

        <div className="flex gap-2 mb-3">
          {sample.bpm && <Badge variant="outline" className="text-xs">{sample.bpm} BPM</Badge>}
          {sample.key && <Badge variant="outline" className="text-xs">{sample.key}</Badge>}
          <Badge variant="outline" className="text-xs">{sample.duration}</Badge>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {sample.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            {sample.likes}
          </span>
          
          <button 
            onClick={() => handleDownload(sample.id, 'sample')}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Download className="w-3 h-3" />
            {sample.downloads}
          </button>
          
          <Button 
            size="sm" 
            variant="default" 
            className="ml-auto h-6 px-2 text-xs"
          >
            <Headphones className="w-3 h-3 mr-1" />
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Card className="fixed inset-4 z-50 bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading community content...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="fixed inset-4 z-50 bg-background flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Community Hub
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Share Project
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-4">
        <div className="h-full flex flex-col">
          <div className="mb-4">
            <Input
              placeholder="Search projects, samples, or artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="projects" className="gap-2">
                <Music className="w-4 h-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="samples" className="gap-2">
                <Headphones className="w-4 h-4" />
                Samples
              </TabsTrigger>
              <TabsTrigger value="trending" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="featured" className="gap-2">
                <Star className="w-4 h-4" />
                Featured
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Community Projects ({projects.length})</h3>
                  <Button size="sm" variant="outline">Filter & Sort</Button>
                </div>
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map(project => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No community projects yet. Be the first to share!</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="samples" className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Sample Library ({samples.length})</h3>
                  <Button size="sm" variant="outline">Filter by Category</Button>
                </div>
                {samples.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {samples.map(sample => (
                      <SampleCard key={sample.id} sample={sample} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No samples available yet.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="trending" className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Trending This Week</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.slice(0, 4).map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="featured" className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Featured Content</h3>
                </div>
                
                <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-primary/20">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Star className="w-8 h-8 text-primary mx-auto mb-2" />
                      <h4 className="font-semibold mb-1">Track of the Week</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Discover exceptional tracks chosen by our community
                      </p>
                      <Button size="sm" className="gap-2">
                        <Music className="w-4 h-4" />
                        Listen Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.filter(p => p.likes > 0).slice(0, 4).map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
