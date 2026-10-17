import { telegramHaptic } from '@/lib/telegram';

const impactOccurred = jest.fn();
const selectionChanged = jest.fn();
const notificationOccurred = jest.fn();
function host(supported: boolean) {
  window.Telegram = { WebApp: { isVersionAtLeast: () => supported, HapticFeedback: { impactOccurred, selectionChanged, notificationOccurred } } } as unknown as typeof window.Telegram;
}
afterEach(() => { delete window.Telegram; jest.clearAllMocks(); });
it('does not invoke haptics in a browser SDK that reports an unsupported version', () => {
  host(false);
  telegramHaptic('selection');
  telegramHaptic('success');
  expect(selectionChanged).not.toHaveBeenCalled();
  expect(notificationOccurred).not.toHaveBeenCalled();
});
it('keeps tactile selection and reward feedback for supported Telegram hosts', () => {
  host(true);
  telegramHaptic('selection');
  telegramHaptic('success');
  expect(selectionChanged).toHaveBeenCalledTimes(1);
  expect(notificationOccurred).toHaveBeenCalledWith('success');
});

it('throttles rapid repeated identical haptic calls to protect the UI thread and prevent continuous vibration', () => {
  host(true);
  telegramHaptic('error');
  telegramHaptic('error');
  telegramHaptic('error');
  expect(notificationOccurred).toHaveBeenCalledTimes(1);
  expect(notificationOccurred).toHaveBeenCalledWith('error');
});

