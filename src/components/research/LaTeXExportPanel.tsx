import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTestHistory } from "@/hooks/useTestHistory";

interface LaTeXExportPanelProps {
  selectedTests?: string[];
}

export const LaTeXExportPanel = ({ selectedTests = [] }: LaTeXExportPanelProps) => {
  const { toast } = useToast();
  const { history } = useTestHistory();
  const [config, setConfig] = useState({
    documentClass: "article",
    includeCharts: true,
    includeRawData: false,
    tableStyle: "booktabs",
    author: "",
    title: "Research Test Results",
  });

  const generateLaTeX = () => {
    const tests = selectedTests.length > 0
      ? history.filter(t => selectedTests.includes(t.id))
      : history;

    let latex = `\\documentclass{${config.documentClass}}
\\usepackage{${config.tableStyle}}
\\usepackage{graphicx}
\\usepackage{float}
\\usepackage{hyperref}
\\usepackage{amsmath}

\\title{${config.title}}
${config.author ? `\\author{${config.author}}` : ''}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
This document presents the results of ${tests.length} research test${tests.length > 1 ? 's' : ''} conducted on AI inference optimization techniques, including sparse inference, model quantization, and distributed inference.
\\end{abstract}

\\section{Introduction}

This report summarizes the performance metrics and analysis of various AI inference optimization techniques tested between ${tests.length > 0 ? new Date(tests[0].test_date).toLocaleDateString() : 'N/A'} and ${tests.length > 0 ? new Date(tests[tests.length - 1].test_date).toLocaleDateString() : 'N/A'}.

\\section{Test Results}

`;

    tests.forEach((test, idx) => {
      latex += `\\subsection{Test ${idx + 1}: ${test.test_type}}

\\textbf{Date:} ${new Date(test.test_date).toLocaleString()}

\\textbf{Summary Metrics:}

`;

      if (test.summary_metrics) {
        latex += `\\begin{table}[H]
\\centering
\\begin{tabular}{lr}
\\toprule
\\textbf{Metric} & \\textbf{Value} \\\\
\\midrule
`;
        Object.entries(test.summary_metrics).forEach(([key, value]) => {
          latex += `${key.replace(/_/g, ' ')} & ${typeof value === 'number' ? value.toFixed(2) : value} \\\\\n`;
        });
        latex += `\\bottomrule
\\end{tabular}
\\caption{Summary metrics for ${test.test_type} test}
\\end{table}

`;
      }

      if (test.notes) {
        latex += `\\textbf{Notes:} ${test.notes}

`;
      }

      if (config.includeRawData && test.test_results) {
        latex += `\\subsubsection{Raw Data}

\\begin{verbatim}
${JSON.stringify(test.test_results, null, 2).substring(0, 500)}...
\\end{verbatim}

`;
      }
    });

    latex += `\\section{Conclusions}

The tests demonstrate various performance characteristics across different inference optimization techniques. Key findings include:

\\begin{itemize}
  \\item Sparse inference showed significant latency improvements
  \\item Model quantization achieved high compression ratios while maintaining quality
  \\item Distributed inference demonstrated effective load balancing
\\end{itemize}

\\section{Future Work}

Further investigation is recommended in the following areas:
\\begin{enumerate}
  \\item Long-term stability analysis
  \\item Production deployment considerations
  \\item Integration with existing ML pipelines
\\end{enumerate}

\\end{document}
`;

    return latex;
  };

  const handleDownload = () => {
    const latex = generateLaTeX();
    const blob = new Blob([latex], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `research-results-${Date.now()}.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "LaTeX Exported",
      description: "Research results have been exported to LaTeX format",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">LaTeX Research Export</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Export test results to LaTeX format for academic papers and research documentation
        </p>
      </Card>

      {/* Configuration */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Export Configuration</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="author">Author(s)</Label>
            <Input
              id="author"
              value={config.author}
              onChange={(e) => setConfig({ ...config, author: e.target.value })}
              placeholder="Your Name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="docClass">Document Class</Label>
            <Select
              value={config.documentClass}
              onValueChange={(value) => setConfig({ ...config, documentClass: value })}
            >
              <SelectTrigger id="docClass" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="paper">Paper</SelectItem>
                <SelectItem value="thesis">Thesis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tableStyle">Table Style</Label>
            <Select
              value={config.tableStyle}
              onValueChange={(value) => setConfig({ ...config, tableStyle: value })}
            >
              <SelectTrigger id="tableStyle" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="booktabs">Booktabs (Recommended)</SelectItem>
                <SelectItem value="tabular">Tabular</SelectItem>
                <SelectItem value="longtable">Long Table</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="charts">Include Chart References</Label>
            <Switch
              id="charts"
              checked={config.includeCharts}
              onCheckedChange={(checked) =>
                setConfig({ ...config, includeCharts: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="rawData">Include Raw Data</Label>
            <Switch
              id="rawData"
              checked={config.includeRawData}
              onCheckedChange={(checked) =>
                setConfig({ ...config, includeRawData: checked })
              }
            />
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={handleDownload} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download LaTeX File
          </Button>
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Preview</h4>
        <Textarea
          value={generateLaTeX().substring(0, 1000) + "\n...\n(truncated for preview)"}
          readOnly
          className="font-mono text-xs h-96"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Selected tests: {selectedTests.length > 0 ? selectedTests.length : 'All'}
        </p>
      </Card>
    </div>
  );
};

export default LaTeXExportPanel;
