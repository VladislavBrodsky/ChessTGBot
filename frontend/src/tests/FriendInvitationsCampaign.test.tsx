import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { InvitationProvider } from '@/components/FriendInvitations';

type Reply = { ok: boolean; json: () => Promise<unknown> };
const push = jest.fn();
const apiFetch = jest.fn((url: string, _opts?: { body?: string }): Promise<Reply> => {
  if (url.includes('/friends/inbox')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ launch: null, invitations: [] }) });
  return Promise.resolve({ ok: true, json: () => Promise.resolve({ kind: 'route', destination: 'home' }) });
});
jest.mock('@/lib/api', () => ({ apiFetch: (url: string, opts?: { body?: string }) => apiFetch(url, opts) }));
jest.mock('@/lib/socket', () => ({ getSocket: () => ({ on: jest.fn(), off: jest.fn() }) }));
jest.mock('@/context/UserContext', () => ({ useUser: () => ({ stats: { telegram_id: 540001 } }) }));
jest.mock('next/navigation', () => ({ usePathname: () => '/en/home', useRouter: () => ({ push, replace: jest.fn(), prefetch: jest.fn() }) }));
jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: () => (key: string) => key }));
jest.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, title, children }: { isOpen: boolean; title: string; children: React.ReactNode }) =>
    isOpen ? <div role="dialog" aria-label={title}>{children}</div> : null,
}));

afterEach(() => { window.history.replaceState(null, '', '/'); sessionStorage.clear(); jest.clearAllMocks(); });

test('a content campaign link records its source silently and keeps the player on Home', async () => {
  window.history.replaceState(null, '', '/en/home?startapp=mk_tg_2026_10_14_tg_community');
  render(<InvitationProvider><p>Home</p></InvitationProvider>);

  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/api/v1/game/friends/preview', expect.anything()));
  const preview = apiFetch.mock.calls.find(([url]) => url.includes('/friends/preview'));
  expect(JSON.parse(preview![1]!.body!)).toEqual({ parameter: 'mk_tg_2026_10_14_tg_community' });
  await waitFor(() => expect(sessionStorage.getItem('chess-invitation:540001:mk_tg_2026_10_14_tg_community')).toBe('1'));

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByText('invalid_invitation')).not.toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
  expect(screen.getByText('Home')).toBeInTheDocument();
});

test('a failed campaign lookup never shows an invitation error', async () => {
  apiFetch.mockImplementation((url: string): Promise<Reply> => url.includes('/friends/inbox')
    ? Promise.resolve({ ok: true, json: () => Promise.resolve({ launch: null, invitations: [] }) })
    : Promise.resolve({ ok: false, json: () => Promise.resolve({ detail: { code: 'invalid_invitation' } }) }));
  window.history.replaceState(null, '', '/en/home?startapp=mk_x_post');
  render(<InvitationProvider><p>Home</p></InvitationProvider>);

  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/api/v1/game/friends/preview', expect.anything()));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByText('invalid_invitation')).not.toBeInTheDocument();
});
