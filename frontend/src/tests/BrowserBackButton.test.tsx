import { render, cleanup } from '@testing-library/react';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
jest.mock('next-intl', () => ({ useLocale: () => 'en' }));
jest.mock('next/navigation', () => ({ usePathname: () => '/en/academy/themes', useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));
function Screen() { useTelegramBackButton(null, null); return null; }
const show = jest.fn();
const hide = jest.fn();
afterEach(() => { cleanup(); document.documentElement.classList.remove('tg-back-button-active'); delete window.Telegram; jest.clearAllMocks(); });

it('retains HTML navigation when the SDK is loaded in an ordinary browser', () => {
  window.Telegram = { WebApp: { initData: '', BackButton: { show, hide } } } as unknown as typeof window.Telegram;
  document.documentElement.classList.add('tg-back-button-active');
  render(<Screen />);
  expect(show).not.toHaveBeenCalled();
  expect(document.documentElement.classList.contains('tg-back-button-active')).toBe(false);
});
it('uses the native back control in an authenticated Telegram host and cleans up after leaving', () => {
  window.Telegram = { WebApp: { initData: 'signed-host-session', BackButton: { show, hide }, onEvent: jest.fn(), offEvent: jest.fn() } } as unknown as typeof window.Telegram;
  const screen = render(<Screen />);
  expect(show).toHaveBeenCalledTimes(1);
  expect(document.documentElement.classList.contains('tg-back-button-active')).toBe(true);
  screen.unmount();
  expect(document.documentElement.classList.contains('tg-back-button-active')).toBe(false);
});
