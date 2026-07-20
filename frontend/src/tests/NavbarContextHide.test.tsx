import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import LayoutWrapper from '@/components/LayoutWrapper';
import { NavbarProvider, useNavbarHideWhileMounted } from '@/context/NavbarContext';

// Regression guard: a commit once dropped the `isNavbarHiddenByContext` term from
// LayoutWrapper's `shouldHideNavbar`, leaving the NavbarContext read orphaned. That
// silently disabled `useNavbarHideWhileMounted()` for EVERY drawer/modal — the
// visible navbar then overlapped their bottom action buttons (e.g. the AI difficulty
// drawer's "Start Training Session" button was unreachable). This test pins the wiring.

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

  it('hides the navbar while a drawer using useNavbarHideWhileMounted is mounted', async () => {
    render(
      <NavbarProvider>
        <LayoutWrapper>
          <DrawerThatHidesNavbar />
        </LayoutWrapper>
      </NavbarProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('navbar')).toHaveAttribute('data-hidden', 'true'),
    );
  });
});
