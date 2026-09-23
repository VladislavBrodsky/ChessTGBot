import { E2E_TEST_INIT_DATA, hasE2ETestIdentity } from '@/lib/e2eTestMode';

/**
 * Cold-start auth readiness gate.
 *
 * telegram-web-app.js loads ASYNCHRONOUSLY: `strategy="beforeInteractive"` is only
 * honored in the ROOT app/layout.tsx and ours lives in the nested [locale] layout, so
 * on a cold launch `window.Telegram.WebApp` — and therefore `initData` — does not exist
 * yet when the first components mount and immediately start fetching (LayoutWrapper's
 * useActiveGame fires `/api/v1/game/active` from its very first effect).
 *
 * A request sent during that window carries NO X-Telegram-Init-Data header, which the
 * backend answers with 401. apiFetch's global 401 handler then clears stored auth and
 * hard-redirects to /login — so a perfectly valid Telegram session gets bounced out of
 * the app before it ever renders. It reproduces only on devices that LOSE the race (a
 * cold WKWebView cache, a slower phone, a slower network), which is exactly why it
 * looked like "works on my phone but I can't open it from another phone". Repeats also
 * accumulate against the backend's per-IP failed-auth throttle, so several cold loads
 * from one Wi-Fi/carrier NAT can escalate the 401s into outright 429s.
 *
 * Every API call therefore awaits this gate first. It resolves the instant initData is
 * available and gives up after SDK_WAIT_MS so genuine (non-Telegram) browser visitors
 * are never stalled.
 */

// Matches AuthGuard's SDK_WAIT_MS budget so the two never disagree about whether a
// launch is still in flight.
const SDK_WAIT_MS = 2500;
const POLL_MS = 50;

/** Read whatever credential is available right now, without waiting. */
export function getInitDataNow(): string {
  if (typeof window === 'undefined') return '';

  const tg = (window as any).Telegram?.WebApp;
  if (tg?.initData) return tg.initData as string;

  if (hasE2ETestIdentity()) return E2E_TEST_INIT_DATA;

  // localStorage can throw a SecurityError inside Telegram Web's cross-origin
  // (third-party) iframe when the browser blocks third-party storage.
  try {
    return localStorage.getItem('telegram_web_auth') || '';
  } catch {
    return '';
  }
}

/**
 * True while a Telegram launch may still be in flight — i.e. the SDK object has not
 * appeared yet, or the launch hash is still on the URL waiting to be consumed. Mirrors
 * the heuristic AuthGuard uses so both agree on when to stop waiting.
 */
function telegramLaunchPending(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  const sdkPresent = !!w.Telegram?.WebApp;
  const launchHash = /tgWebApp(Data|Platform|Version)/.test(w.location.hash || '');
  // Once the WebApp object exists its initData is final: an empty one means this
  // genuinely is not a Mini App session, so there is nothing left to wait for.
  return !sdkPresent || launchHash;
}

let pending: Promise<string> | null = null;

/**
 * Resolve with the request credential once it is available, or with '' once we can be
 * confident this is not a Telegram Mini App session. Safe to call concurrently: all
 * callers share one poll.
 */
export function waitForInitData(): Promise<string> {
  if (typeof window === 'undefined') return Promise.resolve('');

  const immediate = getInitDataNow();
  if (immediate) return Promise.resolve(immediate);
  if (!telegramLaunchPending()) return Promise.resolve('');
  if (pending) return pending;

  pending = new Promise<string>((resolve) => {
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const initData = getInitDataNow();
      const timedOut = Date.now() - startedAt >= SDK_WAIT_MS;

      if (initData || timedOut || !telegramLaunchPending()) {
        window.clearInterval(interval);
        pending = null;
        resolve(initData);
      }
    }, POLL_MS);
  });

  return pending;
}
