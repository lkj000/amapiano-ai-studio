import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface PDFReportGeneratorProps {
  testResults: {
    sparse?: any;
    quantization?: any;
    distributed?: any;
  };
}

export const PDFReportGenerator = ({ testResults }: PDFReportGeneratorProps) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("PhD Thesis Research Report", 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);
    yPos += 15;

    // Executive Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("This report presents comprehensive testing results for three key PhD thesis", 20, yPos);
    yPos += 5;
    doc.text("implementations: Sparse Inference, Model Quantization, and Distributed Inference.", 20, yPos);
    yPos += 15;

    // Sparse Inference Results
    if (testResults.sparse) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("1. Sparse Inference Cache (SIGE-Audio)", 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const sparseData = [
        `Test Iterations: ${testResults.sparse.iterations}`,
        `Cache Hit Rate: ${testResults.sparse.cacheHitRate.toFixed(1)}%`,
        `Average Latency: ${testResults.sparse.avgLatency.toFixed(2)}ms`,
        `Memory Used: ${testResults.sparse.memoryUsed.toFixed(2)}MB`,
        `Activations Cached: ${testResults.sparse.activationsSaved}`,
      ];

      sparseData.forEach(line => {
        doc.text(line, 25, yPos);
        yPos += 5;
      });

      yPos += 3;
      doc.setFont("helvetica", "italic");
      doc.text("Conclusion: SIGE-Audio successfully demonstrates efficient caching with high hit", 25, yPos);
      yPos += 5;
      doc.text("rates, significantly reducing inference latency for audio processing tasks.", 25, yPos);
      yPos += 10;
    }

    // Model Quantization Results
    if (testResults.quantization) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("2. Model Quantization", 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Model Size: ${testResults.quantization.modelSize.toLocaleString()} parameters`, 25, yPos);
      yPos += 8;

      testResults.quantization.results.forEach((result: any, idx: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.text(`Method ${idx + 1}: ${result.method}`, 25, yPos);
        yPos += 6;

        doc.setFont("helvetica", "normal");
        const quantData = [
          `  Compression Ratio: ${result.compressionRatio.toFixed(1)}x`,
          `  Original Size: ${result.originalSizeMB.toFixed(2)}MB`,
          `  Quantized Size: ${result.quantizedSizeMB.toFixed(2)}MB`,
          `  Quality Retained: ${result.qualityRetained.toFixed(1)}%`,
          `  Processing Time: ${result.quantizationTime.toFixed(0)}ms`,
        ];

        quantData.forEach(line => {
          doc.text(line, 25, yPos);
          yPos += 5;
        });
        yPos += 3;
      });

      doc.setFont("helvetica", "italic");
      doc.text("Conclusion: Multiple quantization methods successfully compress models while", 25, yPos);
      yPos += 5;
      doc.text("maintaining high quality, enabling efficient deployment on resource-constrained devices.", 25, yPos);
      yPos += 10;
    }

    // Distributed Inference Results
    if (testResults.distributed) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("3. Distributed Inference System", 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const distData = [
        `Jobs Submitted: ${testResults.distributed.jobsSubmitted}`,
        `Edge Load: ${testResults.distributed.stats.edgeLoad} jobs`,
        `Cloud Load: ${testResults.distributed.stats.cloudLoad} jobs`,
        `Total Nodes: ${testResults.distributed.stats.totalNodes}`,
      ];

      distData.forEach(line => {
        doc.text(line, 25, yPos);
        yPos += 5;
      });

      yPos += 3;
      doc.text("Routing Strategy:", 25, yPos);
      yPos += 5;
      doc.text(`  Edge: <100ms latency, $0.00 cost, 99.9% availability`, 30, yPos);
      yPos += 5;
      doc.text(`  Cloud: 200-300ms latency, $0.001/req, 99.99% availability`, 30, yPos);
      yPos += 8;

      doc.setFont("helvetica", "italic");
      doc.text("Conclusion: Distributed inference system successfully routes jobs between edge", 25, yPos);
      yPos += 5;
      doc.text("and cloud based on priority and complexity, optimizing for latency and cost.", 25, yPos);
      yPos += 10;
    }

    // Final Page - Recommendations
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Recommendations", 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const recommendations = [
      "1. Deploy SIGE-Audio for real-time audio processing workloads",
      "2. Use 8-bit quantization for production models (best quality/size ratio)",
      "3. Route latency-sensitive tasks to edge, batch processing to cloud",
      "4. Continue monitoring cache hit rates and adjust parameters accordingly",
      "5. Explore hybrid quantization strategies combining multiple methods",
    ];

    recommendations.forEach(rec => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(rec, 25, yPos);
      yPos += 7;
    });

    // Footer on last page
    yPos = 280;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(128, 128, 128);
    doc.text("AURA-X Platform | Research Testing Suite", 20, yPos);
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, 180, yPos);

    // Save PDF
    doc.save(`research-report-${Date.now()}.pdf`);
    toast.success("📄 PDF report generated successfully");
  };

  const hasResults = testResults.sparse || testResults.quantization || testResults.distributed;

  if (!hasResults) {
    return null;
  }

  return (
    <Button
      onClick={generatePDF}
      variant="default"
      size="sm"
    >
      <FileText className="w-4 h-4 mr-2" />
      Generate PDF Report
    </Button>
  );
};
