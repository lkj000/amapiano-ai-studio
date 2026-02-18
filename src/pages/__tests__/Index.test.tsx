import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: { subscribed: false, subscription_tier: 'free' },
        error: null,
      }),
    },
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe('Index Page', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User;

  it('renders hero section with title', () => {
    const { getByText } = renderWithRouter(<Index user={null} />);
    expect(getByText(/Create Authentic/i)).toBeInTheDocument();
  });

  it('shows sign-in CTA for unauthenticated users', () => {
    const { getByText } = renderWithRouter(<Index user={null} />);
    expect(getByText(/Join Social Network/i)).toBeInTheDocument();
  });

  it('shows explore CTA for authenticated users', () => {
    const { getAllByText } = renderWithRouter(<Index user={mockUser} />);
    expect(getAllByText(/Explore Social Feed/i).length).toBeGreaterThan(0);
  });

  it('renders feature cards', () => {
    const { getByText } = renderWithRouter(<Index user={null} />);
    expect(getByText('AI Music Generation')).toBeInTheDocument();
    expect(getByText('Professional DAW')).toBeInTheDocument();
    expect(getByText('Sample Library')).toBeInTheDocument();
  });

  it('renders stats section', () => {
    const { getByText } = renderWithRouter(<Index user={null} />);
    expect(getByText('10,000+')).toBeInTheDocument();
    expect(getByText('Authentic Samples')).toBeInTheDocument();
  });

  it('renders cultural heritage section', () => {
    const { getByText } = renderWithRouter(<Index user={null} />);
    expect(getByText(/Preserving South African Musical Heritage/i)).toBeInTheDocument();
  });

  it('renders without crashing with no user', () => {
    const { container } = renderWithRouter(<Index user={null} />);
    expect(container).toBeInTheDocument();
  });
});
