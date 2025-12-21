import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { theme, genre, mood, style, language } = await req.json();
    
    if (!theme) {
      throw new Error('Theme or story idea is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('[LYRICS] Generating lyrics for theme:', theme, 'language:', language || 'zulu');

    // Language mapping for prompts
    const languageNames: Record<string, string> = {
      zulu: 'isiZulu (South African Zulu)',
      xhosa: 'isiXhosa (South African Xhosa with click consonants)',
      sotho: 'Sesotho (Southern Sotho)',
      tswana: 'Setswana (Tswana)',
      pedi: 'Sepedi (Northern Sotho)',
      venda: 'Tshivenda (Venda)',
      tsonga: 'Xitsonga (Tsonga)',
      swati: 'siSwati (Swazi)',
      ndebele: 'isiNdebele (South African Ndebele)',
      afrikaans: 'Afrikaans',
      english: 'English',
      mixed: 'Mixed/Multilingual (code-switching between English and South African languages)',
    };

    const selectedLanguage = languageNames[language] || languageNames.zulu;

    const systemPrompt = `You are a professional songwriter and lyricist specializing in South African music. Generate creative, original song lyrics based on the user's theme or story idea.

Guidelines:
- Create complete song lyrics with verse, chorus, and bridge sections
- Use clear section markers like [Verse 1], [Chorus], [Verse 2], [Bridge]
- Match the requested genre and mood
- Write lyrics in the specified language with authentic expressions and idioms
- Make lyrics emotionally resonant and memorable
- Include rhyme schemes appropriate for the genre
- Keep verses 4-8 lines, choruses 4-6 lines
- Avoid clichés, be creative and unique
- For African languages, use proper spelling and grammar
- For mixed/multilingual, naturally code-switch between languages`;

    const userPrompt = `Create song lyrics for the following:
Theme/Story: ${theme}
Genre: ${genre || 'Amapiano'}
Mood: ${mood || 'uplifting'}
Style: ${style || 'contemporary'}
Language: ${selectedLanguage}

Generate TWO different versions of the lyrics - Version A and Version B. Each should have a unique take on the theme while maintaining the same structure (verses, chorus, bridge). Write the lyrics in ${selectedLanguage}.

Format your response as JSON with this structure:
{
  "versionA": {
    "title": "Song Title A",
    "lyrics": "Full lyrics with section markers"
  },
  "versionB": {
    "title": "Song Title B", 
    "lyrics": "Full lyrics with section markers"
  }
}`;

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('API credits exhausted. Please add credits.');
      }
      const errorText = await response.text();
      console.error('[LYRICS] API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No lyrics generated');
    }

    // Parse the JSON response
    let lyrics;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      lyrics = JSON.parse(jsonStr);
    } catch (parseError) {
      console.log('[LYRICS] Could not parse as JSON, returning raw content');
      // If parsing fails, return the raw content split into two versions
      const parts = content.split(/Version B|version b|VERSION B/i);
      lyrics = {
        versionA: {
          title: 'Version A',
          lyrics: parts[0]?.trim() || content
        },
        versionB: {
          title: 'Version B',
          lyrics: parts[1]?.trim() || 'Alternative version pending...'
        }
      };
    }

    console.log('[LYRICS] Successfully generated lyrics');

    return new Response(
      JSON.stringify({
        success: true,
        ...lyrics,
        metadata: {
          theme,
          genre: genre || 'Pop',
          mood: mood || 'uplifting',
          style: style || 'contemporary'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[LYRICS] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Lyrics generation failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
