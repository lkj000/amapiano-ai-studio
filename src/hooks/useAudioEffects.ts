export interface EffectNode {
  id: string;
  type: 'EQ' | 'Reverb' | 'Compressor' | 'Delay' | 'Distortion';
  node: AudioNode;
  params: Record<string, any>;
}

export interface EffectsChain {
  trackId: string;
  effects: EffectNode[];
  inputGain: GainNode;
  outputGain: GainNode;
}

// AudioEffects system - factory function instead of hook
export function createAudioEffectsSystem(audioContext: AudioContext) {
  const effectsChainsRef = new Map<string, EffectsChain>();

  const createEQ = (context: AudioContext): AudioNode => {
    const eq = context.createBiquadFilter();
    eq.type = 'peaking';
    eq.frequency.value = 1000;
    eq.Q.value = 1;
    eq.gain.value = 0;
    return eq;
  };

  const createReverb = async (context: AudioContext): Promise<AudioNode> => {
    const convolver = context.createConvolver();
    
    // Create impulse response for reverb
    const length = context.sampleRate * 2;
    const impulse = context.createBuffer(2, length, context.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    convolver.buffer = impulse;
    return convolver;
  };

  const createCompressor = (context: AudioContext): AudioNode => {
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    return compressor;
  };

  const createDelay = (context: AudioContext): AudioNode => {
    const delay = context.createDelay(1);
    delay.delayTime.value = 0.3;
    return delay;
  };

  const createDistortion = (context: AudioContext): AudioNode => {
    const waveshaper = context.createWaveShaper();
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + 20) * x * 20 * deg) / (Math.PI + 20 * Math.abs(x));
    }
    
    waveshaper.curve = curve;
    waveshaper.oversample = '4x';
    return waveshaper;
  };

  const getDefaultParams = (effectType: string) => {
    switch (effectType) {
      case 'EQ':
        return { frequency: 1000, Q: 1, gain: 0 };
      case 'Reverb':
        return { wetness: 0.3, roomSize: 0.5 };
      case 'Compressor':
        return { threshold: -24, ratio: 12, attack: 0.003, release: 0.25 };
      case 'Delay':
        return { delayTime: 0.3, feedback: 0.3, wetness: 0.25 };
      case 'Distortion':
        return { amount: 20, output: 1 };
      default:
        return {};
    }
  };

  const createEffect = async (effectType: string, context: AudioContext) => {
    console.log('AudioEffects: Creating effect:', effectType);
    switch (effectType) {
      case 'EQ':
        return createEQ(context);
      case 'Reverb':
        return await createReverb(context);
      case 'Compressor':
        return createCompressor(context);
      case 'Delay':
        return createDelay(context);
      case 'Distortion':
        return createDistortion(context);
      default:
        return context.createGain();
    }
  };

  const initializeEffectsChain = async (
    trackId: string, 
    effects: string[] = [],
    trackGain: GainNode
  ) => {
    if (!audioContext) return null;
    console.log('AudioEffects: Initializing effects chain for track:', trackId, 'effects:', effects);

    const inputGain = audioContext.createGain();
    const outputGain = audioContext.createGain();
    
    // Disconnect track gain from master
    try {
      trackGain.disconnect();
    } catch (e) {
      // Node might not be connected
    }
    
    const effectNodes: EffectNode[] = [];
    let currentNode: AudioNode = inputGain;

    // Create and chain effects
    for (const effectType of effects) {
      try {
        const effectNode = await createEffect(effectType, audioContext);
        const effectNodeWrapper: EffectNode = {
          id: `${trackId}_${effectType}_${Date.now()}`,
          type: effectType as EffectNode['type'],
          node: effectNode,
          params: getDefaultParams(effectType)
        };

        currentNode.connect(effectNode);
        effectNodes.push(effectNodeWrapper);
        currentNode = effectNode;
      } catch (error) {
        console.error('AudioEffects: Failed to create effect:', effectType, error);
      }
    }

    // Connect the final node to output
    currentNode.connect(outputGain);

    // Connect input to track gain
    trackGain.connect(inputGain);

    const chain: EffectsChain = {
      trackId,
      effects: effectNodes,
      inputGain,
      outputGain
    };

    effectsChainsRef.set(trackId, chain);
    console.log('AudioEffects: Effects chain initialized for track:', trackId);
    return chain;
  };

  const addEffect = async (trackId: string, effectType: string, trackGain: GainNode) => {
    console.log('AudioEffects: Adding effect to existing chain:', trackId, effectType);
    const existingChain = effectsChainsRef.get(trackId);
    
    if (existingChain) {
      const effectNode = await createEffect(effectType, audioContext);
      const effectNodeWrapper: EffectNode = {
        id: `${trackId}_${effectType}_${Date.now()}`,
        type: effectType as EffectNode['type'],
        node: effectNode,
        params: getDefaultParams(effectType)
      };

      // Reconnect the chain with the new effect
      existingChain.effects.push(effectNodeWrapper);
      
      // You would need to implement proper chain reconnection here
      console.log('AudioEffects: Effect added to chain');
    }
  };

  const removeEffect = (trackId: string, effectId: string) => {
    console.log('AudioEffects: Removing effect:', trackId, effectId);
    const chain = effectsChainsRef.get(trackId);
    if (chain) {
      chain.effects = chain.effects.filter(effect => effect.id !== effectId);
    }
  };

  const updateEffectParam = (trackId: string, effectId: string, paramName: string, value: any) => {
    console.log('AudioEffects: Updating effect param:', trackId, effectId, paramName, value);
    const chain = effectsChainsRef.get(trackId);
    if (chain) {
      const effect = chain.effects.find(e => e.id === effectId);
      if (effect) {
        effect.params[paramName] = value;
        // Apply parameter changes to the actual audio node here
        updateNodeParam(effect.node, effect.type, paramName, value);
      }
    }
  };

  const getEffectsChain = (trackId: string) => {
    return effectsChainsRef.get(trackId);
  };

  return {
    initializeEffectsChain,
    addEffect,
    removeEffect,
    updateEffectParam,
    getEffectsChain
  };
}

function updateNodeParam(node: AudioNode, effectType: EffectNode['type'], paramName: string, value: any) {
  switch (effectType) {
    case 'EQ':
      if (node instanceof BiquadFilterNode) {
        if (paramName === 'frequency') node.frequency.value = value;
        if (paramName === 'gain') node.gain.value = value;
        if (paramName === 'Q') node.Q.value = value;
      }
      break;
    case 'Compressor':
      if (node instanceof DynamicsCompressorNode) {
        if (paramName === 'threshold') node.threshold.value = value;
        if (paramName === 'ratio') node.ratio.value = value;
        if (paramName === 'attack') node.attack.value = value;
        if (paramName === 'release') node.release.value = value;
      }
      break;
    case 'Delay':
      if (node instanceof DelayNode) {
        if (paramName === 'delayTime') node.delayTime.value = value;
      }
      break;
    // Add more cases as needed
  }
}