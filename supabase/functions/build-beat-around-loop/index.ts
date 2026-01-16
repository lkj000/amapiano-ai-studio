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
      const statusResponse = await fetch(`https://api.sunoapi.org/api/v1/query?taskId=${taskId}`, {
        headers: { 
          'Authorization': `Bearer ${SUNO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Task status error:', statusResponse.status, errorText);
        throw new Error(`Failed to get task status: ${statusResponse.status}`);
      }
      
      const statusData = await statusResponse.json();
      console.log('Task status response:', statusData);
      
      // Check if generation completed
      if (statusData.code === 200 && statusData.data) {
        const clips = statusData.data.clips || [];
        const completedClip = clips.find((c: any) => c.status === 'complete');
        
        if (completedClip && completedClip.audio_url) {
          return new Response(JSON.stringify({
            audioUrl: completedClip.audio_url,
            imageUrl: completedClip.image_url,
            metadata: {
              title: completedClip.title || `${loopName} - AI Beat`,
              duration: completedClip.duration || duration,
              bpm: bpm,
              key: key,
              genre: style,
            }
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        // Still processing
        const processingClip = clips.find((c: any) => c.status === 'submitted' || c.status === 'processing');
        if (processingClip) {
          return new Response(JSON.stringify({ 
            pending: true, 
            status: processingClip.status,
            taskId: taskId
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        // Check for failure
        const failedClip = clips.find((c: any) => c.status === 'error');
        if (failedClip) {
          throw new Error(failedClip.error_message || 'Generation failed');
        }
      }
      
      return new Response(JSON.stringify({ 
        pending: true, 
        status: 'processing' 
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

    // Call Suno API with audio input via add-instrumental endpoint
    const response = await fetch('https://api.sunoapi.org/api/v1/generate/add-instrumental', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadUrl: audioData, // Base64 audio data or URL
        title: loopName || 'AI Generated Beat',
        tags: `${style}, ${elements.join(', ')}`,
        negativeTags: '',
        model: 'V4_5PLUS',
        customMode: true,
        instrumental: !addVocals,
        prompt: fullPrompt,
        style: style,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Suno API error:', response.status, errorText);
      throw new Error(`Suno API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Suno API response:', data);

    // Handle sunoapi.org response format
    if (data.code === 200 && data.data?.taskId) {
      return new Response(JSON.stringify({
        pending: true,
        taskId: data.data.taskId,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Legacy task_id format
    if (data.task_id || data.taskId) {
      return new Response(JSON.stringify({
        pending: true,
        taskId: data.task_id || data.taskId,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Direct response with audio (rare case)
    if (data.audio_url || data.audioUrl) {
      return new Response(JSON.stringify({
        audioUrl: data.audio_url || data.audioUrl,
        imageUrl: data.image_url || data.imageUrl,
        metadata: {
          title: data.title || `${loopName} - AI Beat`,
          duration: data.duration || duration,
          bpm: data.bpm || bpm,
          key: data.key || key,
          genre: style,
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If API returned an error
    if (data.code && data.code !== 200) {
      throw new Error(data.msg || data.message || `API Error: ${data.code}`);
    }

    throw new Error('Unexpected API response format: ' + JSON.stringify(data));
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
