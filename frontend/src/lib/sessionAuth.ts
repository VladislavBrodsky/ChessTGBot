/**
 * Session-scoped web authentication storage.
 *
 * For desktop browser visitors logging in via the Telegram Web Login widget,
 * credentials must not persist permanently in localStorage across days or weeks
 * (which would expose them to prolonged XSS credential theft).
 *
 * We store web credentials in sessionStorage so they are automatically discarded
 * when the browsing session ends. We also transparently migrate and purge any
 * legacy 'telegram_web_auth' items from localStorage.
 */

const STORAGE_KEY = 'telegram_web_auth';

export function getStoredWebAuth(): string {
  if (typeof window === 'undefined') return '';

  try {
    // 1. Check session-scoped storage first
    const sessionAuth = sessionStorage.getItem(STORAGE_KEY);
    if (sessionAuth) return sessionAuth;

    // 2. Migration: if present in localStorage, migrate to sessionStorage and purge from localStorage
    const localAuth = localStorage.getItem(STORAGE_KEY);
    if (localAuth) {
      sessionStorage.setItem(STORAGE_KEY, localAuth);
      localStorage.removeItem(STORAGE_KEY);
      return localAuth;
    }
  } catch {
    // Storage restricted or blocked (e.g. cross-origin iframe security rules)
  }

  return '';
}

export function setStoredWebAuth(authString: string): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(STORAGE_KEY, authString);
    // Ensure legacy persistent localStorage is purged
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage restricted
  }
}

export function clearStoredWebAuth(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage restricted
  }
}
