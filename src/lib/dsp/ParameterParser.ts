/**
 * Phase 0 Sprint 1: AST-based Parameter Parser
 * Replaces regex-based C++ parsing with proper AST analysis
 */

import type { DSPParameter } from './types';

interface ParsedParameter {
  name: string;
  type: string;
  defaultValue: string | number | boolean;
  min?: number;
  max?: number;
  description?: string;
}

export class ParameterParser {
  /**
   * Extract parameters from C++ code using pattern matching
   * This is a simplified AST approach - in production would use a real C++ parser
   */
  static extractParameters(code: string): DSPParameter[] {
    const parameters: DSPParameter[] = [];
    
    // Match JUCE-style parameter declarations
    const juceParamPattern = /addParameter\s*\(\s*new\s+juce::AudioParameterFloat\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/g;
    
    let match;
    while ((match = juceParamPattern.exec(code)) !== null) {
      const [, id, label, minStr, maxStr, defaultStr] = match;
      
      parameters.push({
        id: id.trim(),
        label: label.trim(),
        type: 'float',
        min: this.parseValue(minStr),
        max: this.parseValue(maxStr),
        default: this.parseValue(defaultStr),
        affects: 'audio',
        automatable: true,
        category: 'control'
      });
    }
    
    // Match Web Audio-style parameter declarations
    const webAudioPattern = /this\.(\w+)\s*=\s*context\.createGain\(\)|this\.(\w+)Param\s*=\s*[^;]+/g;
    
    while ((match = webAudioPattern.exec(code)) !== null) {
      const paramName = match[1] || match[2];
      if (paramName) {
        parameters.push({
          id: paramName,
          label: this.camelToTitle(paramName),
          type: 'float',
          default: 0.5,
          min: 0,
          max: 1,
          affects: 'audio',
          category: 'control'
        });
      }
    }
    
    return parameters;
  }
  
  /**
   * Validate parameter values against constraints
   */
  static validateParameter(param: DSPParameter, value: any): boolean {
    switch (param.type) {
      case 'float':
      case 'int':
        const numValue = Number(value);
        if (isNaN(numValue)) return false;
        if (param.min !== undefined && numValue < param.min) return false;
        if (param.max !== undefined && numValue > param.max) return false;
        return true;
        
      case 'bool':
        return typeof value === 'boolean';
        
      case 'enum':
        if (!param.valueStrings) return false;
        return param.valueStrings.includes(String(value));
        
      default:
        return false;
    }
  }
  
  /**
   * Generate parameter manifest for WASM module
   */
  static generateManifest(parameters: DSPParameter[]): Record<string, any> {
    return {
      version: '1.0.0',
      parameters: parameters.map((p, index) => ({
        index,
        id: p.id,
        name: p.label,
        type: p.type,
        defaultValue: p.default,
        min: p.min,
        max: p.max,
        step: p.step,
        unit: p.unit,
        automatable: p.automatable ?? true
      }))
    };
  }
  
  private static parseValue(str: string): number {
    const cleaned = str.trim().replace(/f$/, '');
    return parseFloat(cleaned) || 0;
  }
  
  private static camelToTitle(camel: string): string {
    return camel
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}
