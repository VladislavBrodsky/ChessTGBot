import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import QrClient from '@/app/[locale]/qr/QrClient';

const mockBack = jest.fn();
const mockPush = jest.fn();
let mockCode = 'ref123';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useSearchParams: () => ({ get: (param: string) => (param === 'code' ? mockCode : null) }),
}));

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (ns: string) => (key: string) => {
    const map: Record<string, string> = {
      invite_title: 'You are invited to play',
      invite_description: 'Scan the code or open Telegram to join a chess game.',
      invite_qr_alt: 'Referral invitation QR code',
      open_invite: 'Open invitation in Telegram',
      invalid_invite: 'This invitation link is invalid.',
      share_invite: 'Share',
      copy: 'Copy',
      copied: 'Copied!',
      back: 'Back',
      share_text: 'Play chess with me',
    };
    return map[key] || `${ns}.${key}`;
  },
}));

jest.mock('@/lib/telegram', () => ({
  telegramHaptic: jest.fn(),
}));

jest.mock('@/lib/clipboard', () => ({
  copyToClipboard: jest.fn().mockResolvedValue(true),
}));

describe('QrClient page', () => {
  beforeEach(() => {
    mockCode = 'ref123';
    mockBack.mockClear();
    mockPush.mockClear();
  });

  it('renders instant vector QR code for a valid referral code', () => {
    render(<QrClient />);
    expect(screen.getByRole('heading', { name: 'You are invited to play' })).toBeVisible();
    expect(screen.getByRole('img', { name: 'Referral invitation QR code' })).toBeVisible();
    expect(screen.getByRole('link', { name: /Open invitation in Telegram/i })).toHaveAttribute(
      'href',
      expect.stringContaining('ref_ref123')
    );
  });

  it('navigates back or to challenges when clicking the Back button', () => {
    render(<QrClient />);
    const backButtons = screen.getAllByRole('button', { name: /Back/i });
    expect(backButtons.length).toBeGreaterThan(0);
    fireEvent.click(backButtons[0]);
    expect(mockPush).toHaveBeenCalledWith('/en/challenges');

    // With history > 1
    Object.defineProperty(window.history, 'length', { value: 3, configurable: true });
    fireEvent.click(backButtons[0]);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('shows error state when referral code is missing or invalid', () => {
    mockCode = '';
    render(<QrClient />);
    expect(screen.getByRole('alert')).toHaveTextContent('This invitation link is invalid.');
  });
});
