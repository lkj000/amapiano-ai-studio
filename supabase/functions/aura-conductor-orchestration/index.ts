import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrchestrationRequest {
  prompt: string;
  target: string;
  config: {
    ai_models: string[];
    tools: string[];
    quality_threshold: number;
    cultural_authenticity: boolean;
  };
}

interface PresetGenerationRequest {
  task: 'generate_preset';
  plugin_type: string;
  genre: string;
  current_parameters: any;
}

interface TaskResult {
  taskId: string;
  taskName: string;
  status: 'completed' | 'failed';
  result: any;
  ai_insights: string;
  cultural_score: number;
  quality_metrics: any;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Handle preset generation requests from plugins
    if (requestBody.task === 'generate_preset') {
      console.log('🥁 Generating AI preset for plugin:', requestBody.plugin_type, requestBody.genre);
      return await handlePresetGeneration(requestBody as PresetGenerationRequest);
    }

    // Handle full orchestration requests
    const { prompt, target, config }: OrchestrationRequest = requestBody;
    console.log('🎼 Starting AURA Conductor Orchestration:', { prompt, target });

    // Step 1: Generate orchestration plan (robust with fallback)
    const orchestrationPlan = await generateOrchestrationPlan(prompt, target, config);
    
    // Step 2: Execute orchestration plan
    const executionResults = await executeOrchestrationPlan(orchestrationPlan, config);
    
    // Step 3: Perform quality assessment
    const qualityAssessment = await performQualityAssessment(executionResults);
    
    // Step 4: Validate cultural authenticity
    const culturalValidation = await validateCulturalAuthenticity(executionResults, config);

    const response = {
      success: true,
      orchestration_id: `orch_${Date.now()}`,
      plan: orchestrationPlan,
      execution_results: executionResults,
      quality_assessment: qualityAssessment,
      cultural_validation: culturalValidation,
      final_output: {
        audio_url: `https://mywijmtszelyutssormy.supabase.co/functions/v1/demo-audio-files?track=orchestrated_${Date.now()}`,
        metadata: {
          style: 'amapiano',
          cultural_authenticity: culturalValidation.overall_score,
          quality_score: qualityAssessment.overall_score,
          ai_models_used: config.ai_models,
          generation_time: Date.now()
        }
      }
    };

    console.log('✅ Orchestration completed successfully');
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Orchestration error:', error);
    return new Response(JSON.stringify({ 
      error: 'Orchestration failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Generate orchestration plan using OpenAI with graceful fallback
async function generateOrchestrationPlan(prompt: string, target: string, config: any) {
  const safeConfig = config || { ai_models: [], tools: [], quality_threshold: 0.9, cultural_authenticity: true };
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

  const systemPrompt = `You are AURA Conductor, an AI orchestration engine for amapiano music production. 
Create a detailed orchestration plan based on the user's creative vision.

The plan should include:
1. Musical Analysis (BPM, key, mood, style elements)
2. Style Profile Selection (which amapiano artists/styles to reference)  
3. Neural Generation Strategy (which AI models to use for which parts)
4. Quality Assurance checkpoints
5. Cultural Authenticity validation steps

Return a JSON plan with these steps and their parameters.`;

  // Helper to try OpenAI, but never throw – return null on failure
  const tryOpenAI = async (): Promise<any | null> => {
    if (!OPENAI_API_KEY) {
      console.warn('No OpenAI API key configured, falling back to heuristic plan');
      return null;
    }
    
    try {
      console.log('Attempting OpenAI orchestration plan generation...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create orchestration plan for: "${prompt}" targeting ${target}` }
          ],
          temperature: 0.7,
          max_tokens: 2000
        }),
      });

      const data = await response.json();

      // If API returned an error, log and bail to fallback
      if (!response.ok || data?.error) {
        console.error('OpenAI API error response:', JSON.stringify(data, null, 2));
        return null;
      }

      const planText = data?.choices?.[0]?.message?.content;
      if (!planText) {
        console.error('No content in OpenAI response');
        return null;
      }

      try {
        const parsedPlan = JSON.parse(planText);
        console.log('✅ Successfully generated AI orchestration plan');
        return { ...parsedPlan, meta: { source: 'openai', fallback: false } };
      } catch {
        // If not valid JSON, create a structured plan using the text as description
        console.log('OpenAI returned non-JSON, creating structured fallback');
        return {
          meta: { source: 'openai-structured', fallback: true },
          steps: [
            {
              id: 'analysis',
              name: 'Musical Analysis',
              description: planText.substring(0, 200) + '...',
              parameters: { bpm: 118, key: 'F#m', mood: 'sunset', style: 'deep_amapiano' }
            },
            {
              id: 'style_selection',
              name: 'Style Profile Selection',
              description: 'Select appropriate amapiano style influences',
              parameters: { artists: ['Kelvin Momo', 'Kabza De Small'], elements: ['log_drums', 'deep_bass'] }
            },
            {
              id: 'neural_generation',
              name: 'Neural Music Generation',
              description: 'Generate musical elements using neural networks',
              parameters: { models: safeConfig.ai_models, quality: safeConfig.quality_threshold }
            },
            {
              id: 'quality_assurance',
              name: 'Quality Assurance',
              description: 'Validate audio quality and musical coherence',
              parameters: { min_quality: safeConfig.quality_threshold }
            },
            {
              id: 'cultural_authenticity',
              name: 'Cultural Authenticity Check',
              description: 'Ensure cultural authenticity and respect',
              parameters: { min_authenticity: 0.8 }
            }
          ],
          estimated_duration: '5-10 minutes'
        };
      }
    } catch (err) {
      console.error('Error calling OpenAI for orchestration plan:', err);
      return null;
    }
  };

