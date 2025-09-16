import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RealtimeSession {
  id: string;
  socket: WebSocket;
  preferences: {
    sensitivity: number;
    voiceGuidance: boolean;
    autoApply: boolean;
    customPrompt?: string;
  };
  projectData?: any;
  lastActivity: number;
}

const activeSessions = new Map<string, RealtimeSession>();

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  const sessionId = crypto.randomUUID();
  
  console.log(`New realtime AI session: ${sessionId}`);

  socket.onopen = () => {
    console.log(`Realtime AI session ${sessionId} connected`);
    
    // Create session
    const session: RealtimeSession = {
      id: sessionId,
      socket,
      preferences: {
        sensitivity: 0.7,
        voiceGuidance: true,
        autoApply: false
      },
      lastActivity: Date.now()
    };
    
    activeSessions.set(sessionId, session);
    
    // Send welcome message
    socket.send(JSON.stringify({
      type: 'connected',
      sessionId,
      message: 'Realtime AI Assistant connected and ready!'
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      const session = activeSessions.get(sessionId);
      
      if (!session) return;
      
      session.lastActivity = Date.now();
      
      switch (message.type) {
        case 'init':
          session.preferences = { ...session.preferences, ...message.preferences };
          session.projectData = message.projectData;
          console.log(`Session ${sessionId} initialized with preferences:`, session.preferences);
          break;
          
        case 'context_update':
          session.projectData = message.context;
          await processContextUpdate(session, message.context);
          break;
          
        case 'latency_ping':
          socket.send(JSON.stringify({
            type: 'latency_ping',
            timestamp: message.timestamp
          }));
          break;
          
        default:
          console.log(`Unknown message type: ${message.type}`);
      }
      
    } catch (error) {
      console.error('Error processing message:', error);
    }
  };

  socket.onclose = () => {
    console.log(`Realtime AI session ${sessionId} disconnected`);
    activeSessions.delete(sessionId);
  };

  socket.onerror = (error) => {
    console.error(`WebSocket error for session ${sessionId}:`, error);
    activeSessions.delete(sessionId);
  };

  return response;
});

