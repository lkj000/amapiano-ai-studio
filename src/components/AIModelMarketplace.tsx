import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Store, Download, Upload, Star, Clock, Users, 
  Brain, Zap, Award, Coins, TrendingUp, Filter, 
  Play, Settings, Package, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AIModel {
  id: string;
  name: string;
  description: string;
  author: string;
  type: 'melody' | 'rhythm' | 'harmony' | 'arrangement' | 'mixing' | 'style_transfer';
  category: 'amapiano' | 'jazz' | 'house' | 'afrobeat' | 'general';
  version: string;
  size: string; // e.g., "12.5MB"
  accuracy: number; // 0-1
  downloads: number;
  rating: number; // 0-5
  reviews: number;
  price: number; // 0 for free
  tags: string[];
  modelUrl?: string;
  demoUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  isFeatured: boolean;
}

interface TrainingJob {
  id: string;
  modelName: string;
  type: string;
  status: 'preparing' | 'training' | 'validating' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  estimatedCompletion?: Date;
  logs: string[];
}

interface AIModelMarketplaceProps {
  onModelSelect?: (model: AIModel) => void;
  className?: string;
}

// Sample AI models for the marketplace
const SAMPLE_MODELS: AIModel[] = [
  {
    id: 'model_001',
    name: 'Amapiano Master Drummer',
    description: 'State-of-the-art AI model trained on 10,000+ authentic amapiano drum patterns. Generates complex log drum sequences with perfect swing and cultural accuracy.',
    author: 'KabzaAI Studios',
    type: 'rhythm',
    category: 'amapiano',
    version: '2.1.0',
    size: '45.2MB',
    accuracy: 0.94,
    downloads: 12847,
    rating: 4.8,
    reviews: 234,
    price: 0,
    tags: ['log drums', 'polyrhythm', 'authentic', 'south african'],
    demoUrl: '/demos/amapiano_drums.mp3',
    thumbnailUrl: '/models/drummer_thumb.jpg',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-20'),
    isVerified: true,
    isFeatured: true
  },
  {
    id: 'model_002',
    name: 'Jazz Piano Harmony Engine',
    description: 'Advanced neural network for generating sophisticated jazz chord progressions with voice leading. Perfect for private school amapiano and jazz fusion.',
    author: 'HarmonyAI Labs',
    type: 'harmony',
    category: 'jazz',
    version: '1.8.3',
    size: '78.9MB',
    accuracy: 0.91,
    downloads: 8543,
    rating: 4.7,
    reviews: 167,
    price: 29.99,
    tags: ['jazz chords', 'voice leading', 'extensions', 'sophisticated'],
    demoUrl: '/demos/jazz_piano.mp3',
    thumbnailUrl: '/models/piano_thumb.jpg',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-18'),
    isVerified: true,
    isFeatured: false
  },
  {
    id: 'model_003',
    name: 'Cultural Melody Weaver',
    description: 'Specialized in creating authentic South African melodic patterns with traditional scales and phrasing. Trained on traditional music archives.',
    author: 'AfrobeatsAI',
    type: 'melody',
    category: 'afrobeat',
    version: '1.4.2',
    size: '32.1MB',
    accuracy: 0.89,
    downloads: 5621,
    rating: 4.6,
    reviews: 98,
    price: 19.99,
    tags: ['traditional', 'african scales', 'cultural', 'authentic'],
    demoUrl: '/demos/african_melody.mp3',
    thumbnailUrl: '/models/melody_thumb.jpg',
    createdAt: new Date('2024-01-28'),
    updatedAt: new Date('2024-02-10'),
    isVerified: false,
    isFeatured: false
  },
  {
    id: 'model_004',
    name: 'Style Transfer Master',
    description: 'Transform any musical input into authentic amapiano style while preserving the original essence. Advanced style transfer technology.',
    author: 'StyleAI Corp',
    type: 'style_transfer',
    category: 'general',
    version: '3.0.1',
    size: '156.7MB',
    accuracy: 0.87,
    downloads: 15234,
    rating: 4.9,
    reviews: 445,
    price: 49.99,
    tags: ['style transfer', 'transformation', 'versatile', 'advanced'],
    demoUrl: '/demos/style_transfer.mp3',
    thumbnailUrl: '/models/style_thumb.jpg',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-02-25'),
    isVerified: true,
    isFeatured: true
  }
];

