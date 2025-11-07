import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useTestHistory, TestHistoryEntry } from "@/hooks/useTestHistory";

interface TestComparisonPanelProps {
  test1Id: string;
  test2Id: string;
}

export const TestComparisonPanel = ({ test1Id, test2Id }: TestComparisonPanelProps) => {
  const { compareTests } = useTestHistory();
  
  const comparison = compareTests(test1Id, test2Id);

  if (!comparison) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Unable to compare tests</p>
      </Card>
    );
  }

  const { test1, test2, improvements } = comparison;

  const renderMetricComparison = (key: string, value1: any, value2: any, improvement: number) => {
    const isImprovement = improvement > 0;
    const isRegression = improvement < 0;
    const Icon = isImprovement ? ArrowUp : isRegression ? ArrowDown : Minus;
    const color = isImprovement ? 'text-green-500' : isRegression ? 'text-red-500' : 'text-muted-foreground';

    return (
      <div key={key} className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm font-medium text-foreground mb-2">{key}</p>
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <p className="text-xs text-muted-foreground">Test 1</p>
            <p className="text-lg font-bold text-foreground">
              {typeof value1 === 'number' ? value1.toFixed(2) : String(value1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Test 2</p>
            <p className="text-lg font-bold text-foreground">
              {typeof value2 === 'number' ? value2.toFixed(2) : String(value2)}
            </p>
          </div>
        </div>
        {improvement !== 0 && (
          <div className={`flex items-center gap-1 ${color}`}>
            <Icon className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {Math.abs(improvement).toFixed(1)}% {isImprovement ? 'improvement' : 'regression'}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Test Comparison</h3>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <Badge variant="outline" className="mb-2">Test 1</Badge>
          <p className="text-sm font-semibold text-foreground">{test1.test_type}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(test1.test_date).toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <Badge variant="outline" className="mb-2">Test 2</Badge>
          <p className="text-sm font-semibold text-foreground">{test2.test_type}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(test2.test_date).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {Object.keys(test1.summary_metrics).map(key => 
          renderMetricComparison(
            key,
            test1.summary_metrics[key],
            test2.summary_metrics[key],
            improvements[key] || 0
          )
        )}
      </div>

      <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <p className="text-sm font-semibold text-foreground mb-2">Summary</p>
        <p className="text-xs text-muted-foreground">
          {Object.values(improvements).filter(v => v > 0).length} metrics improved, 
          {' '}{Object.values(improvements).filter(v => v < 0).length} regressed
        </p>
      </div>
    </Card>
  );
};
