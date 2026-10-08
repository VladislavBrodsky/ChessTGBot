import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import LayoutWrapper from '@/components/LayoutWrapper';
import { NavbarProvider, useNavbarHideWhileMounted } from '@/context/NavbarContext';
import UnboxConfirmSheet from '@/components/Marketplace/UnboxConfirmSheet';

// Main destinations retain navigation. Explicit overlays cover it at z >= 100;
// stale context state must never strand a player on a dashboard without a menu.

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/en/game',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/lib/api', () => ({
  apiFetch: jest.fn().mockResolvedValue({ ok: true, json: async () => ({ active_game_id: null }) }),
  getFullPhotoUrl: (u: string) => u,
}));

// Leaf components that are irrelevant to the navbar-hide wiring.
jest.mock('@/components/Onboarding', () => () => null);
jest.mock('@/components/RegionPrompt', () => () => null);
jest.mock('@/components/NotificationModal', () => () => null);
jest.mock('@/components/AnimatedBackground', () => () => null);

// Render the real Navbar but expose its `hide` prop so we can assert on it.
jest.mock('@/components/Navbar', () => ({
  __esModule: true,
  default: ({ hide }: { hide?: boolean }) => (
    <nav data-testid="navbar" data-hidden={hide ? 'true' : 'false'} />
  ),
}));

function DrawerThatHidesNavbar() {
  useNavbarHideWhileMounted();
  return <div>drawer</div>;
}

describe('LayoutWrapper navbar-hide wiring', () => {
  beforeEach(() => {
    // Skip onboarding — it legitimately hides the navbar and would mask the
    // context-driven behavior this test isolates.
    localStorage.setItem('onboarding_completed', 'true');
  });

  it('keeps the navbar visible when no drawer requests a hide', async () => {
    render(
      <NavbarProvider>
        <LayoutWrapper>
          <div>content</div>
        </LayoutWrapper>
      </NavbarProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('navbar')).toHaveAttribute('data-hidden', 'false'),
    );
  });

  it('retains dashboard navigation beneath a mounted overlay', async () => {
    render(
      <NavbarProvider>
        <LayoutWrapper>
          <DrawerThatHidesNavbar />
        </LayoutWrapper>
      </NavbarProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('navbar')).toHaveAttribute('data-hidden', 'false'),
    );
  });

  it('keeps the navbar visible while the marketplace confirmation sheet is closed', async () => {
    render(
      <NavbarProvider>
        <LayoutWrapper>
          <UnboxConfirmSheet
            isOpen={false}
            tier={null}
            userXP={0}
            onConfirm={jest.fn()}
            onCancel={jest.fn()}
          />
        </LayoutWrapper>
      </NavbarProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('navbar')).toHaveAttribute('data-hidden', 'false'),
    );
  });
});
