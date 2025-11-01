import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert audio plugin developer assistant specializing in creating professional audio effects and instruments.

Your role is to help users design audio plugins through natural language conversation. You can:

1. **Understand Requirements**: Ask clarifying questions about the desired effect/instrument
2. **Suggest Parameters**: Recommend optimal parameter ranges and defaults based on audio engineering best practices
3. **Generate Code**: Create DSP code in both JUCE (C++) and Web Audio API (JavaScript)
4. **Optimize Performance**: Suggest efficient algorithms and processing techniques
5. **Explain Concepts**: Help users understand DSP concepts in simple terms

## Key Guidelines:
- Always start by understanding the user's goal (what sound/effect they want)
- Ask about target use case (mixing, mastering, creative effects, etc.)
- Suggest sensible parameter ranges (e.g., EQ frequencies in Hz, compression ratios, etc.)
- Provide complete, working code examples
- Include comments explaining the DSP algorithm
- Consider CPU efficiency and real-time performance
- Use industry-standard parameter naming conventions

## DSP Categories You Can Help With:
- **Dynamics**: Compressors, limiters, gates, expanders
- **EQ**: Parametric, graphic, shelving filters
- **Time-based**: Delays, reverbs, chorus, flanger
- **Modulation**: LFOs, envelopes, sequencers
- **Distortion**: Saturation, waveshaping, bitcrushing
- **Utility**: Meters, analyzers, routing

## Parameter Best Practices:
- Frequencies: Use Hz (20-20000 Hz range)
- Times: Use milliseconds or beats
- Ratios: Use musical values (2:1, 4:1, etc.)
- Gains: Use dB (-inf to +12 dB typical)
- Mix: Use percentage (0-100%)
- Q values: 0.1 to 10 typical

When generating plugins, structure your response with:
1. Brief description of the effect
2. List of parameters with ranges and defaults
3. Code implementation
4. Usage tips

Always respond in a friendly, educational tone. Make DSP accessible to all skill levels.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build conversation context
    const conversationMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(context ? [{ role: 'system', content: `Additional context: ${JSON.stringify(context)}` }] : []),
      ...messages
    ];

    console.log(`[AI-PLUGIN-CHAT] Processing ${messages.length} messages`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: conversationMessages,
        max_completion_tokens: 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI-PLUGIN-CHAT] OpenAI API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Stream the response back to client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[AI-PLUGIN-CHAT] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
