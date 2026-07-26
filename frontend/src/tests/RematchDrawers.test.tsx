import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import RematchChoiceDrawer from '@/components/game/RematchChoiceDrawer';
import IncomingRematchDrawer from '@/components/game/IncomingRematchDrawer';

jest.mock('next-intl', () => {
  // jest.mock factories are hoisted above imports, so the helper must be
  // pulled in lazily here — an ESM import would not be initialised yet.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { asTranslator } = require('./testUtils/nextIntlMock');
  return {
    useTranslations: () =>
      asTranslator((key: string, values?: Record<string, string>) =>
        values?.name ? `${key}:${values.name}` : key
      ),
  };
});

jest.mock('@/context/NavbarContext', () => ({
  useNavbarHideWhileMounted: jest.fn(),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, style }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} onClick={onClick} style={style}>{children}</div>
    ),
    button: ({ children, className, onClick }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button className={className} onClick={onClick}>{children}</button>
    ),
  },
}));

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
    const drawer = document.querySelector('.bottom-drawer-backdrop');
    expect(drawer).not.toBeNull();
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
    const drawer = document.querySelector('.modal-backdrop');
    expect(drawer).not.toBeNull();
    expect(routeWrapper).not.toContainElement(drawer as HTMLElement);
    expect(document.body).toContainElement(drawer as HTMLElement);

    fireEvent.click(screen.getByRole('button', { name: /accept/i }));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
