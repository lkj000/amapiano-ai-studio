import { useState, useCallback, useEffect } from "react";
import { DistributedInferenceCoordinator, InferenceJob } from "@/lib/research/DistributedInferenceCoordinator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDistributedInference = () => {
  const [coordinator] = useState(() => new DistributedInferenceCoordinator());
  const [jobs, setJobs] = useState<InferenceJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState({
    totalNodes: 0,
    edgeNodes: 0,
    cloudNodes: 0,
    edgeLoad: 0,
    cloudLoad: 0,
    totalLoad: 0
  });

  useEffect(() => {
    // Set user ID when available
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        coordinator.setUserId(user.id);
        setIsInitialized(true);
        console.log('[DistriFusion] Coordinator initialized for user:', user.id);
      }
    });

    // Update stats periodically
    const statsInterval = setInterval(() => {
      setStats(coordinator.getStats());
    }, 1000);

    return () => {
      clearInterval(statsInterval);
    };
  }, [coordinator]);

  const submitJob = useCallback(
    async (
      type: string,
      inputData: any,
      priority: number = 5
    ): Promise<string | null> => {
      setIsProcessing(true);
      
      try {
        const jobId = await coordinator.submitJob(type, inputData, priority);
        
        toast.success(`Job ${jobId.substring(0, 8)} submitted successfully`);
        
        // Poll for job completion
        const checkJob = async () => {
          const job = await coordinator.getJobStatus(jobId);
          if (job) {
            if (job.status === 'completed') {
              setJobs(prev => [...prev, job]);
              toast.success(`Job completed on ${job.metrics?.latency}ms`);
              setIsProcessing(false);
              return;
            } else if (job.status === 'failed') {
              toast.error('Job failed');
              setIsProcessing(false);
              return;
            }
          }
          setTimeout(checkJob, 1000);
        };
        
        checkJob();
        
        return jobId;
      } catch (error) {
        console.error('Failed to submit job:', error);
        toast.error('Failed to submit inference job');
        setIsProcessing(false);
        return null;
      }
    },
    [coordinator]
  );

  const getJobStatus = useCallback(
    async (jobId: string): Promise<InferenceJob | null> => {
      return coordinator.getJobStatus(jobId);
    },
    [coordinator]
  );

  const getUserJobs = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('distributed_inference_jobs')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch jobs:', error);
      return [];
    }

    return data.map(job => ({
      id: job.id,
      type: job.job_type,
      status: job.status as any,
      priority: job.priority,
      inputData: job.input_data,
      outputData: job.output_data,
      metrics: job.metrics as any
    }));
  }, []);

  const getRoutingDecisions = useCallback(() => {
    return {
      edge: {
        latency: '< 100ms',
        cost: '$0.00',
        availability: '99.9%'
      },
      cloud: {
        latency: '200-300ms',
        cost: '$0.001/request',
        availability: '99.99%'
      }
    };
  }, []);

  return {
    submitJob,
    getJobStatus,
    getUserJobs,
    getRoutingDecisions,
    jobs,
    isProcessing,
    isInitialized,
    stats
  };
};
