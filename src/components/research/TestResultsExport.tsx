import { Button } from "@/components/ui/button";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface TestResultsExportProps {
  testResults: {
    sparse?: any;
    quantization?: any;
    distributed?: any;
  };
}

export const TestResultsExport = ({ testResults }: TestResultsExportProps) => {
  const exportAsJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      testSuite: "PhD Thesis Research Testing",
      results: testResults
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `research-test-results-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Test results exported as JSON");
  };

  const exportAsCSV = () => {
    const rows: string[] = [];
    
    // Header
    rows.push("Test Type,Metric,Value,Unit");

    // Sparse Inference
    if (testResults.sparse) {
      const { results, summary } = testResults.sparse;
      // Use raw iteration data for accurate cache hit rate
      const totalIterations = results?.length || 0;
      const cachedHits = results?.filter((r: any) => r.cached).length || 0;
      const actualCacheHitRate = totalIterations > 0 ? (cachedHits / totalIterations) * 100 : 0;
      const avgLatency = totalIterations > 0 
        ? results.reduce((sum: number, r: any) => sum + r.latency, 0) / totalIterations 
        : 0;

      rows.push(`Sparse Inference,Iterations,${totalIterations},count`);
      rows.push(`Sparse Inference,Cache Hit Rate,${actualCacheHitRate.toFixed(2)},percent`);
      rows.push(`Sparse Inference,Avg Latency,${avgLatency.toFixed(2)},ms`);
      rows.push(`Sparse Inference,Memory Used,${summary?.memorySizeMB?.toFixed(2) || '0.00'},MB`);
    }

    // Model Quantization
    if (testResults.quantization) {
      testResults.quantization.results.forEach((result: any, idx: number) => {
        rows.push(`Quantization ${idx + 1},Method,${result.method},`);
        rows.push(`Quantization ${idx + 1},Compression Ratio,${result.compressionRatio.toFixed(2)},x`);
        rows.push(`Quantization ${idx + 1},Quality Retained,${result.qualityRetained.toFixed(2)},percent`);
        rows.push(`Quantization ${idx + 1},Quantized Size,${result.quantizedSizeMB.toFixed(2)},MB`);
      });
    }

    // Distributed Inference
    if (testResults.distributed) {
      rows.push(`Distributed Inference,Jobs Submitted,${testResults.distributed.jobsSubmitted},count`);
      rows.push(`Distributed Inference,Edge Load,${testResults.distributed.stats.edgeLoad},count`);
      rows.push(`Distributed Inference,Cloud Load,${testResults.distributed.stats.cloudLoad},count`);
    }

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `research-test-results-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Test results exported as CSV");
  };

  const hasResults = testResults.sparse || testResults.quantization || testResults.distributed;

  if (!hasResults) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={exportAsJSON}
        variant="outline"
        size="sm"
      >
        <FileJson className="w-4 h-4 mr-2" />
        Export JSON
      </Button>
      <Button
        onClick={exportAsCSV}
        variant="outline"
        size="sm"
      >
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
};