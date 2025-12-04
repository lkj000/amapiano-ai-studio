import { useState, useCallback } from "react";
import { 
  ModelQuantizer, 
  QuantizationMethod, 
  QuantizationConfig,
  QuantizedModel 
} from "@/lib/research/ModelQuantizer";
import { toast } from "sonner";

interface QuantizationMetrics {
  compressionRatio: number;
  originalSizeMB: number;
  quantizedSizeMB: number;
  qualityLoss: number;
  snr: number;
  mse: number;
}

export const useModelQuantizer = () => {
  const [isQuantizing, setIsQuantizing] = useState(false);
  const [quantizedModel, setQuantizedModel] = useState<QuantizedModel | null>(null);
  const [metrics, setMetrics] = useState<QuantizationMetrics>({
    compressionRatio: 0,
    originalSizeMB: 0,
    quantizedSizeMB: 0,
    qualityLoss: 0,
    snr: 0,
    mse: 0
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
        
        // Calculate comprehensive quality metrics
        const qualityMetrics = compareModelsDetailed(weights, dequantized);

        setQuantizedModel(quantized);
        setMetrics({
          compressionRatio,
          originalSizeMB,
          quantizedSizeMB,
          qualityLoss: qualityMetrics.qualityLoss,
          snr: qualityMetrics.snr,
          mse: qualityMetrics.mse
        });

        toast.success(`Model quantized successfully! ${compressionRatio}x compression, ${qualityMetrics.qualityRetained.toFixed(1)}% quality retained.`);
        
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
      return compareModelsDetailed(original, quantized);
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

/**
 * Comprehensive model comparison with proper signal processing metrics
 */
function compareModelsDetailed(original: Float32Array, quantized: Float32Array): {
  mse: number;
  snr: number;
  qualityLoss: number;
  qualityRetained: number;
} {
  const minLength = Math.min(original.length, quantized.length);
  
  if (minLength === 0) {
    return { mse: 0, snr: 0, qualityLoss: 0, qualityRetained: 100 };
  }
  
  // Calculate MSE (Mean Squared Error)
  let mse = 0;
  let signalPower = 0;
  
  for (let i = 0; i < minLength; i++) {
    const diff = original[i] - quantized[i];
    mse += diff * diff;
    signalPower += original[i] * original[i];
  }
  mse /= minLength;
  signalPower /= minLength;
  
  // Handle edge cases
  if (signalPower === 0) {
    return { mse: 0, snr: Infinity, qualityLoss: 0, qualityRetained: 100 };
  }
  
  if (mse === 0) {
    return { mse: 0, snr: Infinity, qualityLoss: 0, qualityRetained: 100 };
  }
  
  // Calculate SNR in dB
  const snr = 10 * Math.log10(signalPower / mse);
  
  // Map SNR to quality using psychoacoustic research:
  // - 6 dB per bit for uniform quantization
  // - 8-bit: ~48 dB theoretical, ~40-45 dB practical
  // - 16-bit: ~96 dB theoretical
  
  let qualityRetained: number;
  
  if (snr >= 60) {
    // Excellent: 16-bit equivalent or better
    qualityRetained = 95 + Math.min(5, (snr - 60) / 12);
  } else if (snr >= 48) {
    // Very good: high quality 8-bit
    qualityRetained = 85 + (snr - 48) / 12 * 10;
  } else if (snr >= 36) {
    // Good: standard 8-bit
    qualityRetained = 70 + (snr - 36) / 12 * 15;
  } else if (snr >= 24) {
    // Acceptable: low quality
    qualityRetained = 45 + (snr - 24) / 12 * 25;
  } else if (snr >= 12) {
    // Poor
    qualityRetained = 20 + (snr - 12) / 12 * 25;
  } else if (snr >= 0) {
    // Very poor
    qualityRetained = snr / 12 * 20;
  } else {
    // Catastrophic
    qualityRetained = 0;
  }
  
  qualityRetained = Math.max(0, Math.min(100, qualityRetained));
  const qualityLoss = 100 - qualityRetained;
  
  return { mse, snr, qualityLoss, qualityRetained };
}
