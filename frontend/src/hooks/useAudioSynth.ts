'use client';

// Reusable singleton AudioContext to prevent iOS WKWebView instance limits & audio cutoffs
let sharedSynthAudioCtx: AudioContext | null = null;

function getSynthAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedSynthAudioCtx || sharedSynthAudioCtx.state === 'closed') {
    sharedSynthAudioCtx = new AudioCtx();
  }
  if (sharedSynthAudioCtx.state === 'suspended') {
    sharedSynthAudioCtx.resume().catch(() => {});
  }
  return sharedSynthAudioCtx;
}

export function useAudioSynth() {
  const playTickSound = (type: 'tick' | 'warning' | 'timeout') => {
    if (typeof window === 'undefined') return;
    try {
      const ctx = getSynthAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      let duration = 0.05;
      if (type === 'tick') {
        duration = 0.05;
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      } else if (type === 'warning') {
        duration = 0.15;
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      } else if (type === 'timeout') {
        duration = 0.5;
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      }

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch (err) {
      console.error("Audio error:", err);
    }
  };

  return { playTickSound };
}
