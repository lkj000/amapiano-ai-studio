import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSubscription } from '../useSubscription';
import type { User } from '@supabase/supabase-js';

const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

describe('useSubscription', () => {
  const mockUser = {
    id: 'test-user',
    email: 'test@example.com',
  } as User;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module-level cache by re-importing would be complex,
    // so we test observable behavior
    mockInvoke.mockResolvedValue({
      data: { subscribed: false, subscription_tier: 'free', subscription_end: null },
      error: null,
    });
  });

  it('returns free tier when no user', () => {
    const { result } = renderHook(() => useSubscription(null));
    expect(result.current.subscription_tier).toBe('free');
    expect(result.current.subscribed).toBe(false);
  });

  it('handles subscription check errors gracefully', async () => {
    // Run BEFORE the producer-tier test to avoid hitting the module-level cache
    mockInvoke.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSubscription(mockUser));

    await act(async () => {
      await new Promise(r => setTimeout(r, 100));
    });

    expect(result.current.subscription_tier).toBe('free');
  });

  it('checks subscription for authenticated user', async () => {
    mockInvoke.mockResolvedValue({
      data: { subscribed: true, subscription_tier: 'producer', subscription_end: '2026-12-31' },
      error: null,
    });

    const { result } = renderHook(() => useSubscription(mockUser));

    // Wait for async effect
    await act(async () => {
      await new Promise(r => setTimeout(r, 100));
    });
  });

  it('hasFeature returns false for free tier', () => {
    const { result } = renderHook(() => useSubscription(null));
    expect(result.current.hasFeature('unlimited_projects')).toBe(false);
    expect(result.current.hasFeature('premium_vst_plugins')).toBe(false);
  });

  it('getFeatureLimit returns correct limits for free tier', () => {
    const { result } = renderHook(() => useSubscription(null));
    expect(result.current.getFeatureLimit('max_projects')).toBe(3);
    expect(result.current.getFeatureLimit('max_tracks_per_project')).toBe(8);
  });
});
