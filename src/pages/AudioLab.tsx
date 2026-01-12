/**
 * Audio Lab Page
 * Central hub for audio processing tools: Mastering, Sample Search, Chord Detection
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIMastering, SampleSimilaritySearch, ChordDetector } from '@/components/audio';
import { Wand2, Search, Piano } from 'lucide-react';

export default function AudioLab() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Audio Lab</h1>
          <p className="text-muted-foreground text-lg">
            Professional audio processing powered by AI
          </p>
        </div>

        {/* Tools Tabs */}
        <Tabs defaultValue="mastering" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="mastering" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">AI Mastering</span>
              <span className="sm:hidden">Master</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Sample Search</span>
              <span className="sm:hidden">Search</span>
            </TabsTrigger>
            <TabsTrigger value="chords" className="flex items-center gap-2">
              <Piano className="w-4 h-4" />
              <span className="hidden sm:inline">Chord Detector</span>
              <span className="sm:hidden">Chords</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mastering">
            <AIMastering />
          </TabsContent>

          <TabsContent value="search">
            <SampleSimilaritySearch />
          </TabsContent>

          <TabsContent value="chords">
            <ChordDetector />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
