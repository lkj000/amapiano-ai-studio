import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wand2, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Parameter {
  id: string;
  name: string;
  type: 'float' | 'int' | 'bool' | 'enum' | string;
  min?: number;
  max?: number;
  defaultValue: any;
  unit?: string;
  options?: string[];
}

interface SmartParameterOptimizerProps {
  parameters: Parameter[];
  onParametersOptimized: (optimizedParams: Parameter[]) => void;
}

export const SmartParameterOptimizer = ({
  parameters,
  onParametersOptimized,
}: SmartParameterOptimizerProps) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const analyzeParameters = () => {
    const analyzed = parameters.map((param) => {
      const suggestions = [];
      let severity: "info" | "warning" | "error" = "info";

      // Skip analysis if min/max not defined
      if (param.min === undefined || param.max === undefined) {
        suggestions.push({
          type: "range",
          message: "Parameter missing min/max range",
          suggestion: "Define min and max values for better control",
          severity: "info",
        });
        return {
          parameter: param,
          suggestions,
          severity,
          score: 80,
        };
      }

      // Analyze ranges
      const range = param.max - param.min;
      if (range > 20000) {
        suggestions.push({
          type: "range",
          message: "Very large range may be hard to control precisely",
          suggestion: "Consider logarithmic scaling or reducing range",
          severity: "warning",
        });
        severity = "warning";
      }

      // Analyze default value
      if (range > 0) {
        const defaultPercent = ((param.defaultValue - param.min) / range) * 100;
        if (defaultPercent < 10 || defaultPercent > 90) {
          suggestions.push({
            type: "default",
            message: "Default value near extreme of range",
            suggestion: `Set default closer to middle (around ${((param.min + param.max) / 2).toFixed(2)})`,
            severity: "info",
          });
        }
      }

      // Check for missing units
      if (!param.unit && param.type === "float") {
        suggestions.push({
          type: "unit",
          message: "Missing unit specification",
          suggestion: "Add unit (Hz, dB, %, ms, etc.) for better UX",
          severity: "info",
        });
      }

      // Frequency-specific suggestions
      if (
        param.min !== undefined &&
        param.max !== undefined &&
        (param.name.toLowerCase().includes("freq") || param.unit === "Hz")
      ) {
        if (param.min < 20 || param.max > 20000) {
          suggestions.push({
            type: "frequency",
            message: "Frequency range outside audible spectrum",
            suggestion: "Set range to 20Hz - 20kHz for audio",
            severity: "warning",
          });
          severity = "warning";
        }
      }

      // Gain/volume suggestions
      if (
        param.max !== undefined &&
        (param.name.toLowerCase().includes("gain") ||
          param.name.toLowerCase().includes("volume") ||
          param.unit === "dB")
      ) {
        if (param.max > 24) {
          suggestions.push({
            type: "gain",
            message: "Very high gain ceiling may cause distortion",
            suggestion: "Limit gain to +24dB for safety",
            severity: "error",
          });
          severity = "error";
        }
      }

      return {
        parameter: param,
        suggestions,
        severity,
        score: suggestions.length === 0 ? 100 : Math.max(0, 100 - suggestions.length * 20),
      };
    });

    return analyzed;
  };

  const handleOptimize = () => {
    setIsOptimizing(true);

    setTimeout(() => {
      const analyzed = analyzeParameters();
      setSuggestions(analyzed);

      // Auto-apply safe optimizations
      const optimized = parameters.map((param) => {
        if (param.min === undefined || param.max === undefined) return param;
        
        const analysis = analyzed.find((a) => a.parameter.id === param.id);
        if (!analysis) return param;

        let optimizedParam = { ...param };

        // Auto-fix frequency ranges
        if (
          analysis.suggestions.some((s) => s.type === "frequency") &&
          param.unit === "Hz"
        ) {
          optimizedParam.min = 20;
          optimizedParam.max = 20000;
        }

        // Auto-fix gain ceilings
        if (analysis.suggestions.some((s) => s.type === "gain") && param.max > 24) {
          optimizedParam.max = 24;
        }

        // Center default values if needed
        if (param.min !== undefined && param.max !== undefined) {
          const range = param.max - param.min;
          const defaultPercent = ((param.defaultValue - param.min) / range) * 100;
          if (defaultPercent < 10 || defaultPercent > 90) {
            optimizedParam.defaultValue = (param.min + param.max) / 2;
          }
        }

        return optimizedParam;
      });

      onParametersOptimized(optimized);
      setIsOptimizing(false);
      toast.success("Parameters optimized!");
    }, 1500);
  };

  const analyzed = analyzeParameters();
  const avgScore = analyzed.reduce((sum, a) => sum + a.score, 0) / analyzed.length;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Smart Parameter Analysis</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered optimization suggestions
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{avgScore.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Quality Score</div>
          </div>
        </div>

        <Button onClick={handleOptimize} disabled={isOptimizing} className="w-full">
          <Wand2 className="w-4 h-4 mr-2" />
          {isOptimizing ? "Analyzing..." : "Optimize Parameters"}
        </Button>

        {suggestions.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            {analyzed.map((item, index) => (
              <AccordionItem key={index} value={`param-${index}`}>
                <AccordionTrigger>
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-2">
                      {item.severity === "error" ? (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      ) : item.severity === "warning" ? (
                        <TrendingUp className="w-4 h-4 text-warning" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      )}
                      <span className="font-medium">{item.parameter.name}</span>
                    </div>
                    <Badge
                      variant={
                        item.severity === "error"
                          ? "destructive"
                          : item.severity === "warning"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {item.score}%
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {item.suggestions.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        ✓ Parameter looks good!
                      </div>
                    ) : (
                      item.suggestions.map((suggestion: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg space-y-1">
                          <div className="text-sm font-medium">{suggestion.message}</div>
                          <div className="text-sm text-muted-foreground">
                            💡 {suggestion.suggestion}
                          </div>
                        </div>
                      ))
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      Current: {item.parameter.min} → {item.parameter.max} (default:{" "}
                      {item.parameter.defaultValue})
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {suggestions.length === 0 && parameters.length > 0 && (
          <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
            Click "Optimize Parameters" to analyze your plugin parameters
          </div>
        )}
      </div>
    </Card>
  );
};
