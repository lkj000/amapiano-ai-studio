import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RealtimeSession {
  id: string;
  ws: WebSocket;
  preferences: {
    sensitivity: number;
    voiceGuidance: boolean;
    autoApply: boolean;
    customPrompt?: string;
  };
  projectData: any;
  lastActivity: number;
}

const activeSessions = new Map<string, RealtimeSession>();

serve((req) => {
  const upgrade = req.headers.get("upgrade") || "";
  
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 426 });
  }

  const { socket: ws, response } = Deno.upgradeWebSocket(req);
  const sessionId = crypto.randomUUID();
  
  console.log(`[REALTIME-AI] New connection: ${sessionId}`);

  ws.onopen = () => {
    console.log(`[REALTIME-AI] Session ${sessionId} opened`);
    
    activeSessions.set(sessionId, {
      id: sessionId,
      ws,
      preferences: {
        sensitivity: 0.7,
        voiceGuidance: false,
        autoApply: false
      },
      projectData: null,
      lastActivity: Date.now()
    });

    ws.send(JSON.stringify({
      type: 'session_created',
      sessionId,
      timestamp: Date.now()
    }));
  };

  ws.onmessage = async (event) => {
    try {
      const session = activeSessions.get(sessionId);
      if (!session) return;

      session.lastActivity = Date.now();
      const message = JSON.parse(event.data);
      
      console.log(`[REALTIME-AI] Message from ${sessionId}:`, message.type);

      switch (message.type) {
        case 'init':
          session.projectData = message.projectData;
          session.preferences = { ...session.preferences, ...message.preferences };
          
          ws.send(JSON.stringify({
            type: 'init_complete',
            message: 'AI Assistant ready to provide real-time guidance'
          }));
          break;

        case 'context_update':
          session.projectData = message.context;
          await processContextUpdate(session, message.context);
          break;

        case 'latency_ping':
          ws.send(JSON.stringify({
            type: 'latency_ping',
            timestamp: message.timestamp
          }));
          break;

        default:
          console.log(`[REALTIME-AI] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[REALTIME-AI] Message processing error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  ws.onclose = () => {
    console.log(`[REALTIME-AI] Session ${sessionId} closed`);
    activeSessions.delete(sessionId);
  };

  ws.onerror = (error) => {
    console.error(`[REALTIME-AI] Session ${sessionId} error:`, error);
    activeSessions.delete(sessionId);
  };

  return response;
});

async function processContextUpdate(session: RealtimeSession, context: unknown): Promise<void> {
  // Store context update in agent_memory table for session continuity
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  await supabaseClient.from('agent_memory').upsert({
    agent_id: session.id,
    memory_type: 'context_update',
    content: JSON.stringify(context),
    updated_at: new Date().toISOString()
  }, { onConflict: 'agent_id,memory_type' });
}

function generateRealtimeSuggestions(context: any, preferences: any) {
  const suggestions = [];
  const bpm = context?.bpm || 118;
  const keySignature = context?.keySignature || 'F#m';
  const tracks = context?.tracks || [];

  if (Math.random() > 0.7) {
    suggestions.push({
      type: 'chord_change',
      confidence: 0.75 + Math.random() * 0.2,
      text: `Try adding a ii-V-I progression in ${keySignature} for more harmonic movement`,
      action: {
        type: 'addChords',
        chords: ['Bm7', 'E7', 'AM7'],
        key: keySignature
      }
    });
  }

  if (tracks.length > 1 && Math.random() > 0.6) {
    suggestions.push({
      type: 'rhythm_sync',
      confidence: 0.8 + Math.random() * 0.15,
      text: `Sync percussion to ${bpm} BPM with syncopated ghost hits for authentic amapiano groove`,
      action: {
        type: 'adjustTiming',
        bpm,
        pattern: 'amapiano_syncopated'
      }
    });
  }

  if (Math.random() > 0.65) {
    suggestions.push({
      type: 'effect_add',
      confidence: 0.7 + Math.random() * 0.2,
      text: 'Add subtle reverb to piano for spatial depth while keeping vocals dry',
      action: {
        type: 'addEffect',
        effectName: 'reverb',
        targetTrack: 'piano',
        params: { mix: 0.25, decay: 2.5 }
      }
    });
  }

  if (tracks.length > 0 && Math.random() > 0.8) {
    suggestions.push({
      type: 'arrangement',
      confidence: 0.85 + Math.random() * 0.1,
      text: 'Build energy by gradually adding percussion layers every 16 bars',
      action: {
        type: 'arrangement',
        pattern: 'gradual_build',
        interval: 16
      }
    });
  }

  if (preferences.customPrompt && Math.random() > 0.75) {
    suggestions.push({
      type: 'chord_change',
      confidence: 0.8,
      text: `Based on your preference: ${preferences.customPrompt}`,
      action: {
        type: 'custom',
        prompt: preferences.customPrompt
      }
    });
  }

  return suggestions;
}

setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000;
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastActivity > timeout) {
      console.log(`[REALTIME-AI] Closing inactive session: ${sessionId}`);
      session.ws.close();
      activeSessions.delete(sessionId);
    }
  }
}, 60000);
