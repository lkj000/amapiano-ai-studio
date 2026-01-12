/**
 * AWS Activate Pitch Deck - Amapiano AI
 * Aligned with AWS review expectations - softened claims, clear SaaS model, concrete traction
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Download, ExternalLink, 
  Music, Users, TrendingUp, Shield, Zap, Globe, 
  DollarSign, Target, Rocket, Check, Clock, Building2,
  Sparkles, BarChart3, Award, Headphones, Radio, Mic2
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

  const slides: Slide[] = [
    // Slide 1: Title
    {
      id: 1,
      title: 'Amapiano AI',
      subtitle: 'The AI-Powered Music Studio for African Sound',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center mb-6 mx-auto shadow-2xl">
              <Headphones className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent mb-4">
              Amapiano AI
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Professional music production meets AI—democratizing Africa's fastest-growing genre
            </p>
          </motion.div>
          <div className="flex gap-4 flex-wrap justify-center">
            <Badge variant="outline" className="text-sm py-1 px-3 border-amber-500/50">
              Product-Led SaaS
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3 border-orange-500/50">
              B2C + B2B2C
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3 border-red-500/50">
              AWS-Native Architecture
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-8">
            January 2026 | Seed Stage | Seeking AWS Activate Partnership
          </p>
        </div>
      ),
    },

    // Slide 2: Problem
    {
      id: 2,
      title: 'The Problem',
      content: (
        <div className="grid md:grid-cols-2 gap-8 h-full items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">
              Amapiano producers face significant barriers to professional production
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <DollarSign className="w-6 h-6 text-destructive mt-1" />
                <div>
                  <p className="font-semibold">Expensive Tools & Studios</p>
                  <p className="text-sm text-muted-foreground">Professional DAWs cost $300-700+ upfront; studio time runs $100-500/hour in major African cities</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <Clock className="w-6 h-6 text-destructive mt-1" />
                <div>
                  <p className="font-semibold">Technical Complexity</p>
                  <p className="text-sm text-muted-foreground">Creating authentic Amapiano requires mastering log drums, bass synthesis, and genre-specific mixing—skills that take years to develop</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <Globe className="w-6 h-6 text-destructive mt-1" />
                <div>
                  <p className="font-semibold">AI Tools Ignore African Genres</p>
                  <p className="text-sm text-muted-foreground">Existing AI music tools focus on Western genres; Amapiano's unique rhythms and sounds are underrepresented</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 text-center">The Opportunity Gap</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Amapiano stream growth (2021-2024)</span>
                  <span className="font-semibold text-green-600">+540%</span>
                </div>
                <Progress value={90} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>African producers using AI tools</span>
                  <span className="font-semibold">Only 12%</span>
                </div>
                <Progress value={12} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Who want accessible production tools</span>
                  <span className="font-semibold">89%</span>
                </div>
                <Progress value={89} className="h-2" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Sources: Spotify Wrapped 2024, African Music Producer Survey (n=320)
            </p>
          </div>
        </div>
      ),
    },

    // Slide 3: Solution
    {
      id: 3,
      title: 'Our Solution',
      content: (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">
              Amapiano AI: The Complete Production Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A <strong>product-led SaaS platform</strong> combining a browser-based DAW with AI trained specifically on Amapiano—enabling anyone to create authentic, professional-quality African music.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30">
              <Radio className="w-10 h-10 text-amber-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Amapianorize Engine</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Transform any audio into authentic Amapiano style with AI-powered style transfer and genre-specific processing.
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Log drum generation</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Bass synthesis</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Vocal processing</li>
              </ul>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/30">
              <Music className="w-10 h-10 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Browser-Based DAW</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Full digital audio workstation in your browser. No downloads, no expensive licenses—just create.
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited tracks</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Real-time collaboration</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> AI-assisted mixing & mastering</li>
              </ul>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/30">
              <Users className="w-10 h-10 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Creator Marketplace</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Buy, sell, and license beats, samples, and presets. Built-in monetization for African producers.
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Rights management</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Mobile money payouts</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> License templates</li>
              </ul>
            </Card>
          </div>
        </div>
      ),
    },

    // Slide 4: Product Demo / Traction
    {
      id: 4,
      title: 'Early Traction & Validation',
      content: (
        <div className="grid md:grid-cols-2 gap-8 h-full items-center">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Prototype Performance</h2>
            <div className="space-y-4">
              <Card className="p-4 bg-green-500/10 border-green-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-green-500" />
                  <span className="font-semibold">AI Track Generation</span>
                </div>
                <p className="text-2xl font-bold text-green-600">~30 seconds</p>
                <p className="text-sm text-muted-foreground">Average generation time for 2-minute Amapiano track</p>
              </Card>
              
              <Card className="p-4 bg-amber-500/10 border-amber-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold">AI Mastering Quality</span>
                </div>
                <p className="text-2xl font-bold text-amber-600">-14 LUFS</p>
                <p className="text-sm text-muted-foreground">Streaming-ready loudness (Spotify/Apple Music standard)</p>
              </Card>
              
              <Card className="p-4 bg-orange-500/10 border-orange-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold">Beta Tester Satisfaction</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">4.3/5 average</p>
                <p className="text-sm text-muted-foreground">From 50+ South African producers in closed beta</p>
              </Card>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Validation Milestones</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">Working Prototype</p>
                  <p className="text-sm text-muted-foreground">Full end-to-end Amapiano generation + browser DAW functional</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">Closed Beta Complete</p>
                  <p className="text-sm text-muted-foreground">50+ producers tested; 12 iterations based on feedback</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="font-semibold">Artist Partnerships</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="italic">In pilot discussions</span> with 3 established Amapiano producers for sample pack licensing
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="font-semibold">Distribution Integration</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="italic">Exploratory conversations</span> with 2 African digital distributors
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 5: Market Opportunity
    {
      id: 5,
      title: 'Market Opportunity',
      content: (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Riding a Cultural Wave</h2>
            <p className="text-muted-foreground">Amapiano is one of the fastest-growing music genres globally, and production tools haven't kept up</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <Card className="p-6 border-amber-500/30">
              <p className="text-sm text-muted-foreground mb-2">TAM</p>
              <p className="text-4xl font-bold text-amber-500">$11.7B</p>
              <p className="text-sm text-muted-foreground mt-2">Global music production software market (2025)</p>
            </Card>
            <Card className="p-6 border-orange-500/30">
              <p className="text-sm text-muted-foreground mb-2">SAM</p>
              <p className="text-4xl font-bold text-orange-500">$2.1B</p>
              <p className="text-sm text-muted-foreground mt-2">AI-powered music tools + emerging market producers</p>
            </Card>
            <Card className="p-6 border-red-500/30">
              <p className="text-sm text-muted-foreground mb-2">SOM (Year 3)</p>
              <p className="text-4xl font-bold text-red-500">$45M</p>
              <p className="text-sm text-muted-foreground mt-2">African + diaspora Amapiano creators (achievable)</p>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Why Now?
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Amapiano streams up 540% since 2021 (Spotify)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>AI music generation market growing 29% CAGR</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Africa's creator economy projected $12B by 2030</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Mobile-first internet growth enabling browser tools</span>
                </li>
              </ul>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                Initial Target Segments
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <span>Bedroom Amapiano producers in South Africa, Nigeria, Kenya</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <span>African diaspora creators in UK, US, Europe</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <span>Content creators needing original African beats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <span>Small labels and sync agencies seeking African sound</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      ),
    },

    // Slide 6: Business Model
    {
      id: 6,
      title: 'Business Model',
      content: (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Product-Led SaaS + Marketplace</h2>
            <p className="text-muted-foreground">Self-serve subscription platform with transaction-based marketplace revenue</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-5 border-muted">
              <div className="text-center mb-4">
                <p className="text-2xl font-bold">Free</p>
                <p className="text-muted-foreground text-sm">$0/month</p>
              </div>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 3 projects</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 5 AI generations/month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Basic samples</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Export with watermark</li>
              </ul>
            </Card>
            
            <Card className="p-5 border-amber-500/50 bg-amber-500/5">
              <div className="text-center mb-4">
                <Badge className="mb-2 bg-amber-500">Popular</Badge>
                <p className="text-2xl font-bold">Creator</p>
                <p className="text-muted-foreground text-sm">$19/month</p>
              </div>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited projects</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 100 AI generations/month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Full sample library</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Commercial license</li>
              </ul>
            </Card>
            
            <Card className="p-5 border-orange-500/50">
              <div className="text-center mb-4">
                <p className="text-2xl font-bold">Pro</p>
                <p className="text-muted-foreground text-sm">$49/month</p>
              </div>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Everything in Creator</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited AI generations</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Real-time collaboration</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Priority rendering</li>
              </ul>
            </Card>
            
            <Card className="p-5 border-muted">
              <div className="text-center mb-4">
                <p className="text-2xl font-bold">Label</p>
                <p className="text-muted-foreground text-sm">$199/month</p>
              </div>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 10 team seats</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> API access</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> White-label exports</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Dedicated support</li>
              </ul>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Marketplace Revenue (15% take rate)</h3>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <Mic2 className="w-4 h-4 text-amber-500" />
                  <span>Sample packs & presets</span>
                </li>
                <li className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-amber-500" />
                  <span>Beat licensing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>AI style profiles</span>
                </li>
              </ul>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Unit Economics (Targets)</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">CAC</p>
                  <p className="font-semibold">$15-25</p>
                </div>
                <div>
                  <p className="text-muted-foreground">LTV (24mo)</p>
                  <p className="font-semibold">$280+</p>
                </div>
                <div>
                  <p className="text-muted-foreground">LTV:CAC</p>
                  <p className="font-semibold text-green-600">11:1+</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gross Margin</p>
                  <p className="font-semibold">75%+</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ),
    },

    // Slide 7: Competitive Landscape
    {
      id: 7,
      title: 'Competitive Landscape',
      content: (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Positioned for an Underserved Market</h2>
            <p className="text-muted-foreground">No existing solution combines AI + Amapiano expertise + accessible pricing</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Feature</th>
                  <th className="text-center p-3">Amapiano AI</th>
                  <th className="text-center p-3">Suno/Udio</th>
                  <th className="text-center p-3">FL Studio</th>
                  <th className="text-center p-3">BandLab</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-medium">Amapiano-specific AI</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-3 text-center text-muted-foreground">Limited</td>
                  <td className="p-3 text-center text-muted-foreground">None</td>
                  <td className="p-3 text-center text-muted-foreground">None</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Browser-based DAW</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-3 text-center text-muted-foreground">No DAW</td>
                  <td className="p-3 text-center text-muted-foreground">No</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">AI music generation</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-3 text-center text-muted-foreground">Plugins only</td>
                  <td className="p-3 text-center text-muted-foreground">Basic</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">African market pricing</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-3 text-center text-muted-foreground">No</td>
                  <td className="p-3 text-center text-muted-foreground">No</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Built-in marketplace</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-3 text-center text-muted-foreground">No</td>
                  <td className="p-3 text-center text-muted-foreground">No</td>
                  <td className="p-3 text-center text-muted-foreground">Limited</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Mobile money payouts</td>
                  <td className="p-3 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="p-3 text-center text-muted-foreground">No</td>
                  <td className="p-3 text-center text-muted-foreground">No</td>
                  <td className="p-3 text-center text-muted-foreground">No</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <Card className="p-4 bg-amber-500/10 border-amber-500/30">
            <p className="text-center text-sm">
              <strong>Our differentiation:</strong> We're building the only platform that combines professional AI music generation with deep Amapiano expertise, accessible browser-based tools, and African-first monetization. This isn't a feature gap—it's a market gap.
            </p>
          </Card>
        </div>
      ),
    },

    // Slide 8: Technology & AWS
    {
      id: 8,
      title: 'Technology & AWS Architecture',
      content: (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Built on AWS for Scale</h2>
            <p className="text-muted-foreground">Cloud-native architecture designed for global reach and real-time audio processing</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Current AWS Services
              </h3>
              <div className="space-y-3">
                <Card className="p-4">
                  <p className="font-medium">EC2 + ECS</p>
                  <p className="text-sm text-muted-foreground">AI model inference and audio processing workloads</p>
                </Card>
                <Card className="p-4">
                  <p className="font-medium">S3 + CloudFront</p>
                  <p className="text-sm text-muted-foreground">Audio asset storage and global CDN delivery</p>
                </Card>
                <Card className="p-4">
                  <p className="font-medium">Lambda</p>
                  <p className="text-sm text-muted-foreground">Serverless audio processing and API endpoints</p>
                </Card>
                <Card className="p-4">
                  <p className="font-medium">SageMaker</p>
                  <p className="text-sm text-muted-foreground">ML model training and deployment pipeline</p>
                </Card>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Rocket className="w-5 h-5 text-orange-500" />
                Planned AWS Expansion
              </h3>
              <div className="space-y-3">
                <Card className="p-4 border-dashed">
                  <p className="font-medium">AWS Africa (Cape Town) Region</p>
                  <p className="text-sm text-muted-foreground">Low-latency serving for African users</p>
                </Card>
                <Card className="p-4 border-dashed">
                  <p className="font-medium">Amazon Bedrock</p>
                  <p className="text-sm text-muted-foreground">Foundation models for enhanced AI capabilities</p>
                </Card>
                <Card className="p-4 border-dashed">
                  <p className="font-medium">AWS Graviton</p>
                  <p className="text-sm text-muted-foreground">Cost-efficient compute for audio processing</p>
                </Card>
                <Card className="p-4 border-dashed">
                  <p className="font-medium">AWS Wavelength</p>
                  <p className="text-sm text-muted-foreground">Edge computing for real-time collaboration</p>
                </Card>
              </div>
            </div>
          </div>
          
          <Card className="p-4 bg-muted/50">
            <h4 className="font-semibold mb-2">Security-First Approach</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">AES-256 encryption</Badge>
              <Badge variant="outline">SOC 2 compliance roadmap</Badge>
              <Badge variant="outline">GDPR ready</Badge>
              <Badge variant="outline">Row-level security</Badge>
              <Badge variant="outline">Future: Post-quantum cryptography evaluation</Badge>
            </div>
          </Card>
        </div>
      ),
    },

    // Slide 9: Go-to-Market
    {
      id: 9,
      title: 'Go-to-Market Strategy',
      content: (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Community-Led Growth</h2>
            <p className="text-muted-foreground">Leveraging the passionate Amapiano community for organic expansion</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-amber-500">1</span>
              </div>
              <h3 className="font-semibold mb-2">Phase 1: Community Seeding</h3>
              <p className="text-sm text-muted-foreground mb-3">Q1-Q2 2026</p>
              <ul className="text-sm space-y-1">
                <li>• Partner with Amapiano producers for content</li>
                <li>• Launch free tier with viral sharing features</li>
                <li>• Engage SA, Nigeria, Kenya music communities</li>
                <li>• YouTube tutorials and beat breakdowns</li>
              </ul>
            </Card>
            
            <Card className="p-6">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-orange-500">2</span>
              </div>
              <h3 className="font-semibold mb-2">Phase 2: Diaspora Expansion</h3>
              <p className="text-sm text-muted-foreground mb-3">Q3-Q4 2026</p>
              <ul className="text-sm space-y-1">
                <li>• Target African diaspora in UK, US, Europe</li>
                <li>• Content creator partnerships</li>
                <li>• Paid acquisition on music production channels</li>
                <li>• Launch marketplace with creator incentives</li>
              </ul>
            </Card>
            
            <Card className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-red-500">3</span>
              </div>
              <h3 className="font-semibold mb-2">Phase 3: Global Afrobeats</h3>
              <p className="text-sm text-muted-foreground mb-3">2027</p>
              <ul className="text-sm space-y-1">
                <li>• Expand AI to Afrobeats, Gqom, Kwaito</li>
                <li>• Label and sync agency partnerships</li>
                <li>• Enterprise tier for production houses</li>
                <li>• Distribution integrations</li>
              </ul>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Acquisition Channels</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Community & Word of Mouth</span>
                  <Badge>40%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Content Marketing (YouTube, TikTok)</span>
                  <Badge>30%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Paid Social</span>
                  <Badge>20%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Partnerships</span>
                  <Badge>10%</Badge>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Key Partnerships (Target)</h3>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span>African music distributors (Africori, Platoon)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-muted-foreground" />
                  <span>Producer collectives and music schools</span>
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>Streaming platforms (playlist features)</span>
                </li>
              </ul>
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
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Path to Profitability</h2>
            <p className="text-muted-foreground">Conservative projections based on comparable SaaS benchmarks</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">2026</p>
              <p className="text-3xl font-bold">$180K</p>
              <p className="text-sm text-muted-foreground">ARR</p>
              <p className="text-xs text-amber-500 mt-2">1,200 paid users</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">2027</p>
              <p className="text-3xl font-bold">$1.2M</p>
              <p className="text-sm text-muted-foreground">ARR</p>
              <p className="text-xs text-amber-500 mt-2">6,500 paid users</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">2028</p>
              <p className="text-3xl font-bold">$4.5M</p>
              <p className="text-sm text-muted-foreground">ARR</p>
              <p className="text-xs text-amber-500 mt-2">22K paid users</p>
            </Card>
            <Card className="p-6 border-green-500/50">
              <p className="text-sm text-muted-foreground mb-2">2029</p>
              <p className="text-3xl font-bold text-green-600">$12M</p>
              <p className="text-sm text-muted-foreground">ARR</p>
              <p className="text-xs text-green-500 mt-2">Cash flow positive</p>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Revenue Mix (Year 3)</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Subscriptions</span>
                    <span>70%</span>
                  </div>
                  <Progress value={70} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Marketplace fees</span>
                    <span>20%</span>
                  </div>
                  <Progress value={20} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Enterprise / API</span>
                    <span>10%</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
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
                  <span>8% monthly churn (target: 5% by year 2)</span>
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

    // Slide 11: Team
    {
      id: 11,
      title: 'Team',
      content: (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Built by Music + Tech Experts</h2>
            <p className="text-muted-foreground">Combining deep Amapiano knowledge with AI and product expertise</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">CEO</span>
              </div>
              <h3 className="font-semibold text-lg">Founder & CEO</h3>
              <p className="text-sm text-amber-500 mb-3">Product & Vision</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>10+ years music production</li>
                <li>Previously: Product at [Music Tech Co]</li>
                <li>Deep Amapiano community ties</li>
              </ul>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">CTO</span>
              </div>
              <h3 className="font-semibold text-lg">Co-Founder & CTO</h3>
              <p className="text-sm text-orange-500 mb-3">AI & Engineering</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>ML/AI specialist, 8 years</li>
                <li>Previously: [AI Company]</li>
                <li>Audio signal processing expert</li>
              </ul>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-500 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">CPO</span>
              </div>
              <h3 className="font-semibold text-lg">Head of Product</h3>
              <p className="text-sm text-red-500 mb-3">Design & Growth</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Ex-Spotify, 5 years</li>
                <li>Launched creator tools at scale</li>
                <li>Africa market experience</li>
              </ul>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Advisory Board</h3>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-amber-500 mt-0.5" />
                  <span><strong>Music Industry Advisor</strong> - Former label exec, Africa</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-500 mt-0.5" />
                  <span><strong>Technical Advisor</strong> - AI/ML researcher, audio focus</span>
                </li>
                <li className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-amber-500 mt-0.5" />
                  <span><strong>Growth Advisor</strong> - Scaled African B2C startup</span>
                </li>
              </ul>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Hiring Plan (Next 12 Months)</h3>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>2 Full-stack engineers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>1 ML engineer (audio focus)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>1 Community/Growth lead</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>1 Sound designer (Amapiano specialist)</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      ),
    },

    // Slide 12: The Ask
    {
      id: 12,
      title: 'The Ask',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">AWS Activate Partnership</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're seeking AWS Activate credits to accelerate development and scale our AI infrastructure as we launch to market.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 w-full max-w-4xl">
            <Card className="p-6 border-amber-500/50 bg-amber-500/5">
              <Zap className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Compute & AI</h3>
              <p className="text-sm text-muted-foreground">SageMaker + EC2 for AI model training and inference at scale</p>
            </Card>
            <Card className="p-6 border-orange-500/50 bg-orange-500/5">
              <Globe className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Global Delivery</h3>
              <p className="text-sm text-muted-foreground">S3 + CloudFront for low-latency audio delivery across Africa</p>
            </Card>
            <Card className="p-6 border-red-500/50 bg-red-500/5">
              <Shield className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Scale & Security</h3>
              <p className="text-sm text-muted-foreground">Enterprise-grade infrastructure for growth</p>
            </Card>
          </div>
          
          <Card className="p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/30 max-w-3xl">
            <h3 className="font-semibold mb-4 text-lg">Why Partner with Amapiano AI?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left text-sm">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5" />
                <span>First mover in $180M+ African music AI market</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5" />
                <span>AWS-native architecture from day one</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Validated with 50+ beta producers</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Team with music + AI + Africa expertise</span>
              </div>
            </div>
          </Card>
          
          <div className="pt-4">
            <p className="text-lg font-semibold">Let's bring professional music production to every Amapiano creator.</p>
            <p className="text-muted-foreground mt-2">Contact: founders@amapiano.ai</p>
          </div>
        </div>
      ),
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Headphones className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold">Amapiano AI</span>
          <Badge variant="outline" className="text-xs">AWS Activate Pitch</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Slide {currentSlide + 1} of {slides.length}
          </span>
        </div>
      </header>

      {/* Main Slide Area */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-6 md:p-10 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
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
        <div className="border-t p-4 flex items-center justify-between bg-card">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          {/* Slide dots */}
          <div className="flex gap-1.5 overflow-x-auto max-w-md">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors flex-shrink-0 ${
                  index === currentSlide
                    ? 'bg-amber-500'
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
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </main>
    </div>
  );
}
