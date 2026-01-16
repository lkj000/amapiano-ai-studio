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

    console.log('Build beat request:', { loopName, loopType, style, bpm, key, duration, taskId });

    const SUNO_API_KEY = Deno.env.get('SUNO_API_KEY');
    if (!SUNO_API_KEY) {
      throw new Error('SUNO_API_KEY not configured. Please add the Suno API key in Edge Function secrets.');
    }

    // If polling for existing task
    if (taskId) {
      console.log('Polling task status:', taskId);
      const statusResponse = await fetch(`https://api.apibox.dev/suno/v2/task/${taskId}`, {
        headers: { 'Authorization': `Bearer ${SUNO_API_KEY}` }
      });
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Task status error:', statusResponse.status, errorText);
        throw new Error(`Failed to get task status: ${statusResponse.status}`);
      }
      
      const statusData = await statusResponse.json();
      console.log('Task status response:', statusData);
      
      if (statusData.status === 'completed' && statusData.data?.audio_url) {
        return new Response(JSON.stringify({
          audioUrl: statusData.data.audio_url,
          imageUrl: statusData.data.image_url,
          metadata: {
            title: statusData.data.title || `${loopName} - AI Beat`,
            duration: statusData.data.duration || duration,
            bpm: statusData.data.bpm || bpm,
            key: statusData.data.key || key,
          }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      if (statusData.status === 'failed') {
        throw new Error(statusData.error || 'Generation failed');
      }
      
      return new Response(JSON.stringify({ 
        pending: true, 
        status: statusData.status 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build the generation prompt
    const elements = [];
    if (addDrums) elements.push('powerful drums');
    if (addBass) elements.push('deep bassline');
    if (addMelody) elements.push('melodic elements');
    if (addVocals) elements.push('vocal hooks');

    const fullPrompt = `Build a complete ${style} beat around this ${loopType}. ${prompt || ''}. Add ${elements.join(', ')}. BPM: ${bpm}. Key: ${key}. ${preserveLoop ? 'Preserve and highlight the original loop.' : 'Transform the loop creatively.'} Blend amount: ${blendAmount}%`;

    console.log('Generation prompt:', fullPrompt);

    // Call Suno API with audio input
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Suno API error:', response.status, errorText);
      throw new Error(`Suno API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Suno API response:', data);

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

    throw new Error('Unexpected API response format');
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
