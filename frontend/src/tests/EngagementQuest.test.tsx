import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import EngagementQuest from '@/components/EngagementQuest';
import { apiFetch } from '@/lib/api';

const mockPush = jest.fn();
jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: () => (key: string) => key }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/lib/api', () => ({ apiFetch: jest.fn(), sendTelemetryEvent: jest.fn() }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn() }));
jest.mock('@/context/UserContext', () => ({ useUser: () => ({ stats: { telegram_id: 7, referral_code: 'invite7', bot_username: 'chess_matbot' }, syncStats: jest.fn() }) }));
jest.mock('@/components/ui/Modal', () => ({ Modal: ({ isOpen, title, children }: any) => isOpen ? <div role="dialog" aria-label={title}>{children}</div> : null }));

const quest = { enabled: true, accepting_enrollments: true, enrolled: true, progress: 3, target: 3,
  state: 'claimable', reward_key: null, rewards: [{ key: 'xp_250', probability_percent: 60 }, { key: 'boost_24h', probability_percent: 30 }, { key: 'border_gold', probability_percent: 10 }] };
const response = (data: unknown, ok = true, status = 200) => ({ ok, status, json: async () => data } as Response);
const mockFetch = apiFetch as jest.Mock;
function mount() { return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><EngagementQuest /></SWRConfig>); }
beforeEach(() => { mockFetch.mockReset(); mockPush.mockReset(); });

test('claim responds immediately, reveals only confirmed reward, and cannot be tapped twice', async () => {
  let finish!: (value: Response) => void;
  mockFetch.mockResolvedValueOnce(response(quest)).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'claim' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'claimed' })).toBeDisabled());
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await act(async () => finish(response({ ...quest, state: 'claimed', reward_key: 'xp_250' })));
  expect(await screen.findByRole('dialog', { name: 'revealed' })).toBeVisible();
  expect(mockFetch).toHaveBeenCalledTimes(2);
});

test('a failed claim rolls back and offers recovery', async () => {
  mockFetch.mockResolvedValueOnce(response(quest)).mockResolvedValueOnce(response({}, false, 503));
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'claim' }));
  expect(await screen.findByText('action_error')).toBeVisible();
  expect(screen.getByRole('button', { name: 'claim' })).toBeEnabled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('rules show the server odds and a disabled campaign stays hidden', async () => {
  mockFetch.mockResolvedValue(response(quest));
  const first = mount();
  expect(await screen.findByText('brief')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'odds' }));
  for (const probability of ['60%', '30%', '10%']) expect(screen.getByText(probability)).toBeVisible();
  first.unmount();
  mockFetch.mockResolvedValue(response({ enabled: false }));
  const second = mount();
  await waitFor(() => expect(second.container).toBeEmptyDOMElement());
});

test('active quest opens the match lobby without an invented cash prize or activity count', async () => {
  mockFetch.mockResolvedValue(response({ ...quest, progress: 1, state: 'active' }));
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'play' }));
  expect(mockPush).toHaveBeenCalledWith('/en/game');
  expect(screen.queryByText(/TON|mystery boxes unlocked today/i)).not.toBeInTheDocument();
});

test('claimed reward offers an optional tracked Telegram invite using the real referral code', async () => {
  mockFetch.mockResolvedValue(response({ ...quest, state: 'claimed', reward_key: 'xp_250' }));
  const open = jest.spyOn(window, 'open').mockImplementation(() => null);
  try {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'share_invite' }));
    expect(open).toHaveBeenCalledWith(
      `https://t.me/share/url?url=${encodeURIComponent('https://t.me/chess_matbot?start=ref_invite7')}`,
      '_blank',
      'noopener,noreferrer',
    );
  } finally {
    open.mockRestore();
  }
});
