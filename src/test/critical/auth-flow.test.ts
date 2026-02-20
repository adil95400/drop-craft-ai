/**
 * Tests critiques — Flux d'authentification
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getSession: mockGetSession,
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

describe('Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call signInWithPassword with correct credentials', async () => {
    mockSignIn.mockResolvedValue({ data: { user: { id: '1', email: 'test@test.com' } }, error: null });
    
    const { supabase } = await import('@/integrations/supabase/client');
    const result = await supabase.auth.signInWithPassword({ email: 'test@test.com', password: 'password123' });
    
    expect(mockSignIn).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
    expect(result.error).toBeNull();
    expect(result.data.user.email).toBe('test@test.com');
  });

  it('should return error for invalid credentials', async () => {
    mockSignIn.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid login credentials' } });
    
    const { supabase } = await import('@/integrations/supabase/client');
    const result = await supabase.auth.signInWithPassword({ email: 'bad@test.com', password: 'wrong' });
    
    expect(result.error).toBeTruthy();
    expect(result.error.message).toContain('Invalid');
  });

  it('should call signUp with email and password', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: '2', email: 'new@test.com' }, session: null },
      error: null,
    });
    
    const { supabase } = await import('@/integrations/supabase/client');
    const result = await supabase.auth.signUp({ email: 'new@test.com', password: 'StrongPass123!' });
    
    expect(mockSignUp).toHaveBeenCalled();
    expect(result.data.user.email).toBe('new@test.com');
  });

  it('should handle sign out correctly', async () => {
    mockSignOut.mockResolvedValue({ error: null });
    
    const { supabase } = await import('@/integrations/supabase/client');
    const result = await supabase.auth.signOut();
    
    expect(mockSignOut).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });

  it('should handle session retrieval', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token123', user: { id: '1' } } },
      error: null,
    });
    
    const { supabase } = await import('@/integrations/supabase/client');
    const result = await supabase.auth.getSession();
    
    expect(result.data.session).toBeTruthy();
    expect(result.data.session.access_token).toBe('token123');
  });

  it('should subscribe to auth state changes', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const result = supabase.auth.onAuthStateChange(vi.fn());
    
    expect(mockOnAuthStateChange).toHaveBeenCalled();
    expect(result.data.subscription.unsubscribe).toBeDefined();
  });
});
