import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to process base64 audio in chunks
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

serve(async (req) => {
  console.log('=== Neural Music Generation Started ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!openAIApiKey || !lovableApiKey) {
      throw new Error('Required API keys not configured');
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, audioData, mode } = body;
    
    if (type !== 'voice_to_music' || !audioData) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: missing type or audioData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Step 1: Transcribing audio with Whisper...');
    
    // Transcribe audio using OpenAI Whisper
    const audioBuffer = base64ToArrayBuffer(audioData);
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      // Map OpenAI errors to meaningful HTTP statuses/messages
      let status = transcriptionResponse.status || 500;
      let message = 'Transcription failed';
      let code = 'TRANSCRIPTION_ERROR';
      try {
        const errText = await transcriptionResponse.text();
        try {
          const errJson = JSON.parse(errText);
          const openAiMsg = errJson?.error?.message || errText;
          const openAiCode = errJson?.error?.code || '';
          if (openAiCode === 'insufficient_quota') {
            status = 402; // Payment Required
            message = 'Transcription credits exhausted. Please add funds or reduce usage.';
            code = 'INSUFFICIENT_QUOTA';
          } else if (status === 429) {
            message = 'Rate limit exceeded. Please try again later.';
            code = 'RATE_LIMITED';
          } else {
            message = `Transcription failed: ${openAiMsg}`;
          }
        } catch {
          // Not JSON; pass through raw text
          message = `Transcription failed: ${errText}`;
        }
      } catch {
        // Fallback generic mapping
        message = 'Transcription failed due to an unexpected error';
      }

      return new Response(
        JSON.stringify({ error: message, code }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text: transcript } = await transcriptionResponse.json();
    console.log('Transcription:', transcript);

    console.log('Step 2: Generating music structure with Lovable AI...');
    
    // Use Lovable AI to generate musical structure
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a music composition AI. Analyze voice input and generate MIDI note data in Amapiano style.
Return ONLY valid JSON with this structure:
{
  "midiData": {
    "tracks": [{
      "name": "string",
      "instrument": "string",
      "notes": [{"id": "string", "pitch": number (0-127), "velocity": number (0-127), "startTime": number, "duration": number}]
    }]
  },
  "metadata": {
    "bpm": number,
    "key": "string",
    "genre": "Amapiano",
    "confidence": number
  }
}`
          },
          {
            role: 'user',
            content: `Mode: ${mode || 'melody'}
User said: "${transcript}"

Generate Amapiano music MIDI data based on this input. Create realistic note patterns with proper timing.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add funds to continue.');
      }
      throw new Error(`AI generation failed: ${await aiResponse.text()}`);
    }

    const aiResult = await aiResponse.json();
    const generatedContent = aiResult.choices?.[0]?.message?.content;
    
    if (!generatedContent) {
      throw new Error('No content generated from AI');
    }

    // Parse AI response
    let musicData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : generatedContent;
      musicData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedContent);
      throw new Error('Invalid AI response format');
    }

    console.log('Successfully generated music data');

    return new Response(JSON.stringify({
      transcript,
      audioUrl: "", // Frontend will synthesize audio
      ...musicData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});