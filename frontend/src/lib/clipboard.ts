/**
 * Clipboard helper that never throws and never leaves an unhandled rejection.
 *
 * `navigator.clipboard.writeText` returns a promise that REJECTS with
 * "Write permission denied" in Telegram WebViews when the call loses its
 * user-gesture context (or the WebView denies clipboard access outright).
 * A bare call — even inside try/catch — escapes as an unhandledrejection
 * and lands in admin alerts. Always use this wrapper instead.
 *
 * Resolves `true` only when the text is actually on the clipboard, so
 * callers can gate their "Copied!" feedback on it. This matters for the
 * manual-deposit memo: showing "copied" when the copy silently failed can
 * cost the user their deposit.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or no user gesture — fall through to the legacy path.
  }

  // Legacy fallback for WebViews without (or denying) the async Clipboard API.
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
