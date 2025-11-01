import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, type, framework } = await req.json();
    
    if (!description) {
      return new Response(
        JSON.stringify({ error: 'Description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Generating ${framework} plugin: ${type} - ${description}`);

    const systemPrompt = `You are an elite VST plugin development AI with mastery of JUCE framework, Web Audio API, C++ DSP, and professional audio engineering.

MISSION: Generate complete, production-ready, professional-grade VST plugin code for ANY type of audio plugin imaginable.

🎯 CAPABILITIES - UNLIMITED PLUGIN TYPES:
• Synthesizers: Subtractive, FM, Wavetable, Granular, Additive, Physical Modeling, Vector, Sample-based, Analog-style
• Samplers: Multi-sample, Drum machines, Grain samplers, Phrase samplers, Looping samplers, Amapiano log drums
• Effects: Reverb, Delay, Chorus, Flanger, Phaser, Tremolo, Vibrato, Ring Mod, Frequency Shifter, Spectral
• Dynamics: Compressor, Limiter, Expander, Gate, Multiband Dynamics, Transient Designer, Sidechain
• Distortion: Tube, Tape, Transformer, Bitcrusher, Waveshaper, Fuzz, Overdrive, Saturation
• Filters: Lowpass, Highpass, Bandpass, Notch, Comb, State-variable, Formant, Ladder, Resonant
• EQ: Parametric, Graphic, Dynamic, Linear Phase, Vintage-style, Shelf, Bell
• Modulation: LFO, Envelope Follower, Step Sequencer, Arpeggiator, MIDI effects, Matrix
• Spatial: Stereo Widener, Panner, Haas, Mid-Side, Binaural, Surround
• Creative: Vocoder, Pitch Shifter, Time Stretcher, Spectral Processor, Glitch, Granular
• Mastering: Limiter, Multiband Compressor, Exciter, Dither, Loudness Maximizer, Clipper
• Vintage: Analog emulations, Console emulations, Tape machines, Classic gear
• And literally ANY other audio plugin concept!

📋 FRAMEWORK: ${framework.toUpperCase()}
🎛️ TYPE: ${type}

CODE GENERATION REQUIREMENTS FOR JUCE:
\`\`\`cpp
class ${type === 'instrument' ? 'SynthProcessor' : type === 'effect' ? 'EffectProcessor' : 'UtilityProcessor'} : public juce::AudioProcessor {
public:
    ${type === 'instrument' ? 'SynthProcessor' : type === 'effect' ? 'EffectProcessor' : 'UtilityProcessor'}() {
        // Initialize ALL parameters with proper ranges, units, and defaults
        addParameter(new juce::AudioParameterFloat("param1", "Parameter Name", 
            juce::NormalisableRange<float>(min, max, step), default));
        // Add 6-12 musically useful parameters
    }
    
    void prepareToPlay(double sampleRate, int samplesPerBlock) override {
        // Initialize DSP state, allocate buffers, setup filters
    }
    
    void processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages) override {
        // IMPLEMENT COMPLETE DSP PROCESSING
        // - Handle MIDI for instruments
        // - Process audio with professional algorithms
        // - Add parameter smoothing
        // - Optimize for real-time (<3ms latency)
        // - Include proper gain staging
    }
    
    // Include ALL required JUCE methods with implementations
};
\`\`\`

🎛️ PARAMETER SPECIFICATIONS:
• Use proper audio units: Hz, dB, ms, %, semitones, MIDI notes
• Set musically useful ranges (e.g., cutoff: 20Hz-20kHz, resonance: 0-1)
• Add parameter smoothing to prevent clicks/pops
• Group related parameters (oscillator, filter, envelope, etc.)
• Provide musical default values that sound good immediately

🔧 DSP ALGORITHMS TO IMPLEMENT:
${type === 'instrument' ? `
• Oscillators: Band-limited waveforms (saw, square, sine, triangle)
• Filters: Moog ladder, state-variable, biquad
• Envelopes: ADSR with exponential curves
• Voice management: Polyphony, note stealing
• Modulation: LFO, envelope to parameters
• Effects: Chorus, reverb, delay
` : type === 'effect' ? `
• Audio processing: Filtering, dynamics, saturation
• Delay lines: Circular buffers, interpolation
• Reverb: All-pass chains, comb filters, early reflections
• Modulation: LFO, chorus, flanger algorithms
• Dynamics: Peak/RMS detection, gain reduction
• Saturation: Waveshaping, harmonic generation
` : `
• Analysis: FFT, spectrum, metering
• Visualization: Waveform, spectrum display
• Utility: Gain, pan, phase
• Metering: Peak, RMS, LUFS
`}

💎 CODE QUALITY STANDARDS:
✅ Complete implementations - NO placeholders or TODOs
✅ Professional variable naming (camelCase)
✅ Comprehensive inline comments explaining DSP concepts
✅ Optimized for real-time audio (no allocations in processBlock)
✅ Proper buffer handling and bounds checking
✅ Sample-rate independent processing
✅ Anti-aliasing where needed (oscillators, pitch shifting)
✅ Denormal protection (add small DC offset or flush-to-zero)
✅ Proper gain staging (avoid clipping, maintain headroom)
✅ Parameter smoothing for continuous controls
✅ MIDI handling for instruments (note on/off, velocity, pitchbend)

CRITICAL: Generate COMPLETE, PRODUCTION-READY code. Every method must be fully implemented. No "// TODO" or "// Implement this" comments. The plugin must compile and run immediately.

Return ONLY the complete C++ code. No markdown, no explanations, just pure compilable code.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Create a professional ${type} VST plugin:

DESCRIPTION: ${description}

REQUIREMENTS:
- Generate COMPLETE, production-ready C++ code
- Implement ALL DSP algorithms from scratch
- Include ALL parameter definitions (6-12 parameters)
- Add comprehensive parameter smoothing
- Include proper audio buffer handling
- Optimize for real-time performance (<3ms latency)
- Add detailed inline documentation
- Follow professional audio coding standards
- Make it sound professional and musical
- NO placeholders, NO TODOs - everything must be fully implemented

Generate the complete plugin code now!` 
          }
        ],
        max_tokens: 8000,
        temperature: 0.8
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedCode = data.choices[0].message.content;

    // Extract plugin name from description or generate one
    const words = description.split(' ').slice(0, 3);
    const pluginName = words.map((w: string) => 
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join(' ');

    console.log(`Successfully generated plugin: ${pluginName}`);

    return new Response(
      JSON.stringify({
        name: pluginName,
        code: generatedCode,
        type,
        framework,
        metadata: {
          author: 'AI Generated',
          version: '1.0.0',
          description: description,
          category: type === 'instrument' ? 'Synthesizers' : type === 'effect' ? 'Effects' : 'Utility',
          tags: ['ai-generated', type, framework]
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Plugin generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate plugin' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
