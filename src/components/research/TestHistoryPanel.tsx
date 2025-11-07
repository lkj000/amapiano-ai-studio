import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Trash2, GitCompare, Calendar } from "lucide-react";
import { useTestHistory } from "@/hooks/useTestHistory";
import { format } from "date-fns";

interface TestHistoryPanelProps {
  onCompare?: (test1Id: string, test2Id: string) => void;
  onLoadTest?: (testResults: any) => void;
}

export const TestHistoryPanel = ({ onCompare, onLoadTest }: TestHistoryPanelProps) => {
  const { history, isLoading, deleteEntry } = useTestHistory();
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  const toggleTestSelection = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId].slice(-2) // Keep only last 2 selections
    );
  };

  const handleCompare = () => {
    if (selectedTests.length === 2 && onCompare) {
      onCompare(selectedTests[0], selectedTests[1]);
    }
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'sparse': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'quantization': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'distributed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'full_suite': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading test history...</p>
        </div>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <History className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground">No test history yet</p>
          <p className="text-sm text-muted-foreground">Run tests to start building your history</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Test History</h3>
          <p className="text-sm text-muted-foreground">
            {history.length} test{history.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        {selectedTests.length === 2 && (
          <Button onClick={handleCompare} size="sm">
            <GitCompare className="w-4 h-4 mr-2" />
            Compare Selected
          </Button>
        )}
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-3">
          {history.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                selectedTests.includes(entry.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/30 hover:bg-muted/50'
              }`}
              onClick={() => toggleTestSelection(entry.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getTestTypeColor(entry.test_type)}>
                    {entry.test_type}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(entry.test_date), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteEntry(entry.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {entry.notes && (
                <p className="text-xs text-muted-foreground mb-2">{entry.notes}</p>
              )}

              <div className="grid grid-cols-3 gap-2 text-xs">
                {Object.entries(entry.summary_metrics).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="p-2 bg-background rounded">
                    <p className="text-muted-foreground truncate">{key}</p>
                    <p className="font-semibold text-foreground">
                      {typeof value === 'number' ? value.toFixed(2) : String(value)}
                    </p>
                  </div>
                ))}
              </div>

              {onLoadTest && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLoadTest(entry.test_results);
                  }}
                >
                  Load Results
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
