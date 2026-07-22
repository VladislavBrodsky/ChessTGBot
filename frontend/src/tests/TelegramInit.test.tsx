import { render, waitFor } from '@testing-library/react';
import TelegramInit from '@/components/TelegramInit';

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark' }),
}));

function installTelegram(platform: string) {
  const webApp = {
    platform,
    ready: jest.fn(),
    expand: jest.fn(),
    setHeaderColor: jest.fn(),
    setBackgroundColor: jest.fn(),
    disableVerticalSwipes: jest.fn(),
    enableClosingConfirmation: jest.fn(),
    isVersionAtLeast: jest.fn(() => false),
  };
  Object.defineProperty(window, 'Telegram', {
    configurable: true,
    value: { WebApp: webApp },
  });
  return webApp;
}

describe('TelegramInit swipe behavior', () => {
  afterEach(() => {
    delete (window as { Telegram?: unknown }).Telegram;
  });

  it('keeps mouse-wheel scrolling enabled in Telegram Web', async () => {
    const webApp = installTelegram('weba');
    render(<TelegramInit />);

    await waitFor(() => expect(webApp.ready).toHaveBeenCalled());
    expect(webApp.disableVerticalSwipes).not.toHaveBeenCalled();
  });

  it('still disables the close gesture in mobile Telegram clients', async () => {
    const webApp = installTelegram('android');
    render(<TelegramInit />);

    await waitFor(() => expect(webApp.disableVerticalSwipes).toHaveBeenCalledTimes(1));
  });
});
