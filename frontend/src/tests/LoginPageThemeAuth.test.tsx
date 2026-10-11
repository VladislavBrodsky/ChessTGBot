import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

let mockPathname = '/en/login';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      verifying_auth: 'Verifying authentication...',
      secure_web_portal: 'Secure Web Portal',
      web3chess: 'Web3Chess',
    };
    return map[key] || key;
  },
  useLocale: () => 'en',
}));

function ThemeInspector() {
  const { theme } = useTheme();
  return <div data-testid="active-theme">{theme}</div>;
}

describe('Theme and AuthGuard Public Route Behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPathname = '/en/login';
  });

  it('defaults to dark theme even if prefers-color-scheme is light', () => {
    // Simulate system preferring light mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: query.includes('light'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <ThemeProvider>
        <ThemeInspector />
      </ThemeProvider>
    );

    expect(screen.getByTestId('active-theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('respects explicitly saved light theme in localStorage', () => {
    localStorage.setItem('theme', 'light');

    render(
      <ThemeProvider>
        <ThemeInspector />
      </ThemeProvider>
    );

    expect(screen.getByTestId('active-theme').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('renders children immediately without verifying overlay on /login route', () => {
    mockPathname = '/en/login';

    render(
      <AuthGuard>
        <div data-testid="login-content">Login Form Rendered</div>
      </AuthGuard>
    );

    expect(screen.getByTestId('login-content')).toBeInTheDocument();
    expect(screen.queryByText('Verifying authentication...')).not.toBeInTheDocument();
  });
});
