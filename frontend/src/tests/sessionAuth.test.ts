import { getStoredWebAuth, setStoredWebAuth, clearStoredWebAuth } from '@/lib/sessionAuth';

describe('sessionAuth', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('stores and retrieves web auth from sessionStorage', () => {
    setStoredWebAuth('id=123&hash=abc');
    expect(sessionStorage.getItem('telegram_web_auth')).toBe('id=123&hash=abc');
    expect(localStorage.getItem('telegram_web_auth')).toBeNull();
    expect(getStoredWebAuth()).toBe('id=123&hash=abc');
  });

  it('migrates legacy credentials from localStorage to sessionStorage and purges localStorage', () => {
    localStorage.setItem('telegram_web_auth', 'id=999&hash=xyz');
    expect(sessionStorage.getItem('telegram_web_auth')).toBeNull();

    const auth = getStoredWebAuth();
    expect(auth).toBe('id=999&hash=xyz');
    expect(sessionStorage.getItem('telegram_web_auth')).toBe('id=999&hash=xyz');
    expect(localStorage.getItem('telegram_web_auth')).toBeNull();
  });

  it('clears both sessionStorage and localStorage upon logout', () => {
    sessionStorage.setItem('telegram_web_auth', 'session_val');
    localStorage.setItem('telegram_web_auth', 'local_val');

    clearStoredWebAuth();
    expect(sessionStorage.getItem('telegram_web_auth')).toBeNull();
    expect(localStorage.getItem('telegram_web_auth')).toBeNull();
    expect(getStoredWebAuth()).toBe('');
  });
});
