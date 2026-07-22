/**
 * Browser E2E tests run a local Next dev server with this explicit switch.
 *
 * The hostname and NODE_ENV checks are intentional defense in depth: a test
 * identity can never make an internet-facing production build authenticated,
 * even if someone accidentally supplies the public environment variable.
 */
export function hasE2ETestIdentity(): boolean {
  if (
    typeof window === 'undefined'
    || process.env.NEXT_PUBLIC_E2E_TEST_MODE !== 'true'
    || process.env.NODE_ENV === 'production'
  ) {
    return false;
  }

  const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
  if (!localHosts.has(window.location.hostname)) return false;

  return (window as Window & { __E2E_TEST_AUTH__?: boolean }).__E2E_TEST_AUTH__ === true;
}

/** A deliberately invalid Telegram init-data value used only by local E2E mocks. */
export const E2E_TEST_INIT_DATA = 'e2e-local-browser-test';
