import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import SettingsPage from '@/app/[locale]/settings/page';
import messages from '@/messages/en.json';
import { SOUND_PREFERENCE_KEY, setSoundEnabled } from '@/lib/soundPreference';

const mockApi = jest.fn();
const mockSetTheme = jest.fn();
const mockSetReducedMotion = jest.fn();
const mockSyncStats = jest.fn();
const mockSyncBalance = jest.fn();
const mockToast = { error: jest.fn(), success: jest.fn() };
let mockStats = { arena_notifications: true, is_premium: false, is_admin: false, telegram_id: 42 };

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (key: string) => {
    const value = (messages as unknown as Record<string, Record<string, string>>)[namespace][key];
    if (!value) throw new Error(`Missing ${namespace}.${key}`);
    return value;
  },
}));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: jest.fn() }), usePathname: () => '/en/settings' }));
jest.mock('@/components/LayoutWrapper', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
jest.mock('@/components/ui/Drawer', () => ({ Drawer: ({ isOpen, title, children, onClose }: any) => isOpen ? <div role="dialog" aria-label={title}><h2>{title}</h2><button onClick={onClose}>Close dialog</button>{children}</div> : null }));
jest.mock('@/context/ThemeContext', () => ({ useTheme: () => ({ theme: 'dark', setTheme: mockSetTheme }) }));
jest.mock('@/context/ReducedMotionContext', () => ({ useReducedMotionPreference: () => ({ reducedMotion: false, setReducedMotion: mockSetReducedMotion }) }));
jest.mock('@/context/ToastContext', () => ({ useToast: () => mockToast }));
jest.mock('@/context/UserContext', () => ({ useUser: () => ({ stats: mockStats, walletAddress: 'EQ1234567890abcd', loadingStats: false, loadingBalance: false, syncStats: mockSyncStats, syncBalance: mockSyncBalance }) }));
jest.mock('@/lib/api', () => ({ apiFetch: (...args: any[]) => mockApi(...args) }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn() }));

describe('Settings navigation and preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks(); localStorage.clear(); setSoundEnabled(true);
    mockStats = { arena_notifications: true, is_premium: false, is_admin: false, telegram_id: 42 };
    mockSyncStats.mockResolvedValue(mockStats); mockSyncBalance.mockResolvedValue({ balance: 10 });
  });

  it('separates preferences, account and help without unrelated navigation or inline FAQs', () => {
    render(<SettingsPage />);
    for (const name of ['Preferences', 'Account', 'Help']) expect(screen.getByRole('heading', { name })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/en/home');
    expect(screen.getByRole('link', { name: /TON Wallet/ })).toHaveAttribute('href', '/en/wallet');
    expect(screen.getByRole('link', { name: /Premium membership/ })).toHaveAttribute('href', '/en/membership');
    expect(screen.queryByRole('link', { name: /Academy|Marketplace/ })).not.toBeInTheDocument();
    expect(screen.queryByText(messages.Settings.faq_q1)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Choose Language: English/ })).toBeVisible();
  });

  it('opens help on demand and exposes expandable answers', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /^Help center/ }));
    expect(screen.getByRole('dialog', { name: 'Help center' })).toBeVisible();
    const answer = screen.getByText(messages.Settings.faq_a2);
    expect(answer).not.toBeVisible();
    fireEvent.click(screen.getByText(messages.Settings.faq_q2));
    expect(answer).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('persists sound from the preference switch and uses the shared theme and motion controls', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole('switch', { name: 'Sound effects' }));
    expect(screen.getByRole('switch', { name: 'Sound effects' })).toHaveAttribute('aria-checked', 'false');
    expect(localStorage.getItem(SOUND_PREFERENCE_KEY)).toBe('false');
    fireEvent.click(screen.getByRole('switch', { name: 'Dark mode' }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
    fireEvent.click(screen.getByRole('switch', { name: 'Reduce motion' }));
    expect(mockSetReducedMotion).toHaveBeenCalledWith(true);
  });

  it('prevents overlapping alert saves and restores the previous preference on a failure', async () => {
    let finish: (value: { ok: boolean }) => void = () => {};
    mockApi.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    render(<SettingsPage />);
    const control = screen.getByRole('switch', { name: 'Arena alerts' });
    fireEvent.click(control);
    expect(control).toHaveAttribute('aria-checked', 'false');
    expect(control).toBeDisabled();
    fireEvent.click(control);
    expect(mockApi).toHaveBeenCalledTimes(1);
    await act(async () => finish({ ok: false }));
    expect(control).toHaveAttribute('aria-checked', 'true');
    expect(control).toBeEnabled();
    expect(mockToast.error).toHaveBeenCalledWith(messages.Settings.alerts_error);
  });

  it('keeps account tools collapsed and reports an unavailable refresh as a failure', async () => {
    mockSyncBalance.mockResolvedValueOnce(null);
    render(<SettingsPage />);
    expect(screen.getByRole('button', { name: 'Refresh', hidden: true })).not.toBeVisible();
    fireEvent.click(screen.getByText('Account tools'));
    const refresh = screen.getByRole('button', { name: 'Refresh' });
    expect(refresh).toBeVisible();
    await act(async () => fireEvent.click(refresh));
    expect(mockToast.error).toHaveBeenCalledWith(messages.Settings.refresh_error);
    expect(mockToast.success).not.toHaveBeenCalled();
  });
});
