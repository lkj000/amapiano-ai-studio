import { useRef, useCallback, useEffect } from 'react';

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

export function useAudioEffects(audioContext: AudioContext | null) {
  const effectsChainsRef = useRef<Map<string, EffectsChain>>(new Map());

  const createEQ = useCallback((context: AudioContext): AudioNode => {
    const eq = context.createBiquadFilter();
    eq.type = 'peaking';
    eq.frequency.value = 1000;
    eq.Q.value = 1;
    eq.gain.value = 0;
    return eq;
  }, []);

  const createReverb = useCallback(async (context: AudioContext): Promise<AudioNode> => {
    const convolver = context.createConvolver();
    const reverb = context.createGain();
    const dry = context.createGain();
    const wet = context.createGain();
    
    // Create impulse response for reverb
    const length = context.sampleRate * 2; // 2 seconds
    const impulse = context.createBuffer(2, length, context.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    convolver.buffer = impulse;
    
    // Create a composite node
    const reverbNode = context.createGain();
    reverbNode.connect(dry);
    reverbNode.connect(convolver);
    convolver.connect(wet);
    
    dry.connect(reverb);
    wet.connect(reverb);
    
    dry.gain.value = 0.7;
    wet.gain.value = 0.3;
    
    return reverb;
  }, []);

  const createCompressor = useCallback((context: AudioContext): AudioNode => {
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 5;
    compressor.ratio.value = 8;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.1;
    return compressor;
  }, []);

  const createDelay = useCallback((context: AudioContext): AudioNode => {
    const delay = context.createDelay(1.0);
    const feedback = context.createGain();
    const wet = context.createGain();
    const dry = context.createGain();
    const output = context.createGain();
    
    delay.delayTime.value = 0.3;
    feedback.gain.value = 0.3;
    wet.gain.value = 0.3;
    dry.gain.value = 0.7;
    
    // Create delay network
    const delayNode = context.createGain();
    delayNode.connect(dry);
    delayNode.connect(delay);
    delay.connect(wet);
    delay.connect(feedback);
    feedback.connect(delay);
    
    dry.connect(output);
    wet.connect(output);
    
    return output;
  }, []);

  const createDistortion = useCallback((context: AudioContext): AudioNode => {
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
  }, []);

  const createEffect = useCallback(async (
    type: EffectNode['type'], 
    context: AudioContext
  ): Promise<AudioNode> => {
    switch (type) {
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
  }, [createEQ, createReverb, createCompressor, createDelay, createDistortion]);

  const initializeEffectsChain = useCallback(async (
    trackId: string, 
    effects: string[] = [],
    trackGain: GainNode
  ) => {
    if (!audioContext) return null;

    const inputGain = audioContext.createGain();
    const outputGain = audioContext.createGain();
    
    // Disconnect track gain from master
    trackGain.disconnect();
    
    const effectNodes: EffectNode[] = [];
    let currentNode: AudioNode = inputGain;

    // Create and chain effects
    for (const effectType of effects) {
      try {
        const effectNode = await createEffect(effectType as EffectNode['type'], audioContext);
        const effectNodeWrapper: EffectNode = {
          id: `${trackId}_${effectType}_${Date.now()}`,
          type: effectType as EffectNode['type'],
          node: effectNode,
          params: getDefaultParams(effectType as EffectNode['type'])
        };
        
        currentNode.connect(effectNode);
        currentNode = effectNode;
        effectNodes.push(effectNodeWrapper);
      } catch (error) {
        console.error(`Failed to create ${effectType} effect:`, error);
      }
    }

    // Connect final node to output
    currentNode.connect(outputGain);
    
    // Connect track gain to input
    trackGain.connect(inputGain);

    const chain: EffectsChain = {
      trackId,
      effects: effectNodes,
      inputGain,
      outputGain
    };

    effectsChainsRef.current.set(trackId, chain);
    return chain;
  }, [audioContext, createEffect]);

  const addEffect = useCallback(async (
    trackId: string, 
    effectType: EffectNode['type'],
    trackGain: GainNode
  ) => {
    if (!audioContext) return;

    let chain = effectsChainsRef.current.get(trackId);
    
    if (!chain) {
      // Initialize chain if it doesn't exist
      chain = await initializeEffectsChain(trackId, [effectType], trackGain);
      return;
    }

    // Create new effect
    const effectNode = await createEffect(effectType, audioContext);
    const effectNodeWrapper: EffectNode = {
      id: `${trackId}_${effectType}_${Date.now()}`,
      type: effectType,
      node: effectNode,
      params: getDefaultParams(effectType)
    };

    // Rebuild the chain
    const lastEffect = chain.effects[chain.effects.length - 1];
    if (lastEffect) {
      lastEffect.node.disconnect();
      lastEffect.node.connect(effectNode);
      effectNode.connect(chain.outputGain);
    } else {
      chain.inputGain.disconnect();
      chain.inputGain.connect(effectNode);
      effectNode.connect(chain.outputGain);
    }

    chain.effects.push(effectNodeWrapper);
  }, [audioContext, createEffect, initializeEffectsChain]);

  const removeEffect = useCallback((trackId: string, effectId: string) => {
    const chain = effectsChainsRef.current.get(trackId);
    if (!chain) return;

    const effectIndex = chain.effects.findIndex(e => e.id === effectId);
    if (effectIndex === -1) return;

    // Remove the effect and rebuild the chain
    chain.effects.splice(effectIndex, 1);
    
    // Disconnect all nodes
    chain.effects.forEach(effect => effect.node.disconnect());
    chain.inputGain.disconnect();

    // Rebuild connections
    let currentNode: AudioNode = chain.inputGain;
    chain.effects.forEach(effect => {
      currentNode.connect(effect.node);
      currentNode = effect.node;
    });
    currentNode.connect(chain.outputGain);
  }, []);

  const updateEffectParam = useCallback((
    trackId: string, 
    effectId: string, 
    paramName: string, 
    value: any
  ) => {
    const chain = effectsChainsRef.current.get(trackId);
    if (!chain) return;

    const effect = chain.effects.find(e => e.id === effectId);
    if (!effect) return;

    // Update the parameter based on effect type
    updateNodeParam(effect.node, effect.type, paramName, value);
    effect.params[paramName] = value;
  }, []);

  const getEffectsChain = useCallback((trackId: string) => {
    return effectsChainsRef.current.get(trackId);
  }, []);

  const clearEffectsChain = useCallback((trackId: string) => {
    const chain = effectsChainsRef.current.get(trackId);
    if (chain) {
      chain.effects.forEach(effect => effect.node.disconnect());
      chain.inputGain.disconnect();
      chain.outputGain.disconnect();
      effectsChainsRef.current.delete(trackId);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      effectsChainsRef.current.forEach((chain) => {
        chain.effects.forEach(effect => effect.node.disconnect());
        chain.inputGain.disconnect();
        chain.outputGain.disconnect();
      });
      effectsChainsRef.current.clear();
    };
  }, []);

  return {
    initializeEffectsChain,
    addEffect,
    removeEffect,
    updateEffectParam,
    getEffectsChain,
    clearEffectsChain
  };
}

function getDefaultParams(effectType: EffectNode['type']): Record<string, any> {
  switch (effectType) {
    case 'EQ':
      return { frequency: 1000, gain: 0, Q: 1 };
    case 'Reverb':
      return { roomSize: 0.5, damping: 0.5, wetness: 0.3 };
    case 'Compressor':
      return { threshold: -20, ratio: 8, attack: 0.003, release: 0.1 };
    case 'Delay':
      return { time: 0.3, feedback: 0.3, wetness: 0.3 };
    case 'Distortion':
      return { drive: 20, tone: 0.5 };
    default:
      return {};
  }
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
    // Add more cases as needed
  }
}