import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import FriendChallengeDrawer from '@/components/game/FriendChallengeDrawer';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) =>
    values ? `${key}:${Object.values(values).join(':')}` : key,
}));
jest.mock('@/components/ui/Drawer', () => ({
  Drawer: ({ children, footer }: { children: ReactNode; footer: ReactNode }) => <div>{children}{footer}</div>,
}));
jest.mock('@/components/ui/SnapPicker', () => ({
  SnapPicker: ({ onChange }: { onChange: (value: number) => void }) => <button onClick={() => onChange(1800)}>choose 30m</button>,
}));

const props = {
  onClose: jest.fn(), onCreate: jest.fn(), onTopUp: jest.fn(),
  initialTime: 600, initialWager: 500, walletBalance: 1000,
  loadingBalance: false, balanceError: false, isCreating: false,
};

afterEach(() => jest.clearAllMocks());

it('keeps free friend games available when the wallet cannot load', () => {
  render(<FriendChallengeDrawer {...props} balanceError />);
  fireEvent.click(screen.getByText('choose 30m'));
  fireEvent.click(screen.getByRole('button', { name: 'friend_create_free' }));
  expect(props.onCreate).toHaveBeenCalledWith(0, 1800);
});

it('requires funds and passes the confirmed stake and clock to creation', () => {
  const view = render(<FriendChallengeDrawer {...props} walletBalance={100} />);
  fireEvent.click(screen.getByRole('tab', { name: 'friend_staked_match' }));
  expect(screen.getByRole('button', { name: 'friend_create_staked:$5.00' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'lobby_topup' }));
  expect(props.onTopUp).toHaveBeenCalledWith(500);

  view.rerender(<FriendChallengeDrawer {...props} walletBalance={1000} />);
  fireEvent.click(screen.getByText('choose 30m'));
  fireEvent.click(screen.getByRole('button', { name: 'friend_create_staked:$5.00' }));
  expect(props.onCreate).toHaveBeenCalledWith(500, 1800);
});
