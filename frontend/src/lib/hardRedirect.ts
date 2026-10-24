/**
 * Full page load to `url`, replacing the current history entry. A seam of its
 * own because jsdom cannot stub window.location, so tests mock this instead.
 */
export function hardRedirect(url: string): void {
  window.location.replace(url);
}
