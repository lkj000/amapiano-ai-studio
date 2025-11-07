import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TestHistoryEntry {
  id: string;
  user_id: string;
  test_date: string;
  test_type: string;
  test_results: any;
  summary_metrics: any;
  notes: string | null;
  created_at: string;
}

export const useTestHistory = () => {
  const [history, setHistory] = useState<TestHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = useCallback(async (testType?: string) => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to view test history");
        return;
      }

      let query = supabase
        .from('test_history')
        .select('*')
        .eq('user_id', user.id)
        .order('test_date', { ascending: false })
        .limit(50);

      if (testType) {
        query = query.eq('test_type', testType);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching test history:", error);
        toast.error("Failed to fetch test history");
        return;
      }

      setHistory(data || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveTestResults = useCallback(
    async (
      testType: string,
      testResults: any,
      summaryMetrics: any,
      notes?: string
    ) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in to save test results");
          return null;
        }

        const { data, error } = await supabase
          .from('test_history')
          .insert([
            {
              user_id: user.id,
              test_type: testType,
              test_results: testResults,
              summary_metrics: summaryMetrics,
              notes: notes || null
            }
          ])
          .select()
          .single();

        if (error) {
          console.error("Error saving test results:", error);
          toast.error("Failed to save test results");
          return null;
        }

        toast.success("Test results saved to history");
        await fetchHistory();
        return data;
      } catch (error) {
        console.error("Error saving test results:", error);
        toast.error("Failed to save test results");
        return null;
      }
    },
    [fetchHistory]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from('test_history')
          .delete()
          .eq('id', id);

        if (error) {
          console.error("Error deleting test entry:", error);
          toast.error("Failed to delete test entry");
          return false;
        }

        toast.success("Test entry deleted");
        await fetchHistory();
        return true;
      } catch (error) {
        console.error("Error deleting test entry:", error);
        toast.error("Failed to delete test entry");
        return false;
      }
    },
    [fetchHistory]
  );

  const compareTests = useCallback(
    (testId1: string, testId2: string) => {
      const test1 = history.find(t => t.id === testId1);
      const test2 = history.find(t => t.id === testId2);

      if (!test1 || !test2) {
        toast.error("One or both tests not found");
        return null;
      }

      return {
        test1,
        test2,
        improvements: calculateImprovements(test1.summary_metrics, test2.summary_metrics)
      };
    },
    [history]
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    fetchHistory,
    saveTestResults,
    deleteEntry,
    compareTests
  };
};

function calculateImprovements(metrics1: any, metrics2: any) {
  const improvements: Record<string, number> = {};
  
  Object.keys(metrics1).forEach(key => {
    if (typeof metrics1[key] === 'number' && typeof metrics2[key] === 'number') {
      const change = ((metrics2[key] - metrics1[key]) / metrics1[key]) * 100;
      improvements[key] = change;
    }
  });

  return improvements;
}
