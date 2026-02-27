import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pluginCode, optimizationType } = await req.json();
    
    console.log(`[ML Optimizer] Analyzing plugin code (${pluginCode.length} chars)`);
    console.log(`[ML Optimizer] Optimization type: ${optimizationType || 'all'}`);

    // Use Lovable AI gateway (Gemini 2.5 Flash) or fall back to Anthropic Claude Haiku
    const systemPrompt = `You are an expert audio DSP optimization engineer. Analyze the provided plugin code and suggest specific, actionable optimizations focusing on:

1. Performance: SIMD vectorization, memory allocation, cache efficiency
2. Quality: Anti-aliasing, DC blocking, oversampling opportunities
3. Architecture: Better patterns, modularity, maintainability
4. Parameters: Perceptual scaling, smoothing, value ranges

Provide concrete code examples for each suggestion. Be specific about the improvement impact (high/medium/low effort, high/medium/low impact).`;

    const userMessage = `Analyze this audio plugin code and provide optimization suggestions:\n\n${pluginCode}`;

    let analysis: string;

    if (LOVABLE_API_KEY) {
      console.log('[ML Optimizer] Using Lovable AI gateway (google/gemini-2.5-flash)');
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
            { role: 'user', content: userMessage }
          ],
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Lovable AI gateway error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      analysis = data.choices[0].message.content;

    } else if (ANTHROPIC_API_KEY) {
      console.log('[ML Optimizer] Falling back to Anthropic Claude Haiku');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userMessage }
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      analysis = data.content[0].text;

    } else {
      throw new Error('No AI API key configured. Set LOVABLE_API_KEY or ANTHROPIC_API_KEY.');
    }
    
    // Parse AI response into structured suggestions
    const suggestions = parseOptimizationSuggestions(analysis);
    
    console.log(`[ML Optimizer] Generated ${suggestions.length} optimization suggestions`);

    return new Response(
      JSON.stringify({
        success: true,
        suggestions,
        rawAnalysis: analysis
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('[ML Optimizer] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function parseOptimizationSuggestions(analysis: string) {
  // Parse the AI response into structured suggestions
  const suggestions = [];
  
  // Look for optimization patterns in the response
  const sections = analysis.split(/\d+\.\s+/);
  
  for (const section of sections) {
    if (section.length < 50) continue;
    
    // Extract title (first line)
    const lines = section.trim().split('\n');
    const title = lines[0].replace(/[*#]/g, '').trim();
    
    // Determine type
    let type = 'architecture';
    if (/performance|simd|memory|cache|cpu/i.test(section)) {
      type = 'performance';
    } else if (/quality|audio|alias|dc|harmonic/i.test(section)) {
      type = 'quality';
    } else if (/parameter|smoothing|scaling/i.test(section)) {
      type = 'parameters';
    }
    
    // Determine impact
    let impact = 'medium';
    if (/high impact|significant|major improvement/i.test(section)) {
      impact = 'high';
    } else if (/low impact|minor|small improvement/i.test(section)) {
      impact = 'low';
    }
    
    // Determine effort
    let effort = 'medium';
    if (/easy|simple|quick|low effort/i.test(section)) {
      effort = 'low';
    } else if (/complex|difficult|time-consuming|high effort/i.test(section)) {
      effort = 'high';
    }
    
    // Extract code block if present
    const codeMatch = section.match(/```[\w]*\n([\s\S]*?)```/);
    const appliedCode = codeMatch ? codeMatch[1] : null;
    
    suggestions.push({
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      description: section.substring(title.length).trim(),
      impact,
      effort,
      appliedCode
    });
  }
  
  return suggestions;
}
