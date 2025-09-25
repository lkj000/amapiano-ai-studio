import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  context: string;
  culturalAdaptation?: boolean;
}

// Cultural translations for key amapiano terms
const CULTURAL_MAPPINGS = {
  zu: {
    // Zulu translations with cultural context
    'deep house': 'umculo ojulile',
    'log drums': 'izigubhu zesigodo',
    'piano chords': 'ama-chord epiyano',
    'saxophone': 'isaksofoni',
    'bass line': 'umugqa we-bass',
    'groove': 'ukudansa',
    'vibe': 'umoya',
    'township': 'ilokishi',
    'kasi': 'ekasi',
    'amapiano': 'amapiano'
  },
  xh: {
    // Xhosa translations with cultural context
    'deep house': 'umculo onzulu',
    'log drums': 'iingubo zomthi',
    'piano chords': 'iicord zepiyano',
    'saxophone': 'isaksofoni',
    'bass line': 'umgca we-bass',
    'groove': 'ukudanisa',
    'vibe': 'imvakalelo',
    'township': 'ilokishi', 
    'kasi': 'ekasi',
    'amapiano': 'amapiano'
  },
  st: {
    // Sotho translations with cultural context
    'deep house': 'mmino o tebileng',
    'log drums': 'meropa ya logong',
    'piano chords': 'li-chord tsa piano',
    'saxophone': 'saxophone',
    'bass line': 'mola wa bass',
    'groove': 'ho tantsha',
    'vibe': 'maikutlo',
    'township': 'motse',
    'kasi': 'kasi',
    'amapiano': 'amapiano'
  },
  en: {
    // South African English with local expressions
    'deep house': 'deep house',
    'log drums': 'log drums',
    'piano chords': 'piano chords',
    'saxophone': 'sax',
    'bass line': 'bassline',
    'groove': 'groove',
    'vibe': 'vibe',
    'township': 'township',
    'kasi': 'kasi',
    'amapiano': 'amapiano'
  }
};

const CULTURAL_CONTEXTS = {
  zu: {
    context: "Incorporate traditional Zulu musical elements and ubuntu philosophy",
    greetings: ["Sawubona", "Sanibonani"],
    expressions: ["Siyabonga", "Ngiyajabula", "Kulungile"]
  },
  xh: {
    context: "Include Xhosa cultural elements and storytelling traditions", 
    greetings: ["Molo", "Molweni"],
    expressions: ["Enkosi", "Ndiyavuya", "Kulungile"]
  },
  st: {
    context: "Incorporate Sotho musical traditions and community values",
    greetings: ["Dumela", "Dumelang"],
    expressions: ["Kea leboha", "Ke thabetse", "Ho lokile"]
  },
  en: {
    context: "Use South African English with local township expressions",
    greetings: ["Howzit", "Sharp"],
    expressions: ["Lekker", "Eish", "Now now", "Just now"]
  }
};

async function translateWithOpenAI(
  text: string, 
  sourceLanguage: string, 
  targetLanguage: string,
  context: string,
  culturalAdaptation: boolean = false
): Promise<string> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const languageNames = {
    'en': 'English (South African)',
    'zu': 'Zulu (isiZulu)',
    'xh': 'Xhosa (isiXhosa)', 
    'st': 'Sotho (Sesotho)'
  };

  const sourceLangName = languageNames[sourceLanguage as keyof typeof languageNames] || sourceLanguage;
  const targetLangName = languageNames[targetLanguage as keyof typeof languageNames] || targetLanguage;

  let systemPrompt = `You are a professional translator specializing in South African languages and amapiano music culture. 
  
  Translate from ${sourceLangName} to ${targetLangName}.
  
  Context: This is for ${context}, so maintain musical terminology appropriately.`;

  if (culturalAdaptation) {
    const culturalContext = CULTURAL_CONTEXTS[targetLanguage as keyof typeof CULTURAL_CONTEXTS];
    if (culturalContext) {
      systemPrompt += `\n\nCultural Adaptation: ${culturalContext.context}
      
      Use appropriate cultural expressions: ${culturalContext.expressions.join(', ')}
      
      When translating music-related terms, preserve the amapiano authenticity while making it culturally relevant.`;
    }
  }

  systemPrompt += `\n\nIMPORTANT: Keep amapiano music terms like "log drums", "deep house", "amapiano" recognizable across languages. Adapt meaning while preserving musical identity.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Translate this ${context} text: "${text}"` 
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();

  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

function applyCulturalMappings(text: string, targetLanguage: string): string {
  const mappings = CULTURAL_MAPPINGS[targetLanguage as keyof typeof CULTURAL_MAPPINGS];
  if (!mappings) return text;

  let translatedText = text.toLowerCase();
  
  for (const [english, translation] of Object.entries(mappings)) {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    translatedText = translatedText.replace(regex, translation);
  }

  return translatedText;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: TranslationRequest = await req.json();
    const { text, sourceLanguage, targetLanguage, context, culturalAdaptation = false } = body;

    if (!text || !sourceLanguage || !targetLanguage) {
      throw new Error('Missing required fields: text, sourceLanguage, targetLanguage');
    }

    console.log(`Translating from ${sourceLanguage} to ${targetLanguage}:`, text);

    // If source and target are the same, return original
    if (sourceLanguage === targetLanguage) {
      return new Response(JSON.stringify({ 
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        culturallyAdapted: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let translatedText: string;

    // For simple cultural mappings, use local mappings first
    if (culturalAdaptation && context === 'amapiano_music_prompt') {
      translatedText = applyCulturalMappings(text, targetLanguage);
      
      // If significant changes were made, also use AI translation for context
      if (translatedText !== text.toLowerCase()) {
        try {
          const aiTranslation = await translateWithOpenAI(
            text, sourceLanguage, targetLanguage, context, culturalAdaptation
          );
          // Combine cultural mappings with AI translation
          translatedText = applyCulturalMappings(aiTranslation, targetLanguage);
        } catch (aiError) {
          console.warn('AI translation failed, using cultural mappings only:', aiError);
        }
      } else {
        // No cultural mappings applied, use AI translation
        translatedText = await translateWithOpenAI(
          text, sourceLanguage, targetLanguage, context, culturalAdaptation
        );
      }
    } else {
      // Standard AI translation
      translatedText = await translateWithOpenAI(
        text, sourceLanguage, targetLanguage, context, culturalAdaptation
      );
    }

    console.log('Translation result:', translatedText);

    return new Response(JSON.stringify({
      translatedText,
      sourceLanguage,
      targetLanguage,
      culturallyAdapted: culturalAdaptation,
      context
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in multi-language-processor:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'TRANSLATION_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});