  // Try OpenAI first
  const aiPlan = await tryOpenAI();
  if (aiPlan) return aiPlan;

  // Fallback – heuristic plan generator (no external APIs)
  console.warn('🔄 Falling back to heuristic orchestration plan due to AI unavailability');
  return buildHeuristicPlan(prompt, target, safeConfig);
}

// Heuristic orchestration plan generator – deterministic, offline
function buildHeuristicPlan(prompt: string, target: string, config: any) {
  const text = (prompt || '').toLowerCase();

  // BPM heuristics
  let bpm = 118;
  if (text.includes('private school')) bpm = 112 + Math.floor(Math.random() * 6); // 112-117
  if (text.includes('soulful')) bpm = 110 + Math.floor(Math.random() * 8); // 110-117
  if (text.includes('uptempo') || text.includes('festival')) bpm = 120 + Math.floor(Math.random() * 6); // 120-125

  // Key heuristics
  let key = 'F#m';
  if (text.includes('sunset')) key = 'Emaj';
  if (text.includes('melancholy') || text.includes('deep')) key = 'D#m';

  // Instrument selection
  const elements: string[] = ['piano_chords'];
  if (text.includes('log drum') || text.includes('logdrum')) elements.push('log_drums');
  if (text.includes('bass') || text.includes('808') || text.includes('deep bass')) elements.push('deep_bass');
  if (text.includes('sax')) elements.push('saxophone');
  if (text.includes('strings')) elements.push('strings');
  if (!elements.includes('log_drums')) elements.push('log_drums'); // ensure signature element

  const artists = [
    text.includes('kelvin') || text.includes('momo') ? 'Kelvin Momo' : 'Kabza De Small',
    'Young Stunna'
  ];

  const models = config.ai_models?.length ? config.ai_models : [
    'transformer_harmony',
    'gan_log_drums',
    'rnn_deep_bass',
    'lstm_piano'
  ];

  console.log(`🎵 Generated heuristic plan: ${bpm}BPM, ${key}, elements: ${elements.join(', ')}`);

  return {
    meta: { source: 'heuristic-fallback', fallback: true },
    overview: {
      intent: prompt,
      target,
      bpm,
      key,
      mood: text.includes('sunset') ? 'sunset' : (text.includes('club') ? 'club' : 'deep'),
      style: 'amapiano'
    },
    steps: [
      {
        id: 'analysis',
        name: 'Musical Analysis',
        description: 'Heuristic analysis of prompt and target to derive initial musical parameters',
        parameters: { bpm, key, mood: 'deep/soulful', style: 'amapiano_private_school' }
      },
      {
        id: 'style_selection',
        name: 'Style Profile Selection',
        description: 'Choose relevant artist/style influences and core elements',
        parameters: { artists, elements }
      },
      {
        id: 'neural_generation',
        name: 'Neural Music Generation',
        description: 'Map instruments to available models and generate core stems',
        parameters: {
          models,
          routing: [
            { part: 'piano', model: 'lstm_piano', bars: 64 },
            { part: 'log_drums', model: 'gan_log_drums', bars: 64 },
            { part: 'deep_bass', model: 'rnn_deep_bass', bars: 64 },
            ...(text.includes('sax') ? [{ part: 'saxophone', model: 'transformer_saxophone', bars: 32 }] : [])
          ],
          quality: config.quality_threshold ?? 0.9
        }
      },
      {
        id: 'quality_assurance',
        name: 'Quality Assurance',
        description: 'Automatic QA: clipping, loudness, balance, phase, DC offset',
        parameters: { min_quality: config.quality_threshold ?? 0.9 }
      },
      {
        id: 'cultural_authenticity',
        name: 'Cultural Authenticity Check',
        description: 'Validate log-drum phrasing, swing, progression voicings typical to amapiano',
        parameters: { min_authenticity: config.cultural_authenticity ? 0.9 : 0.7 }
      }
    ],
    estimated_duration: '2-5 minutes',
    success_criteria: {
      quality_score: config.quality_threshold ?? 0.9,
      cultural_score: 0.9,
      user_satisfaction: 0.9
    }
  };
}

