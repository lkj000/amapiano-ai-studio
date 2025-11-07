import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Zap } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

interface QuantizationResult {
  method: string;
  bitPrecision: number;
  compressionRatio: number;
  qualityRetained: number;
  quantizedSizeMB: number;
  snr?: number;
}

interface QuantizationAnalysisReportProps {
  results: QuantizationResult[];
}

export const QuantizationAnalysisReport = ({ results }: QuantizationAnalysisReportProps) => {
  if (!results || results.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No quantization results available. Run tests first.</p>
      </Card>
    );
  }

  // Prepare data for compression vs quality chart
  const compressionQualityData = results.map(r => ({
    method: `${r.method} ${r.bitPrecision}-bit`,
    compression: r.compressionRatio,
    quality: r.qualityRetained,
    size: r.quantizedSizeMB
  }));

  // Calculate efficiency score (quality per compression ratio)
  const efficiencyData = results.map(r => ({
    method: `${r.method} ${r.bitPrecision}-bit`,
    efficiency: r.compressionRatio > 0 ? (r.qualityRetained / r.compressionRatio) : 0,
    quality: r.qualityRetained
  })).sort((a, b) => b.efficiency - a.efficiency);

  // Thesis hypothesis mapping
  const analyzeForThesis = () => {
    const ptq8 = results.find(r => r.method === 'PTQ' && r.bitPrecision === 8);
    const svd8 = results.find(r => r.method === 'SVDQuant' && r.bitPrecision === 8);
    const ptq4 = results.find(r => r.method === 'PTQ' && r.bitPrecision === 4);

    const analysis = {
      baseline8bit: ptq8 ? `${ptq8.qualityRetained.toFixed(1)}%` : 'N/A',
      proposed8bit: svd8 ? `${svd8.qualityRetained.toFixed(1)}%` : 'N/A',
      baseline4bit: ptq4 ? `${ptq4.qualityRetained.toFixed(1)}%` : 'N/A',
      improvement: ptq8 && svd8 ? `+${(svd8.qualityRetained - ptq8.qualityRetained).toFixed(1)}%` : 'N/A',
      hypothesis1Status: svd8 && svd8.qualityRetained > 85 ? 'VALIDATED' : 'NEEDS WORK',
      recommendation: ''
    };

    // Generate thesis recommendation
    if (svd8 && ptq8) {
      if (svd8.qualityRetained > ptq8.qualityRetained + 5) {
        analysis.recommendation = 'SVDQuant shows significant improvement over baseline PTQ. Strong evidence for Hypothesis 1 (Nunchaku-Audio superiority).';
      } else if (svd8.qualityRetained > ptq8.qualityRetained) {
        analysis.recommendation = 'SVDQuant shows modest improvement. Consider emphasizing 4-bit scenario or improving algorithm.';
      } else {
        analysis.recommendation = 'SVDQuant underperforms baseline. Critical: Revise algorithm or pivot thesis focus to diagnostic study.';
      }
    }

    return analysis;
  };

  const thesisAnalysis = analyzeForThesis();

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      results: compressionQualityData,
      efficiency: efficiencyData,
      thesisAnalysis
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quantization-analysis-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Analysis report exported');
  };

  return (
    <div className="space-y-6">
      {/* Thesis Hypothesis Mapping */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Thesis Hypothesis 1: Quantization Validation
          </h3>
          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">PTQ 8-bit (Baseline)</p>
            <p className="text-2xl font-bold">{thesisAnalysis.baseline8bit}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">SVDQuant 8-bit (Proposed)</p>
            <p className="text-2xl font-bold text-primary">{thesisAnalysis.proposed8bit}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Improvement</p>
            <p className="text-2xl font-bold text-green-600">{thesisAnalysis.improvement}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Hypothesis Status</p>
            <p className={`text-2xl font-bold ${
              thesisAnalysis.hypothesis1Status === 'VALIDATED' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {thesisAnalysis.hypothesis1Status}
            </p>
          </div>
        </div>

        <div className="p-4 bg-background rounded-lg">
          <p className="text-sm font-medium mb-2">Thesis Recommendation:</p>
          <p className="text-sm text-muted-foreground">{thesisAnalysis.recommendation}</p>
        </div>
      </Card>

      {/* Compression vs Quality Tradeoff */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Compression-Quality Tradeoff Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={compressionQualityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="method" angle={-45} textAnchor="end" height={80} />
            <YAxis yAxisId="left" label={{ value: 'Quality Retained (%)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Compression Ratio (x)', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="quality" stroke="hsl(var(--primary))" strokeWidth={2} name="Quality %" />
            <Line yAxisId="right" type="monotone" dataKey="compression" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Compression" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Method Efficiency Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Method Efficiency Ranking (Quality/Compression)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={efficiencyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="method" angle={-45} textAnchor="end" height={80} />
            <YAxis label={{ value: 'Efficiency Score', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="efficiency" fill="hsl(var(--chart-1))" name="Efficiency Score" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Detailed Results Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Results</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Method</th>
                <th className="text-right p-2">Bits</th>
                <th className="text-right p-2">Compression</th>
                <th className="text-right p-2">Quality</th>
                <th className="text-right p-2">Size (MB)</th>
                <th className="text-right p-2">SNR (dB)</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 font-medium">{r.method}</td>
                  <td className="text-right p-2">{r.bitPrecision}</td>
                  <td className="text-right p-2">{r.compressionRatio.toFixed(1)}x</td>
                  <td className="text-right p-2">
                    <span className={`font-semibold ${
                      r.qualityRetained > 85 ? 'text-green-600' :
                      r.qualityRetained > 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {r.qualityRetained.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right p-2">{r.quantizedSizeMB.toFixed(3)}</td>
                  <td className="text-right p-2">{r.snr ? r.snr.toFixed(1) : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