export const AIModelMarketplace: React.FC<AIModelMarketplaceProps> = ({
  onModelSelect,
  className
}) => {
  const [models, setModels] = useState<AIModel[]>(SAMPLE_MODELS);
  const [filteredModels, setFilteredModels] = useState<AIModel[]>(SAMPLE_MODELS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [showPaidOnly, setShowPaidOnly] = useState(false);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [newModelData, setNewModelData] = useState({
    name: '',
    description: '',
    type: 'melody' as AIModel['type'],
    category: 'amapiano' as AIModel['category']
  });

  // Filter and sort models
  useEffect(() => {
    let filtered = models;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(model => model.category === selectedCategory);
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(model => model.type === selectedType);
    }

    // Price filter
    if (showPaidOnly) {
      filtered = filtered.filter(model => model.price > 0);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(model =>
        model.name.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query) ||
        model.author.toLowerCase().includes(query) ||
        model.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'downloads':
          return b.downloads - a.downloads;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        default: // featured
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || b.rating - a.rating;
      }
    });

    setFilteredModels(filtered);
  }, [models, searchQuery, selectedCategory, selectedType, sortBy, showPaidOnly]);

  const downloadModel = async (model: AIModel) => {
    try {
      toast.info(`Downloading ${model.name}...`);
      
      // Simulate download process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update download count
      setModels(prev =>
        prev.map(m => m.id === model.id ? { ...m, downloads: m.downloads + 1 } : m)
      );

      onModelSelect?.(model);
      toast.success(`${model.name} downloaded successfully!`);

    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed. Please try again.');
    }
  };

  const startModelTraining = async () => {
    if (!newModelData.name.trim()) {
      toast.error('Please enter a model name');
      return;
    }

    const trainingJob: TrainingJob = {
      id: `job_${Date.now()}`,
      modelName: newModelData.name,
      type: newModelData.type,
      status: 'preparing',
      progress: 0,
      startTime: new Date(),
      logs: ['Initializing training pipeline...', 'Preparing dataset...']
    };

    setTrainingJobs(prev => [trainingJob, ...prev]);
    
    // Simulate training process
    simulateTraining(trainingJob.id);
    
    toast.success(`Training started for ${newModelData.name}`);
    
    // Reset form
    setNewModelData({
      name: '',
      description: '',
      type: 'melody',
      category: 'amapiano'
    });
  };

  const simulateTraining = async (jobId: string) => {
    const stages = [
      { status: 'preparing' as const, progress: 10, log: 'Dataset validation complete' },
      { status: 'training' as const, progress: 30, log: 'Training epoch 1/10 completed' },
      { status: 'training' as const, progress: 60, log: 'Training epoch 5/10 completed' },
      { status: 'training' as const, progress: 85, log: 'Training epoch 9/10 completed' },
      { status: 'validating' as const, progress: 95, log: 'Running validation tests...' },
      { status: 'completed' as const, progress: 100, log: 'Model training completed successfully!' }
    ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setTrainingJobs(prev =>
        prev.map(job =>
          job.id === jobId
            ? {
                ...job,
                status: stage.status,
                progress: stage.progress,
                logs: [...job.logs, stage.log]
              }
            : job
        )
      );
    }

    // Add completed model to marketplace
    if (Math.random() > 0.2) { // 80% success rate
      setTimeout(() => {
        const newModel: AIModel = {
          id: `model_${Date.now()}`,
          name: newModelData.name,
          description: newModelData.description || 'Custom trained model',
          author: 'You',
          type: newModelData.type,
          category: newModelData.category,
          version: '1.0.0',
          size: `${Math.round(Math.random() * 50 + 20)}MB`,
          accuracy: Math.random() * 0.2 + 0.8,
          downloads: 0,
          rating: 0,
          reviews: 0,
          price: 0,
          tags: ['custom', 'user-trained'],
          createdAt: new Date(),
          updatedAt: new Date(),
          isVerified: false,
          isFeatured: false
        };

        setModels(prev => [newModel, ...prev]);
        toast.success(`🎉 Your model "${newModel.name}" is now available in the marketplace!`);
      }, 1000);
    }
  };

  const playDemo = (model: AIModel) => {
    if (model.demoUrl) {
      const audio = new Audio(model.demoUrl);
      audio.play().catch(() => {
        toast.error('Demo audio not available');
      });
    } else {
      toast.info('Demo coming soon...');
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      melody: Brain,
      rhythm: Zap,
      harmony: Award,
      arrangement: Settings,
      mixing: Package,
      style_transfer: Share2
    };
    return icons[type as keyof typeof icons] || Brain;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      amapiano: 'bg-purple-500/20 text-purple-700',
      jazz: 'bg-blue-500/20 text-blue-700',
      house: 'bg-green-500/20 text-green-700',
      afrobeat: 'bg-orange-500/20 text-orange-700',
      general: 'bg-gray-500/20 text-gray-700'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/20 text-gray-700';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          AI Model Marketplace
          <Badge variant="outline" className="ml-auto bg-gradient-to-r from-purple-500/20 to-pink-500/20">
            <Package className="w-3 h-3 mr-1" />
            {models.length} Models
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="browse" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="train">Train Model</TabsTrigger>
            <TabsTrigger value="my-models">My Models</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Search models, authors, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="amapiano">Amapiano</option>
                  <option value="jazz">Jazz</option>
                  <option value="house">House</option>
                  <option value="afrobeat">Afrobeat</option>
                  <option value="general">General</option>
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="melody">Melody</option>
                  <option value="rhythm">Rhythm</option>
                  <option value="harmony">Harmony</option>
                  <option value="arrangement">Arrangement</option>
                  <option value="mixing">Mixing</option>
                  <option value="style_transfer">Style Transfer</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="featured">Featured</option>
                  <option value="rating">Rating</option>
                  <option value="downloads">Downloads</option>
                  <option value="newest">Newest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showPaidOnly}
                    onChange={(e) => setShowPaidOnly(e.target.checked)}
                  />
                  Paid models only
                </label>
              </div>
            </div>

            {/* Model Grid */}
            <ScrollArea className="h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredModels.map((model) => {
                  const TypeIcon = getTypeIcon(model.type);
                  return (
                    <Card key={model.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-5 h-5 text-primary" />
                          <h3 className="font-medium">{model.name}</h3>
                          {model.isVerified && (
                            <Badge variant="outline" className="bg-blue-500/20 text-blue-700">
                              <Award className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        {model.isFeatured && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                            Featured
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {model.description}
                      </p>

                      <div className="flex items-center gap-4 mb-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{model.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({model.reviews})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="w-4 h-4 text-muted-foreground" />
                          <span>{model.downloads.toLocaleString()}</span>
                        </div>
                        <div className="text-muted-foreground">{model.size}</div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={getCategoryColor(model.category)} variant="outline">
                          {model.category}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {model.type.replace('_', ' ')}
                        </Badge>
                        <div className="ml-auto text-sm font-medium">
                          {model.price === 0 ? 'Free' : `$${model.price}`}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => downloadModel(model)}
                          className="flex-1"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {model.price === 0 ? 'Download' : 'Purchase'}
                        </Button>
                        <Button
                          onClick={() => playDemo(model)}
                          variant="outline"
                          size="sm"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {model.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="train" className="space-y-4">
            {/* Model Training Interface */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Train Your Own AI Model</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create custom AI models trained on your own musical data and preferences.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Model Name</label>
                  <Input
                    placeholder="My Custom Amapiano Model"
                    value={newModelData.name}
                    onChange={(e) => setNewModelData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Model Type</label>
                  <select
                    value={newModelData.type}
                    onChange={(e) => setNewModelData(prev => ({ ...prev, type: e.target.value as AIModel['type'] }))}
                    className="w-full mt-1 px-3 py-2 border rounded"
                  >
                    <option value="melody">Melody Generation</option>
                    <option value="rhythm">Rhythm Patterns</option>
                    <option value="harmony">Harmony & Chords</option>
                    <option value="arrangement">Arrangement</option>
                    <option value="mixing">Mixing & Effects</option>
                    <option value="style_transfer">Style Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Describe what your model specializes in..."
                  value={newModelData.description}
                  onChange={(e) => setNewModelData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={newModelData.category}
                  onChange={(e) => setNewModelData(prev => ({ ...prev, category: e.target.value as AIModel['category'] }))}
                  className="w-full mt-1 px-3 py-2 border rounded"
                >
                  <option value="amapiano">Amapiano</option>
                  <option value="jazz">Jazz</option>
                  <option value="house">House</option>
                  <option value="afrobeat">Afrobeat</option>
                  <option value="general">General</option>
                </select>
              </div>

              <Button
                onClick={startModelTraining}
                disabled={!newModelData.name.trim()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Start Training Model
              </Button>
            </div>

            {/* Active Training Jobs */}
            {trainingJobs.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">Training Jobs</h3>
                {trainingJobs.map((job) => (
                  <Card key={job.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{job.modelName}</h4>
                      <Badge className={
                        job.status === 'completed' ? 'bg-green-500/20 text-green-700' :
                        job.status === 'failed' ? 'bg-red-500/20 text-red-700' :
                        'bg-blue-500/20 text-blue-700'
                      }>
                        {job.status}
                      </Badge>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3" />
                        Started: {job.startTime.toLocaleTimeString()}
                      </div>
                      <div className="text-xs">
                        Latest: {job.logs[job.logs.length - 1]}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-models" className="space-y-4">
            <div className="text-center p-6 text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Your trained models will appear here</p>
              <p className="text-xs">Train your first model to get started</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};