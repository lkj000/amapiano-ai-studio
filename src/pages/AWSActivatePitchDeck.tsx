/**
 * AWS Activate Pitch Deck V2 - Amapiano AI
 * Enhanced version incorporating PDF insights with AWS-safe positioning
 * - Stronger cultural narrative from PDF
 * - Technical depth with measured claims
 * - Clear product-led SaaS model
 * - Concrete traction with proper status labels
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Download, 
  Music, Users, TrendingUp, Shield, Zap, Globe, 
  DollarSign, Target, Rocket, Check, Clock, Building2,
  Sparkles, BarChart3, Award, Headphones, Radio, Mic2,
  Heart, Layers, Database, Server, Lock, ArrowRight,
  Play, Volume2, Star, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Slide {
  id: number;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
}

export default function AWSActivatePitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const slides: Slide[] = [
    // Slide 1: Title - Cultural Hook
    {
      id: 1,
      title: 'Amapiano AI',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 flex items-center justify-center mb-6 mx-auto shadow-2xl shadow-orange-500/30">
              <Headphones className="w-14 h-14 md:w-18 md:h-18 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-4">
              Amapiano AI
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The AI-Powered Music Studio Built for Africa's Sound
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex gap-3 flex-wrap justify-center">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 py-1.5 px-4">
                Product-Led SaaS
              </Badge>
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 py-1.5 px-4">
                B2C + B2B2C
              </Badge>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 py-1.5 px-4">
                AWS-Native
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Seed Stage • January 2026 • Seeking AWS Activate Partnership
            </p>
          </motion.div>
        </div>
      ),
    },

    // Slide 2: The Cultural Moment
    {
      id: 2,
      title: 'The Cultural Moment',
      content: (
        <div className="grid lg:grid-cols-2 gap-8 h-full items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <TrendingUp className="w-3 h-3 mr-1" /> Breaking Out
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                Amapiano is Africa's biggest music export since Afrobeats
              </h2>
              <p className="text-lg text-muted-foreground">
                Born in South African townships, now topping charts from London to Lagos. Grammy nominations. Major label signings. Global festival stages.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30">
                <p className="text-3xl font-bold text-green-500">540%</p>
                <p className="text-sm text-muted-foreground">Stream growth since 2021</p>
                <p className="text-xs text-muted-foreground/70">Source: Spotify Wrapped</p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30">
                <p className="text-3xl font-bold text-amber-500">2B+</p>
                <p className="text-sm text-muted-foreground">Annual streams globally</p>
                <p className="text-xs text-muted-foreground/70">Source: Luminate 2024</p>
              </Card>
            </div>
          </div>
          
          <div className="space-y-4">
            <Card className="p-5 border-muted bg-card/50">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Genre-Defining Moments
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <span>Grammy nominations for Amapiano artists (2024)</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <span>Major label deals: Columbia, Def Jam Africa, Universal</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <span>Drake, Beyoncé, Chris Brown sampling Amapiano sounds</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <span>Coachella, Glastonbury, Tomorrowland bookings</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-5 bg-amber-500/10 border-amber-500/30">
              <p className="text-center font-medium">
                "Amapiano is the sound of a generation—and it's just getting started."
              </p>
              <p className="text-center text-sm text-muted-foreground mt-2">
                — Apple Music Global Editorial
              </p>
            </Card>
          </div>
        </div>
      ),
    },

    // Slide 3: The Problem
    {
      id: 3,
      title: 'The Problem',
      content: (
        <div className="grid lg:grid-cols-2 gap-8 h-full items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                The tools haven't caught up to the culture
              </h2>
              <p className="text-lg text-muted-foreground">
                Millions want to create Amapiano, but professional production remains out of reach for most African creators.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <DollarSign className="w-6 h-6 text-destructive mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Prohibitive Costs</p>
                  <p className="text-sm text-muted-foreground">
                    DAW licenses cost $300-700 USD—more than monthly minimum wage in South Africa. Studio time: $100-500/hour in Johannesburg.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <Clock className="w-6 h-6 text-destructive mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Technical Barriers</p>
                  <p className="text-sm text-muted-foreground">
                    Authentic Amapiano requires mastering log drums, bass synthesis, and genre-specific mixing—skills that take years to develop.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <Globe className="w-6 h-6 text-destructive mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">AI Ignores African Music</p>
                  <p className="text-sm text-muted-foreground">
                    Suno, Udio, and other AI tools are trained on Western music. Amapiano's unique rhythms, percussion, and structure are underrepresented.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <Card className="p-6 border-muted">
              <h3 className="text-lg font-semibold mb-4 text-center">The Market Reality</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">South Africa minimum wage</p>
                    <p className="text-xs text-muted-foreground">~$250/month vs $500+ DAW cost</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Users className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Millions of aspiring producers</p>
                    <p className="text-xs text-muted-foreground">Limited by cost and complexity</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Globe className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">No genre-specific AI tools</p>
                    <p className="text-xs text-muted-foreground">Existing AI trained on Western music</p>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-amber-500/10 border-amber-500/30">
              <p className="text-sm text-center font-medium">
                The opportunity: Bridge the gap between global demand and local creator access
              </p>
            </Card>
          </div>
        </div>
      ),
    },

    // Slide 4: Our Solution
    {
      id: 4,
      title: 'Our Solution',
      content: (
        <div className="space-y-8">
          <div className="text-center mb-6">
            <Badge className="mb-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30">
              Product-Led SaaS Platform
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Amapiano AI: Create Authentic African Music in Minutes
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A browser-based music production platform with AI trained specifically on Amapiano, Afrobeats, and South African electronic music.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30 hover:border-amber-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Amapianorize™ Engine</h3>
              <p className="text-sm text-muted-foreground mb-4">
                AI-powered style transfer that understands Amapiano's DNA—log drums, basslines, shaker patterns, and vocal textures.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Genre-specific generation</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Regional style variations</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Stem separation & remix</li>
              </ul>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30 hover:border-orange-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Browser DAW</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Digital audio workstation in your browser. No downloads, no expensive licenses. Works on any device.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Multi-track timeline</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Built-in instruments</li>
                <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-500" /> AI mixing (planned)</li>
              </ul>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/30 hover:border-red-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Creator Marketplace</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Buy, sell, and license beats, samples, and presets. Monetization for creators.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Sample library</li>
                <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-500" /> Mobile payments (planned)</li>
                <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-500" /> License templates (planned)</li>
              </ul>
            </Card>
          </div>
          
          <Card className="p-4 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-red-500/5 border-muted">
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-green-500" />
                <span className="text-sm">Generate in ~30 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-amber-500" />
                <span className="text-sm">Streaming-ready quality (-14 LUFS)</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                <span className="text-sm">Works on mobile browsers</span>
              </div>
            </div>
          </Card>
        </div>
      ),
    },

    // Slide 5: Current Status
    {
      id: 5,
      title: 'Current Status',
      content: (
        <div className="grid lg:grid-cols-2 gap-8 h-full items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                Pre-Launch Stage
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold">What We've Built</h2>
            </div>
            
            <div className="space-y-4">
              <Card className="p-5 bg-gradient-to-r from-green-500/10 to-transparent border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-green-500" />
                    <span className="font-semibold">Functional Prototype</span>
                  </div>
                  <Badge variant="outline" className="border-green-500/50 text-green-500">Built</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Browser-based DAW with multi-track timeline, sample library, and pattern sequencer</p>
              </Card>
              
              <Card className="p-5 bg-gradient-to-r from-green-500/10 to-transparent border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-green-500" />
                    <span className="font-semibold">AI Generation Engine</span>
                  </div>
                  <Badge variant="outline" className="border-green-500/50 text-green-500">Built</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Pattern generation, style transfer, and Amapiano-specific instruments</p>
              </Card>
              
              <Card className="p-5 bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold">Cloud Infrastructure</span>
                  </div>
                  <Badge variant="outline" className="border-amber-500/50 text-amber-500">Supabase</Badge>
                </div>
                <p className="text-sm text-muted-foreground">User auth, project storage, and serverless functions via Lovable Cloud</p>
              </Card>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold">Development Roadmap</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">Core Platform</p>
                  <p className="text-sm text-muted-foreground">DAW interface, sample management, pattern editor</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">AI Integration</p>
                  <p className="text-sm text-muted-foreground">Pattern generation, style analysis, audio processing</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">User Testing</p>
                    <Badge variant="outline" className="text-xs">Next Phase</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Seeking initial producers for feedback</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">Artist Partnerships</p>
                    <Badge variant="outline" className="text-xs">Planned</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Sample licensing and collaboration features</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">AWS Migration</p>
                    <Badge variant="outline" className="text-xs">Planned</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Scale infrastructure with AWS Activate support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 6: Market Opportunity
    {
      id: 6,
      title: 'Market Opportunity',
      content: (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Riding a Cultural & Tech Wave</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Two mega-trends converging: African music's global rise and AI-powered creative tools.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <Card className="p-6 border-amber-500/30 hover:border-amber-500/50 transition-colors">
              <p className="text-sm text-muted-foreground mb-2">TAM</p>
              <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">$11.7B</p>
              <p className="text-sm text-muted-foreground mt-2">Global music production software</p>
              <p className="text-xs text-muted-foreground/70">Grand View Research 2025</p>
            </Card>
            <Card className="p-6 border-orange-500/30 hover:border-orange-500/50 transition-colors">
              <p className="text-sm text-muted-foreground mb-2">SAM</p>
              <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">$2.1B</p>
              <p className="text-sm text-muted-foreground mt-2">AI music + emerging market tools</p>
              <p className="text-xs text-muted-foreground/70">29% CAGR</p>
            </Card>
            <Card className="p-6 border-red-500/30 bg-red-500/5 hover:border-red-500/50 transition-colors">
              <p className="text-sm text-muted-foreground mb-2">SOM (Year 3)</p>
              <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">$45M</p>
              <p className="text-sm text-muted-foreground mt-2">African + diaspora creators</p>
              <Badge variant="outline" className="mt-2 text-xs">Achievable</Badge>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Why Now?
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Amapiano streams grew 540% (2021-2024)—outpacing K-pop growth</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>AI music market: $400M → $2.5B by 2028 (29% CAGR)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Africa's creator economy: $5B → $12B by 2030</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Mobile-first internet (400M users) enables browser tools</span>
                </li>
              </ul>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                Initial Target Segments
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Primary:</strong> Bedroom producers in South Africa, Nigeria, Kenya</span>
                </li>
                <li className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Secondary:</strong> African diaspora creators (UK, US, Europe)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Expansion:</strong> Content creators needing original African beats</span>
                </li>
                <li className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span><strong>B2B:</strong> Labels and sync agencies seeking African sound</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      ),
    },

    // Slide 7: Business Model
    {
      id: 7,
      title: 'Business Model',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Product-Led SaaS + Marketplace</h2>
            <p className="text-muted-foreground">Self-serve subscription with transaction-based marketplace revenue</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border-muted hover:border-muted-foreground/30 transition-colors">
              <div className="text-center mb-3">
                <p className="text-xl font-bold">Free</p>
                <p className="text-muted-foreground text-sm">$0/mo</p>
              </div>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> 3 projects</li>
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> 5 AI gens/month</li>
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Basic samples</li>
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Watermarked export</li>
              </ul>
            </Card>
            
            <Card className="p-4 border-amber-500/50 bg-amber-500/5 relative">
              <Badge className="absolute -top-2 right-2 bg-amber-500">Popular</Badge>
              <div className="text-center mb-3">
                <p className="text-xl font-bold">Creator</p>
                <p className="text-amber-500 font-semibold">$19/mo</p>
              </div>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Unlimited projects</li>
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> 100 AI gens/month</li>
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Full sample library</li>
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Commercial license</li>
              </ul>
            </Card>
            
            <Card className="p-4 border-orange-500/50 hover:border-orange-500 transition-colors">
              <div className="text-center mb-3">
                <p className="text-xl font-bold">Pro</p>
                <p className="text-orange-500 font-semibold">$49/mo</p>
              </div>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Everything in Creator</li>
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Unlimited AI gens</li>
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Real-time collab</li>
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Priority rendering</li>
              </ul>
            </Card>
            
            <Card className="p-4 border-muted hover:border-muted-foreground/30 transition-colors">
              <div className="text-center mb-3">
                <p className="text-xl font-bold">Label</p>
                <p className="text-muted-foreground font-semibold">$199/mo</p>
              </div>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> 10 team seats</li>
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> API access</li>
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> White-label exports</li>
                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Dedicated support</li>
              </ul>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-500" />
                Marketplace (15% take rate)
              </h3>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Mic2 className="w-4 h-4 text-muted-foreground" /> Sample packs & presets</li>
                <li className="flex items-center gap-2"><Music className="w-4 h-4 text-muted-foreground" /> Beat licensing</li>
                <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-muted-foreground" /> AI style profiles</li>
              </ul>
            </Card>
            
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Unit Economics (Targets)</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">CAC</p>
                  <p className="font-semibold">$15-25</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">LTV (24mo)</p>
                  <p className="font-semibold">$280+</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">LTV:CAC</p>
                  <p className="font-semibold text-green-500">11:1+</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Gross Margin</p>
                  <p className="font-semibold">75%+</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-5 bg-amber-500/5 border-amber-500/30">
              <h3 className="font-semibold mb-3">African-First Payments (Planned)</h3>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-500" /> M-Pesa integration</li>
                <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-500" /> Regional pricing tiers</li>
                <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-500" /> Multi-currency support</li>
              </ul>
            </Card>
          </div>
        </div>
      ),
    },

    // Slide 8: Competitive Landscape
    {
      id: 8,
      title: 'Competitive Landscape',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Positioned for an Underserved Market</h2>
            <p className="text-muted-foreground">No solution combines AI + Amapiano expertise + accessible pricing</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-muted">
                  <th className="text-left p-3 font-semibold">Capability</th>
                  <th className="text-center p-3">
                    <span className="text-amber-500 font-bold">Amapiano AI</span>
                  </th>
                  <th className="text-center p-3 text-muted-foreground">Suno/Udio</th>
                  <th className="text-center p-3 text-muted-foreground">FL Studio</th>
                  <th className="text-center p-3 text-muted-foreground">BandLab</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-muted/50">
                  <td className="p-3 font-medium">Amapiano-specific AI</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-3 text-center text-muted-foreground text-xs">Generic only</td>
                  <td className="p-3 text-center text-muted-foreground text-xs">None</td>
                  <td className="p-3 text-center text-muted-foreground text-xs">None</td>
                </tr>
                <tr className="border-b border-muted/50">
                  <td className="p-3 font-medium">Browser-based DAW</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-3 text-center text-muted-foreground text-xs">No DAW</td>
                  <td className="p-3 text-center text-muted-foreground text-xs">Desktop only</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-muted/50">
                  <td className="p-3 font-medium">AI music generation</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-3 text-center text-muted-foreground text-xs">3rd party plugins</td>
                  <td className="p-3 text-center text-muted-foreground text-xs">Basic</td>
                </tr>
                <tr className="border-b border-muted/50">
                  <td className="p-3 font-medium">African market pricing</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-3 text-center text-muted-foreground text-xs">$10-30 USD</td>
                  <td className="p-3 text-center text-muted-foreground text-xs">$199+ USD</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-muted/50">
                  <td className="p-3 font-medium">Creator marketplace</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-3 text-center text-muted-foreground text-xs">No</td>
                  <td className="p-3 text-center text-muted-foreground text-xs">No</td>
                  <td className="p-3 text-center text-muted-foreground text-xs">Limited</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Mobile money payouts</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-3 text-center text-muted-foreground text-xs">No</td>
                  <td className="p-3 text-center text-muted-foreground text-xs">No</td>
                  <td className="p-3 text-center text-muted-foreground text-xs">No</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <Card className="p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <p className="text-center">
              <strong className="text-amber-400">Our differentiation:</strong>{' '}
              <span className="text-muted-foreground">
                The only platform combining professional AI music generation with deep Amapiano expertise, accessible browser-based tools, and African-first monetization.
              </span>
            </p>
          </Card>
        </div>
      ),
    },

    // Slide 9: Technology & AWS
    {
      id: 9,
      title: 'Technology & AWS',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Technology Stack & AWS Migration Plan</h2>
            <p className="text-muted-foreground">From prototype to AWS-native production infrastructure</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Server className="w-5 h-5 text-amber-500" />
                Current Stack (Prototype)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4">
                  <p className="font-medium text-sm">Supabase</p>
                  <p className="text-xs text-muted-foreground">Database & Auth</p>
                </Card>
                <Card className="p-4">
                  <p className="font-medium text-sm">Lovable Cloud</p>
                  <p className="text-xs text-muted-foreground">Edge Functions</p>
                </Card>
                <Card className="p-4">
                  <p className="font-medium text-sm">React + Vite</p>
                  <p className="text-xs text-muted-foreground">Frontend</p>
                </Card>
                <Card className="p-4">
                  <p className="font-medium text-sm">TensorFlow.js</p>
                  <p className="text-xs text-muted-foreground">Client-side AI</p>
                </Card>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Rocket className="w-5 h-5 text-orange-500" />
                AWS Migration Plan (With Activate)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 border-dashed border-amber-500/30">
                  <p className="font-medium text-sm">EC2 + SageMaker</p>
                  <p className="text-xs text-muted-foreground">AI model training</p>
                </Card>
                <Card className="p-4 border-dashed border-amber-500/30">
                  <p className="font-medium text-sm">S3 + CloudFront</p>
                  <p className="text-xs text-muted-foreground">Audio CDN</p>
                </Card>
                <Card className="p-4 border-dashed border-amber-500/30">
                  <p className="font-medium text-sm">AWS Cape Town</p>
                  <p className="text-xs text-muted-foreground">Low-latency Africa</p>
                </Card>
                <Card className="p-4 border-dashed border-amber-500/30">
                  <p className="font-medium text-sm">Amazon Bedrock</p>
                  <p className="text-xs text-muted-foreground">Foundation models</p>
                </Card>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-500" />
                AI Architecture (Built)
              </h3>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Browser-based audio processing with Web Audio API</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Pattern recognition for Amapiano style analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <span>Server-side AI training (requires AWS compute)</span>
                </li>
              </ul>
            </Card>
            
            <Card className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" />
                Security (Current)
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Supabase RLS</Badge>
                <Badge variant="outline">HTTPS</Badge>
                <Badge variant="outline">JWT Auth</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Planned with scale: SOC 2 compliance, advanced encryption, audit logging
              </p>
            </Card>
          </div>
        </div>
      ),
    },

    // Slide 10: Financial Projections
    {
      id: 10,
      title: 'Financial Projections',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Path to Profitability</h2>
            <p className="text-muted-foreground">Conservative projections based on product-led growth</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 text-center">
              <p className="text-sm text-muted-foreground mb-1">2026</p>
              <p className="text-3xl font-bold">$180K</p>
              <p className="text-xs text-muted-foreground">ARR</p>
              <p className="text-xs text-amber-500 mt-2">1,200 paid users</p>
            </Card>
            <Card className="p-5 text-center">
              <p className="text-sm text-muted-foreground mb-1">2027</p>
              <p className="text-3xl font-bold">$1.2M</p>
              <p className="text-xs text-muted-foreground">ARR</p>
              <p className="text-xs text-amber-500 mt-2">6,500 paid users</p>
            </Card>
            <Card className="p-5 text-center">
              <p className="text-sm text-muted-foreground mb-1">2028</p>
              <p className="text-3xl font-bold">$4.5M</p>
              <p className="text-xs text-muted-foreground">ARR</p>
              <p className="text-xs text-amber-500 mt-2">22K paid users</p>
            </Card>
            <Card className="p-5 text-center border-green-500/50 bg-green-500/5">
              <p className="text-sm text-muted-foreground mb-1">2029</p>
              <p className="text-3xl font-bold text-green-500">$12M</p>
              <p className="text-xs text-muted-foreground">ARR</p>
              <p className="text-xs text-green-500 mt-2">Cash flow positive</p>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Revenue Mix (Year 3)</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Subscriptions</span>
                    <span className="font-semibold">70%</span>
                  </div>
                  <Progress value={70} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Marketplace fees</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <Progress value={20} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Enterprise / API</span>
                    <span className="font-semibold">10%</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </div>
            </Card>
            
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Key Assumptions</h3>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>5% free-to-paid conversion (industry: 2-5%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>$25 blended ARPU (regional pricing)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>8% monthly churn → 5% by year 2</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>75% gross margin (AWS cost optimized)</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      ),
    },

    // Slide 11: Team & Vision
    {
      id: 11,
      title: 'Team & Vision',
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Early Stage, Big Vision</h2>
            <p className="text-muted-foreground">Building the foundation for African music's AI future</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-amber-500" />
                Current Stage
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Solo founder with functional prototype</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Full-stack development (React, Supabase, AI)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Deep understanding of Amapiano genre and culture</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Seeking technical co-founder</span>
                </li>
              </ul>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                Immediate Goals
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Secure AWS Activate credits for infrastructure</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Recruit initial beta testers from SA producer community</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Build AI training pipeline on AWS</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Establish first artist partnerships for licensed content</span>
                </li>
              </ul>
            </Card>
          </div>
          
          <Card className="p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/30">
            <h3 className="font-semibold mb-4 text-center">Why This Will Work</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="text-center">
                <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="font-medium">Cultural Authenticity</p>
                <p className="text-xs text-muted-foreground">Built by someone who understands and loves the genre</p>
              </div>
              <div className="text-center">
                <Zap className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="font-medium">Technical Capability</p>
                <p className="text-xs text-muted-foreground">Functional prototype proves execution ability</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-medium">Perfect Timing</p>
                <p className="text-xs text-muted-foreground">Amapiano's global rise + AI democratization</p>
              </div>
            </div>
          </Card>
        </div>
      ),
    },

    // Slide 12: The Ask
    {
      id: 12,
      title: 'The Ask',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8 px-4">
          <div>
            <Badge className="mb-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30 py-1.5 px-4">
              AWS Activate Partnership
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Let's Build the Future of African Music Together</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're seeking AWS Activate credits to accelerate AI development and scale infrastructure as we launch to market.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 w-full max-w-4xl">
            <Card className="p-6 border-amber-500/50 bg-amber-500/5">
              <Zap className="w-10 h-10 text-amber-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Compute & AI</h3>
              <p className="text-sm text-muted-foreground">SageMaker + EC2 for AI model training and low-latency inference</p>
            </Card>
            <Card className="p-6 border-orange-500/50 bg-orange-500/5">
              <Globe className="w-10 h-10 text-orange-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Global Delivery</h3>
              <p className="text-sm text-muted-foreground">S3 + CloudFront for sub-100ms audio delivery across Africa</p>
            </Card>
            <Card className="p-6 border-red-500/50 bg-red-500/5">
              <Shield className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Scale & Security</h3>
              <p className="text-sm text-muted-foreground">Enterprise-grade infrastructure for sustainable growth</p>
            </Card>
          </div>
          
          <Card className="p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/30 max-w-3xl">
            <h3 className="font-semibold mb-4 text-lg">Why Partner with Amapiano AI?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left text-sm">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5" />
                <span>First-mover in African music AI space</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Functional prototype ready to scale on AWS</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Clear AWS migration path and usage plan</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Riding the Amapiano cultural wave</span>
              </div>
            </div>
          </Card>
          
          <div className="pt-4">
            <p className="text-xl font-semibold bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Democratizing music production for Africa's next generation of creators.
            </p>
            <p className="text-muted-foreground mt-3">Contact: founders@amapiano.ai</p>
          </div>
        </div>
      ),
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleExport = () => {
    // Open print dialog which allows saving as PDF
    window.print();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col print:bg-white">
      {/* Header */}
      <header className="border-b px-4 md:px-6 py-3 flex items-center justify-between bg-card/80 backdrop-blur-sm sticky top-0 z-10 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Headphones className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold hidden sm:inline">Amapiano AI</span>
          <Badge variant="outline" className="text-xs">AWS Activate</Badge>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {currentSlide + 1} / {slides.length}
          </span>
          <Button variant="outline" size="sm" className="hidden md:flex" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </header>

      {/* Main Slide Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-4 md:p-8 lg:p-10 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="h-full max-w-7xl mx-auto"
            >
              {slides[currentSlide].title && currentSlide > 0 && (
                <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
                  {slides[currentSlide].title}
                </h1>
              )}
              {slides[currentSlide].content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="border-t p-3 md:p-4 flex items-center justify-between bg-card/80 backdrop-blur-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="min-w-[100px]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          {/* Slide dots */}
          <div className="flex gap-1.5 overflow-x-auto max-w-xs md:max-w-md px-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all flex-shrink-0 ${
                  index === currentSlide
                    ? 'bg-amber-500 scale-125'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="min-w-[100px]"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </main>
    </div>
  );
}
