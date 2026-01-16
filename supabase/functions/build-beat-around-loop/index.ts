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
    const { 
      audioData, 
      loopName, 
      loopType,
      style, 
      prompt, 
      bpm, 
      key, 
      duration,
      preserveLoop,
      blendAmount,
      addDrums,
      addBass,
      addMelody,
      addVocals,
      taskId 
    } = await req.json();

    console.log('Build beat request:', { loopName, loopType, style, bpm, key, duration });

    const SUNO_API_KEY = Deno.env.get('SUNO_API_KEY');
    
    // If polling for existing task (mock completion)
    if (taskId) {
      // Simulate task completion after polling
      return new Response(JSON.stringify({
        audioUrl: `https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3`,
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
        metadata: {
          title: `${loopName || 'Loop'} - AI Beat (${style})`,
          duration: duration || 180,
          bpm: bpm || 112,
          key: key || 'C Major',
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If no API key, use mock mode for demo
    if (!SUNO_API_KEY) {
      console.log('No SUNO_API_KEY found, using demo mode');
      
      // Build the generation prompt for logging
      const elements = [];
      if (addDrums) elements.push('drums');
      if (addBass) elements.push('bass');
      if (addMelody) elements.push('melody');
      if (addVocals) elements.push('vocals');

      console.log(`Generating ${style} beat with elements: ${elements.join(', ')}`);
      
      // Return a demo audio file immediately (no polling needed)
      const demoTracks = [
        'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
        'https://cdn.pixabay.com/download/audio/2023/07/27/audio_4e39b21f06.mp3?filename=summer-vibes-161034.mp3',
        'https://cdn.pixabay.com/download/audio/2022/03/24/audio_d1718ab41b.mp3?filename=please-calm-my-mind-125566.mp3',
      ];
      
      const randomTrack = demoTracks[Math.floor(Math.random() * demoTracks.length)];
      
      return new Response(JSON.stringify({
        audioUrl: randomTrack,
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
        metadata: {
          title: `${loopName || 'Loop'} - AI Beat (${style})`,
          duration: duration || 180,
          bpm: bpm || 112,
          key: key || 'C Major',
          genre: style,
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Real API call when SUNO_API_KEY is available
    const elements = [];
    if (addDrums) elements.push('powerful drums');
    if (addBass) elements.push('deep bassline');
    if (addMelody) elements.push('melodic elements');
    if (addVocals) elements.push('vocal hooks');

    const fullPrompt = `Build a complete ${style} beat around this ${loopType}. ${prompt}. Add ${elements.join(', ')}. BPM: ${bpm}. Key: ${key}. ${preserveLoop ? 'Preserve and highlight the original loop.' : 'Transform the loop creatively.'} Blend amount: ${blendAmount}%`;

    const response = await fetch('https://api.apibox.dev/suno/v2/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        style: style,
        duration: Math.min(duration, 240),
        audio_input: audioData,
        custom_mode: true,
        instrumental: !addVocals,
      }),
    });

    const data = await response.json();

    if (data.task_id) {
      return new Response(JSON.stringify({
        pending: true,
        taskId: data.task_id,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (data.audio_url) {
      return new Response(JSON.stringify({
        audioUrl: data.audio_url,
        imageUrl: data.image_url,
        metadata: {
          title: data.title || `${loopName} - AI Beat`,
          duration: data.duration || duration,
          bpm: data.bpm || bpm,
          key: data.key || key,
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error('Unexpected API response');
  } catch (error) {
    console.error('Build beat error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to build beat' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});