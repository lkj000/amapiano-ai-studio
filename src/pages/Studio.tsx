/**
 * Studio Page
 * Unified hub for all production tools - LANDR-inspired design
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User } from '@supabase/supabase-js';
import { 
  Music, 
  Package, 
  Users, 
  Wand2, 
  Globe, 
  Calculator,
  MessageSquare,
  Layers,
  Search,
  Disc3,
  Piano
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Import components
import { SampleBrowser } from '@/components/samples';
import { PluginBrowser } from '@/components/plugins';
import { ProNetwork } from '@/components/network';
import { MusicDistribution, RoyaltySplitCalculator } from '@/components/distribution';
import { CollaborationRoom } from '@/components/collaboration';
import { SamplePackPublisher } from '@/components/marketplace/SamplePackPublisher';
import { AIMastering, SampleSimilaritySearch, ChordDetector } from '@/components/audio';

interface StudioProps {
  user: User | null;
}

const QUICK_TOOLS = [
  { 
    icon: Wand2, 
    title: 'AI Mastering', 
    description: 'Polish your tracks instantly',
    tab: 'mastering',
    badge: 'AI'
  },
  { 
    icon: Layers, 
    title: 'Stem Splitter', 
    description: 'Isolate vocals, drums, bass',
    link: '/stem-splitter',
    badge: 'Popular'
  },
  { 
    icon: Piano, 
    title: 'Chord Detection', 
    description: 'Identify chords from audio',
    tab: 'chords',
    badge: 'New'
  },
  { 
    icon: Globe, 
    title: 'Distribute', 
    description: 'Release to 150+ platforms',
    tab: 'distribution',
    badge: null
  },
];

export default function Studio({ user }: StudioProps) {
  const [activeTab, setActiveTab] = useState('samples');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Studio</h1>
            <p className="text-muted-foreground text-lg">
              Your complete Amapiano production toolkit
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link to="/daw">
                <Music className="w-4 h-4 mr-2" />
                Open DAW
              </Link>
            </Button>
            <Button asChild>
              <Link to="/creator-hub">
                <Disc3 className="w-4 h-4 mr-2" />
                Creator Hub
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Tools */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {QUICK_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card 
                key={tool.title}
                className="bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => {
                  if (tool.tab) setActiveTab(tool.tab);
                  else if (tool.link) window.location.href = tool.link;
                }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{tool.title}</span>
                      {tool.badge && (
                        <Badge variant="secondary" className="text-xs h-4">
                          {tool.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 mb-6">
            <TabsTrigger value="samples" className="gap-2">
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">Samples</span>
            </TabsTrigger>
            <TabsTrigger value="plugins" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Plugins</span>
            </TabsTrigger>
            <TabsTrigger value="network" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Network</span>
            </TabsTrigger>
            <TabsTrigger value="mastering" className="gap-2">
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">Mastering</span>
            </TabsTrigger>
            <TabsTrigger value="chords" className="gap-2">
              <Piano className="w-4 h-4" />
              <span className="hidden sm:inline">Chords</span>
            </TabsTrigger>
            <TabsTrigger value="similarity" className="gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Similarity</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Distribution</span>
            </TabsTrigger>
            <TabsTrigger value="royalties" className="gap-2">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Royalties</span>
            </TabsTrigger>
            <TabsTrigger value="collaborate" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Collaborate</span>
            </TabsTrigger>
            <TabsTrigger value="publish" className="gap-2">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Publish</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="samples">
            <SampleBrowser />
          </TabsContent>

          <TabsContent value="plugins">
            <PluginBrowser />
          </TabsContent>

          <TabsContent value="network">
            <ProNetwork />
          </TabsContent>

          <TabsContent value="mastering">
            <AIMastering />
          </TabsContent>

          <TabsContent value="chords">
            <ChordDetector />
          </TabsContent>

          <TabsContent value="similarity">
            <SampleSimilaritySearch />
          </TabsContent>

          <TabsContent value="distribution">
            <MusicDistribution />
          </TabsContent>

          <TabsContent value="royalties">
            <RoyaltySplitCalculator />
          </TabsContent>

          <TabsContent value="collaborate">
            <CollaborationRoom />
          </TabsContent>

          <TabsContent value="publish">
            <SamplePackPublisher />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
