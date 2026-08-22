import { useCallback, useRef } from 'react';

type SoundType = 'move' | 'capture' | 'check' | 'win' | 'loss' | 'start' | 'topup';

// Reusable singleton AudioContext to prevent iOS WKWebView instance limits & GC stutters
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export const useAudio = () => {
  const enabledRef = useRef(true);

  const play = useCallback((type: SoundType) => {
    if (!enabledRef.current || typeof window === 'undefined') return;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      // Helper to play a tone with precise envelope settings and frequency slides
      const playNote = (
        freq: number,
        startOffset: number,
        duration: number,
        waveType: OscillatorType = 'triangle',
        volume: number = 0.15,
        frequencyRampTarget?: number
      ) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);

        if (frequencyRampTarget) {
          osc.frequency.exponentialRampToValueAtTime(
            frequencyRampTarget,
            ctx.currentTime + startOffset + duration
          );
        }

        gain.gain.setValueAtTime(volume, ctx.currentTime + startOffset);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + startOffset + duration
        );

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startOffset);
        osc.stop(ctx.currentTime + startOffset + duration);
      };

      if (type === 'move') {
        // Short warm wood knock
        playNote(300, 0, 0.08, 'triangle', 0.18, 150);
      } else if (type === 'capture') {
        // Two quick metallic/wood knock pulses
        playNote(480, 0, 0.04, 'triangle', 0.18, 240);
        playNote(400, 0.03, 0.06, 'triangle', 0.15, 180);
      } else if (type === 'check') {
        // Dual-tone warning chord
        playNote(650, 0, 0.18, 'sine', 0.10);
        playNote(820, 0, 0.18, 'sine', 0.08);
      } else if (type === 'start') {
        // Rise upward swell
        playNote(220, 0, 0.25, 'sine', 0.12, 440);
      } else if (type === 'win') {
        // Ascending bright major chord arpeggio
        playNote(523.25, 0, 0.12, 'sine', 0.12);     // C5
        playNote(659.25, 0.08, 0.12, 'sine', 0.10);  // E5
        playNote(783.99, 0.16, 0.12, 'sine', 0.08);  // G5
        playNote(1046.50, 0.24, 0.25, 'sine', 0.06); // C6
      } else if (type === 'loss') {
        // Descending minor sweep
        playNote(392.00, 0, 0.15, 'triangle', 0.15, 293.66); // G4 -> D4
        playNote(311.13, 0.12, 0.15, 'triangle', 0.12, 233.08); // Eb4 -> Bb3
        playNote(261.63, 0.24, 0.35, 'triangle', 0.10, 130.81); // C4 -> C3
      } else if (type === 'topup') {
        // Satisfying double coin register chime
        playNote(987.77, 0, 0.12, 'sine', 0.08);   // B5
        playNote(1318.51, 0.06, 0.25, 'sine', 0.06); // E6
      }
    } catch {
      // Audio playback fails gracefully without blocking game loop
    }
  }, []);

  const toggleSound = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return { play, toggleSound };
};
