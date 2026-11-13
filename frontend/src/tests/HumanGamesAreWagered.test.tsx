import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { InvitationProvider } from '@/components/FriendInvitations';
import RematchChoiceDrawer from '@/components/game/RematchChoiceDrawer';

// Free play is the AI coach only: the client never offers to start a free game against a person.

type Reply = { ok: boolean; json: () => Promise<unknown> };
let inbox: unknown[] = [];
const apiFetch = jest.fn((url: string): Promise<Reply> => {
  if (url.includes('/friends/inbox')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ launch: null, invitations: inbox }) });
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
});
jest.mock('@/lib/api', () => ({ apiFetch: (url: string) => apiFetch(url) }));
jest.mock('@/lib/socket', () => ({ getSocket: () => ({ on: jest.fn(), off: jest.fn() }) }));
jest.mock('@/context/UserContext', () => ({ useUser: () => ({ stats: { telegram_id: 540001 } }) }));
jest.mock('next/navigation', () => ({ usePathname: () => '/en/home', useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }) }));
jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: () => (key: string) => key }));
jest.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, title, children }: { isOpen: boolean; title: string; children: React.ReactNode }) =>
    isOpen ? <div role="dialog" aria-label={title}>{children}</div> : null,
}));
jest.mock('@/components/ui/Drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div>,
}));

const pendingRequest = (role: 'host' | 'guest') => ({
  kind: 'request', id: 'inv1', status: 'pending', role, free: true, wager: 0, time_control: 600,
  opponent: { name: 'Friend', elo: 1200 }, game_id: null, url: 'https://t.me/x?startapp=fi_inv1',
});

afterEach(() => { inbox = []; sessionStorage.clear(); jest.clearAllMocks(); });

test.each([['host', 'decline'], ['guest', 'cancel']] as const)(
  'a pending free friend request (%s) can only be closed, never accepted', async (role, closeLabel) => {
    inbox = [pendingRequest(role)];
    render(<InvitationProvider><p>Home</p></InvitationProvider>);
    // The host is shown the request automatically on Home.
    if (role === 'host') {
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      expect(screen.queryByRole('button', { name: 'accept' })).toBeNull();
      expect(screen.getByRole('button', { name: closeLabel })).toBeInTheDocument();
      expect(screen.getByText('stake_required')).toBeInTheDocument();
      expect(screen.getByText('decline_help')).toBeInTheDocument();
    } else {
      await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/api/v1/game/friends/inbox'));
      expect(screen.queryByRole('button', { name: 'accept' })).toBeNull();
    }
  });

test('a game without a stake offers no free rematch', () => {
  const send = jest.fn();
  render(<RematchChoiceDrawer wagerAmount={0} onClose={jest.fn()} onSendRematchOffer={send} />);
  expect(screen.getByText('rematch_stake_required')).toBeInTheDocument();
  expect(screen.queryByText('same_stakes')).toBeNull();
  expect(screen.queryByText('double_stakes_choice')).toBeNull();
});

test('a staked game still offers same and double stakes', () => {
  render(<RematchChoiceDrawer wagerAmount={500} onClose={jest.fn()} onSendRematchOffer={jest.fn()} />);
  expect(screen.getByText('same_stakes')).toBeInTheDocument();
  expect(screen.getByText('double_stakes_choice')).toBeInTheDocument();
});
