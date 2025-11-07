import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface ThesisDataExporterProps {
  thesisData: {
    sigeAudio?: any;
    nunchakuAudio?: any;
    distriFusionAudio?: any;
    validationStats?: any;
  };
}

export const ThesisDataExporter = ({ thesisData }: ThesisDataExporterProps) => {
  const exportAsJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      thesisTitle: "Full-stack co-design for efficient, culturally-aware music generation",
      year: "Year 3 of 4",
      overallProgress: {
        completion: 62,
        confidence: 70,
        objectivesValidated: "1/3",
        researchImpact: "High"
      },
      pillars: thesisData
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `thesis-data-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Thesis data exported as JSON");
  };

  const exportAsCSV = () => {
    const rows: string[] = [];
    
    // Header
    rows.push("Pillar,Metric,Value,Status");

    // SIGE-Audio
    if (thesisData.sigeAudio) {
      rows.push(`SIGE-Audio,Cache Hit Rate,${thesisData.sigeAudio.cacheHitRate || 'N/A'},${thesisData.sigeAudio.validated ? 'Validated' : 'Pending'}`);
      rows.push(`SIGE-Audio,Avg Latency,${thesisData.sigeAudio.avgLatency || 'N/A'}ms,${thesisData.sigeAudio.validated ? 'Validated' : 'Pending'}`);
    }

    // Nunchaku-Audio
    if (thesisData.nunchakuAudio) {
      rows.push(`Nunchaku-Audio,Quality Retention,${thesisData.nunchakuAudio.qualityRetention || 'N/A'}%,${thesisData.nunchakuAudio.validated ? 'Validated' : 'Pivot Required'}`);
      rows.push(`Nunchaku-Audio,Compression Ratio,${thesisData.nunchakuAudio.compressionRatio || 'N/A'}x,${thesisData.nunchakuAudio.validated ? 'Validated' : 'Pivot Required'}`);
    }

    // DistriFusion-Audio
    if (thesisData.distriFusionAudio) {
      rows.push(`DistriFusion-Audio,Edge Load,${thesisData.distriFusionAudio.edgeLoad || 0},${thesisData.distriFusionAudio.validated ? 'Validated' : 'Debugging'}`);
      rows.push(`DistriFusion-Audio,Cloud Load,${thesisData.distriFusionAudio.cloudLoad || 0},${thesisData.distriFusionAudio.validated ? 'Validated' : 'Debugging'}`);
    }

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `thesis-data-export-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Thesis data exported as CSV");
  };

  const exportAsPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text("Doctoral Thesis Progress Report", 20, 20);
    
    doc.setFontSize(12);
    doc.text("Full-stack co-design for efficient, culturally-aware music generation", 20, 30);
    doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 38);

    let yPos = 50;

    // SIGE-Audio
    doc.setFontSize(14);
    doc.text("SIGE-Audio: Sparse Inference", 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    if (thesisData.sigeAudio) {
      doc.text(`Status: ${thesisData.sigeAudio.validated ? 'Validated ✓' : 'Pending'}`, 20, yPos);
      yPos += 6;
      doc.text(`Cache Hit Rate: ${thesisData.sigeAudio.cacheHitRate || 'N/A'}%`, 20, yPos);
      yPos += 6;
      doc.text(`Avg Latency: ${thesisData.sigeAudio.avgLatency || 'N/A'}ms`, 20, yPos);
      yPos += 10;
    }

    // Nunchaku-Audio
    doc.setFontSize(14);
    doc.text("Nunchaku-Audio: Quantization", 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    if (thesisData.nunchakuAudio) {
      doc.text(`Status: ${thesisData.nunchakuAudio.validated ? 'Validated ✓' : 'Pivot Required ⚠'}`, 20, yPos);
      yPos += 6;
      doc.text(`Quality Retention: ${thesisData.nunchakuAudio.qualityRetention || 'N/A'}%`, 20, yPos);
      yPos += 6;
      doc.text(`Compression Ratio: ${thesisData.nunchakuAudio.compressionRatio || 'N/A'}x`, 20, yPos);
      yPos += 10;
    }

    // DistriFusion-Audio
    doc.setFontSize(14);
    doc.text("DistriFusion-Audio: Distributed System", 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    if (thesisData.distriFusionAudio) {
      doc.text(`Status: ${thesisData.distriFusionAudio.validated ? 'Validated ✓' : 'Debugging 🔧'}`, 20, yPos);
      yPos += 6;
      doc.text(`Edge Load: ${thesisData.distriFusionAudio.edgeLoad || 0}`, 20, yPos);
      yPos += 6;
      doc.text(`Cloud Load: ${thesisData.distriFusionAudio.cloudLoad || 0}`, 20, yPos);
    }

    doc.save(`thesis-progress-report-${Date.now()}.pdf`);
    toast.success("Thesis progress report exported as PDF");
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Export Thesis Data</h3>
      <div className="flex gap-2 flex-wrap">
        <Button onClick={exportAsJSON} variant="outline" size="sm">
          <FileJson className="w-4 h-4 mr-2" />
          JSON
        </Button>
        <Button onClick={exportAsCSV} variant="outline" size="sm">
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          CSV
        </Button>
        <Button onClick={exportAsPDF} variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          PDF Report
        </Button>
      </div>
    </Card>
  );
};
