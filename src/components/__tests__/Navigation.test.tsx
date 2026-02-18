import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navigation from '../Navigation';
import type { User } from '@supabase/supabase-js';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: { subscribed: false, subscription_tier: 'free' },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        order: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
  },
}));

const renderNav = (user: User | null = null) =>
  render(
    <BrowserRouter>
      <Navigation user={user} />
    </BrowserRouter>
  );

describe('Navigation', () => {
  const mockUser = {
    id: 'test-user',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User;

  it('renders logo', () => {
    const { getByText } = renderNav();
    expect(getByText('Amapiano AI')).toBeInTheDocument();
  });

  it('shows sign in for unauthenticated users', () => {
    const { getByText } = renderNav(null);
    expect(getByText('Sign In')).toBeInTheDocument();
    expect(getByText('Get Started')).toBeInTheDocument();
  });

  it('shows user avatar for authenticated users', () => {
    const { getByText } = renderNav(mockUser);
    expect(getByText('T')).toBeInTheDocument();
  });

  it('renders mobile menu button', () => {
    const { getAllByRole } = renderNav();
    const buttons = getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
