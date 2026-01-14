/**
 * Stereo Imager AudioWorklet Processor
 * Real-time mid/side stereo width processing with bass mono
 */

class StereoImagerProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    // Initialize parameters from options
    const opts = options.processorOptions || {};
    this.width = (opts.width || 100) / 100;
    this.midGain = opts.midGain || 1.0;
    this.sideGain = opts.sideGain || 1.0;
    this.lowCrossover = opts.lowCrossover || 120;
    this.highEnhance = (opts.highEnhance || 0) / 100;
    this.safeWidth = opts.safeWidth !== false;
    
    // Filter states for bass mono
    this.lowpassState = { l: 0, r: 0 };
    this.highpassState = { l: 0, r: 0 };
    
    // Correlation measurement
    this.correlationBuffer = new Float32Array(1024);
    this.correlationIndex = 0;
    this.correlation = 0.5;
    
    // Calculate filter coefficient
    this.updateFilterCoefficient();
    
    // Handle messages from main thread
    this.port.onmessage = (event) => {
      const { type, value } = event.data;
      switch (type) {
        case 'setWidth':
          this.width = value / 100;
          break;
        case 'setMidGain':
          this.midGain = value;
          break;
        case 'setSideGain':
          this.sideGain = value;
          break;
        case 'setLowCrossover':
          this.lowCrossover = value;
          this.updateFilterCoefficient();
          break;
        case 'setHighEnhance':
          this.highEnhance = value / 100;
          break;
        case 'setSafeWidth':
          this.safeWidth = value;
          break;
      }
    };
  }
  
  updateFilterCoefficient() {
    // Simple one-pole filter coefficient
    // More accurate would use Butterworth or Linkwitz-Riley
    const fc = this.lowCrossover / sampleRate;
    this.lpCoeff = 1 - Math.exp(-2 * Math.PI * fc);
    this.hpCoeff = 1 - this.lpCoeff;
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0] || !output || !output[0]) {
      return true;
    }
    
    const inputL = input[0];
    const inputR = input[1] || input[0]; // Mono fallback
    const outputL = output[0];
    const outputR = output[1] || output[0];
    
    const numSamples = inputL.length;
    
    let sumCorrelation = 0;
    
    for (let i = 0; i < numSamples; i++) {
      const inL = inputL[i];
      const inR = inputR[i];
      
      // Simple lowpass/highpass split
      this.lowpassState.l += this.lpCoeff * (inL - this.lowpassState.l);
      this.lowpassState.r += this.lpCoeff * (inR - this.lowpassState.r);
      
      const lowL = this.lowpassState.l;
      const lowR = this.lowpassState.r;
      const highL = inL - lowL;
      const highR = inR - lowR;
      
      // Mono the lows (sum to center)
      const monoLow = (lowL + lowR) * 0.5;
      
      // Mid/Side encoding for highs
      let mid = (highL + highR) * 0.5;
      let side = (highL - highR) * 0.5;
      
      // Apply gains
      mid *= this.midGain;
      side *= this.sideGain * this.width;
      
      // Apply high frequency enhancement to sides
      if (this.highEnhance > 0) {
        // Simple high-frequency boost to sides
        side *= (1 + this.highEnhance * 0.5);
      }
      
      // Safe width limiting to prevent phase issues
      if (this.safeWidth) {
        const maxSide = Math.abs(mid) * 2;
        side = Math.max(-maxSide, Math.min(maxSide, side));
      }
      
      // Decode back to L/R
      const processedHighL = mid + side;
      const processedHighR = mid - side;
      
      // Combine mono lows with processed highs
      outputL[i] = monoLow + processedHighL;
      outputR[i] = monoLow + processedHighR;
      
      // Calculate correlation
      sumCorrelation += outputL[i] * outputR[i];
    }
    
    // Update correlation (running average)
    const avgCorrelation = sumCorrelation / numSamples;
    this.correlation = this.correlation * 0.9 + avgCorrelation * 0.1;
    
    // Send correlation to main thread periodically
    this.correlationBuffer[this.correlationIndex++] = this.correlation;
    if (this.correlationIndex >= this.correlationBuffer.length) {
      this.correlationIndex = 0;
      this.port.postMessage({
        type: 'correlation',
        value: this.correlation
      });
    }
    
    return true;
  }
}

registerProcessor('stereo-imager', StereoImagerProcessor);
