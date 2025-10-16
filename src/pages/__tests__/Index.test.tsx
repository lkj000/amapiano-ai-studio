import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Index from '../Index';
import type { User } from '@supabase/supabase-js';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Index Page', () => {
  const mockUser: Partial<User> = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  it('renders landing page content', () => {
    const { getByRole } = render(
      <BrowserRouter>
        <Index user={mockUser as User} />
      </BrowserRouter>
    );
    
    // Check for key landing page elements
    expect(getByRole('banner')).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <Index user={null} />
      </BrowserRouter>
    );
    
    expect(container).toBeInTheDocument();
  });
});
