export const SOUND_PREFERENCE_KEY = 'web3chess.sound.enabled';
const SOUND_CHANGE_EVENT = 'web3chess:sound-change';
let enabled = true;
let loaded = false;

export function getSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  if (!loaded) {
    try { enabled = localStorage.getItem(SOUND_PREFERENCE_KEY) !== 'false'; } catch { /* Restricted WebView: retain the session preference. */ }
    loaded = true;
  }
  return enabled;
}

export function setSoundEnabled(next: boolean): void {
  enabled = next;
  loaded = true;
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(SOUND_PREFERENCE_KEY, String(next)); } catch { /* Session preference still works without storage. */ }
  window.dispatchEvent(new Event(SOUND_CHANGE_EVENT));
}

export function subscribeSoundPreference(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== SOUND_PREFERENCE_KEY && event.key !== null) return;
    loaded = false;
    onChange();
  };
  window.addEventListener(SOUND_CHANGE_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(SOUND_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}
