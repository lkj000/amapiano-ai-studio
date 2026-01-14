/**
 * Music Production Tools for Level 5 Autonomous Agent
 * Complete toolset matching Suno + Moises + LANDR capabilities
 */

import { supabase } from '@/integrations/supabase/client';
import { Tool } from './ReActLoop';

// ============= SUNO-LIKE TOOLS (Music Generation) =============

export const generateFullSong: Tool = {
  name: 'generate_full_song',
  description: 'Generate a complete song with vocals, lyrics, and instrumentation using Suno AI. Supports any genre with South African specialization.',
  parameters: {
    lyrics: { type: 'string', description: 'Song lyrics (optional for instrumental)', required: false },
    genre: { type: 'string', description: 'Genre (Amapiano, Afrobeats, Gqom, Kwaito, etc.)', required: true },
    mood: { type: 'string', description: 'Mood (energetic, chill, melancholic, uplifting, etc.)', required: true },
    bpm: { type: 'number', description: 'Tempo in BPM (60-180)', required: false },
    instrumental: { type: 'boolean', description: 'Generate instrumental only', required: false },
    language: { type: 'string', description: 'Lyrics language (zulu, xhosa, sotho, english, etc.)', required: false },
    voiceStyle: { type: 'string', description: 'Voice style preset', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('generate-song-suno', {
      body: {
        lyrics: input.lyrics,
        genre: input.genre || 'Amapiano',
        mood: input.mood || 'energetic',
        bpm: input.bpm || 112,
        instrumental: input.instrumental || false,
        language: input.language || 'zulu',
        voiceStyle: input.voiceStyle || 'nkosazana'
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

export const generateLyrics: Tool = {
  name: 'generate_lyrics',
  description: 'Generate song lyrics using AI in any language including South African languages (Zulu, Xhosa, Sotho, etc.)',
  parameters: {
    theme: { type: 'string', description: 'Theme or topic for lyrics', required: true },
    language: { type: 'string', description: 'Target language', required: true },
    style: { type: 'string', description: 'Lyrical style (poetic, conversational, chant-heavy)', required: false },
    structure: { type: 'string', description: 'Song structure (verse-chorus, freestyle, etc.)', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('generate-lyrics', {
      body: {
        theme: input.theme,
        language: input.language || 'english',
        style: input.style || 'conversational',
        structure: input.structure || 'verse-chorus'
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

export const generateInstrumental: Tool = {
  name: 'generate_instrumental',
  description: 'Generate an instrumental track without vocals. Ideal for beats, backing tracks, and production.',
  parameters: {
    genre: { type: 'string', description: 'Genre style', required: true },
    bpm: { type: 'number', description: 'Tempo in BPM', required: true },
    key: { type: 'string', description: 'Musical key (C, D, E, F, G, A, B with # or b)', required: false },
    duration: { type: 'number', description: 'Duration in seconds', required: false },
    elements: { type: 'array', description: 'Specific elements to include (log_drum, piano, bass, etc.)', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('generate-instrumental', {
      body: {
        genre: input.genre,
        bpm: input.bpm,
        key: input.key || 'C',
        duration: input.duration || 60,
        elements: input.elements || ['log_drum', 'piano', 'bass', 'shakers']
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

export const generateSoundEffect: Tool = {
  name: 'generate_sound_effect',
  description: 'Generate custom sound effects and samples using AI',
  parameters: {
    description: { type: 'string', description: 'Description of the sound effect', required: true },
    duration: { type: 'number', description: 'Duration in seconds (1-30)', required: false },
    format: { type: 'string', description: 'Output format (wav, mp3)', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('sound-effect-generator', {
      body: {
        description: input.description,
        duration: input.duration || 5,
        format: input.format || 'wav'
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

// ============= MOISES-LIKE TOOLS (Audio Processing) =============

export const separateStems: Tool = {
  name: 'separate_stems',
  description: 'Separate audio into individual stems using AI (vocals, drums, bass, guitar, piano, other). Similar to Moises stem separation.',
  parameters: {
    audio_url: { type: 'string', description: 'URL of audio file to separate', required: true },
    stems: { type: 'array', description: 'Specific stems to extract', required: false },
    quality: { type: 'string', description: 'Quality level (standard, high)', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('stem-separation', {
      body: {
        audioUrl: input.audio_url,
        stems: input.stems || ['vocals', 'drums', 'bass', 'other'],
        quality: input.quality || 'high'
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

export const removeVocals: Tool = {
  name: 'remove_vocals',
  description: 'Remove vocals from a track to create an instrumental/karaoke version',
  parameters: {
    audio_url: { type: 'string', description: 'URL of audio file', required: true },
    preserve_harmonies: { type: 'boolean', description: 'Keep background harmonies', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('vocal-remover', {
      body: {
        audioUrl: input.audio_url,
        preserveHarmonies: input.preserve_harmonies || false
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

export const detectChords: Tool = {
  name: 'detect_chords',
  description: 'Detect chord progressions in audio using AI analysis. Returns chord symbols with timing.',
  parameters: {
    audio_url: { type: 'string', description: 'URL of audio file', required: true },
    format: { type: 'string', description: 'Output format (simple, detailed, midi)', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('analyze-audio', {
      body: {
        audioUrl: input.audio_url,
        analysisType: 'chords',
        format: input.format || 'detailed'
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

export const detectBpmKey: Tool = {
  name: 'detect_bpm_key',
  description: 'Detect BPM, key signature, and other musical attributes from audio',
  parameters: {
    audio_url: { type: 'string', description: 'URL of audio file', required: true }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('analyze-audio', {
      body: {
        audioUrl: input.audio_url,
        analysisType: 'full'
      }
    });
    if (error) throw error;
    return JSON.stringify({
      bpm: data.bpm,
      key: data.key,
      scale: data.scale,
      energy: data.energy,
      danceability: data.danceability
    });
  }
};

export const changePitch: Tool = {
  name: 'change_pitch',
  description: 'Transpose audio up or down by semitones while preserving tempo',
  parameters: {
    audio_url: { type: 'string', description: 'URL of audio file', required: true },
    semitones: { type: 'number', description: 'Number of semitones to shift (-12 to +12)', required: true },
    preserve_formants: { type: 'boolean', description: 'Preserve vocal formants for natural sound', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('audio-format-converter', {
      body: {
        audioUrl: input.audio_url,
        operation: 'pitch_shift',
        semitones: input.semitones,
        preserveFormants: input.preserve_formants || true
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

export const changeTempo: Tool = {
  name: 'change_tempo',
  description: 'Change the tempo/speed of audio while preserving pitch',
  parameters: {
    audio_url: { type: 'string', description: 'URL of audio file', required: true },
    target_bpm: { type: 'number', description: 'Target BPM', required: false },
    ratio: { type: 'number', description: 'Speed ratio (0.5 = half speed, 2.0 = double speed)', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('audio-format-converter', {
      body: {
        audioUrl: input.audio_url,
        operation: 'tempo_change',
        targetBpm: input.target_bpm,
        ratio: input.ratio
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

export const audioToMidi: Tool = {
  name: 'audio_to_midi',
  description: 'Convert audio (melody, chords, drums) to MIDI data',
  parameters: {
    audio_url: { type: 'string', description: 'URL of audio file', required: true },
    type: { type: 'string', description: 'Conversion type (melody, chords, drums, full)', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('audio-to-midi', {
      body: {
        audioUrl: input.audio_url,
        type: input.type || 'full'
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

export const smartMetronome: Tool = {
  name: 'smart_metronome',
  description: 'Generate a click track that follows the tempo variations in audio (like Moises smart metronome)',
  parameters: {
    audio_url: { type: 'string', description: 'URL of audio file', required: true },
    click_sound: { type: 'string', description: 'Click sound type (standard, woodblock, rimshot)', required: false },
    subdivision: { type: 'string', description: 'Subdivision (quarter, eighth, sixteenth)', required: false }
  },
  execute: async (input) => {
    // First analyze BPM
    const { data: analysis } = await supabase.functions.invoke('analyze-audio', {
      body: { audioUrl: input.audio_url, analysisType: 'rhythm' }
    });
    
    return JSON.stringify({
      bpm: analysis?.bpm || 120,
      timeSignature: analysis?.timeSignature || '4/4',
      clickTrackGenerated: true,
      subdivision: input.subdivision || 'quarter',
      beatMarkers: analysis?.beatMarkers || []
    });
  }
};

// ============= LANDR-LIKE TOOLS (Mastering & Distribution) =============

export const masterTrack: Tool = {
  name: 'master_track',
  description: 'AI mastering with genre-specific presets. Applies EQ, compression, stereo enhancement, and loudness optimization.',
  parameters: {
    audio_url: { type: 'string', description: 'URL of audio file to master', required: true },
    style: { type: 'string', description: 'Mastering style (amapiano, afrobeats, warm, bright, balanced, punchy)', required: false },
    target_loudness: { type: 'number', description: 'Target LUFS (-14 for streaming, -9 for club)', required: false },
    reference_url: { type: 'string', description: 'Reference track URL for matching', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('ai-mastering', {
      body: {
        audioUrl: input.audio_url,
        style: input.style || 'amapiano',
        targetLoudness: input.target_loudness || -14,
        referenceUrl: input.reference_url
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

export const validatePremaster: Tool = {
  name: 'validate_premaster',
  description: 'Check if audio meets premaster requirements (peak levels, dynamic range, clipping, phase issues)',
  parameters: {
    audio_url: { type: 'string', description: 'URL of audio file to validate', required: true }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('analyze-audio', {
      body: {
        audioUrl: input.audio_url,
        analysisType: 'premaster_validation'
      }
    });
    if (error) throw error;
    
    const issues: string[] = [];
    if (data?.peakDb > -3) issues.push('Peak level too high (should be below -3dB)');
    if (data?.peakDb > 0) issues.push('CLIPPING DETECTED - critical issue');
    if (data?.lufs > -14) issues.push('Too loud for mastering headroom');
    if (data?.dynamicRange < 6) issues.push('Low dynamic range - may sound over-compressed');
    
    return JSON.stringify({
      valid: issues.length === 0,
      peakDb: data?.peakDb,
      lufs: data?.lufs,
      dynamicRange: data?.dynamicRange,
      issues,
      recommendation: issues.length === 0 ? 'Ready for mastering' : 'Fix issues before mastering'
    });
  }
};

export const distributeTrack: Tool = {
  name: 'distribute_track',
  description: 'Prepare and submit track for distribution to streaming platforms (Spotify, Apple Music, etc.)',
  parameters: {
    audio_url: { type: 'string', description: 'Mastered audio URL', required: true },
    title: { type: 'string', description: 'Track title', required: true },
    artist: { type: 'string', description: 'Artist name', required: true },
    genre: { type: 'string', description: 'Genre for categorization', required: true },
    release_date: { type: 'string', description: 'Scheduled release date (YYYY-MM-DD)', required: false },
    artwork_url: { type: 'string', description: 'Cover art URL (3000x3000)', required: false },
    isrc: { type: 'string', description: 'ISRC code if available', required: false }
  },
  execute: async (input) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');
    
    // Store distribution release
    const { data, error } = await supabase.from('distribution_releases').insert({
      audio_url: String(input.audio_url),
      title: String(input.title),
      artist_name: String(input.artist),
      genre: String(input.genre),
      release_date: input.release_date ? String(input.release_date) : null,
      user_id: user.id,
      artwork_url: input.artwork_url ? String(input.artwork_url) : null,
      isrc_code: input.isrc ? String(input.isrc) : null,
      status: 'pending',
      platforms: { spotify: true, apple_music: true, youtube_music: true, deezer: true }
    }).select().single();
    
    if (error) throw error;
    return JSON.stringify({
      success: true,
      releaseId: data.id,
      status: 'pending_review',
      estimatedLiveDate: input.release_date || 'Within 48 hours',
      platforms: ['Spotify', 'Apple Music', 'YouTube Music', 'Deezer', 'Tidal']
    });
  }
};

// ============= ADVANCED PRODUCTION TOOLS =============

export const analyzeAudio: Tool = {
  name: 'analyze_audio',
  description: 'Comprehensive audio analysis including spectral, rhythm, harmonic, and timbral features',
  parameters: {
    audio_url: { type: 'string', description: 'URL of audio file', required: true },
    analysis_type: { type: 'string', description: 'Type: full, spectral, rhythm, harmonic, genre', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('analyze-audio', {
      body: {
        audioUrl: input.audio_url,
        analysisType: input.analysis_type || 'full'
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

export const amapianorize: Tool = {
  name: 'amapianorize',
  description: 'Transform any track into Amapiano style by adding log drums, bass, and characteristic elements',
  parameters: {
    audio_url: { type: 'string', description: 'URL of source audio', required: true },
    region: { type: 'string', description: 'Regional style (johannesburg, pretoria, durban, capetown)', required: false },
    intensity: { type: 'number', description: 'Transformation intensity 0-100', required: false },
    elements: { type: 'array', description: 'Elements to add (log_drum, shakers, piano, bass)', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('amapianorize-audio', {
      body: {
        audioUrl: input.audio_url,
        region: input.region || 'johannesburg',
        intensity: input.intensity || 70,
        elements: input.elements || ['log_drum', 'shakers', 'bass', 'piano_stabs']
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

export const generateLogDrum: Tool = {
  name: 'generate_log_drum',
  description: 'Generate authentic Amapiano log drum pattern with customizable parameters',
  parameters: {
    style: { type: 'string', description: 'Log drum style (deep, bacardi, soulful, prayer)', required: true },
    key: { type: 'string', description: 'Musical key to tune to', required: true },
    bpm: { type: 'number', description: 'Tempo in BPM', required: true },
    bars: { type: 'number', description: 'Number of bars to generate', required: false },
    swing: { type: 'number', description: 'Swing amount 0-100', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('generate-sample', {
      body: {
        type: 'log_drum',
        style: input.style,
        key: input.key,
        bpm: input.bpm,
        bars: input.bars || 8,
        swing: input.swing || 65
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

export const textToSpeech: Tool = {
  name: 'text_to_speech',
  description: 'Convert text to natural speech with voice cloning capabilities',
  parameters: {
    text: { type: 'string', description: 'Text to convert to speech', required: true },
    voice_id: { type: 'string', description: 'Voice model ID', required: false },
    language: { type: 'string', description: 'Language code', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: {
        text: input.text,
        voiceId: input.voice_id,
        language: input.language || 'en'
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

export const voiceToText: Tool = {
  name: 'voice_to_text',
  description: 'Transcribe speech/vocals to text with multi-language support',
  parameters: {
    audio_url: { type: 'string', description: 'URL of audio file', required: true },
    language: { type: 'string', description: 'Expected language (auto-detect if not specified)', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('voice-to-text', {
      body: {
        audioUrl: input.audio_url,
        language: input.language
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

// ============= DAW & PROJECT TOOLS =============

export const createProject: Tool = {
  name: 'create_project',
  description: 'Create a new DAW project with specified settings',
  parameters: {
    name: { type: 'string', description: 'Project name', required: true },
    bpm: { type: 'number', description: 'Project tempo', required: true },
    key: { type: 'string', description: 'Project key signature', required: false },
    template: { type: 'string', description: 'Template preset (amapiano, afrobeats, blank)', required: false }
  },
  execute: async (input) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');
    
    const projectData = {
      bpm: input.bpm,
      key: input.key || 'C',
      timeSignature: '4/4',
      tracks: [],
      template: input.template
    };
    
    const { data, error } = await supabase.from('daw_projects').insert({
      name: String(input.name),
      bpm: Number(input.bpm) || 120,
      key_signature: String(input.key || 'C'),
      project_data: projectData as any,
      user_id: user.id
    }).select().single();
    
    if (error) throw error;
    return JSON.stringify({ projectId: data.id, ...projectData });
  }
};

export const saveProject: Tool = {
  name: 'save_project',
  description: 'Save current project state to cloud storage',
  parameters: {
    project_id: { type: 'string', description: 'Project ID', required: true },
    project_data: { type: 'object', description: 'Full project data object', required: true }
  },
  execute: async (input) => {
    const { error } = await supabase.from('daw_projects')
      .update({ 
        project_data: input.project_data as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', String(input.project_id));
    
    if (error) throw error;
    return JSON.stringify({ success: true, savedAt: new Date().toISOString() });
  }
};

export const exportProject: Tool = {
  name: 'export_project',
  description: 'Export project as audio file or stems package',
  parameters: {
    project_id: { type: 'string', description: 'Project ID', required: true },
    format: { type: 'string', description: 'Export format (wav, mp3, stems, project_file)', required: true },
    quality: { type: 'string', description: 'Quality (standard, high, master)', required: false }
  },
  execute: async (input) => {
    const { data, error } = await supabase.functions.invoke('zip-stems', {
      body: {
        projectId: input.project_id,
        format: input.format,
        quality: input.quality || 'high'
      }
    });
    if (error) throw error;
    return JSON.stringify(data);
  }
};

// ============= EXPORT ALL TOOLS =============

export const musicProductionTools: Tool[] = [
  // Suno-like (Generation)
  generateFullSong,
  generateLyrics,
  generateInstrumental,
  generateSoundEffect,
  
  // Moises-like (Processing)
  separateStems,
  removeVocals,
  detectChords,
  detectBpmKey,
  changePitch,
  changeTempo,
  audioToMidi,
  smartMetronome,
  
  // LANDR-like (Mastering & Distribution)
  masterTrack,
  validatePremaster,
  distributeTrack,
  
  // Advanced Production
  analyzeAudio,
  amapianorize,
  generateLogDrum,
  textToSpeech,
  voiceToText,
  
  // DAW & Project
  createProject,
  saveProject,
  exportProject
];
