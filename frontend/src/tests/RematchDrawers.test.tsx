import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import RematchChoiceDrawer from '@/components/game/RematchChoiceDrawer';
import IncomingRematchDrawer from '@/components/game/IncomingRematchDrawer';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    values?.name ? `${key}:${values.name}` : key,
}));

jest.mock('@/context/NavbarContext', () => ({ useNavbar: () => ({ pushHide: jest.fn(), popHide: jest.fn() }) }));
jest.mock('@/hooks/useAnimationsEnabled', () => ({ useAnimationsEnabled: () => false }));

describe('rematch drawers', () => {
  it('portals the revenge choices above the portalled game-over modal', () => {
    const onSendRematchOffer = jest.fn();

    render(
      <div data-testid="animated-route-wrapper">
        <RematchChoiceDrawer
          wagerAmount={500}
          onClose={jest.fn()}
          onSendRematchOffer={onSendRematchOffer}
        />
      </div>,
    );

    const routeWrapper = screen.getByTestId('animated-route-wrapper');
    const drawer = document.querySelector('.ui-drawer-viewport');
    expect(drawer).not.toBeNull();
    expect(drawer).toHaveStyle({ zIndex: 110 });
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(routeWrapper).not.toContainElement(drawer as HTMLElement);
    expect(document.body).toContainElement(drawer as HTMLElement);

    fireEvent.click(screen.getByRole('button', { name: /same_stakes/i }));
    expect(onSendRematchOffer).toHaveBeenCalledWith(false);
  });

  it('portals incoming revenge offers above the game-over modal', () => {
    const onAccept = jest.fn();

    render(
      <div data-testid="animated-route-wrapper">
        <IncomingRematchDrawer
          incomingRematch={{
            challenger_name: 'Opponent',
            wager: 500,
            double_stakes: false,
          }}
          onAccept={onAccept}
          onDecline={jest.fn()}
        />
      </div>,
    );

    const routeWrapper = screen.getByTestId('animated-route-wrapper');
    const drawer = document.querySelector('.ui-modal-viewport');
    expect(drawer).not.toBeNull();
    expect(drawer).toHaveStyle({ zIndex: 110 });
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(routeWrapper).not.toContainElement(drawer as HTMLElement);
    expect(document.body).toContainElement(drawer as HTMLElement);

    fireEvent.click(screen.getByRole('button', { name: /accept/i }));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
