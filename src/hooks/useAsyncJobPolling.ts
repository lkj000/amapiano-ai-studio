import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface JobStatus {
  status: 'idle' | 'starting' | 'processing' | 'succeeded' | 'failed';
  jobId: string | null;
  result: any | null;
  error: string | null;
  progress: number; // 0-100
}

interface UseAsyncJobPollingOptions {
  functionName: string;
  pollIntervalMs?: number;
  maxPollAttempts?: number;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  onProgress?: (status: string) => void;
}

/**
 * Hook for handling async job polling with edge functions
 * Returns immediately with a job ID and polls for completion
 */
export const useAsyncJobPolling = ({
  functionName,
  pollIntervalMs = 3000,
  maxPollAttempts = 120, // 6 minutes max at 3s intervals
  onSuccess,
  onError,
  onProgress,
}: UseAsyncJobPollingOptions) => {
  const [jobStatus, setJobStatus] = useState<JobStatus>({
    status: 'idle',
    jobId: null,
    result: null,
    error: null,
    progress: 0,
  });

  const pollCountRef = useRef(0);
  const isPollingRef = useRef(false);

  const pollForStatus = useCallback(async (jobId: string) => {
    if (!isPollingRef.current) return;

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'check_status',
          jobId,
        },
      });

      if (error) throw error;

      pollCountRef.current++;
      const progress = Math.min(95, (pollCountRef.current / maxPollAttempts) * 100);

      if (data.status === 'succeeded') {
        isPollingRef.current = false;
        setJobStatus({
          status: 'succeeded',
          jobId,
          result: data,
          error: null,
          progress: 100,
        });
        onSuccess?.(data);
        return;
      }

      if (data.status === 'failed') {
        isPollingRef.current = false;
        const errorMsg = data.error || 'Job failed';
        setJobStatus({
          status: 'failed',
          jobId,
          result: null,
          error: errorMsg,
          progress: 0,
        });
        onError?.(errorMsg);
        return;
      }

      // Still processing
      setJobStatus(prev => ({
        ...prev,
        status: data.status,
        progress,
      }));
      onProgress?.(data.status);

      // Check if we've exceeded max attempts
      if (pollCountRef.current >= maxPollAttempts) {
        isPollingRef.current = false;
        const errorMsg = 'Job timed out after maximum attempts';
        setJobStatus({
          status: 'failed',
          jobId,
          result: null,
          error: errorMsg,
          progress: 0,
        });
        onError?.(errorMsg);
        return;
      }

      // Continue polling
      setTimeout(() => pollForStatus(jobId), pollIntervalMs);
    } catch (err) {
      console.error('[useAsyncJobPolling] Poll error:', err);
      // Retry on network errors
      if (pollCountRef.current < maxPollAttempts) {
        setTimeout(() => pollForStatus(jobId), pollIntervalMs * 2);
      }
    }
  }, [functionName, maxPollAttempts, pollIntervalMs, onSuccess, onError, onProgress]);

  const startJob = useCallback(async (body: Record<string, any>) => {
    pollCountRef.current = 0;
    isPollingRef.current = true;

    setJobStatus({
      status: 'starting',
      jobId: null,
      result: null,
      error: null,
      progress: 0,
    });

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
      });

      if (error) throw error;

      // If the function returns immediately with a result (sync mode)
      if (data.status === 'succeeded' && data.audioUrl) {
        isPollingRef.current = false;
        setJobStatus({
          status: 'succeeded',
          jobId: null,
          result: data,
          error: null,
          progress: 100,
        });
        onSuccess?.(data);
        return data;
      }

      // Async mode - got a job ID, start polling
      if (data.jobId) {
        setJobStatus(prev => ({
          ...prev,
          status: 'processing',
          jobId: data.jobId,
          progress: 5,
        }));
        
        // Start polling after a short delay
        setTimeout(() => pollForStatus(data.jobId), pollIntervalMs);
        return data;
      }

      // Unexpected response
      throw new Error('No job ID or result returned');
    } catch (err) {
      isPollingRef.current = false;
      const errorMsg = err instanceof Error ? err.message : 'Failed to start job';
      setJobStatus({
        status: 'failed',
        jobId: null,
        result: null,
        error: errorMsg,
        progress: 0,
      });
      onError?.(errorMsg);
      throw err;
    }
  }, [functionName, pollIntervalMs, pollForStatus, onSuccess, onError]);

  const cancelPolling = useCallback(() => {
    isPollingRef.current = false;
    setJobStatus(prev => ({
      ...prev,
      status: 'idle',
    }));
  }, []);

  const reset = useCallback(() => {
    isPollingRef.current = false;
    pollCountRef.current = 0;
    setJobStatus({
      status: 'idle',
      jobId: null,
      result: null,
      error: null,
      progress: 0,
    });
  }, []);

  return {
    jobStatus,
    startJob,
    cancelPolling,
    reset,
    isProcessing: ['starting', 'processing'].includes(jobStatus.status),
  };
};
