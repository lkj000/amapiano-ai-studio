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
      
      // Calculate signal power
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
      
      // Audio-specific quality mapping
      // Based on perceptual thresholds for audio distortion
      // <30dB: Catastrophic (unusable)
      // 30-45dB: Poor (noticeable distortion)
      // 45-60dB: Acceptable (mild artifacts)
      // 60-75dB: Good (minimal artifacts)
      // >75dB: Excellent (near-transparent)
      
      let qualityRetained: number;
      if (snr < 30) {
        // Catastrophic quality - exponential degradation
        qualityRetained = Math.max(0, (snr / 30) * 40); // 0-40%
      } else if (snr < 45) {
        // Poor quality - linear mapping
        qualityRetained = 40 + ((snr - 30) / 15) * 25; // 40-65%
      } else if (snr < 60) {
        // Acceptable quality
        qualityRetained = 65 + ((snr - 45) / 15) * 20; // 65-85%
      } else if (snr < 75) {
        // Good quality
        qualityRetained = 85 + ((snr - 60) / 15) * 12; // 85-97%
      } else {
        // Excellent quality (but cap at 98% for realism)
        qualityRetained = Math.min(98, 97 + ((snr - 75) / 25) * 1);
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
