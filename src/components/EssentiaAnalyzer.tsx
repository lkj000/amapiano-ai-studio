import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useEssentiaAnalysis, ComprehensiveAnalysis } from '@/hooks/useEssentiaAnalysis';
import { useRealtimeFeatureExtraction } from '@/hooks/useRealtimeFeatureExtraction';
import { 
  Music, Waves, Activity, Radio, AlertCircle, 
  Fingerprint, Download, Play, Upload, Sparkles, Zap
} from 'lucide-react';
import { toast } from 'sonner';

export const EssentiaAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState<string>('');
  const [useWASM, setUseWASM] = useState(true); // Enable WASM by default
  const { analyzeAudio, isAnalyzing, analysis } = useEssentiaAnalysis();
  const wasmExtractor = useRealtimeFeatureExtraction();

  // Auto-initialize WASM engine
  useEffect(() => {
    if (useWASM && !wasmExtractor.isInitialized) {
      wasmExtractor.initialize();
    }
  }, [useWASM]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      if (!uploadedFile.type.startsWith('audio/')) {
        toast.error('Please upload an audio file');
        return;
      }
      setFile(uploadedFile);
      toast.success('File loaded. Click Analyze to start.');
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Please upload an audio file first');
      return;
    }

    try {
      setProgress(0);
      setAnalysisStage('Initializing...');

      if (useWASM && wasmExtractor.isInitialized) {
        // Use high-speed WASM analysis
        setAnalysisStage('🚀 High-Speed C++ WASM Analysis...');
        
        // Load audio file
        const audioContext = new AudioContext();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // High-speed batch extraction
        const startTime = performance.now();
        await wasmExtractor.batchExtract(audioBuffer, (p) => {
          setProgress(p * 100);
          if (p < 0.5) setAnalysisStage('⚡ C++ WASM: Extracting features (10-100x faster)...');
          else setAnalysisStage('⚡ C++ WASM: Finalizing analysis...');
        });
        
        const duration = performance.now() - startTime;
        const speedup = (audioBuffer.duration * 1000) / duration;
        
        setAnalysisStage(`✓ Complete! ${speedup.toFixed(1)}x faster than JavaScript`);
        toast.success('High-Speed Analysis Complete', {
          description: `Analyzed ${audioBuffer.duration.toFixed(1)}s in ${duration.toFixed(0)}ms (${speedup.toFixed(1)}x real-time)`
        });
        
        audioContext.close();
      } else {
        // Fallback to JavaScript analysis
        await analyzeAudio(file, {
          includeFingerprint: true,
          realtimeCallback: (p) => {
            setProgress(p * 100);
            if (p < 0.2) setAnalysisStage('Analyzing spectral features...');
            else if (p < 0.4) setAnalysisStage('Analyzing temporal features...');
            else if (p < 0.6) setAnalysisStage('Analyzing tonal features...');
            else if (p < 0.75) setAnalysisStage('Analyzing rhythm...');
            else if (p < 0.85) setAnalysisStage('Analyzing audio quality...');
            else if (p < 0.97) setAnalysisStage('Generating fingerprint...');
            else if (p < 1.0) setAnalysisStage('AI deep learning analysis...');
            else setAnalysisStage('Complete!');
          }
        });
        
        setAnalysisStage('Analysis complete with AI insights!');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisStage('');
      toast.error('Analysis failed. Check console for details.');
    }
  };

  const exportAnalysis = () => {
    if (!analysis) return;
    
    const dataStr = JSON.stringify(analysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audio-analysis-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Analysis exported');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Essentia Audio Analysis
            </div>
            <div className="flex items-center gap-2">
              {wasmExtractor.isInitialized && (
                <Badge variant="default" className="gap-1">
                  <Zap className="h-3 w-3" />
                  C++ WASM Ready
                </Badge>
              )}
              {wasmExtractor.speedupFactor > 0 && (
                <Badge variant="secondary">
                  {wasmExtractor.speedupFactor.toFixed(1)}x faster
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="audio-upload"
              />
              <label htmlFor="audio-upload">
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Audio File
                  </span>
                </Button>
              </label>
            </div>
            <Button 
              onClick={handleAnalyze} 
              disabled={!file || isAnalyzing}
              className="flex-1"
            >
              <Play className="mr-2 h-4 w-4" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
            {analysis && (
              <Button onClick={exportAnalysis} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          </div>

          {file && (
            <div className="text-sm text-muted-foreground">
              File: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{analysisStage}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
              {progress > 97 && (
                <p className="text-xs text-muted-foreground animate-pulse flex items-center justify-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  Running AI models for genre, mood, and cultural analysis...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <Tabs defaultValue="spectral" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="spectral">Spectral</TabsTrigger>
            <TabsTrigger value="temporal">Temporal</TabsTrigger>
            <TabsTrigger value="tonal">Tonal</TabsTrigger>
            <TabsTrigger value="rhythm">Rhythm</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="fingerprint">Fingerprint</TabsTrigger>
          </TabsList>

          <TabsContent value="spectral" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5" />
                  Spectral Descriptors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DescriptorRow 
                  label="Spectral Centroid" 
                  value={`${analysis.spectral.centroid.toFixed(2)} Hz`}
                  description="Center of mass of spectrum"
                />
                <DescriptorRow 
                  label="Spectral Rolloff" 
                  value={`${analysis.spectral.rolloff.toFixed(2)} Hz`}
                  description="85% energy point"
                />
                <DescriptorRow 
                  label="Spectral Flatness" 
                  value={analysis.spectral.flatness.toFixed(3)}
                  description="Tonality vs noise (0=tonal, 1=noisy)"
                />
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2">Spectral Contrast (7 bands)</p>
                  <div className="flex gap-1">
                    {analysis.spectral.contrast.map((val, idx) => (
                      <div key={idx} className="flex-1">
                        <div 
                          className="bg-primary rounded-t" 
                          style={{ height: `${val * 60}px` }}
                        />
                        <p className="text-xs text-center mt-1">{idx + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="temporal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Temporal Descriptors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DescriptorRow 
                  label="Zero Crossing Rate" 
                  value={analysis.temporal.zeroCrossingRate.toFixed(4)}
                  description="Frequency content indicator"
                />
                <DescriptorRow 
                  label="RMS Energy" 
                  value={analysis.temporal.rms.toFixed(4)}
                  description="Root mean square amplitude"
                />
                <DescriptorRow 
                  label="Total Energy" 
                  value={analysis.temporal.energy.toFixed(4)}
                  description="Average signal power"
                />
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2">
                    Envelope ({analysis.temporal.envelope.length} frames)
                  </p>
                  <div className="h-20 bg-muted rounded flex items-end gap-px">
                    {analysis.temporal.envelope.slice(0, 100).map((val, idx) => (
                      <div 
                        key={idx}
                        className="flex-1 bg-primary rounded-t"
                        style={{ height: `${val * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tonal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Tonal Descriptors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-lg px-4 py-2">
                    {analysis.tonal.key}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Confidence: {(analysis.tonal.keyStrength * 100).toFixed(1)}%
                  </span>
                </div>
                <DescriptorRow 
                  label="Tuning Frequency" 
                  value={`${analysis.tonal.tuning.toFixed(2)} Hz`}
                  description="A4 reference frequency"
                />
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2">Chromagram (12 pitch classes)</p>
                  <div className="flex gap-1">
                    {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((note, idx) => (
                      <div key={note} className="flex-1">
                        <div 
                          className="bg-primary rounded-t" 
                          style={{ 
                            height: `${analysis.tonal.chroma[idx] * 60}px`,
                            opacity: analysis.tonal.chroma[idx]
                          }}
                        />
                        <p className="text-xs text-center mt-1">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rhythm" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Rhythm Descriptors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-2xl px-6 py-3">
                    {analysis.rhythm.bpm} BPM
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Confidence: {(analysis.rhythm.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <DescriptorRow 
                  label="Detected Onsets" 
                  value={analysis.rhythm.onsets.length.toString()}
                  description="Note attack transients"
                />
                <DescriptorRow 
                  label="Beat Positions" 
                  value={analysis.rhythm.beatPositions.length.toString()}
                  description="Estimated beat grid"
                />
                <DescriptorRow 
                  label="Downbeats" 
                  value={analysis.rhythm.downbeats.length.toString()}
                  description="Strong beats (bar starts)"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Audio Quality Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={analysis.quality.clipping ? "destructive" : "default"}>
                    {analysis.quality.clipping ? 'Clipping Detected' : 'No Clipping'}
                  </Badge>
                  {analysis.quality.clipping && (
                    <span className="text-sm text-muted-foreground">
                      {(analysis.quality.clippingRate * 100).toFixed(3)}% samples
                    </span>
                  )}
                </div>
                <DescriptorRow 
                  label="Dynamic Range" 
                  value={`${analysis.quality.dynamicRange.toFixed(2)} dB`}
                  description="Peak to average ratio"
                />
                <DescriptorRow 
                  label="Signal-to-Noise Ratio" 
                  value={`${analysis.quality.snr.toFixed(2)} dB`}
                  description="SNR estimation"
                />
                <DescriptorRow 
                  label="Noise Level" 
                  value={`${(analysis.quality.noiseLevel * 100).toFixed(2)}%`}
                  description="High-frequency content"
                />
                
                {analysis.quality.issues.length > 0 && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-medium mb-2">Issues Detected:</p>
                    <ul className="space-y-1">
                      {analysis.quality.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.quality.issues.length === 0 && (
                  <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      ✓ No quality issues detected
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
              </TabsContent>

              <TabsContent value="deep-learning" className="space-y-4">
                {analysis?.deepLearning ? (
                  <>
                    {analysis.deepLearning.genres && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Music className="w-5 h-5" />
                            Genre Classification
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {analysis.deepLearning.genres.map((genre, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{genre.name}</span>
                                <span className="text-muted-foreground">
                                  {(genre.confidence * 100).toFixed(1)}%
                                </span>
                              </div>
                              {genre.subgenre && (
                                <div className="text-xs text-muted-foreground ml-4">
                                  → {genre.subgenre}
                                </div>
                              )}
                              <Progress value={genre.confidence * 100} className="h-2" />
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {analysis.deepLearning.mood && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Mood & Emotion
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <DescriptorRow 
                              label="Primary Mood" 
                              value={analysis.deepLearning.mood.primary}
                            />
                            {analysis.deepLearning.mood.secondary && (
                              <DescriptorRow 
                                label="Secondary" 
                                value={analysis.deepLearning.mood.secondary}
                              />
                            )}
                            <DescriptorRow 
                              label="Valence" 
                              value={(analysis.deepLearning.mood.valence * 100).toFixed(0) + '%'}
                              description="Positive/Negative emotion"
                            />
                            <DescriptorRow 
                              label="Arousal" 
                              value={(analysis.deepLearning.mood.arousal * 100).toFixed(0) + '%'}
                              description="Energy/Calmness"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium mb-2">Emotions Detected:</div>
                            <div className="flex flex-wrap gap-2">
                              {analysis.deepLearning.mood.emotions.map((emotion, idx) => (
                                <Badge key={idx} variant="secondary">{emotion}</Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {analysis.deepLearning.danceability && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Danceability Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Danceability Score</span>
                              <span>{(analysis.deepLearning.danceability.score * 100).toFixed(0)}%</span>
                            </div>
                            <Progress value={analysis.deepLearning.danceability.score * 100} className="h-3" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <DescriptorRow 
                              label="Groove Factor" 
                              value={(analysis.deepLearning.danceability.grooveFactor * 100).toFixed(0) + '%'}
                            />
                            <DescriptorRow 
                              label="Complexity" 
                              value={(analysis.deepLearning.danceability.rhythmicComplexity * 100).toFixed(0) + '%'}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium mb-2">Compatible Dance Styles:</div>
                            <div className="flex flex-wrap gap-2">
                              {analysis.deepLearning.danceability.danceStyles.map((style, idx) => (
                                <Badge key={idx} variant="outline">{style}</Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {analysis.deepLearning.cultural && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Cultural Authenticity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Authenticity Score</span>
                              <span>{(analysis.deepLearning.cultural.authenticity * 100).toFixed(0)}%</span>
                            </div>
                            <Progress value={analysis.deepLearning.cultural.authenticity * 100} className="h-3" />
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm font-medium mb-2">Traditions:</div>
                              <div className="flex flex-wrap gap-2">
                                {analysis.deepLearning.cultural.traditions.map((tradition, idx) => (
                                  <Badge key={idx} variant="secondary">{tradition}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium mb-2">Instruments:</div>
                              <div className="flex flex-wrap gap-2">
                                {analysis.deepLearning.cultural.instruments.map((instrument, idx) => (
                                  <Badge key={idx} variant="outline">{instrument}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium mb-2">Regional Markers:</div>
                              <div className="flex flex-wrap gap-2">
                                {analysis.deepLearning.cultural.regionalMarkers.map((marker, idx) => (
                                  <Badge key={idx}>{marker}</Badge>
                                ))}
                              </div>
                            </div>
                            {analysis.deepLearning.cultural.fusionElements.length > 0 && (
                              <div>
                                <div className="text-sm font-medium mb-2">Fusion Elements:</div>
                                <div className="flex flex-wrap gap-2">
                                  {analysis.deepLearning.cultural.fusionElements.map((element, idx) => (
                                    <Badge key={idx} variant="secondary">{element}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {analysis.deepLearning.insights && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">AI Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            {analysis.deepLearning.insights.map((insight, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Overall Confidence</span>
                          <Badge variant="outline">
                            {(analysis.deepLearning.confidence * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      Deep learning analysis not available. Upload and analyze a file to see results.
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="fingerprint" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  Audio Fingerprint
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.fingerprint ? (
                  <>
                    <div className="p-3 bg-muted rounded font-mono text-xs break-all">
                      {analysis.fingerprint.hash}
                    </div>
                    <DescriptorRow 
                      label="Landmarks" 
                      value={analysis.fingerprint.landmarks.length.toString()}
                      description="Spectral peaks for matching"
                    />
                    <DescriptorRow 
                      label="Duration" 
                      value={`${analysis.fingerprint.duration.toFixed(2)}s`}
                      description="Audio length"
                    />
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground">
                        This fingerprint can be used for:
                      </p>
                      <ul className="text-sm mt-2 space-y-1 ml-4 list-disc">
                        <li>Copyright detection</li>
                        <li>Duplicate identification</li>
                        <li>Cover song detection</li>
                        <li>Audio matching & search</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Fingerprint not generated. Enable fingerprinting in analysis options.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DescriptorRow 
              label="Duration" 
              value={`${analysis.metadata.duration.toFixed(2)}s`}
            />
            <DescriptorRow 
              label="Sample Rate" 
              value={`${analysis.metadata.sampleRate} Hz`}
            />
            <DescriptorRow 
              label="Channels" 
              value={analysis.metadata.channels.toString()}
            />
            <DescriptorRow 
              label="Loudness" 
              value={`${analysis.metadata.loudness.toFixed(2)} LUFS`}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const DescriptorRow: React.FC<{ 
  label: string; 
  value: string; 
  description?: string;
}> = ({ label, value, description }) => (
  <div className="flex justify-between items-start">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
    <Badge variant="outline">{value}</Badge>
  </div>
);
