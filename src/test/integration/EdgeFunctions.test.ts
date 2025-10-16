import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('Edge Functions Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ai-music-generation', () => {
    it('handles successful generation', async () => {
      const mockResponse = {
        data: { audioUrl: 'https://example.com/audio.mp3', success: true },
        error: null,
      };
      
      vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse);
      
      const result = await supabase.functions.invoke('ai-music-generation', {
        body: { prompt: 'Test prompt', type: 'full' },
      });
      
      expect(result.data).toEqual(mockResponse.data);
      expect(result.error).toBeNull();
    });

    it('handles rate limit error (429)', async () => {
      const mockError = {
        data: null,
        error: { status: 429, message: 'Rate limit exceeded' },
      };
      
      vi.mocked(supabase.functions.invoke).mockResolvedValue(mockError);
      
      const result = await supabase.functions.invoke('ai-music-generation', {
        body: { prompt: 'Test prompt' },
      });
      
      expect(result.error).toBeDefined();
      expect(result.error?.status).toBe(429);
    });

    it('handles credit exhaustion (402)', async () => {
      const mockError = {
        data: null,
        error: { status: 402, message: 'Payment required' },
      };
      
      vi.mocked(supabase.functions.invoke).mockResolvedValue(mockError);
      
      const result = await supabase.functions.invoke('ai-music-generation', {
        body: { prompt: 'Test prompt' },
      });
      
      expect(result.error).toBeDefined();
      expect(result.error?.status).toBe(402);
    });
  });

  describe('check-subscription', () => {
    it('returns subscription status', async () => {
      const mockResponse = {
        data: { tier: 'free', isActive: true },
        error: null,
      };
      
      vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse);
      
      const result = await supabase.functions.invoke('check-subscription');
      
      expect(result.data?.tier).toBe('free');
      expect(result.error).toBeNull();
    });
  });

  describe('aura-conductor-orchestration', () => {
    it('handles preset generation', async () => {
      const mockResponse = {
        data: {
          presets: [
            { name: 'Kick', parameters: { frequency: 60 } },
          ],
        },
        error: null,
      };
      
      vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse);
      
      const result = await supabase.functions.invoke('aura-conductor-orchestration', {
        body: { action: 'generate_presets', genre: 'amapiano' },
      });
      
      expect(result.data?.presets).toBeDefined();
      expect(Array.isArray(result.data?.presets)).toBe(true);
    });
  });
});
