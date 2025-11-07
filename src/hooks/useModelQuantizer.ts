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
      
      // Calculate MSE (Mean Squared Error)
      let mse = 0;
      for (let i = 0; i < minLength; i++) {
        const diff = original[i] - quantized[i];
        mse += diff * diff;
      }
      mse = mse / minLength;
      
      // Calculate signal power (RMS)
      let signalPower = 0;
      for (let i = 0; i < minLength; i++) {
        signalPower += original[i] * original[i];
      }
      signalPower = signalPower / minLength;
      
      // Handle edge cases
      if (signalPower === 0) {
        // No signal at all
        return { mse: 0, snr: 0, qualityLoss: 0, qualityRetained: 100 };
      }
      
      if (mse === 0) {
        // Perfect reconstruction
        return { mse: 0, snr: Infinity, qualityLoss: 0, qualityRetained: 100 };
      }
      
      // Calculate SNR in dB
      const snr = 10 * Math.log10(signalPower / mse);
      
      // Audio quality mapping based on SNR thresholds
      // SNR ranges for audio quantization:
      // 4-bit: ~24 dB (poor, ~35-45% quality)
      // 8-bit: ~48 dB (good, ~80-88% quality)  
      // 16-bit: ~96 dB (excellent, ~95-98% quality)
      
      let qualityRetained: number;
      
      if (snr < 0) {
        // Catastrophic - noise exceeds signal
        qualityRetained = 0;
      } else if (snr < 24) {
        // Very poor quality (below 4-bit standard)
        qualityRetained = (snr / 24) * 35; // 0-35%
      } else if (snr < 36) {
        // Poor quality (4-bit range)
        qualityRetained = 35 + ((snr - 24) / 12) * 20; // 35-55%
      } else if (snr < 48) {
        // Acceptable quality (between 4-bit and 8-bit)
        qualityRetained = 55 + ((snr - 36) / 12) * 25; // 55-80%
      } else if (snr < 60) {
        // Good quality (8-bit range)
        qualityRetained = 80 + ((snr - 48) / 12) * 10; // 80-90%
      } else if (snr < 72) {
        // Very good quality
        qualityRetained = 90 + ((snr - 60) / 12) * 5; // 90-95%
      } else {
        // Excellent quality (approaching 16-bit)
        qualityRetained = Math.min(98, 95 + ((snr - 72) / 24) * 3); // 95-98%
      }
      
      const qualityLoss = 100 - qualityRetained;
      
      return {
        mse,
        snr,
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
