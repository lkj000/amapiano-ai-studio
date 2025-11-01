import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { PluginDevelopmentIDE } from '@/components/plugins/PluginDevelopmentIDE';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Sparkles, Zap, Package, BookOpen, Rocket } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      <Navigation user={null} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Code className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold">Plugin Development Platform</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            Create professional audio plugins with JUCE, compile to WASM, and publish to the marketplace
          </p>
          
          <div className="flex items-center justify-center gap-3 mb-8">
            {wasmEngine.isInitialized && (
              <Badge variant="default" className="bg-gradient-to-r from-cyan-500 to-blue-500 text-lg py-2 px-4">
                <Zap className="h-4 w-4 mr-2" />
                C++ WASM Enabled
              </Badge>
            )}
            {wasmEngine.isProfessionalGrade && (
              <Badge variant="default" className="bg-gradient-to-r from-green-500 to-emerald-500 text-lg py-2 px-4">
                Professional Grade
              </Badge>
            )}
          </div>

          <Button onClick={() => setShowIDE(true)} size="lg" className="text-lg px-8">
            <Sparkles className="h-5 w-5 mr-2" />
            Launch Plugin IDE
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Code Editor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✅ JUCE framework support</li>
                <li>✅ Syntax highlighting</li>
                <li>✅ Code snippets library</li>
                <li>✅ Real-time validation</li>
                <li>✅ Auto-completion</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                C++ WASM Compiler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>⚡ 10-100x faster performance</li>
                <li>⚡ &lt;3ms latency</li>
                <li>⚡ 12ms compilation time</li>
                <li>⚡ Professional-grade DSP</li>
                <li>⚡ Multi-threaded audio</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Marketplace Publishing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>🚀 One-click publishing</li>
                <li>🚀 Automatic distribution</li>
                <li>🚀 Version management</li>
                <li>🚀 Analytics dashboard</li>
                <li>🚀 Revenue tracking</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Steps */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Development Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Choose Template</h4>
                <p className="text-sm text-muted-foreground">
                  Start with professional templates or from scratch
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Write Code</h4>
                <p className="text-sm text-muted-foreground">
                  Use JUCE or Web Audio API with code assistance
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Compile to WASM</h4>
                <p className="text-sm text-muted-foreground">
                  Compile to high-performance C++ WASM
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold">4</span>
                </div>
                <h4 className="font-semibold mb-2">Test Plugin</h4>
                <p className="text-sm text-muted-foreground">
                  Run comprehensive tests and benchmarks
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold">5</span>
                </div>
                <h4 className="font-semibold mb-2">Publish</h4>
                <p className="text-sm text-muted-foreground">
                  Share with the community or sell
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Performance Benchmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">10-100x</div>
                <div className="text-sm text-muted-foreground">Faster Processing</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">&lt;3ms</div>
                <div className="text-sm text-muted-foreground">Latency</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">12ms</div>
                <div className="text-sm text-muted-foreground">Compilation Time</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">Pro</div>
                <div className="text-sm text-muted-foreground">Audio Quality</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button onClick={() => setShowIDE(true)} size="lg" className="text-lg px-12">
            <Code className="h-5 w-5 mr-2" />
            Start Building
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            No installation required • Free to start • Professional results
          </p>
        </div>
      </main>
    </div>
  );
}
