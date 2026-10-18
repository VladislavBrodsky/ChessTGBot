import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FriendInviteDrawer from '@/components/game/FriendInviteDrawer';
import { copyToClipboard } from '@/lib/clipboard';
import { telegramHaptic } from '@/lib/telegram';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) =>
    values?.time ? `${key}:${values.time}` : key,
}));

jest.mock('@/context/NavbarContext', () => ({ useNavbar: () => ({ pushHide: jest.fn(), popHide: jest.fn() }) }));
jest.mock('@/hooks/useAnimationsEnabled', () => ({ useAnimationsEnabled: () => false }));
jest.mock('@/lib/clipboard', () => ({ copyToClipboard: jest.fn().mockResolvedValue(true) }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn() }));

describe('FriendInviteDrawer', () => {
  it('renders time control, free match tag, and invite link', () => {
    const onClose = jest.fn();
    render(
      <FriendInviteDrawer
        inviteLink="https://t.me/chess_matbot?startapp=custom_duel_123"
        timeControl={600}
        onClose={onClose}
      />
    );

    expect(screen.getByText('10 MIN')).toBeInTheDocument();
    expect(screen.getByText('free_match')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://t.me/chess_matbot?startapp=custom_duel_123')).toBeInTheDocument();
  });

  it('triggers copyToClipboard and haptic feedback on copy button click', async () => {
    const onClose = jest.fn();
    render(
      <FriendInviteDrawer
        inviteLink="https://t.me/chess_matbot?startapp=custom_duel_123"
        timeControl={600}
        onClose={onClose}
      />
    );

    const copyBtn = screen.getByRole('button', { name: /copy_code/i });
    fireEvent.click(copyBtn);

    expect(copyToClipboard).toHaveBeenCalledWith('https://t.me/chess_matbot?startapp=custom_duel_123');
    await waitFor(() => {
      expect(telegramHaptic).toHaveBeenCalledWith('success');
    });
  });

  it('calls onClose when back button is tapped', () => {
    const onClose = jest.fn();
    render(
      <FriendInviteDrawer
        inviteLink="https://t.me/chess_matbot?startapp=custom_duel_123"
        timeControl={600}
        onClose={onClose}
      />
    );

    const backBtn = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
