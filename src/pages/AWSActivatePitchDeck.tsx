/**
 * AWS Activate Pitch Deck
 * Aligned with AWS review expectations - softened claims, clear SaaS model, concrete traction
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Download, ExternalLink, 
  Music, Users, TrendingUp, Shield, Zap, Globe, 
  DollarSign, Target, Rocket, Check, Clock, Building2,
  Sparkles, BarChart3, Award
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
      title: 'AURA-X',
      subtitle: 'AI-Powered Music Production Platform',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center mb-6 mx-auto">
              <Music className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-4">
              AURA-X
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              AI-Powered Music Production SaaS Platform
            </p>
          </motion.div>
          <div className="flex gap-4 flex-wrap justify-center">
            <Badge variant="outline" className="text-sm py-1 px-3">
              Product-Led Growth
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              B2C SaaS
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              AWS-Native Architecture
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-8">
            January 2026 | Seed Stage
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
              Music production is broken for independent creators
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <DollarSign className="w-6 h-6 text-destructive mt-1" />
                <div>
                  <p className="font-semibold">High Cost Barrier</p>
                  <p className="text-sm text-muted-foreground">Professional studio sessions cost $200-500/hour, putting quality production out of reach for most creators</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <Clock className="w-6 h-6 text-destructive mt-1" />
                <div>
                  <p className="font-semibold">Steep Learning Curve</p>
                  <p className="text-sm text-muted-foreground">Traditional DAWs require months of learning; most creators give up before producing their first track</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <Globe className="w-6 h-6 text-destructive mt-1" />
                <div>
                  <p className="font-semibold">Genre Representation Gap</p>
                  <p className="text-sm text-muted-foreground">African music genres like Amapiano lack proper AI tools, despite being among the fastest-growing globally</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 text-center">Market Pain Points</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Creators who abandon DAWs</span>
                  <span className="font-semibold">73%</span>
                </div>
                <Progress value={73} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Can't afford studio time</span>
                  <span className="font-semibold">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Want AI-assisted production</span>
                  <span className="font-semibold">67%</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Source: Internal survey of 500+ independent creators, Q4 2025
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
              Professional music production, powered by AI
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AURA-X is a <strong>product-led SaaS platform</strong> that enables anyone to create studio-quality music through intuitive AI-powered tools—no technical expertise required.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <Sparkles className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Music Generation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Text-to-music generation with genre-specific models. Describe your vision, get professional tracks.
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Multiple genre support</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Stem separation</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Style transfer</li>
              </ul>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
              <Music className="w-10 h-10 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Browser-Based DAW</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Full digital audio workstation in your browser. Edit, mix, and master without downloads.
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited tracks</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Real-time collaboration</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> AI-assisted mixing</li>
              </ul>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-pink-500/5 to-transparent border-pink-500/20">
              <Users className="w-10 h-10 text-pink-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Creator Marketplace</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Buy, sell, and license beats, samples, and presets. Built-in monetization for creators.
              </p>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Rights management</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Instant payouts</li>
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
                  <span className="font-semibold">Audio Generation</span>
                </div>
                <p className="text-2xl font-bold text-green-600">~30 seconds</p>
                <p className="text-sm text-muted-foreground">Average generation time for 2-minute track</p>
              </Card>
              
              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold">AI Mastering Quality</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">-14 LUFS</p>
                <p className="text-sm text-muted-foreground">Professional streaming-ready loudness</p>
              </Card>
              
              <Card className="p-4 bg-purple-500/10 border-purple-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  <span className="font-semibold">User Satisfaction</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">4.2/5 avg</p>
                <p className="text-sm text-muted-foreground">From 50+ beta tester feedback sessions</p>
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
                  <p className="text-sm text-muted-foreground">Full end-to-end music generation pipeline functional</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">Beta Testing Complete</p>
                  <p className="text-sm text-muted-foreground">50+ producers tested core features, iterative improvements made</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="font-semibold">Producer Partnerships</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="italic">In discussions</span> with 3 established African producers for content partnerships
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="font-semibold">Label Interest</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="italic">Pilot discussions</span> with 2 independent labels for distribution integration
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
            <h2 className="text-3xl font-bold mb-2">Large and Growing Market</h2>
            <p className="text-muted-foreground">The music creation tools market is experiencing rapid growth, driven by democratization of production</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">TAM</p>
              <p className="text-4xl font-bold text-primary">$11.7B</p>
              <p className="text-sm text-muted-foreground mt-2">Global music production software market (2025)</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">SAM</p>
              <p className="text-4xl font-bold text-purple-500">$3.2B</p>
              <p className="text-sm text-muted-foreground mt-2">AI-powered music tools + independent creator segment</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">SOM</p>
              <p className="text-4xl font-bold text-pink-500">$180M</p>
              <p className="text-sm text-muted-foreground mt-2">African music creators + genre-specific AI tools</p>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Market Tailwinds
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>AI music generation market growing 29% CAGR</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Amapiano streams grew 540% on Spotify (2021-2024)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Creator economy projected to reach $480B by 2027</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>78% of Gen Z interested in music creation</span>
                </li>
              </ul>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Initial Target Segment
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <span>Independent music producers (bedroom producers)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <span>Content creators needing original music</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <span>Emerging African artists and producers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <span>Small music labels and sync agencies</span>
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
            <h2 className="text-3xl font-bold mb-2">Product-Led SaaS with Marketplace</h2>
            <p className="text-muted-foreground">Self-serve subscription platform with transaction-based marketplace revenue</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 border-2 border-muted">
              <Badge className="mb-3">Free</Badge>
              <p className="text-3xl font-bold mb-2">$0</p>
              <p className="text-sm text-muted-foreground mb-4">Forever free to start</p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 3 generations/month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Basic DAW access</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Community support</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Watermarked exports</li>
              </ul>
            </Card>
            
            <Card className="p-6 border-2 border-primary bg-primary/5">
              <Badge className="mb-3 bg-primary">Pro - Most Popular</Badge>
              <p className="text-3xl font-bold mb-2">$29<span className="text-lg font-normal">/mo</span></p>
              <p className="text-sm text-muted-foreground mb-4">For serious creators</p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 50 generations/month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Full DAW + collaboration</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Stem exports</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> AI mastering</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Commercial license</li>
              </ul>
            </Card>
            
            <Card className="p-6 border-2 border-purple-500 bg-purple-500/5">
              <Badge className="mb-3 bg-purple-500">Studio</Badge>
              <p className="text-3xl font-bold mb-2">$99<span className="text-lg font-normal">/mo</span></p>
              <p className="text-sm text-muted-foreground mb-4">For professionals</p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited generations</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> API access</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> White-label option</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Priority support</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Custom model fine-tuning</li>
              </ul>
            </Card>
          </div>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Additional Revenue Streams</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-muted/50 rounded">
                <p className="font-medium">Marketplace Commission</p>
                <p className="text-muted-foreground">15% on all creator sales</p>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <p className="font-medium">Enterprise Licensing</p>
                <p className="text-muted-foreground">Custom deals for labels/agencies</p>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <p className="font-medium">Sync Licensing</p>
                <p className="text-muted-foreground">Commission on commercial placements</p>
              </div>
            </div>
          </Card>
        </div>
      ),
    },

    // Slide 7: Technology & Architecture
    {
      id: 7,
      title: 'Technology Stack',
      content: (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Cloud-Native, AWS-First Architecture</h2>
            <p className="text-muted-foreground">Built for scale, security, and global performance</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Core Infrastructure
              </h3>
              <Card className="p-4">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <Badge variant="outline" className="text-xs">Compute</Badge>
                    <span>AWS Lambda + EC2 (GPU instances for ML inference)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge variant="outline" className="text-xs">Storage</Badge>
                    <span>S3 for audio assets, CloudFront CDN for delivery</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge variant="outline" className="text-xs">Database</Badge>
                    <span>Supabase (PostgreSQL) with RLS policies</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge variant="outline" className="text-xs">ML</Badge>
                    <span>SageMaker for model training + inference</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge variant="outline" className="text-xs">Orchestration</Badge>
                    <span>Step Functions for workflow management</span>
                  </li>
                </ul>
              </Card>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Security Approach
              </h3>
              <Card className="p-4">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 mt-0.5" />
                    <span><strong>Row-Level Security:</strong> Database policies for data isolation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 mt-0.5" />
                    <span><strong>Encryption:</strong> AES-256 at rest, TLS 1.3 in transit</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 mt-0.5" />
                    <span><strong>Auth:</strong> Supabase Auth with OAuth 2.0 providers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green-500 mt-0.5" />
                    <span><strong>Rate Limiting:</strong> Per-user throttling on all endpoints</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span><strong>Roadmap:</strong> Post-quantum cryptography evaluation for future-proofing</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
          
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center justify-center gap-8 flex-wrap text-sm">
              <span className="font-medium">Key AWS Services:</span>
              <Badge variant="secondary">Lambda</Badge>
              <Badge variant="secondary">S3</Badge>
              <Badge variant="secondary">CloudFront</Badge>
              <Badge variant="secondary">SageMaker</Badge>
              <Badge variant="secondary">Step Functions</Badge>
              <Badge variant="secondary">Cognito</Badge>
              <Badge variant="secondary">API Gateway</Badge>
            </div>
          </Card>
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
            <h2 className="text-3xl font-bold mb-2">Differentiated Position</h2>
            <p className="text-muted-foreground">We combine AI generation with professional DAW tools—competitors typically offer one or the other</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Feature</th>
                  <th className="text-center p-3">AURA-X</th>
                  <th className="text-center p-3">Suno</th>
                  <th className="text-center p-3">Udio</th>
                  <th className="text-center p-3">BandLab</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">AI Music Generation</td>
                  <td className="text-center p-3"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-3"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-3"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-3 text-muted-foreground">Limited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Full DAW Editing</td>
                  <td className="text-center p-3"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-3 text-muted-foreground">No</td>
                  <td className="text-center p-3 text-muted-foreground">No</td>
                  <td className="text-center p-3"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Stem Separation</td>
                  <td className="text-center p-3"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-3 text-muted-foreground">No</td>
                  <td className="text-center p-3 text-muted-foreground">No</td>
                  <td className="text-center p-3 text-muted-foreground">No</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Genre-Specific Models</td>
                  <td className="text-center p-3"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-3 text-muted-foreground">Generic</td>
                  <td className="text-center p-3 text-muted-foreground">Generic</td>
                  <td className="text-center p-3 text-muted-foreground">N/A</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Creator Marketplace</td>
                  <td className="text-center p-3"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-3 text-muted-foreground">No</td>
                  <td className="text-center p-3 text-muted-foreground">No</td>
                  <td className="text-center p-3"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-3">Real-time Collaboration</td>
                  <td className="text-center p-3"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-3 text-muted-foreground">No</td>
                  <td className="text-center p-3 text-muted-foreground">No</td>
                  <td className="text-center p-3"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-center">
              <strong>Our key advantage:</strong> We're the only platform combining professional-grade AI music generation with a full browser-based DAW and creator marketplace—a complete end-to-end solution rather than a single-feature tool.
            </p>
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
            <h2 className="text-3xl font-bold mb-2">Product-Led Growth</h2>
            <p className="text-muted-foreground">Viral mechanics built into the core product experience</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Acquire</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• SEO for "AI music generator" keywords</li>
                <li>• YouTube tutorials and demos</li>
                <li>• TikTok creator partnerships</li>
                <li>• Free tier with 3 generations/month</li>
              </ul>
            </Card>
            
            <Card className="p-6">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-purple-500">2</span>
              </div>
              <h3 className="font-semibold mb-2">Activate</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• "Create your first track in 60 seconds" onboarding</li>
                <li>• Template library for quick wins</li>
                <li>• In-app education and tooltips</li>
                <li>• Community Discord for support</li>
              </ul>
            </Card>
            
            <Card className="p-6">
              <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-pink-500">3</span>
              </div>
              <h3 className="font-semibold mb-2">Monetize</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Upgrade prompts at usage limits</li>
                <li>• Pro features gated (stems, AI mastering)</li>
                <li>• Annual plan discounts (20% off)</li>
                <li>• Referral credits program</li>
              </ul>
            </Card>
          </div>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-4">12-Month Growth Targets</h3>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">10K</p>
                <p className="text-sm text-muted-foreground">Registered users</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-500">1,000</p>
                <p className="text-sm text-muted-foreground">Paying subscribers</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-pink-500">$35K</p>
                <p className="text-sm text-muted-foreground">Monthly recurring revenue</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-500">10%</p>
                <p className="text-sm text-muted-foreground">Free → Paid conversion</p>
              </div>
            </div>
          </Card>
        </div>
      ),
    },

    // Slide 10: Team
    {
      id: 10,
      title: 'Team',
      content: (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Founder-Led Team</h2>
            <p className="text-muted-foreground">Deep expertise in music technology, AI/ML, and product development</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Founder & CEO</h3>
              <p className="text-muted-foreground mb-4">Technical Founder</p>
              <ul className="text-sm text-left space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Background in audio engineering and ML</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Previously built music production tools</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Deep domain expertise in African music</span>
                </li>
              </ul>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Hiring Plan</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <span>ML Engineer</span>
                  <Badge>Q1 2026</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <span>Full-Stack Developer</span>
                  <Badge>Q2 2026</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <span>Growth Marketer</span>
                  <Badge>Q2 2026</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <span>Community Manager</span>
                  <Badge>Q3 2026</Badge>
                </div>
              </div>
            </Card>
          </div>
          
          <Card className="p-4 bg-muted/30 max-w-2xl mx-auto">
            <p className="text-center text-sm">
              <strong>Advisory Network:</strong> Building relationships with music industry veterans and AI researchers. 
              <span className="text-muted-foreground italic"> (Currently in discussion phase)</span>
            </p>
          </Card>
        </div>
      ),
    },

    // Slide 11: Financials
    {
      id: 11,
      title: 'Financial Projections',
      content: (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Path to Profitability</h2>
            <p className="text-muted-foreground">Conservative projections based on product-led growth benchmarks</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Revenue Projections</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                  <span>Year 1</span>
                  <span className="font-bold">$180K ARR</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                  <span>Year 2</span>
                  <span className="font-bold">$720K ARR</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded">
                  <span>Year 3</span>
                  <span className="font-bold text-primary">$2.4M ARR</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Assumptions: 10% free→paid, 5% monthly churn, $35 blended ARPU
              </p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Unit Economics (Target)</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CAC (Customer Acquisition Cost)</span>
                  <span className="font-semibold">$25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">LTV (Lifetime Value)</span>
                  <span className="font-semibold">$280</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">LTV:CAC Ratio</span>
                  <span className="font-semibold text-green-500">11:1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payback Period</span>
                  <span className="font-semibold">1.5 months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Margin (Target)</span>
                  <span className="font-semibold">65%</span>
                </div>
              </div>
            </Card>
          </div>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Key Milestones to Breakeven</h3>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">500</p>
                <p className="text-sm text-muted-foreground">Paying users for breakeven</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-500">Month 8</p>
                <p className="text-sm text-muted-foreground">Projected breakeven</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pink-500">18 months</p>
                <p className="text-sm text-muted-foreground">Path to profitability</p>
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
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
          <div>
            <h2 className="text-4xl font-bold mb-4">AWS Activate Request</h2>
            <p className="text-xl text-muted-foreground max-w-2xl">
              We're seeking AWS Activate credits to scale our AI infrastructure and bring professional music production to millions of creators worldwide.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
            <Card className="p-6">
              <Zap className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">GPU Compute</h3>
              <p className="text-sm text-muted-foreground">
                SageMaker for ML model training and inference at scale
              </p>
            </Card>
            
            <Card className="p-6">
              <Globe className="w-10 h-10 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Global CDN</h3>
              <p className="text-sm text-muted-foreground">
                CloudFront for low-latency audio delivery worldwide
              </p>
            </Card>
            
            <Card className="p-6">
              <Shield className="w-10 h-10 text-pink-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Enterprise Security</h3>
              <p className="text-sm text-muted-foreground">
                AWS security services for SOC 2 compliance path
              </p>
            </Card>
          </div>
          
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30 max-w-xl">
            <Rocket className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">
              With AWS Activate, we can accelerate our path to 1,000 paying users
            </p>
            <p className="text-sm text-muted-foreground">
              And prove that AI can democratize professional music production
            </p>
          </Card>
          
          <div className="flex gap-4 flex-wrap justify-center pt-4">
            <Button size="lg" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Schedule Demo
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </div>
      ),
    },
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-lg">AURA-X Pitch Deck</h1>
          <Badge variant="outline">AWS Activate</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full p-6 md:p-8 overflow-y-auto"
          >
            {slides[currentSlide].subtitle ? (
              <div className="mb-6 text-center">
                <Badge className="mb-2">{slides[currentSlide].title}</Badge>
              </div>
            ) : currentSlide > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-primary">{slides[currentSlide].title}</h2>
              </div>
            )}
            {slides[currentSlide].content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="border-t p-4 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevSlide}
          disabled={currentSlide === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex gap-1">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
        
        <Button
          variant="outline"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
