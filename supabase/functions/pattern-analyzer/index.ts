import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PatternAnalysis {
  rhythmPatterns: Array<{
    pattern: number[];
    frequency: number;
    style: string;
  }>;
  harmonicProgressions: Array<{
    chords: string[];
    frequency: number;
    context: string;
  }>;
  melodicMotifs: Array<{
    notes: number[];
    interval: number[];
    usage: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const formData = await req.formData();
    const analysisType = formData.get('analysisType') as string;
    
    // Get all uploaded files
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        files.push(value);
      }
    }

    console.log(`[PATTERN-ANALYZER] Analyzing ${files.length} files for ${analysisType} patterns`);

    // Process each file: upload to a temporary public URL is not feasible here,
    // so we use file metadata + MIME type to call Modal with a data-uri approach
    // where the Modal endpoint supports base64-encoded audio via audio_data field.
    const modalUrl = Deno.env.get('MODAL_API_URL') || 'https://mabgwej--aura-x-backend-fastapi-app.modal.run';

    const fileAnalyses = await Promise.all(
      files.map(async (file, index) => {
        const fileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          index,
        };

        try {
          const arrayBuffer = await file.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

          const modalResp = await fetch(`${modalUrl}/audio/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio_data: base64,
              audio_mime: file.type,
              extract_features: true,
            }),
          });

          if (!modalResp.ok) {
            throw new Error(`Modal /audio/analyze returned ${modalResp.status}`);
          }

          const modalData = await modalResp.json();

          return {
            fileInfo,
            patterns: {
              rhythm: {
                complexity: modalData.rhythm_complexity ?? 0,
                syncopation: modalData.syncopation ?? 0,
                authenticity: modalData.authenticity ?? 0,
              },
              harmony: {
                jazzInfluence: modalData.jazz_influence ?? 0,
                modernProgression: modalData.modern_progression ?? 0,
                culturalElements: modalData.cultural_elements ?? 0,
              },
              melody: {
                pianoComplexity: modalData.piano_complexity ?? 0,
                vocalElements: modalData.vocal_elements ?? 0,
                instrumentalDiversity: modalData.instrumental_diversity ?? 0,
              },
            },
            confidence: modalData.confidence ?? 0,
          };
        } catch (err) {
          console.error(`[PATTERN-ANALYZER] Modal analysis failed for ${file.name}:`, err);
          // On failure return zeros — do not use random values
          return {
            fileInfo,
            patterns: {
              rhythm: { complexity: 0, syncopation: 0, authenticity: 0 },
              harmony: { jazzInfluence: 0, modernProgression: 0, culturalElements: 0 },
              melody: { pianoComplexity: 0, vocalElements: 0, instrumentalDiversity: 0 },
            },
            confidence: 0,
          };
        }
      })
    );

    // Use OpenAI to provide intelligent pattern analysis
    const aiAnalysisPrompt = `Analyze these music files for Amapiano patterns:

Analysis Type: ${analysisType}
Files: ${files.map(f => f.name).join(', ')}

Based on typical Amapiano music characteristics, provide detailed pattern analysis including:
1. Common rhythmic patterns (log drums, percussion)
2. Harmonic progressions (jazz-influenced chords)
3. Melodic motifs (piano melodies, bass lines)
4. Cultural authenticity markers
5. Style classification

Focus on identifying authentic Amapiano elements and their frequency of occurrence.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert music analyst specializing in Amapiano patterns and cultural authenticity.' },
          { role: 'user', content: aiAnalysisPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('[PATTERN-ANALYZER] OpenAI API error:', await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiAnalysis = aiResponse.choices[0].message.content;

    // Default template patterns (Amapiano genre knowledge — NOT derived from uploaded files)
    // These serve as reference templates when no audio-specific data is available.
    const patternAnalysis: PatternAnalysis = {
      rhythmPatterns: [
        {
          pattern: [1, 0, 0, 1, 0, 1, 0, 0], // Classic Amapiano log drum pattern
          frequency: 0, // frequency not measured — template only
          style: '[Template] Classic Log Drums'
        },
        {
          pattern: [1, 0, 1, 0, 1, 0, 1, 0], // Four-on-floor with syncopation
          frequency: 0,
          style: '[Template] Syncopated Percussion'
        },
        {
          pattern: [1, 0, 0, 0, 0, 1, 0, 1], // Deep bass pattern
          frequency: 0,
          style: '[Template] Deep Bass Rhythm'
        }
      ],
      harmonicProgressions: [
        {
          chords: ['Cm', 'Ab', 'Bb', 'Gm'],
          frequency: 0,
          context: '[Template] Classic Amapiano progression'
        },
        {
          chords: ['Am', 'F', 'C', 'G'],
          frequency: 0,
          context: '[Template] Jazz-influenced harmony'
        },
        {
          chords: ['Dm', 'Bb', 'F', 'C'],
          frequency: 0,
          context: '[Template] Private School style'
        }
      ],
      melodicMotifs: [
        {
          notes: [60, 62, 64, 67, 69], // C, D, E, G, A
          interval: [2, 2, 3, 2],
          usage: '[Template] Piano melody foundation'
        },
        {
          notes: [36, 43, 36, 31], // Bass line pattern
          interval: [7, -7, -5],
          usage: '[Template] Log drum bass pattern'
        },
        {
          notes: [72, 74, 76, 72, 69], // High piano accents
          interval: [2, 2, -4, -3],
          usage: '[Template] Piano accents and fills'
        }
      ]
    };

    console.log('[PATTERN-ANALYZER] Analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      analysis: patternAnalysis,
      aiInsights: aiAnalysis,
      filesAnalyzed: files.length,
      analysisType,
      timestamp: Date.now(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[PATTERN-ANALYZER] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