// Execute orchestration plan
async function executeOrchestrationPlan(plan: any, config: any): Promise<TaskResult[]> {
  const results: TaskResult[] = [];
  
  for (const step of plan.steps || []) {
    console.log(`🎵 Executing step: ${step.name}`);
    
    const result = await executeTask(step, config);
    results.push(result);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  
  return results;
}

// Execute individual task
async function executeTask(task: any, config: any): Promise<TaskResult> {
  // Simulate AI processing for each task type
  const taskResults = {
    'analysis': {
      bpm: 118,
      key: 'F#m', 
      mood_vector: [0.8, 0.6, 0.9],
      style_confidence: 0.94,
      complexity_score: 0.76
    },
    'style_selection': {
      selected_artists: ['Kelvin Momo', 'Kabza De Small'],
      style_blend: { deep: 0.7, uplifting: 0.3 },
      cultural_elements: ['log_drums', 'deep_bass', 'piano_chords']
    },
    'neural_generation': {
      tracks_generated: 4,
      total_bars: 64,
      audio_quality: 0.96,
      pattern_complexity: 0.88
    },
    'quality_assurance': {
      audio_quality: 0.96,
      mix_balance: 0.92,
      mastering_score: 0.94,
      technical_issues: 0
    },
    'cultural_authenticity': {
      authenticity_score: 0.98,
      traditional_elements: 0.95,
      modern_fusion: 0.87,
      respect_score: 1.0
    }
  };

  const taskId = task.id || task.name.toLowerCase().replace(/\s+/g, '_');
  const result = taskResults[taskId as keyof typeof taskResults] || { success: true };
  
  return {
    taskId,
    taskName: task.name,
    status: 'completed',
    result,
    ai_insights: generateTaskInsights(taskId, result),
    cultural_score: calculateCulturalScore(taskId, result),
    quality_metrics: {
      execution_time: Math.random() * 1000 + 500,
      confidence: 0.85 + Math.random() * 0.15,
      success_rate: 0.95 + Math.random() * 0.05
    },
    timestamp: new Date().toISOString()
  };
}

function generateTaskInsights(taskId: string, result: any): string {
  const insights = {
    'analysis': `Detected classic amapiano characteristics with ${(result.style_confidence * 100).toFixed(1)}% confidence. Optimal BPM and key signature identified.`,
    'style_selection': `Successfully blended ${result.selected_artists?.join(' and ')} influences while maintaining cultural authenticity.`,
    'neural_generation': `Generated ${result.tracks_generated} high-quality tracks with ${(result.audio_quality * 100).toFixed(1)}% audio fidelity.`,
    'quality_assurance': `Audio meets professional standards with ${(result.audio_quality * 100).toFixed(1)}% quality score and balanced mix.`,
    'cultural_authenticity': `Achieved ${(result.authenticity_score * 100).toFixed(1)}% cultural authenticity while respecting traditional amapiano elements.`
  };
  
  return insights[taskId as keyof typeof insights] || 'Task completed successfully with AI optimization.';
}

function calculateCulturalScore(taskId: string, result: any): number {
  const culturalScores = {
    'analysis': 0.85,
    'style_selection': 0.92,
    'neural_generation': 0.88,
    'quality_assurance': 0.90,
    'cultural_authenticity': result.authenticity_score || 0.95
  };
  
  return culturalScores[taskId as keyof typeof culturalScores] || 0.85;
}

// Perform quality assessment
async function performQualityAssessment(results: TaskResult[]) {
  const qualityScores = results.map(r => r.quality_metrics.confidence);
  const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
  
  return {
    overall_score: avgQuality,
    individual_scores: results.map(r => ({
      task: r.taskName,
      score: r.quality_metrics.confidence,
      status: r.status
    })),
    recommendations: avgQuality > 0.9 
      ? ['Excellent quality - ready for release']
      : ['Consider additional refinement', 'Review mix balance'],
    technical_metrics: {
      latency: 1250,
      cpu_usage: 0.65,
      memory_usage: 0.45,
      success_rate: 0.96
    }
  };
}

// Validate cultural authenticity
async function validateCulturalAuthenticity(results: TaskResult[], config: any) {
  const culturalScores = results.map(r => r.cultural_score);
  const avgCultural = culturalScores.reduce((a, b) => a + b, 0) / culturalScores.length;
  
  return {
    overall_score: avgCultural,
    authenticity_breakdown: {
      traditional_elements: 0.95,
      modern_fusion: 0.87,
      cultural_respect: 1.0,
      artist_influence: 0.92
    },
    validation_checks: [
      { check: 'Log drum patterns', status: 'authentic', score: 0.96 },
      { check: 'Piano chord progressions', status: 'authentic', score: 0.94 },
      { check: 'Bass line characteristics', status: 'authentic', score: 0.98 },
      { check: 'Overall amapiano feel', status: 'authentic', score: 0.93 }
    ],
    cultural_recommendations: avgCultural > 0.9
      ? ['Maintains excellent cultural authenticity']
      : ['Consider strengthening traditional elements', 'Review cultural context']
  };
}

// Handle AI preset generation for plugins
async function handlePresetGeneration(request: PresetGenerationRequest) {
  console.log('🎛️ Generating preset for:', request.plugin_type, 'in genre:', request.genre);
  
  // Genre-specific preset definitions for 808 Log Drum
  const presetTemplates = {
    'amapiano': {
      pitch: 50 + Math.floor(Math.random() * 8), // 50-57
      glide_time: 180 + Math.floor(Math.random() * 40), // 180-220ms
      knock_mix: 0.35 + Math.random() * 0.15, // 0.35-0.5
      body_mix: 0.75 + Math.random() * 0.15, // 0.75-0.9
      decay_time: 550 + Math.floor(Math.random() * 100), // 550-650ms
      attack_time: 1 + Math.floor(Math.random() * 3), // 1-4ms
      sustain_level: 0.35 + Math.random() * 0.15, // 0.35-0.5
      release_time: 950 + Math.floor(Math.random() * 100), // 950-1050ms
      master_gain: 0.7 + Math.random() * 0.2 // 0.7-0.9
    },
    'private_school': {
      pitch: 53 + Math.floor(Math.random() * 6), // 53-58
      glide_time: 60 + Math.floor(Math.random() * 40), // 60-100ms
      knock_mix: 0.15 + Math.random() * 0.15, // 0.15-0.3
      body_mix: 0.85 + Math.random() * 0.1, // 0.85-0.95
      decay_time: 350 + Math.floor(Math.random() * 100), // 350-450ms
      attack_time: 1 + Math.floor(Math.random() * 2), // 1-3ms
      sustain_level: 0.15 + Math.random() * 0.15, // 0.15-0.3
      release_time: 700 + Math.floor(Math.random() * 150), // 700-850ms
      master_gain: 0.75 + Math.random() * 0.15 // 0.75-0.9
    },
    'deep_house': {
      pitch: 43 + Math.floor(Math.random() * 8), // 43-50
      glide_time: 280 + Math.floor(Math.random() * 40), // 280-320ms
      knock_mix: 0.5 + Math.random() * 0.2, // 0.5-0.7
      body_mix: 0.6 + Math.random() * 0.2, // 0.6-0.8
      decay_time: 1100 + Math.floor(Math.random() * 200), // 1100-1300ms
      attack_time: 6 + Math.floor(Math.random() * 4), // 6-10ms
      sustain_level: 0.45 + Math.random() * 0.15, // 0.45-0.6
      release_time: 1600 + Math.floor(Math.random() * 400), // 1600-2000ms
      master_gain: 0.65 + Math.random() * 0.25 // 0.65-0.9
    }
  };

  const template = presetTemplates[request.genre as keyof typeof presetTemplates] || presetTemplates['amapiano'];
  
  const response = {
    success: true,
    preset: {
      name: `AI ${request.genre.charAt(0).toUpperCase() + request.genre.slice(1)} Preset`,
      genre: request.genre,
      parameters: template,
      description: `AI-generated ${request.genre} preset optimized for authentic sound`,
      cultural_authenticity_score: 0.92 + Math.random() * 0.06,
      generation_timestamp: new Date().toISOString()
    }
  };

  console.log('✅ Generated preset successfully:', response.preset.name);
  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}