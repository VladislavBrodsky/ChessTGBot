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
    isVersionAtLeast: jest.fn((version: string) => version !== '8.0'),
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

  it('does not call unsupported controls in a browser or an older Telegram host', () => {
    const webApp = installTelegram('unknown');
    webApp.isVersionAtLeast.mockReturnValue(false);
    render(<TelegramInit />);
    expect(webApp.ready).toHaveBeenCalled();
    expect(webApp.setHeaderColor).not.toHaveBeenCalled();
    expect(webApp.setBackgroundColor).not.toHaveBeenCalled();
    expect(webApp.enableClosingConfirmation).not.toHaveBeenCalled();
    expect(webApp.disableVerticalSwipes).not.toHaveBeenCalled();
  });

  it('synchronizes supported host colours once despite initialization and theme effects', () => {
    const webApp = installTelegram('weba');
    render(<TelegramInit />);
    expect(webApp.setHeaderColor).toHaveBeenCalledTimes(1);
    expect(webApp.setHeaderColor).toHaveBeenCalledWith('#000000');
    expect(webApp.setBackgroundColor).toHaveBeenCalledTimes(1);
  });
});
