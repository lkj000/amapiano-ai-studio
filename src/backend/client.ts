import { supabase } from '@/integrations/supabase/client';
import type { DawProjectData, DawTrack, MidiNote } from '@/types/daw';
import { toast } from 'sonner';

// Helper function to refresh session and retry operation
async function retryWithRefresh<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Check if it's a JWT expiry error
    if (error?.code === 'PGRST301' || error?.code === 'PGRST303' || 
        error?.message?.includes('JWT expired') || error?.message?.includes('JWT') ||
        error?.message?.includes('invalid JWT')) {
      
      console.log('JWT error detected, attempting to refresh session...');
      toast.info('Refreshing session...');
      
      // Try to refresh the session
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !data.session) {
        console.error('Session refresh failed:', refreshError);
        toast.error('Session expired. Please log in again.');
        // Redirect to auth page after a delay
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
        throw new Error('Session expired. Please log in again.');
      }
      
      console.log('Session refreshed successfully, retrying operation...');
      // Retry the operation with refreshed session
      return await operation();
    }
    throw error;
  }
}

export interface ProjectResponse {
  projectId: string;
  name: string;
  version: number;
  lastSaved: string;
}

export interface LoadProjectResponse {
  projectData: DawProjectData;
  name: string;
  version: number;
}

export interface ListProjectsResponse {
  projects: Array<{
    id: string;
    name: string;
    version: number;
    bpm: number;
    keySignature: string;
    updatedAt: string;
  }>;
}

export interface GenerateElementResponse {
  newTrack: DawTrack;
}

const backend = {
  music: {
    async saveProject(data: {
      name: string;
      projectData: DawProjectData;
      projectId?: string;
    }): Promise<ProjectResponse> {
      return retryWithRefresh(async () => {
        try {
          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('Authentication required to save projects');
          }

          const upsertData: any = {
            name: data.name,
            bpm: data.projectData.bpm,
            key_signature: data.projectData.keySignature,
            time_signature: data.projectData.timeSignature || '4/4',
            project_data: data.projectData,
            updated_at: new Date().toISOString(),
            user_id: user.id, // Add user_id for RLS policy
          };

          if (data.projectId) {
            upsertData.id = data.projectId;
          }

          const { data: result, error } = await supabase
            .from('daw_projects')
            .upsert(upsertData)
            .select('id, name, version, updated_at')
            .single();

          if (error) throw error;

          return {
            projectId: result.id,
            name: result.name,
            version: result.version || 1,
            lastSaved: result.updated_at,
          };
        } catch (error) {
          console.error('Save project error:', error);
          throw new Error(error.message || 'Failed to save project');
        }
      });
    },

    async loadProject(data: { projectId: string }): Promise<LoadProjectResponse> {
      return retryWithRefresh(async () => {
        try {
          const { data: result, error } = await supabase
            .from('daw_projects')
            .select('*')
            .eq('id', data.projectId)
            .single();

          if (error) throw error;

          return {
            projectData: (result.project_data as unknown) as DawProjectData,
            name: result.name,
            version: result.version || 1,
          };
        } catch (error) {
          console.error('Load project error:', error);
          throw new Error('Failed to load project');
        }
      });
    },

    async listProjects(): Promise<ListProjectsResponse> {
      return retryWithRefresh(async () => {
        try {
          const { data: result, error } = await supabase
            .from('daw_projects')
            .select('id, name, version, bpm, key_signature, updated_at')
            .order('updated_at', { ascending: false });

          if (error) throw error;

          return {
            projects: result.map(project => ({
              id: project.id,
              name: project.name,
              version: project.version || 1,
              bpm: project.bpm,
              keySignature: project.key_signature,
              updatedAt: project.updated_at,
            })),
          };
        } catch (error) {
          console.error('List projects error:', error);
          throw new Error('Failed to list projects');
        }
      });
    },

    async generateDawElement(data: {
      prompt: string;
      trackType: 'midi' | 'audio';
    }): Promise<GenerateElementResponse> {
      try {
        const { data: result, error } = await supabase.functions.invoke('ai-music-generation', {
          body: {
            prompt: data.prompt,
            trackType: data.trackType,
          },
        });

        if (error) throw error;
        if (!result.success) throw new Error(result.error);

        // Convert AI response to DawTrack format
        const newTrack: DawTrack = data.trackType === 'midi' ? {
          id: `track_${Date.now()}`,
          type: 'midi',
          name: result.data.metadata?.name || 'AI Generated Track',
          instrument: result.data.instrument || 'Synthesizer',
          clips: result.data.pattern ? [{
            id: `clip_${Date.now()}`,
            name: 'AI Generated Clip',
            startTime: 0,
            duration: 4,
            notes: result.data.pattern.notes || [],
          }] : [],
          mixer: {
            volume: 0.8,
            pan: 0,
            isMuted: false,
            isSolo: false,
            effects: [],
          },
          isArmed: false,
          color: 'bg-purple-500',
        } : {
          id: `track_${Date.now()}`,
          type: 'audio',
          name: result.data.metadata?.name || 'AI Generated Track',
          clips: result.data.audioUrl ? [{
            id: `clip_${Date.now()}`,
            name: 'AI Generated Clip',
            startTime: 0,
            duration: 4,
            audioUrl: result.data.audioUrl,
          }] : [],
          mixer: {
            volume: 0.8,
            pan: 0,
            isMuted: false,
            isSolo: false,
            effects: [],
          },
          isArmed: false,
          color: 'bg-purple-500',
        };

        return { newTrack };
      } catch (error) {
        console.error('Generate element error:', error);
        throw new Error('Failed to generate AI content');
      }
    },
  },
};

export default backend;