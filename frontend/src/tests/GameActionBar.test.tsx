import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { GameActionBar } from '@/components/game/active/GameActionBar';

// The live-game page pads its content by the tray's reported footprint. If the report drifts from where the tray
// actually sits, the invite button and the player's own card end up underneath it (as they did at 390x844).

const bar = (props: { isTelegramWeb: boolean; onFootprintChange: (px: number) => void }) => (
  <GameActionBar onResign={jest.fn()} onOfferDraw={jest.fn()} tResign="resign" tOfferDraw="offer_draw" {...props} />
);

describe('GameActionBar footprint', () => {
  let trayHeight = 76;
  let resize: (() => void) | null = null;

  beforeEach(() => {
    trayHeight = 76;
    jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => trayHeight);
    (global as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      constructor(callback: () => void) { resize = callback; }
      observe() {}
      disconnect() { resize = null; }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as unknown as { ResizeObserver?: unknown }).ResizeObserver;
  });

  it('reports its bottom offset plus its height', () => {
    const onFootprintChange = jest.fn();
    const { rerender } = render(bar({ isTelegramWeb: false, onFootprintChange }));
    expect(onFootprintChange).toHaveBeenLastCalledWith(92);

    rerender(bar({ isTelegramWeb: true, onFootprintChange }));
    expect(onFootprintChange).toHaveBeenLastCalledWith(142);
  });

  it('reports again when the tray grows, e.g. a label wraps in a longer locale', () => {
    const onFootprintChange = jest.fn();
    render(bar({ isTelegramWeb: false, onFootprintChange }));

    trayHeight = 96;
    resize?.();
    expect(onFootprintChange).toHaveBeenLastCalledWith(112);
  });
});
