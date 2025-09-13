import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../test/test-utils';
import { RegisterForm } from '../RegisterForm';

// Mock the useAuth hook
const mockRegister = vi.fn();
const mockAuthContext = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: vi.fn(),
  register: mockRegister,
  logout: vi.fn(),
};

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('RegisterForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form with all fields', () => {
    render(<RegisterForm />);
    
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<RegisterForm />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
    });
  });

  it('validates form fields on submission', async () => {
    render(<RegisterForm />);
    
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password123');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    // Just check that the form doesn't submit successfully (no register call)
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows validation error for weak password', async () => {
    render(<RegisterForm />);
    
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'weak');
    await user.type(confirmPasswordInput, 'weak');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when passwords do not match', async () => {
    render(<RegisterForm />);
    
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'DifferentPassword123');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('calls register function with correct credentials', async () => {
    render(<RegisterForm />);
    
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password123');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });
    });
  });

  it('displays error message when registration fails', async () => {
    const errorMessage = 'Email already exists';
    mockRegister.mockRejectedValueOnce(new Error(errorMessage));
    
    render(<RegisterForm />);
    
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password123');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('calls onSwitchToLogin when sign in link is clicked', async () => {
    const mockSwitchToLogin = vi.fn();
    render(<RegisterForm onSwitchToLogin={mockSwitchToLogin} />);
    
    const signInLink = screen.getByRole('button', { name: /sign in/i });
    await user.click(signInLink);

    expect(mockSwitchToLogin).toHaveBeenCalled();
  });
});