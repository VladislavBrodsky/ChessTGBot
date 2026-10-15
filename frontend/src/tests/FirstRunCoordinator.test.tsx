import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import FirstRunCoordinator from '@/components/FirstRunCoordinator';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => '/en/home',
  useRouter: () => ({ push: mockPush }),
}));

let mockStats: any = null;
let mockLoadingStats = false;
jest.mock('@/context/UserContext', () => ({
  useUser: () => ({
    stats: mockStats,
    loadingStats: mockLoadingStats,
    syncStats: jest.fn(),
  }),
}));

const apiFetchMock = jest.fn();
jest.mock('@/lib/api', () => ({
  apiFetch: (url: string, opts?: unknown) => apiFetchMock(url, opts),
}));

jest.mock('@/lib/telegram', () => ({
  telegramHaptic: jest.fn(),
  telegramAlert: jest.fn(),
}));

jest.mock('@/context/NavbarContext', () => ({
  useNavbar: () => ({ pushHide: jest.fn(), popHide: jest.fn() }),
}));

jest.mock('@/hooks/useDialogAccessibility', () => ({
  useDialogAccessibility: () => ({ current: null }),
}));

// Mock child dialog components to render lightweight inspection nodes
jest.mock('@/components/Onboarding', () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-modal="true" data-testid="onboarding-dialog">
      <h2>Onboarding Walkthrough</h2>
      <button onClick={onClose}>Finish Onboarding</button>
    </div>
  ),
}));

jest.mock('@/components/RegionPrompt', () => ({
  __esModule: true,
  default: ({ onClose }: { onClose?: () => void }) => (
    <div role="dialog" aria-modal="true" data-testid="region-dialog">
      <h2>Select Your Region</h2>
      <button onClick={onClose}>Skip Region</button>
    </div>
  ),
}));

jest.mock('@/components/DailyCheckinModal', () => ({
  __esModule: true,
  default: ({ onClose }: { onClose?: () => void }) => (
    <div role="dialog" aria-modal="true" data-testid="daily-reward-dialog">
      <h2>Daily Reward</h2>
      <button onClick={onClose}>Claim Daily</button>
    </div>
  ),
}));

describe('FirstRunCoordinator', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    apiFetchMock.mockClear();
    mockStats = null;
    mockLoadingStats = false;
  });

  it('coordinates sequential first-run queue and never mounts multiple dialogs concurrently', async () => {
    // User needs all three:
    // 1. Onboarding not completed
    // 2. Region not set
    // 3. Daily checkin claimable
    mockStats = { id: 1, region: null };
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ can_claim_today: true }),
    });

    await act(async () => {
      render(<FirstRunCoordinator />);
    });

    // Step 1: Onboarding must be mounted first
    const onboarding = await screen.findByTestId('onboarding-dialog');
    expect(onboarding).toBeInTheDocument();
    expect(screen.queryByTestId('region-dialog')).toBeNull();
    expect(screen.queryByTestId('daily-reward-dialog')).toBeNull();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);

    // Complete Onboarding
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /finish onboarding/i }));
    });

    // Step 2: Region Prompt must mount next, Onboarding must be unmounted
    const region = await screen.findByTestId('region-dialog');
    expect(region).toBeInTheDocument();
    expect(screen.queryByTestId('onboarding-dialog')).toBeNull();
    expect(screen.queryByTestId('daily-reward-dialog')).toBeNull();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);

    // Dismiss Region Prompt
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /skip region/i }));
    });

    // Step 3: Daily Reward mounts next, Region Prompt must be unmounted
    const daily = await screen.findByTestId('daily-reward-dialog');
    expect(daily).toBeInTheDocument();
    expect(screen.queryByTestId('onboarding-dialog')).toBeNull();
    expect(screen.queryByTestId('region-dialog')).toBeNull();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);

    // Close Daily Reward
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /claim daily/i }));
    });

    // All dialogs finished: 0 modals mounted
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('skips already completed steps for returning users', async () => {
    localStorage.setItem('onboarding_completed', 'true');
    mockStats = { id: 1, region: 'europe_africa' };
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ can_claim_today: false }),
    });

    await act(async () => {
      render(<FirstRunCoordinator />);
    });

    // No dialogs should be mounted
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

test('a saved invitation pauses first-run dialogs without completing onboarding', async () => {
  const { InvitationContext } = await import('@/context/InvitationContext');
  localStorage.removeItem('onboarding_completed');
  const value = { busy: true, items: [], unavailable: false, open: jest.fn() };
  const { rerender } = render(<InvitationContext.Provider value={value}><FirstRunCoordinator /></InvitationContext.Provider>);
  expect(screen.queryByTestId('onboarding-dialog')).not.toBeInTheDocument();
  expect(localStorage.getItem('onboarding_completed')).toBeNull();
  rerender(<InvitationContext.Provider value={{ ...value, busy: false }}><FirstRunCoordinator /></InvitationContext.Provider>);
  expect(await screen.findByTestId('onboarding-dialog')).toBeInTheDocument();
});
