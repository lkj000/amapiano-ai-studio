// Real-time DSP Audio Processor
// This AudioWorklet processes audio using actual DSP algorithms

class DSPProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.sampleRate = sampleRate;
    this.parameters = options.processorOptions?.parameters || {};
    this.pluginType = options.processorOptions?.pluginType || 'effect';
    
    // Initialize DSP state
    this.filters = [];
    this.delays = [];
    this.lfos = [];
    
    // DC blocker coefficients
    this.dcBlockerX1 = 0;
    this.dcBlockerY1 = 0;
    
    // Message handler for parameter updates
    this.port.onmessage = (event) => {
      if (event.data.type === 'setParameter') {
        this.parameters[event.data.id] = event.data.value;
      }
    };
    
    console.log('[DSP Processor] Initialized', {
      sampleRate: this.sampleRate,
      pluginType: this.pluginType,
      parameters: Object.keys(this.parameters)
    });
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0]) {
      return true;
    }
    
    const inputChannel = input[0];
    const outputChannel = output[0];
    const blockSize = inputChannel.length;
    
    // Process each sample
    for (let i = 0; i < blockSize; i++) {
      let sample = inputChannel[i];
      
      // Apply plugin processing based on type
      switch (this.pluginType) {
        case 'distortion':
          sample = this.processDistortion(sample);
          break;
        case 'filter':
          sample = this.processFilter(sample);
          break;
        case 'delay':
          sample = this.processDelay(sample);
          break;
        case 'compressor':
          sample = this.processCompressor(sample);
          break;
        default:
          // Pass through with DC blocking
          sample = this.processDCBlocker(sample);
      }
      
      // Soft clip to prevent harsh clipping
      sample = Math.tanh(sample);
      
      outputChannel[i] = sample;
    }
    
    // Copy to additional output channels if present
    for (let channel = 1; channel < output.length; channel++) {
      output[channel].set(output[0]);
    }
    
    return true;
  }
  
  processDCBlocker(sample) {
    // High-pass filter to remove DC offset
    const R = 0.995;
    const y = sample - this.dcBlockerX1 + R * this.dcBlockerY1;
    this.dcBlockerX1 = sample;
    this.dcBlockerY1 = y;
    return y;
  }
  
  processDistortion(sample) {
    const drive = this.parameters.drive || 0.5;
    const mix = this.parameters.mix || 1.0;
    
    // Soft clipping distortion
    const amplified = sample * (1 + drive * 10);
    const distorted = Math.tanh(amplified);
    
    return sample * (1 - mix) + distorted * mix;
  }
  
  processFilter(sample) {
    const cutoff = this.parameters.cutoff || 0.5;
    const resonance = this.parameters.resonance || 0.0;
    
    // Simple one-pole low-pass filter
    const freq = 20 + cutoff * 19980; // 20Hz to 20kHz
    const omega = 2 * Math.PI * freq / this.sampleRate;
    const alpha = Math.sin(omega) / (2 * (1 + resonance * 10));
    
    // Initialize filter state if needed
    if (!this.filterState) {
      this.filterState = { x1: 0, x2: 0, y1: 0, y2: 0 };
    }
    
    const b0 = (1 - Math.cos(omega)) / 2;
    const b1 = 1 - Math.cos(omega);
    const b2 = (1 - Math.cos(omega)) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * Math.cos(omega);
    const a2 = 1 - alpha;
    
    const output = (b0/a0) * sample + (b1/a0) * this.filterState.x1 + (b2/a0) * this.filterState.x2
                   - (a1/a0) * this.filterState.y1 - (a2/a0) * this.filterState.y2;
    
    this.filterState.x2 = this.filterState.x1;
    this.filterState.x1 = sample;
    this.filterState.y2 = this.filterState.y1;
    this.filterState.y1 = output;
    
    return output;
  }
  
  processDelay(sample) {
    const time = this.parameters.delayTime || 0.5;
    const feedback = this.parameters.feedback || 0.3;
    const mix = this.parameters.mix || 0.5;
    
    // Initialize delay buffer if needed
    const delayLength = Math.floor(this.sampleRate * 2); // 2 second max delay
    if (!this.delayBuffer) {
      this.delayBuffer = new Float32Array(delayLength);
      this.delayIndex = 0;
    }
    
    const delaySamples = Math.floor(time * this.sampleRate);
    const readIndex = (this.delayIndex - delaySamples + delayLength) % delayLength;
    
    const delayed = this.delayBuffer[readIndex];
    this.delayBuffer[this.delayIndex] = sample + delayed * feedback;
    
    this.delayIndex = (this.delayIndex + 1) % delayLength;
    
    return sample * (1 - mix) + delayed * mix;
  }
  
  processCompressor(sample) {
    const threshold = this.parameters.threshold || 0.5;
    const ratio = this.parameters.ratio || 0.5;
    const attack = this.parameters.attack || 0.01;
    const release = this.parameters.release || 0.1;
    
    if (!this.compressorState) {
      this.compressorState = { envelope: 0 };
    }
    
    const input = Math.abs(sample);
    const attackCoeff = Math.exp(-1 / (attack * this.sampleRate));
    const releaseCoeff = Math.exp(-1 / (release * this.sampleRate));
    
    if (input > this.compressorState.envelope) {
      this.compressorState.envelope = attackCoeff * this.compressorState.envelope + (1 - attackCoeff) * input;
    } else {
      this.compressorState.envelope = releaseCoeff * this.compressorState.envelope + (1 - releaseCoeff) * input;
    }
    
    let gain = 1.0;
    if (this.compressorState.envelope > threshold) {
      const excess = this.compressorState.envelope - threshold;
      const compressionRatio = 1 + ratio * 9; // 1:1 to 10:1
      gain = threshold / (threshold + excess / compressionRatio);
    }
    
    return sample * gain;
  }
}

registerProcessor('dsp-processor', DSPProcessor);
