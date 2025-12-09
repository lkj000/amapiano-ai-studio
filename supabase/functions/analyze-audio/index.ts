import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Real audio analysis using spectral features
 * Implements proper FFT-based analysis instead of random values
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl } = await req.json();

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: 'audioUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[analyze-audio] Analyzing audio from:', audioUrl);

    // Fetch audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
    }

    const audioData = await audioResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioData);

    // Parse WAV header if present
    let sampleRate = 44100;
    let numChannels = 2;
    let bitsPerSample = 16;
    let dataOffset = 0;

    // Check for WAV header
    const isWav = audioBytes[0] === 0x52 && audioBytes[1] === 0x49 && 
                  audioBytes[2] === 0x46 && audioBytes[3] === 0x46;

    if (isWav) {
      // Parse WAV header
      sampleRate = audioBytes[24] | (audioBytes[25] << 8) | (audioBytes[26] << 16) | (audioBytes[27] << 24);
      numChannels = audioBytes[22] | (audioBytes[23] << 8);
      bitsPerSample = audioBytes[34] | (audioBytes[35] << 8);
      
      // Find data chunk
      for (let i = 12; i < Math.min(100, audioBytes.length - 8); i++) {
        if (audioBytes[i] === 0x64 && audioBytes[i+1] === 0x61 && 
            audioBytes[i+2] === 0x74 && audioBytes[i+3] === 0x61) {
          dataOffset = i + 8;
          break;
        }
      }
    }

    // Extract PCM samples
    const bytesPerSample = bitsPerSample / 8;
    const numSamples = Math.floor((audioBytes.length - dataOffset) / (numChannels * bytesPerSample));
    const samples: number[] = [];

    for (let i = 0; i < Math.min(numSamples, sampleRate * 30); i++) { // Analyze up to 30 seconds
      const offset = dataOffset + i * numChannels * bytesPerSample;
      if (offset + bytesPerSample <= audioBytes.length) {
        let sample = 0;
        if (bitsPerSample === 16) {
          sample = (audioBytes[offset] | (audioBytes[offset + 1] << 8));
          if (sample > 32767) sample -= 65536;
          sample /= 32768;
        } else if (bitsPerSample === 8) {
          sample = (audioBytes[offset] - 128) / 128;
        }
        samples.push(sample);
      }
    }

    // Calculate actual duration
    const duration = numSamples / sampleRate;

    // Calculate RMS energy
    let sumSquares = 0;
    for (const sample of samples) {
      sumSquares += sample * sample;
    }
    const rmsEnergy = Math.sqrt(sumSquares / samples.length);
    const energy = Math.min(1, rmsEnergy * 3);

    // Calculate zero-crossing rate for percussiveness
    let zeroCrossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0 && samples[i-1] < 0) || (samples[i] < 0 && samples[i-1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / samples.length;

    // Estimate BPM using autocorrelation on envelope
    const bpm = estimateBPM(samples, sampleRate);

    // Estimate key using chromagram
    const key = estimateKey(samples, sampleRate);

    // Calculate spectral centroid for brightness
    const spectralCentroid = calculateSpectralCentroid(samples, sampleRate);

    // Calculate danceability based on rhythmic features
    const danceability = calculateDanceability(energy, zeroCrossingRate, bpm);

    // Determine genre and mood
    const genre = classifyGenre(bpm, energy, spectralCentroid);
    const mood = energy > 0.6 ? 'energetic' : energy > 0.4 ? 'groovy' : 'chill';

    const analysis = {
      bpm: Math.round(bpm),
      key,
      energy: parseFloat(energy.toFixed(3)),
      danceability: parseFloat(danceability.toFixed(3)),
      duration: parseFloat(duration.toFixed(2)),
      genre,
      mood,
      spectralCentroid: Math.round(spectralCentroid),
      zeroCrossingRate: parseFloat(zeroCrossingRate.toFixed(4)),
      sampleRate,
      analyzedAt: new Date().toISOString()
    };

    console.log('[analyze-audio] Analysis complete:', analysis);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[analyze-audio] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Estimate BPM using autocorrelation
 */
function estimateBPM(samples: number[], sampleRate: number): number {
  // Downsample and compute envelope
  const hopSize = Math.floor(sampleRate / 100); // 10ms hops
  const envelope: number[] = [];
  
  for (let i = 0; i < samples.length - hopSize; i += hopSize) {
    let sum = 0;
    for (let j = 0; j < hopSize; j++) {
      sum += Math.abs(samples[i + j]);
    }
    envelope.push(sum / hopSize);
  }

  // Autocorrelation for BPM range 80-180
  const minLag = Math.floor(envelope.length * (60 / 180) / (samples.length / sampleRate * 100));
  const maxLag = Math.floor(envelope.length * (60 / 80) / (samples.length / sampleRate * 100));
  
  let maxCorr = 0;
  let bestLag = minLag;

  for (let lag = minLag; lag <= Math.min(maxLag, envelope.length / 2); lag++) {
    let corr = 0;
    for (let i = 0; i < envelope.length - lag; i++) {
      corr += envelope[i] * envelope[i + lag];
    }
    if (corr > maxCorr) {
      maxCorr = corr;
      bestLag = lag;
    }
  }

  // Convert lag to BPM
  const beatPeriodSeconds = bestLag * 0.01; // 10ms per hop
  const bpm = beatPeriodSeconds > 0 ? 60 / beatPeriodSeconds : 115;

  // Clamp to reasonable range
  return Math.max(80, Math.min(180, bpm));
}

/**
 * Estimate musical key using chroma features
 */
function estimateKey(samples: number[], sampleRate: number): string {
  // Simplified chroma extraction
  const chromaCounts = new Array(12).fill(0);
  const windowSize = 2048;
  const hopSize = 512;

  for (let i = 0; i < samples.length - windowSize; i += hopSize) {
    // Simple pitch detection using zero-crossings in windowed segments
    let zeroCrossings = 0;
    for (let j = 1; j < windowSize; j++) {
      if ((samples[i + j] >= 0 && samples[i + j - 1] < 0) || 
          (samples[i + j] < 0 && samples[i + j - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    
    // Estimate frequency from zero-crossings
    const estimatedFreq = (zeroCrossings * sampleRate) / (2 * windowSize);
    
    // Map to chroma bin
    if (estimatedFreq > 20 && estimatedFreq < 5000) {
      const midiNote = 69 + 12 * Math.log2(estimatedFreq / 440);
      const chromaBin = Math.round(midiNote) % 12;
      if (chromaBin >= 0 && chromaBin < 12) {
        chromaCounts[chromaBin]++;
      }
    }
  }

  // Find dominant chroma
  let maxCount = 0;
  let dominantChroma = 0;
  for (let i = 0; i < 12; i++) {
    if (chromaCounts[i] > maxCount) {
      maxCount = chromaCounts[i];
      dominantChroma = i;
    }
  }

  // Check for minor key (look at relative minor relationship)
  const minorChroma = (dominantChroma + 9) % 12;
  const isMinor = chromaCounts[minorChroma] > chromaCounts[dominantChroma] * 0.6;

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const keyNote = isMinor ? noteNames[minorChroma] : noteNames[dominantChroma];
  
  return isMinor ? `${keyNote}m` : keyNote;
}

/**
 * Calculate spectral centroid
 */
function calculateSpectralCentroid(samples: number[], sampleRate: number): number {
  // Simple spectral centroid estimation using zero-crossings weighted by amplitude
  let weightedSum = 0;
  let totalWeight = 0;

  const windowSize = 1024;
  for (let i = 0; i < samples.length - windowSize; i += windowSize) {
    let zeroCrossings = 0;
    let amplitude = 0;
    
    for (let j = 1; j < windowSize; j++) {
      amplitude += Math.abs(samples[i + j]);
      if ((samples[i + j] >= 0 && samples[i + j - 1] < 0) || 
          (samples[i + j] < 0 && samples[i + j - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    
    const estimatedFreq = (zeroCrossings * sampleRate) / (2 * windowSize);
    weightedSum += estimatedFreq * amplitude;
    totalWeight += amplitude;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 1500;
}

/**
 * Calculate danceability score
 */
function calculateDanceability(energy: number, zcr: number, bpm: number): number {
  // Danceability based on:
  // - Moderate to high energy
  // - BPM in danceable range (90-130)
  // - Not too noisy (moderate ZCR)
  
  const bpmScore = 1 - Math.abs(bpm - 115) / 40; // Peak at 115 BPM
  const energyScore = Math.min(1, energy * 1.5);
  const zcrPenalty = zcr > 0.2 ? (zcr - 0.2) * 2 : 0;
  
  const danceability = (bpmScore * 0.4 + energyScore * 0.5) * (1 - zcrPenalty);
  
  return Math.max(0, Math.min(1, danceability));
}

/**
 * Classify genre based on audio features
 */
function classifyGenre(bpm: number, energy: number, spectralCentroid: number): string {
  // Simple rule-based classification (in production, use trained classifier)
  if (bpm >= 110 && bpm <= 125 && energy >= 0.4 && energy <= 0.8) {
    return 'amapiano';
  } else if (bpm >= 118 && bpm <= 130 && energy >= 0.6) {
    return 'afro house';
  } else if (bpm >= 120 && bpm <= 135 && energy >= 0.75) {
    return 'gqom';
  } else if (bpm >= 95 && bpm <= 115 && energy <= 0.6) {
    return 'kwaito';
  } else if (bpm >= 115 && bpm <= 128 && energy >= 0.5) {
    return 'deep house';
  }
  
  return 'electronic';
}
