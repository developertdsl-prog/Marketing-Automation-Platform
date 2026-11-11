import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import LoginPage from './page';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => '/auth/login'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock the auth store
vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    setAuth: vi.fn(),
    user: null,
    isAuthenticated: false,
    isLoading: false,
  })),
}));

// Mock the API client
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

const mockSetAuth = vi.fn();
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'MEMBER',
          organization: { id: 'org-1', name: 'Test Org', slug: 'test-org', plan: 'starter' },
        },
        tokens: { accessToken: 'token-123', refreshToken: 'refresh-123' },
      },
    });
    (mockUseAuthStore as any).mockReturnValue({
      setAuth: mockSetAuth,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('renders login form with email and password fields', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: /sign in/i });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls login API and sets auth on successful submit', async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButtons = screen.getAllByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButtons[0]);

    await vi.waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(mockSetAuth).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com' }),
      expect.objectContaining({ accessToken: 'token-123' }),
    );
  });

  it('shows error message on failed login', async () => {
    (api.post as unknown as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButtons = screen.getAllByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(submitButtons[0]);

    await vi.waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