async function processContextUpdate(session: RealtimeSession, context: any) {
  try {
    // Analyze the current context and generate suggestions
    const suggestions = await generateRealtimeSuggestions(context, session.preferences);
    
    for (const suggestion of suggestions) {
      if (suggestion.confidence >= session.preferences.sensitivity) {
        session.socket.send(JSON.stringify({
          type: 'suggestion',
          suggestionType: suggestion.type,
          confidence: suggestion.confidence,
          text: suggestion.text,
          action: suggestion.action
        }));
        
        // Small delay between suggestions to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
  } catch (error) {
    console.error('Error processing context update:', error);
  }
}

async function generateRealtimeSuggestions(context: any, preferences: any) {
  const suggestions = [];
  
  if (!context || !context.tracks) return suggestions;
  
  // Analyze current tracks and generate contextual suggestions
  const tracks = context.tracks || [];
  const bpm = context.bpm || 118;
  const keySignature = context.keySignature || 'F#m';
  
  // Musical analysis suggestions
  const drumTracks = tracks.filter((t: any) => 
    t.name?.toLowerCase().includes('drum') || 
    t.name?.toLowerCase().includes('log') ||
    t.instrument?.toLowerCase().includes('drum')
  );
  
  const pianoTracks = tracks.filter((t: any) => 
    t.name?.toLowerCase().includes('piano') || 
    t.instrument?.toLowerCase().includes('piano')
  );
  
  const bassTracks = tracks.filter((t: any) => 
    t.name?.toLowerCase().includes('bass') || 
    t.instrument?.toLowerCase().includes('bass')
  );

  // Generate drum pattern suggestions
  if (drumTracks.length === 0) {
    suggestions.push({
      type: 'arrangement',
      confidence: 0.9,
      text: 'Your track needs a log drum foundation. Try adding a classic amapiano drum pattern.',
      action: {
        type: 'generate_track',
        prompt: `Generate a classic amapiano log drum pattern at ${bpm} BPM in ${keySignature}`,
        trackType: 'midi'
      }
    });
  }

  // Piano chord suggestions
  if (pianoTracks.length === 0) {
    suggestions.push({
      type: 'chord_change',
      confidence: 0.85,
      text: 'Add soulful piano chords to create the harmonic foundation.',
      action: {
        type: 'generate_track', 
        prompt: `Generate gospel-style amapiano piano chords in ${keySignature} at ${bpm} BPM`,
        trackType: 'midi'
      }
    });
  }

  // Bass line suggestions  
  if (bassTracks.length === 0 && drumTracks.length > 0) {
    suggestions.push({
      type: 'rhythm_sync',
      confidence: 0.8,
      text: 'Your drums need a deep bass line to lock in the groove.',
      action: {
        type: 'generate_track',
        prompt: `Generate a deep amapiano bass line in ${keySignature} that locks with the kick drum`,
        trackType: 'midi'
      }
    });
  }

  // BPM optimization
  if (bpm < 113 || bpm > 122) {
    suggestions.push({
      type: 'arrangement',
      confidence: 0.7,
      text: `Consider adjusting tempo to 118 BPM - the sweet spot for amapiano.`,
      action: {
        type: 'set_bpm',
        bpm: 118
      }
    });
  }

  // Key signature suggestions
  if (!['F#m', 'Am', 'Gm', 'Dm'].includes(keySignature)) {
    suggestions.push({
      type: 'chord_change',
      confidence: 0.65,
      text: 'F# minor is a popular key for amapiano - creates that soulful mood.',
      action: {
        type: 'set_key',
        key: 'F#m'
      }
    });
  }

  // Effect suggestions based on track count
  if (tracks.length > 2) {
    suggestions.push({
      type: 'effect_add',
      confidence: 0.6,
      text: 'Try adding reverb to create space and depth in your mix.',
      action: {
        type: 'add_effect',
        effectName: 'Reverb'
      }
    });
  }

  // Arrangement suggestions based on custom prompts
  if (preferences.customPrompt) {
    const prompt = preferences.customPrompt.toLowerCase();
    
    if (prompt.includes('log drum')) {
      suggestions.push({
        type: 'next_note',
        confidence: 0.75,
        text: 'Focus on the syncopated kick pattern - emphasize beats 1 and 3 with ghost notes.',
        action: {
          type: 'suggestion',
          message: 'Adjust drum pattern emphasis for authentic amapiano groove'
        }
      });
    }
    
    if (prompt.includes('jazz') || prompt.includes('chord')) {
      suggestions.push({
        type: 'chord_change',
        confidence: 0.8,
        text: 'Try adding 7th and 9th chord extensions for richer harmony.',
        action: {
          type: 'suggestion',
          message: 'Enhance chord progressions with jazz extensions'
        }
      });
    }
  }

  // Cultural authenticity suggestions
  if (Math.random() > 0.7) { // Occasional cultural tips
    const culturalTips = [
      'Remember amapiano\'s roots in South African house music - keep the groove soulful.',
      'Traditional amapiano builds gradually - let the energy develop naturally.',
      'The \'log drum\' sound comes from pitched percussion - experiment with different tunings.',
      'Amapiano vocals often use call-and-response patterns - great for adding human connection.'
    ];
    
    suggestions.push({
      type: 'arrangement',
      confidence: 0.55,
      text: culturalTips[Math.floor(Math.random() * culturalTips.length)],
      action: {
        type: 'suggestion',
        message: 'Cultural context and authenticity guidance'
      }
    });
  }

  return suggestions;
}

// Cleanup inactive sessions
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastActivity > timeout) {
      console.log(`Cleaning up inactive session: ${sessionId}`);
      session.socket.close();
      activeSessions.delete(sessionId);
    }
  }
}, 60000); // Check every minute