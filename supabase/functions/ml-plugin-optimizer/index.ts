import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    // Use GPT-5 to analyze code and provide optimization suggestions
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'system',
            content: `You are an expert audio DSP optimization engineer. Analyze the provided plugin code and suggest specific, actionable optimizations focusing on:
            
1. Performance: SIMD vectorization, memory allocation, cache efficiency
2. Quality: Anti-aliasing, DC blocking, oversampling opportunities
3. Architecture: Better patterns, modularity, maintainability
4. Parameters: Perceptual scaling, smoothing, value ranges

Provide concrete code examples for each suggestion. Be specific about the improvement impact (high/medium/low effort, high/medium/low impact).`
          },
          {
            role: 'user',
            content: `Analyze this audio plugin code and provide optimization suggestions:\n\n${pluginCode}`
          }
        ],
        max_completion_tokens: 2000,
      }),
    });

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
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
