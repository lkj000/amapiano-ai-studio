import { useState, useCallback } from "react";
import { 
  ModelQuantizer, 
  QuantizationMethod, 
  QuantizationConfig,
  QuantizedModel 
} from "@/lib/research/ModelQuantizer";
import { toast } from "sonner";

export const useModelQuantizer = () => {
  const [isQuantizing, setIsQuantizing] = useState(false);
  const [quantizedModel, setQuantizedModel] = useState<QuantizedModel | null>(null);
  const [metrics, setMetrics] = useState({
    compressionRatio: 0,
    originalSizeMB: 0,
    quantizedSizeMB: 0,
    qualityLoss: 0
  });

  const quantize = useCallback(
    async (
      weights: Float32Array,
      shape: number[],
      modelName: string,
      method: QuantizationMethod = 'ptq',
      bitPrecision: number = 8
    ) => {
      setIsQuantizing(true);
      
      try {
        const config: QuantizationConfig = {
          method,
          bitPrecision,
          calibrationSamples: 100,
          preserveQuality: true
        };

        const quantizer = new ModelQuantizer(config);
        const quantized = await quantizer.quantize(weights, shape, modelName);

        const originalSizeMB = (weights.length * 4) / (1024 * 1024);
        const quantizedSizeMB = (quantized.weights.length * (bitPrecision / 8)) / (1024 * 1024);
        const compressionRatio = ModelQuantizer.getCompressionRatio(32, bitPrecision);

        // Dequantize to measure quality loss
        const dequantized = quantizer.dequantize(quantized);
        const qualityLoss = ModelQuantizer.estimateQualityLoss(weights, dequantized);

        setQuantizedModel(quantized);
        setMetrics({
          compressionRatio,
          originalSizeMB,
          quantizedSizeMB,
          qualityLoss
        });

        toast.success(`Model quantized successfully! ${compressionRatio}x compression achieved.`);
        
        return quantized;
      } catch (error) {
        console.error('Quantization failed:', error);
        toast.error('Failed to quantize model');
        throw error;
      } finally {
        setIsQuantizing(false);
      }
    },
    []
  );

  const dequantize = useCallback(
    (model?: QuantizedModel): Float32Array | null => {
      const targetModel = model || quantizedModel;
      if (!targetModel) return null;

      const config: QuantizationConfig = targetModel.config;
      const quantizer = new ModelQuantizer(config);
      
      return quantizer.dequantize(targetModel);
    },
    [quantizedModel]
  );

  const compareModels = useCallback(
    (original: Float32Array, quantized: Float32Array) => {
      // Ensure arrays are same length
      const minLength = Math.min(original.length, quantized.length);
      let mse = 0;
      
      for (let i = 0; i < minLength; i++) {
        const diff = original[i] - quantized[i];
        mse += diff * diff;
      }
      
      mse = mse / minLength;
      
      // Calculate signal power for SNR-based quality metric
      let signalPower = 0;
      for (let i = 0; i < minLength; i++) {
        signalPower += original[i] * original[i];
      }
      signalPower = signalPower / minLength;
      
      // Avoid division by zero
      if (signalPower === 0 || mse === 0) {
        return { mse, qualityLoss: 0, qualityRetained: 100 };
      }
      
      // Calculate SNR (Signal-to-Noise Ratio) in dB
      const snr = 10 * Math.log10(signalPower / mse);
      
      // Normalize SNR to 0-100% quality scale
      // Typical audio SNR ranges: <20dB (poor), 20-40dB (acceptable), >40dB (good)
      const qualityRetained = Math.min(100, Math.max(0, (snr + 10) / 50 * 100));
      const qualityLoss = 100 - qualityRetained;
      
      return {
        mse,
        qualityLoss,
        qualityRetained
      };
    },
    []
  );

  return {
    quantize,
    dequantize,
    compareModels,
    isQuantizing,
    quantizedModel,
    metrics
  };
};
