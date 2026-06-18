/**
 * Telegram WebApp SDK helpers for native UI popups and haptic feedback.
 * Provides a clean browser fallback for local development.
 */

export const telegramAlert = (message: string, callback?: () => void) => {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("custom-alert", {
      detail: { message, callback }
    });
    window.dispatchEvent(event);
  } else {
    if (callback) callback();
  }
};

export const telegramConfirm = (message: string, callback: (ok: boolean) => void) => {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("custom-confirm", {
      detail: { message, callback }
    });
    window.dispatchEvent(event);
  } else {
    const result = confirm(message);
    callback(result);
  }
};

export const telegramHaptic = (type: 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy') => {
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
    const haptic = window.Telegram.WebApp.HapticFeedback;
    if (['success', 'warning', 'error'].includes(type) && haptic.notificationOccurred) {
      haptic.notificationOccurred(type as 'success' | 'warning' | 'error');
    } else {
      // Fallback to impact feedback if notification is unsupported
      const style = type === 'warning' || type === 'error' ? 'heavy' : type === 'success' ? 'medium' : type;
      haptic.impactOccurred(style as 'light' | 'medium' | 'heavy' | 'rigid' | 'soft');
    }
  }
};
