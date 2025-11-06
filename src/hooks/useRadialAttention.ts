import { useState, useCallback, useRef, useEffect } from "react";
import { RadialAttention, RadialAttentionConfig } from "@/lib/research/RadialAttention";

export const useRadialAttention = (config?: Partial<RadialAttentionConfig>) => {
  const defaultConfig: RadialAttentionConfig = {
    numHeads: 8,
    headDim: 64,
    maxSeqLength: 1024,
    radialBands: 12,
    useFFT: true,
    ...config
  };

  const attentionRef = useRef<RadialAttention | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [complexity, setComplexity] = useState({ spatial: 0, radial: 0 });

  useEffect(() => {
    attentionRef.current = new RadialAttention(defaultConfig);
    setComplexity(attentionRef.current.getComplexityReduction());
    setIsInitialized(true);

    return () => {
      attentionRef.current = null;
    };
  }, [defaultConfig.numHeads, defaultConfig.headDim, defaultConfig.maxSeqLength, defaultConfig.radialBands]);

  const applyAttention = useCallback(
    async (input: Float32Array[]): Promise<Float32Array[]> => {
      if (!attentionRef.current) {
        throw new Error("Radial attention not initialized");
      }

      const startTime = performance.now();
      const result = attentionRef.current.multiHeadAttention(input);
      const processingTime = performance.now() - startTime;

      console.log(`Radial attention processed ${input.length} sequence items in ${processingTime.toFixed(2)}ms`);

      return result;
    },
    []
  );

  const getEfficiencyGain = useCallback(() => {
    if (complexity.spatial === 0) return 0;
    return ((complexity.spatial - complexity.radial) / complexity.spatial) * 100;
  }, [complexity]);

  return {
    isInitialized,
    applyAttention,
    complexity,
    efficiencyGain: getEfficiencyGain(),
    config: defaultConfig
  };
};
