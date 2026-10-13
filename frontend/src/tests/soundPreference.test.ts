import { act, renderHook } from '@testing-library/react';
import { useAudio } from '@/hooks/useAudio';
import { useSoundPreference } from '@/hooks/useSoundPreference';
import { getSoundEnabled, setSoundEnabled, SOUND_PREFERENCE_KEY } from '@/lib/soundPreference';

describe('shared sound preference', () => {
  beforeEach(() => { localStorage.clear(); setSoundEnabled(true); });
  afterEach(() => { jest.restoreAllMocks(); });

  it('loads the persisted choice after a fresh module load', async () => {
    localStorage.setItem(SOUND_PREFERENCE_KEY, 'false');
    await jest.isolateModulesAsync(async () => {
      const fresh = await import('@/lib/soundPreference');
      expect(fresh.getSoundEnabled()).toBe(false);
    });
  });

  it('updates mounted controls and retains a session choice when storage is blocked', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    const { result } = renderHook(() => useSoundPreference());
    act(() => setSoundEnabled(false));
    expect(result.current.soundEnabled).toBe(false);
    expect(getSoundEnabled()).toBe(false);
    act(() => setSoundEnabled(true));
    expect(result.current.soundEnabled).toBe(true);
  });

  it('prevents game audio from starting while muted, including an already mounted player', () => {
    const start = jest.fn();
    const constructor = jest.fn(() => ({
      state: 'running', currentTime: 0, destination: {},
      createOscillator: () => ({ type: '', frequency: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }, connect: jest.fn(), start, stop: jest.fn() }),
      createGain: () => ({ gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }, connect: jest.fn() }),
    }));
    const original = window.AudioContext;
    window.AudioContext = constructor as unknown as typeof AudioContext;
    try {
      const { result } = renderHook(() => useAudio());
      setSoundEnabled(false); result.current.play('move');
      expect(constructor).not.toHaveBeenCalled();
      setSoundEnabled(true); result.current.play('move');
      expect(start).toHaveBeenCalledTimes(1);
      setSoundEnabled(false); result.current.play('capture');
      expect(start).toHaveBeenCalledTimes(1);
    } finally { window.AudioContext = original; }
  });
});
