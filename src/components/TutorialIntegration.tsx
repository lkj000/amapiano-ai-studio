import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  PlayCircle, 
  Clock, 
  TrendingUp,
  Search,
  Filter,
  Star,
  ExternalLink
} from 'lucide-react';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: 'private-school' | 'log-drums' | 'mixing' | 'arrangement' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  videoUrl: string;
  tags: string[];
  contextTriggers: string[];
}

const tutorials: Tutorial[] = [
  {
    id: 'kelvin-momo-tutorial',
    title: 'Private School Piano with Kelvin Momo Style',
    description: 'Learn the sophisticated log drum patterns and jazzy piano progressions that define Private School Amapiano',
    duration: '15:00',
    category: 'private-school',
    difficulty: 'intermediate',
    videoUrl: 'https://www.youtube.com/watch?v=jmKziUTkgmY',
    tags: ['kelvin-momo', 'private-school', 'log-drums', 'jazz-piano'],
    contextTriggers: ['private-school', 'kelvin-momo', 'jazzy-piano']
  },
  {
    id: 'stock-plugins-only',
    title: 'Professional Amapiano Using Stock Plugins Only',
    description: 'Create radio-ready Amapiano tracks without any third-party VSTs',
    duration: '16:12',
    category: 'general',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=zA1OEetvOYU',
    tags: ['stock-plugins', 'workflow', 'dsp', 'professional'],
    contextTriggers: ['stock-plugins', 'dsp', 'effects']
  },
  {
    id: 'ghost-production',
    title: 'Ghost Production Workflow for Major Artists',
    description: 'Professional beat-making process for client work and commercial releases',
    duration: '12:05',
    category: 'general',
    difficulty: 'advanced',
    videoUrl: 'https://www.youtube.com/watch?v=oyFym_i7Wzg',
    tags: ['ghost-production', 'workflow', 'client-work', 'professional'],
    contextTriggers: ['ghost-producer', 'client', 'professional']
  },
  {
    id: 'log-drum-patterns',
    title: 'Signature Log Drum Programming',
    description: 'Master the iconic log drum patterns that drive Amapiano tracks',
    duration: '10:30',
    category: 'log-drums',
    difficulty: 'intermediate',
    videoUrl: '#',
    tags: ['log-drums', 'rhythm', 'programming', 'patterns'],
    contextTriggers: ['log-drum', 'drums', 'rhythm']
  },
  {
    id: 'mixing-amapiano',
    title: 'Mixing Amapiano: Sub Bass & Space',
    description: 'Professional mixing techniques for deep sub bass and spatial arrangement',
    duration: '18:45',
    category: 'mixing',
    difficulty: 'advanced',
    videoUrl: '#',
    tags: ['mixing', 'sub-bass', 'mastering', 'eq'],
    contextTriggers: ['mixing', 'mastering', 'sub-bass', 'eq']
  }
];

interface TutorialIntegrationProps {
  contextHints?: string[];
  className?: string;
}

export const TutorialIntegration = ({ contextHints = [], className }: TutorialIntegrationProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [contextualTutorials, setContextualTutorials] = useState<Tutorial[]>([]);
  const [allTutorials, setAllTutorials] = useState<Tutorial[]>(tutorials);

  // Context-aware tutorial suggestions
  useEffect(() => {
    if (contextHints.length > 0) {
      const relevant = tutorials.filter(tutorial =>
        tutorial.contextTriggers.some(trigger =>
          contextHints.some(hint => 
            hint.toLowerCase().includes(trigger.toLowerCase())
          )
        )
      );
      setContextualTutorials(relevant.slice(0, 3));
    }
  }, [contextHints]);

  const filteredTutorials = allTutorials.filter(tutorial => {
    const matchesSearch = searchQuery === '' || 
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const openTutorial = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Tutorial Library
          <Badge variant="secondary" className="ml-auto">
            {tutorials.length} Lessons
          </Badge>
        </CardTitle>
        <CardDescription>
          Context-aware video tutorials and production guides
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="private-school" className="text-xs">Private School</TabsTrigger>
            <TabsTrigger value="log-drums" className="text-xs">Log Drums</TabsTrigger>
            <TabsTrigger value="mixing" className="text-xs">Mixing</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Contextual Suggestions */}
        {contextualTutorials.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Star className="w-4 h-4 text-primary" />
              Suggested for You
            </h4>
            <div className="space-y-2">
              {contextualTutorials.map(tutorial => (
                <div
                  key={tutorial.id}
                  className="p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
                  onClick={() => openTutorial(tutorial.videoUrl)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-foreground line-clamp-1">
                        {tutorial.title}
                      </h5>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {tutorial.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px]">
                          <Clock className="w-3 h-3 mr-1" />
                          {tutorial.duration}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {tutorial.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <PlayCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Tutorials List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <h4 className="text-sm font-semibold text-foreground sticky top-0 bg-card py-2">
            All Tutorials ({filteredTutorials.length})
          </h4>
          {filteredTutorials.map(tutorial => (
            <div
              key={tutorial.id}
              className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => openTutorial(tutorial.videoUrl)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {tutorial.title}
                  </h5>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {tutorial.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tutorial.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-[10px] text-muted-foreground">{tutorial.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
