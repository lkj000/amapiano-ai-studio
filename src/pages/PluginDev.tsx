import React, { useState, useEffect } from 'react';
import { PluginDevelopmentIDE } from '@/components/plugins/PluginDevelopmentIDE';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Sparkles, Zap, Package, BookOpen, Rocket, Play, Wand2, Globe, Cpu, Activity, Layers, Lightbulb } from 'lucide-react';
import { useHighSpeedAudioEngine } from '@/hooks/useHighSpeedAudioEngine';

export default function PluginDev() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [showIDE, setShowIDE] = useState(false);
  const wasmEngine = useHighSpeedAudioEngine();

  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(ctx);
    wasmEngine.initialize();

    return () => {
      ctx.close();
    };
  }, []);

  if (showIDE) {
    return (
      <div className="min-h-screen bg-background">
        <PluginDevelopmentIDE
          audioContext={audioContext}
          onClose={() => setShowIDE(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <main className="container mx-auto px-4 py-8 space-y-16">
        {/* Hero Section with Animated Background */}
        <div className="relative text-center space-y-6 py-16">
          {/* Animated gradient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }} />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-full border border-primary/20 backdrop-blur-sm animate-fade-in">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                AI-Powered VST Development Platform
              </span>
            </div>
            
            <h1 className="text-6xl font-bold tracking-tight animate-fade-in">
              Create <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">Unlimited</span>
              <span className="block mt-2">VST Plugins with AI</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in">
              Professional plugin development environment with real-time AI generation, visual building, 
              C++ WASM compilation, and instant marketplace publishing. No limits, infinite possibilities.
            </p>

            <div className="flex gap-4 justify-center items-center flex-wrap animate-fade-in">
              <Button 
                size="lg" 
                onClick={() => setShowIDE(true)}
                className="text-lg px-8 py-6 h-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Code className="mr-2 h-5 w-5" />
                Launch Plugin IDE
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => {
                  const section = document.getElementById('features');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-lg px-8 py-6 h-auto hover:bg-primary/10 transition-all"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-8 justify-center pt-8 animate-fade-in flex-wrap">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">∞</div>
                <div className="text-sm text-muted-foreground">Plugin Types</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">20+</div>
                <div className="text-sm text-muted-foreground">Templates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">&lt;3ms</div>
                <div className="text-sm text-muted-foreground">Latency</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">12ms</div>
                <div className="text-sm text-muted-foreground">Compile Time</div>
              </div>
            </div>

            {/* Status Badges */}
            {wasmEngine.isInitialized && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Badge variant="default" className="bg-gradient-to-r from-cyan-500 to-blue-500 text-base py-2 px-4 animate-fade-in">
                  <Zap className="h-4 w-4 mr-2" />
                  C++ WASM Enabled
                </Badge>
                {wasmEngine.isProfessionalGrade && (
                  <Badge variant="default" className="bg-gradient-to-r from-green-500 to-emerald-500 text-base py-2 px-4 animate-fade-in">
                    Professional Grade
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Features Grid with Interactive Cards */}
        <div id="features" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Powerful Features</h2>
            <p className="text-muted-foreground">Everything you need to create professional VST plugins</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="group p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-card to-card/50">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-xl font-semibold">AI Plugin Generator</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Describe any plugin in natural language and watch AI generate production-ready code instantly. Unlimited plugin types supported.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">Synths</Badge>
                  <Badge variant="secondary" className="text-xs">Effects</Badge>
                  <Badge variant="secondary" className="text-xs">Dynamics</Badge>
                  <Badge variant="secondary" className="text-xs">+More</Badge>
                </div>
              </div>
            </Card>

            <Card className="group p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-card to-card/50">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                  <Code className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-xl font-semibold">Professional Code Editor</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Monaco-powered editor with IntelliSense, syntax highlighting, multi-cursor editing, and real-time error detection.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">C++</Badge>
                  <Badge variant="secondary" className="text-xs">JUCE</Badge>
                  <Badge variant="secondary" className="text-xs">Live Errors</Badge>
                </div>
              </div>
            </Card>

            <Card className="group p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-card to-card/50">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                  <Wand2 className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-xl font-semibold">Visual Plugin Builder</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Drag-and-drop audio modules to build complex signal chains. Real-time visual feedback and instant parameter control.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">20+ Modules</Badge>
                  <Badge variant="secondary" className="text-xs">Drag & Drop</Badge>
                  <Badge variant="secondary" className="text-xs">Real-time</Badge>
                </div>
              </div>
            </Card>

            <Card className="group p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-card to-card/50">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                  <Cpu className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-xl font-semibold">WASM Compiler</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Lightning-fast C++ to WebAssembly compilation. Average compile time under 12ms with real-time progress tracking.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">12ms Compile</Badge>
                  <Badge variant="secondary" className="text-xs">JUCE Framework</Badge>
                </div>
              </div>
            </Card>

            <Card className="group p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-card to-card/50">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                  <Play className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-xl font-semibold">Live Testing Suite</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Test plugins instantly with real-time audio playback, visual waveforms, spectrum analyzer, and performance metrics.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">Real-time Audio</Badge>
                  <Badge variant="secondary" className="text-xs">Metrics</Badge>
                </div>
              </div>
            </Card>

            <Card className="group p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-card to-card/50">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                  <Globe className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-xl font-semibold">Marketplace Publishing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  One-click publishing to plugin marketplace. Monetize your creations, track downloads, and manage versions.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">1-Click Publish</Badge>
                  <Badge variant="secondary" className="text-xs">Monetization</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Development Workflow Timeline */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Streamlined Workflow</h2>
            <p className="text-muted-foreground">From idea to published plugin in minutes</p>
          </div>
          
          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-purple-500 to-pink-500 hidden md:block" />
            
            <div className="space-y-8">
              {[
                {
                  step: 1,
                  icon: Sparkles,
                  title: "AI Generate or Choose Template",
                  description: "Describe your plugin in natural language or browse 20+ professional templates. AI generates complete, working code instantly.",
                  highlight: "Unlimited plugin types"
                },
                {
                  step: 2,
                  icon: Code,
                  title: "Edit & Customize",
                  description: "Fine-tune with the professional code editor or use drag-and-drop visual builder. Real-time syntax checking and IntelliSense.",
                  highlight: "Monaco Editor + Visual Builder"
                },
                {
                  step: 3,
                  icon: Cpu,
                  title: "Compile to WASM",
                  description: "Lightning-fast C++ to WebAssembly compilation. Watch real-time progress with detailed logs and error messages.",
                  highlight: "12ms compilation"
                },
                {
                  step: 4,
                  icon: Play,
                  title: "Test & Refine",
                  description: "Test with real audio in the integrated testing suite. Visualize waveforms, spectrum, and performance metrics.",
                  highlight: "Real-time audio processing"
                },
                {
                  step: 5,
                  icon: Globe,
                  title: "Publish & Share",
                  description: "One-click publishing to marketplace. Set pricing, manage versions, track downloads, and earn from your creations.",
                  highlight: "Instant deployment"
                }
              ].map((item, index) => (
                <div key={item.step} className={`relative flex gap-6 items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Step number circle */}
                  <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg hover:scale-110 transition-transform border-4 border-background">
                    {item.step}
                  </div>
                  
                  {/* Content card */}
                  <Card className="flex-1 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/50 group cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h3 className="text-xl font-semibold">{item.title}</h3>
                          <Badge className="bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30">
                            {item.highlight}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics with Visual Appeal */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 p-8">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          
          <div className="relative z-10 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Industry-Leading Performance</h2>
              <p className="text-muted-foreground">Optimized for professional audio production</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { value: '<3ms', label: 'Audio Processing Latency', icon: Zap, color: 'text-yellow-500' },
                { value: '12ms', label: 'Average Compile Time', icon: Cpu, color: 'text-blue-500' },
                { value: '192kHz', label: 'Max Sample Rate', icon: Activity, color: 'text-green-500' },
                { value: '∞', label: 'Plugin Instances', icon: Layers, color: 'text-purple-500' }
              ].map((metric) => (
                <Card key={metric.label} className="text-center p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 group cursor-pointer border-2 hover:border-primary/50">
                  <div className="space-y-3">
                    <metric.icon className={`h-8 w-8 mx-auto ${metric.color} group-hover:scale-110 transition-transform`} />
                    <div className="text-4xl font-bold bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent">
                      {metric.value}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">{metric.label}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Plugin Types Showcase */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Create Any Plugin Type</h2>
            <p className="text-muted-foreground">No limits on what you can build</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { name: 'Synthesizers', icon: '🎹' },
              { name: 'Effects', icon: '✨' },
              { name: 'Samplers', icon: '🥁' },
              { name: 'Dynamics', icon: '📊' },
              { name: 'Modulation', icon: '🌊' },
              { name: 'Reverb', icon: '🏛️' },
              { name: 'Delay', icon: '⏱️' },
              { name: 'Distortion', icon: '🔥' },
              { name: 'Filters', icon: '🎛️' },
              { name: 'EQ', icon: '📈' },
              { name: 'Mastering', icon: '💎' },
              { name: 'Vintage', icon: '📻' },
              { name: 'MIDI', icon: '🎼' },
              { name: 'Creative', icon: '🎨' }
            ].map((type) => (
              <Card key={type.name} className="p-4 text-center hover:shadow-lg hover:scale-105 transition-all cursor-pointer border-2 hover:border-primary/50 group">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{type.icon}</div>
                <div className="text-xs font-medium">{type.name}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Final CTA with Enhanced Design */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 p-12">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          
          <div className="relative z-10 text-center space-y-6">
            <h2 className="text-4xl font-bold">Ready to Build the Future of Audio?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join developers worldwide creating next-generation VST plugins with AI assistance
            </p>
            
            <div className="flex gap-4 justify-center items-center flex-wrap">
              <Button 
                size="lg" 
                onClick={() => setShowIDE(true)}
                className="text-lg px-10 py-7 h-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl hover:shadow-2xl transition-all hover:scale-110"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Creating Now
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-10 py-7 h-auto hover:bg-primary/10 transition-all"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                View Documentation
              </Button>
            </div>
            
            <div className="pt-6 text-sm text-muted-foreground">
              ✨ No credit card required • 🚀 Start building in seconds • 💡 Unlimited possibilities
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
