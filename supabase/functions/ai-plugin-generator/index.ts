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

    const systemPrompt = `You are an expert VST plugin developer specializing in ${framework.toUpperCase()} framework.
Your expertise covers ALL plugin types: synthesizers, samplers, effects, dynamics, modulation, filters, mastering tools, vintage emulations, creative processors, and MIDI effects.

Generate a complete, production-ready, professional-grade VST plugin based on the description.

CRITICAL REQUIREMENTS:
- Framework: ${framework}
- Plugin Type: ${type}
- Include proper parameter definitions using addParameter() with juce::AudioParameterFloat
- Implement complete processBlock() with professional DSP algorithms
- Use industry-standard audio processing techniques
- Add detailed comments explaining the DSP concepts
- For JUCE: use juce::AudioProcessor, juce::dsp classes, proper buffer handling
- For instruments: handle MIDI input, note-on/off, velocity, pitch bend
- For effects: process audio buffer with proper gain compensation
- Include 6-12 meaningful parameters with musically useful ranges
- Add proper smoothing for parameter changes to avoid clicks
- Use appropriate data types (float for continuous, int for discrete, bool for switches)
- Implement efficient processing (use SIMD when appropriate)

PLUGIN-SPECIFIC REQUIREMENTS:
${type === 'instrument' ? `
- Handle MIDI events (note on/off, velocity, pitch bend, modulation)
- Implement polyphony if appropriate
- Include envelope generators (ADSR)
- Add oscillators with anti-aliasing
- Implement proper voice management
` : type === 'effect' ? `
- Process audio buffers efficiently
- Implement proper wet/dry mixing
- Add input/output gain controls
- Handle stereo processing correctly
- Consider latency compensation if needed
` : `
- Implement utility functionality
- Include visualization if appropriate
- Add analysis features
- Provide clear metering
`}

Return ONLY the complete, compilable C++ code. No explanations, no markdown formatting.`;

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
          { role: 'user', content: description }
        ],
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
