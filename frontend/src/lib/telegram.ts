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

export const telegramHaptic = (type: 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy' | 'selection') => {
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
    try {
      const haptic = window.Telegram.WebApp.HapticFeedback as any;
      if (type === 'selection' && haptic.selectionChanged) {
        haptic.selectionChanged();
      } else if (['success', 'warning', 'error'].includes(type) && haptic.notificationOccurred) {
        haptic.notificationOccurred(type as 'success' | 'warning' | 'error');
      } else if (haptic.impactOccurred) {
        // Fallback to impact feedback if notification is unsupported
        const style = type === 'warning' || type === 'error' ? 'heavy' : type === 'success' ? 'medium' : type === 'selection' ? 'light' : type;
        haptic.impactOccurred(style as 'light' | 'medium' | 'heavy' | 'rigid' | 'soft');
      }
    } catch (e) {
      console.warn("Telegram haptic feedback failed:", e);
    }
  }
};

export const triggerTaskSuccess = (title: string, xpReward: number) => {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("task-success", {
      detail: { title, xpReward }
    });
    window.dispatchEvent(event);
  }
};
