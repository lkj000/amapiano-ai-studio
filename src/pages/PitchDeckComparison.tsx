/**
 * Pitch Deck Comparison - Side by side review of original vs. AWS-optimized pitch decks
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, 
  XCircle, ArrowRight, FileText, Eye, ThumbsUp, ThumbsDown,
  AlertCircle, Lightbulb, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';

interface SlideComparison {
  slideNumber: number;
  title: string;
  originalContent: string;
  optimizedContent: string;
  issues: CritiqueItem[];
  improvements: string[];
}

interface CritiqueItem {
  type: 'risk' | 'warning' | 'suggestion';
  category: string;
  issue: string;
  recommendation: string;
}

export default function PitchDeckComparison() {
  const [activeTab, setActiveTab] = useState('overview');

  // Comprehensive critique of the original PDF pitch deck
  const overallCritique: CritiqueItem[] = [
    {
      type: 'risk',
      category: 'Ambitious Claims',
      issue: '"Building the world\'s first AI production system specifically for South African music" - This is a bold claim that AWS may flag for verification.',
      recommendation: 'Soften to "Building a purpose-built AI production system for South African music" or "Among the first dedicated AI platforms for Amapiano."'
    },
    {
      type: 'risk',
      category: 'Ambitious Claims',
      issue: '"Insurmountable barriers for competitors" on the competitive moats slide - This is overconfident language.',
      recommendation: 'Replace with "Sustainable competitive advantages" or "Defensible market position."'
    },
    {
      type: 'risk',
      category: 'Quantum Cryptography',
      issue: 'Post-quantum cryptography is mentioned as a core feature ("15-20% revenue share with post-quantum cryptography", "PQC encryption for voice models"). This positions it as a current dependency rather than future roadmap.',
      recommendation: 'Reframe as: "Security-first approach with roadmap to post-quantum cryptography" or move to future features section.'
    },
    {
      type: 'risk',
      category: 'Artist Partnerships',
      issue: '"Partnerships with Kabza De Small, Focalistic, etc." and "50+ artists" - Mentioning specific famous artists without clarifying status may trigger verification.',
      recommendation: 'Indicate partnership stage clearly: "In discussions with", "Pilot partnership with", or "Targeting partnerships with [type of artist]" rather than specific names.'
    },
    {
      type: 'warning',
      category: 'Business Model Clarity',
      issue: 'The deck positions as "Sovereign AI Infrastructure" which sounds more like B2B infrastructure/consulting than a product-led SaaS platform.',
      recommendation: 'Lead with "Product-Led SaaS Platform for African Music Production" to clearly communicate the self-serve software business model.'
    },
    {
      type: 'warning',
      category: 'Traction Evidence',
      issue: 'Traction slide mentions "Production-ready infrastructure" with 90/100 score but lacks concrete user traction metrics.',
      recommendation: 'Add specific, verifiable metrics: "50+ beta testers", "X tracks generated in testing", "Y% user satisfaction from pilot."'
    },
    {
      type: 'warning',
      category: 'Partnership Status',
      issue: '"Piano Hub partnership signed", "Blaq Boy Music partnership (in progress)" - Need clearer status indicators.',
      recommendation: 'Use consistent terminology: "Signed", "In Pilot", "In Discussion", "Targeting" with dates where possible.'
    },
    {
      type: 'suggestion',
      category: 'Market Sizing',
      issue: 'TAM/SAM/SOM calculations differ between slides ($487M on one slide, different numbers on market opportunity). Inconsistent data can raise credibility concerns.',
      recommendation: 'Use consistent market sizing throughout. Pick conservative, defensible numbers and cite sources.'
    },
    {
      type: 'suggestion',
      category: 'Technical Claims',
      issue: '"87% Cost Advantage" and "NUNCHAKU 4-bit quantization" are very specific technical claims.',
      recommendation: 'Be prepared to demonstrate these with benchmarks. Consider adding "Based on internal testing" disclaimer.'
    },
    {
      type: 'suggestion',
      category: 'Language',
      issue: '"The Unhobbling" and "Hobbled Producer" are creative but may confuse reviewers unfamiliar with the terminology.',
      recommendation: 'Use clearer industry-standard language for AWS reviewers who may not understand the metaphor.'
    }
  ];

  // Slide-by-slide comparison
  const slideComparisons: SlideComparison[] = [
    {
      slideNumber: 1,
      title: 'Title Slide',
      originalContent: 'AURA-X: Sovereign AI Infrastructure for African Music Production. "Building the world\'s first AI production system specifically for South African music, powered by quantum-ready infrastructure and culturally sovereign technology."',
      optimizedContent: 'Amapiano AI: The AI-Powered Music Studio for African Sound. "Professional music production meets AI—democratizing Africa\'s fastest-growing genre" with clear Product-Led SaaS, B2C + B2B2C, AWS-Native Architecture badges.',
      issues: [
        { type: 'risk', category: 'Claims', issue: '"World\'s first" is unverifiable', recommendation: 'Remove superlative' },
        { type: 'risk', category: 'Quantum', issue: 'Quantum-ready implies dependency', recommendation: 'Remove from tagline' }
      ],
      improvements: ['Clear business model badges', 'Accessible language', 'No unverifiable claims']
    },
    {
      slideNumber: 2,
      title: 'Problem Slide',
      originalContent: 'The African Music AI Gap. Status quo: A "Hobbled" African Music Economy. Lists English-centric tools, high latency, no artist revenue share, prohibitive costs.',
      optimizedContent: 'The Problem. Amapiano producers face significant barriers to professional production: expensive tools, technical complexity, AI tools ignoring African genres. Includes concrete opportunity gap with sourced statistics.',
      issues: [
        { type: 'warning', category: 'Language', issue: '"Hobbled" metaphor may confuse reviewers', recommendation: 'Use clear problem statement' }
      ],
      improvements: ['Sourced statistics', 'Clear problem framing', 'Opportunity gap visualization']
    },
    {
      slideNumber: 3,
      title: 'Solution Slide',
      originalContent: 'The Unhobbling: AURA-X Level 5 Production. Genre-specific expertise, Regional infrastructure, 12-language support, 87% cost advantage. Mentions "Partnerships with Kabza De Small, Focalistic, etc." with "15-20% revenue share with post-quantum cryptography."',
      optimizedContent: 'Our Solution: Amapiano AI Complete Production Platform. Clearly states "product-led SaaS platform." Features: Amapianorize Engine, Browser-Based DAW, Creator Marketplace. No specific artist names or quantum claims.',
      issues: [
        { type: 'risk', category: 'Artists', issue: 'Names famous artists without verification', recommendation: 'Remove specific names or clarify status' },
        { type: 'risk', category: 'Quantum', issue: 'PQC as core feature', recommendation: 'Move to security roadmap' }
      ],
      improvements: ['Clear SaaS positioning', 'No unverifiable partnerships', 'Focused feature set']
    },
    {
      slideNumber: 4,
      title: 'Traction / Validation',
      originalContent: 'Current Status (December 2025): Production-ready infrastructure 90/100 score, Complete training pipeline, 87% GPU Cost Reduction, 93% Gross Margin.',
      optimizedContent: 'Early Traction & Validation: ~30 second AI track generation, -14 LUFS mastering quality, 4.3/5 from 50+ SA producers in closed beta. Clear milestone tracking with "In pilot discussions" and "Exploratory conversations" labels.',
      issues: [
        { type: 'warning', category: 'Metrics', issue: 'Technical readiness vs. user traction', recommendation: 'Lead with user validation' }
      ],
      improvements: ['Concrete user numbers', 'Measurable benchmarks', 'Clear partnership status labels']
    },
    {
      slideNumber: 5,
      title: 'Market Opportunity',
      originalContent: '$487M Addressable Market. TAM Global music software $2.8B, SAM Amapiano producers 50,000, Target 10,000 users, ARPU $45/month, SOM ARR $5.4M.',
      optimizedContent: 'TAM $11.7B, SAM $2.1B, SOM (Year 3) $45M with "achievable" label. Sourced market growth data and clear segment definitions.',
      issues: [
        { type: 'suggestion', category: 'Consistency', issue: 'Different TAM numbers on different slides', recommendation: 'Use consistent sizing' }
      ],
      improvements: ['Conservative SOM', 'Sourced data', 'Clear segment definitions']
    },
    {
      slideNumber: 6,
      title: 'Business Model',
      originalContent: 'Freemium SaaS with Artist Revenue Share. Four tiers: Free, Hobbyist, Creator, Studio. 15-20% artist revenue share. Unit Economics at 10,000 users.',
      optimizedContent: 'Product-Led SaaS + Marketplace. Four tiers: Free, Creator ($19), Pro ($49), Label ($199). 15% marketplace take rate. Clear CAC/LTV/Gross Margin targets.',
      issues: [
        { type: 'suggestion', category: 'Naming', issue: '"Hobbyist" tier naming less professional', recommendation: 'Use clearer tier names' }
      ],
      improvements: ['Clear pricing', 'Unit economics with target labels', 'Marketplace revenue model']
    },
    {
      slideNumber: 7,
      title: 'Competitive Advantages',
      originalContent: 'Five Defensible Moats: Technical, Cultural, Data, Regional, IP. "Our strategic positioning creates insurmountable barriers for competitors." Mentions PQC encryption.',
      optimizedContent: 'Positioned for an Underserved Market. Feature comparison table vs. Suno/Udio, FL Studio, BandLab. Differentiation statement without superlatives.',
      issues: [
        { type: 'risk', category: 'Language', issue: '"Insurmountable barriers" is overconfident', recommendation: 'Use measured language' },
        { type: 'risk', category: 'Quantum', issue: 'PQC as current moat', recommendation: 'Move to roadmap' }
      ],
      improvements: ['Factual comparison table', 'No overconfident claims', 'Clear differentiation']
    },
    {
      slideNumber: 8,
      title: 'Technology / AWS',
      originalContent: 'Multi-Region AWS Design. Cape Town primary, US-East backup. Post-Quantum Crypto in security layer. 99.99% Uptime SLA.',
      optimizedContent: 'Built on AWS for Scale. Current services: EC2, S3, Lambda, SageMaker. Planned: Cape Town region, Bedrock, Graviton. Security-first with "Future: Post-quantum cryptography evaluation."',
      issues: [
        { type: 'risk', category: 'Quantum', issue: 'PQC as current security layer', recommendation: 'Show as future evaluation' },
        { type: 'warning', category: 'SLA', issue: '99.99% is a strong commitment', recommendation: 'Use "targeting" language' }
      ],
      improvements: ['Clear current vs. planned separation', 'PQC as future roadmap', 'Realistic commitments']
    }
  ];

  const riskCount = overallCritique.filter(c => c.type === 'risk').length;
  const warningCount = overallCritique.filter(c => c.type === 'warning').length;
  const suggestionCount = overallCritique.filter(c => c.type === 'suggestion').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Pitch Deck Review & Comparison</h1>
              <p className="text-muted-foreground">AWS Activate alignment analysis</p>
            </div>
            <div className="flex gap-3">
              <Link to="/pitch-deck">
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  View Optimized Deck
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview & Critique</TabsTrigger>
            <TabsTrigger value="comparison">Slide-by-Slide</TabsTrigger>
            <TabsTrigger value="recommendations">Action Items</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 border-red-500/50 bg-red-500/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-red-500">{riskCount}</p>
                      <p className="text-sm text-muted-foreground">High-Risk Issues</p>
                    </div>
                  </div>
                  <p className="text-sm">Claims or positioning that may trigger AWS review flags or verification requirements.</p>
                </Card>

                <Card className="p-6 border-yellow-500/50 bg-yellow-500/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-yellow-600">{warningCount}</p>
                      <p className="text-sm text-muted-foreground">Warnings</p>
                    </div>
                  </div>
                  <p className="text-sm">Areas that could be improved for clarity or credibility with AWS reviewers.</p>
                </Card>

                <Card className="p-6 border-blue-500/50 bg-blue-500/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-blue-500">{suggestionCount}</p>
                      <p className="text-sm text-muted-foreground">Suggestions</p>
                    </div>
                  </div>
                  <p className="text-sm">Optional improvements that could strengthen the application.</p>
                </Card>
              </div>

              {/* Detailed Critique */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-6">Detailed Critique of Original Deck</h2>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4 pr-4">
                    {overallCritique.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`p-4 ${
                          item.type === 'risk' ? 'border-red-500/50 bg-red-500/5' :
                          item.type === 'warning' ? 'border-yellow-500/50 bg-yellow-500/5' :
                          'border-blue-500/50 bg-blue-500/5'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              item.type === 'risk' ? 'bg-red-500/20' :
                              item.type === 'warning' ? 'bg-yellow-500/20' :
                              'bg-blue-500/20'
                            }`}>
                              {item.type === 'risk' ? <XCircle className="w-4 h-4 text-red-500" /> :
                               item.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-600" /> :
                               <Lightbulb className="w-4 h-4 text-blue-500" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={`text-xs ${
                                  item.type === 'risk' ? 'border-red-500/50 text-red-600' :
                                  item.type === 'warning' ? 'border-yellow-500/50 text-yellow-600' :
                                  'border-blue-500/50 text-blue-600'
                                }`}>
                                  {item.category}
                                </Badge>
                                <Badge variant="secondary" className="text-xs capitalize">{item.type}</Badge>
                              </div>
                              <p className="text-sm font-medium mb-2">{item.issue}</p>
                              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <ArrowRight className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                                <span>{item.recommendation}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison">
            <div className="space-y-8">
              {slideComparisons.map((slide, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="bg-muted p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        Slide {slide.slideNumber}: {slide.title}
                      </h3>
                      <div className="flex gap-2">
                        {slide.issues.filter(i => i.type === 'risk').length > 0 && (
                          <Badge className="bg-red-500">{slide.issues.filter(i => i.type === 'risk').length} Risks</Badge>
                        )}
                        {slide.issues.filter(i => i.type === 'warning').length > 0 && (
                          <Badge className="bg-yellow-500">{slide.issues.filter(i => i.type === 'warning').length} Warnings</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 divide-x">
                    {/* Original */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline" className="border-red-500/50 text-red-600">
                          <ThumbsDown className="w-3 h-3 mr-1" />
                          Original PDF
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{slide.originalContent}</p>
                      <div className="space-y-2">
                        {slide.issues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-red-500/10">
                            <AlertCircle className="w-3 h-3 text-red-500 mt-0.5" />
                            <span>{issue.issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Optimized */}
                    <div className="p-6 bg-green-500/5">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline" className="border-green-500/50 text-green-600">
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Optimized Version
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{slide.optimizedContent}</p>
                      <div className="space-y-2">
                        {slide.improvements.map((improvement, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-green-500/10">
                            <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5" />
                            <span>{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Critical Actions */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-500" />
                  Critical Actions (Must Do)
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <h4 className="font-semibold mb-2">1. Remove "World's First" Claims</h4>
                    <p className="text-sm text-muted-foreground">Replace with verifiable positioning like "purpose-built for" or "dedicated to."</p>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <h4 className="font-semibold mb-2">2. Reframe Quantum Cryptography</h4>
                    <p className="text-sm text-muted-foreground">Move PQC from current features to "security roadmap" or "future evaluation."</p>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <h4 className="font-semibold mb-2">3. Clarify Artist Partnership Status</h4>
                    <p className="text-sm text-muted-foreground">Add status labels: "In Discussion", "Pilot", "Signed" - avoid naming specific famous artists without verification.</p>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <h4 className="font-semibold mb-2">4. Remove "Insurmountable Barriers"</h4>
                    <p className="text-sm text-muted-foreground">Replace with "sustainable competitive advantages" or "defensible positioning."</p>
                  </div>
                </div>
              </Card>

              {/* Important Improvements */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Important Improvements
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <h4 className="font-semibold mb-2">1. Clarify Business Model</h4>
                    <p className="text-sm text-muted-foreground">Lead with "Product-Led SaaS" instead of "Sovereign AI Infrastructure" which sounds like B2B consulting.</p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <h4 className="font-semibold mb-2">2. Add Concrete Traction Metrics</h4>
                    <p className="text-sm text-muted-foreground">Include specific numbers: beta testers, tracks generated, user satisfaction scores with sample sizes.</p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <h4 className="font-semibold mb-2">3. Consistent Market Sizing</h4>
                    <p className="text-sm text-muted-foreground">Use the same TAM/SAM/SOM numbers throughout. Pick conservative, sourced figures.</p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <h4 className="font-semibold mb-2">4. Simplify Terminology</h4>
                    <p className="text-sm text-muted-foreground">Replace "The Unhobbling" and "Hobbled Producer" with clearer industry-standard language.</p>
                  </div>
                </div>
              </Card>

              {/* Summary */}
              <Card className="p-6 md:col-span-2 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
                <h2 className="text-xl font-bold mb-4">Summary: Key Differences</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                      <XCircle className="w-4 h-4" />
                      Original PDF Issues
                    </h3>
                    <ul className="text-sm space-y-2">
                      <li>• Unverifiable "world's first" claims</li>
                      <li>• PQC positioned as current dependency</li>
                      <li>• Named famous artists without status clarity</li>
                      <li>• "Insurmountable barriers" overconfidence</li>
                      <li>• "Sovereign AI Infrastructure" confusing positioning</li>
                      <li>• Technical readiness vs. user traction focus</li>
                      <li>• Inconsistent market sizing across slides</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Optimized Version Improvements
                    </h3>
                    <ul className="text-sm space-y-2">
                      <li>• Measured, verifiable claims</li>
                      <li>• PQC as future security roadmap</li>
                      <li>• Clear "In Discussion"/"Pilot" labels</li>
                      <li>• "Sustainable advantages" language</li>
                      <li>• Clear "Product-Led SaaS" positioning</li>
                      <li>• Concrete user traction metrics (50+ beta users)</li>
                      <li>• Consistent, conservative market sizing</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
