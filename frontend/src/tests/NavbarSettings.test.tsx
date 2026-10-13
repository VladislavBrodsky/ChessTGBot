import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Navbar from '@/components/Navbar';
import mockMessages from '@/messages/en.json';

let mockDesktop = false;
jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: (namespace: string) => (key: string) => (mockMessages as unknown as Record<string, Record<string, string>>)[namespace][key] }));
jest.mock('next/navigation', () => ({ usePathname: () => '/en/settings', useRouter: () => ({ prefetch: jest.fn() }) }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
jest.mock('@/hooks/useDesktopNavigation', () => ({ useDesktopNavigation: () => mockDesktop }));
jest.mock('@/hooks/useClaimableTasks', () => ({ useClaimableTasks: () => 0 }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn() }));
jest.mock('framer-motion', () => ({ motion: { nav: ({ children, initial: _initial, animate: _animate, transition: _transition, ...props }: any) => <nav {...props}>{children}</nav> } }));

describe('Settings navigation context', () => {
  it('marks Profile as the mobile parent while keeping the link usable', () => {
    mockDesktop = false;
    render(<Navbar />);
    const profile = screen.getByRole('link', { name: 'Profile' });
    expect(profile).toHaveAttribute('aria-current', 'location');
    expect(profile).toHaveAttribute('href', '/en/profile');
    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
  });
  it('marks Settings itself in the desktop sidebar without highlighting Profile', () => {
    mockDesktop = true;
    render(<Navbar />);
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Profile' })).not.toHaveAttribute('aria-current');
  });
});
