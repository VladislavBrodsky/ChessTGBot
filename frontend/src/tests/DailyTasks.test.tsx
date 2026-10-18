import { translatorFor as mockTranslatorFor } from './testUtils/messagesMock';
import '@testing-library/jest-dom';
import { render, screen, within, fireEvent } from '@testing-library/react';
import DailyTasks from '@/components/DailyTasks';
import messages from '@/messages/en.json';

jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: (namespace: string) => mockTranslatorFor(namespace) }));
jest.mock('@/context/UserContext', () => ({ useUser: () => ({ syncStats: jest.fn(), syncBalance: jest.fn() }) }));
jest.mock('@/context/ToastContext', () => ({ useToast: () => ({ error: jest.fn(), success: jest.fn() }) }));
jest.mock('@/context/ReducedMotionContext', () => ({ useReducedMotionPreference: () => ({ reducedMotion: true }) }));
jest.mock('@/lib/telegram', () => ({ triggerTaskSuccess: jest.fn(), telegramHaptic: jest.fn() }));
jest.mock('@/lib/api', () => ({ apiFetch: jest.fn() }));
const task = (over: Record<string, unknown>) => ({ id: 1, task_id: 1, title_key: 'daily_play', progress: 0, target_count: 1, xp_reward: 50, gram_reward_nano: '300000000', completed: false, claimed: false, ...over });
let mockTasks: ReturnType<typeof task>[] = [];
jest.mock('@/hooks/useTasks', () => ({ useTasks: () => ({ tasks: mockTasks, error: undefined, loading: false, refresh: jest.fn(), setTasks: jest.fn() }) }));

const row = (title: string) => screen.getByRole('heading', { name: title }).closest('li') as HTMLElement;

beforeEach(() => {
  mockTasks = [
    task({ id: 1, task_id: 1, title_key: 'daily_play', progress: 2, target_count: 3 }),
    task({ id: 2, task_id: 2, title_key: 'daily_win', progress: 1, target_count: 1, xp_reward: 100, completed: true }),
    task({ id: 3, task_id: 3, title_key: 'daily_win', progress: 1, target_count: 1, completed: true, claimed: true, gram_reward_nano: '0' }),
  ];
});

it('keeps the rewards on one meta line with no separator character in the text', () => {
  render(<DailyTasks />);
  const pending = row('Play a Match');
  const facts = pending.querySelectorAll('.ui-meta__item');
  expect(facts).toHaveLength(2);
  expect(facts[0]).toHaveTextContent('+50 XP');
  expect(facts[1]).toHaveTextContent('+0.3 GRAM');
  expect(pending.textContent).not.toContain('·');
});

it('shows progress beside the bar while pending and a Claim action instead once complete', () => {
  render(<DailyTasks />);
  const pending = row('Play a Match');
  expect(within(pending).getByText('2 / 3')).toBeVisible();
  expect(within(pending).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
  const claimable = screen.getAllByRole('heading', { name: 'Win a Match' })[0].closest('li') as HTMLElement;
  expect(within(claimable).getByRole('button', { name: 'Claim' })).toBeVisible();
  expect(within(claimable).queryByText('1 / 1')).not.toBeInTheDocument();
});

it('hides completed tasks by default from active list into the completed missions archive', () => {
  render(<DailyTasks />);
  expect(screen.queryAllByRole('heading', { name: 'Win a Match' })).toHaveLength(1);
  const archiveButton = screen.getByRole('button', { name: /completed missions/i });
  expect(archiveButton).toBeVisible();
  fireEvent.click(archiveButton);
  expect(screen.getAllByRole('heading', { name: 'Win a Match' })).toHaveLength(2);
});

it('drops the GRAM fact when a task has no GRAM reward', () => {
  render(<DailyTasks />);
  fireEvent.click(screen.getByRole('button', { name: /completed missions/i }));
  const claimed = screen.getAllByRole('heading', { name: 'Win a Match' })[1].closest('li') as HTMLElement;
  expect(claimed.querySelectorAll('.ui-meta__item')).toHaveLength(1);
  expect(within(claimed).getByText(messages.Gamification.claimed_status)).toBeVisible();
});
