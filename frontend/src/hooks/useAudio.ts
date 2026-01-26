import { useCallback, useEffect, useRef } from 'react';

type SoundType = 'move' | 'capture' | 'check' | 'win' | 'loss' | 'start';

const SOUNDS: Record<SoundType, string> = {
    move: '/sounds/move.mp3',
    capture: '/sounds/capture.mp3',
    check: '/sounds/check.mp3',
    win: '/sounds/win.mp3',
    loss: '/sounds/loss.mp3',
    start: '/sounds/start.mp3',
};

export const useAudio = () => {
    const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
    const enabledRef = useRef(true); // Default to enabled, can be toggled via context later

    useEffect(() => {
        // Preload sounds
        Object.entries(SOUNDS).forEach(([key, src]) => {
            const audio = new Audio(src);
            audio.volume = 0.6; // Not too loud
            audioRefs.current[key] = audio;
        });
    }, []);

    const play = useCallback((type: SoundType) => {
        if (!enabledRef.current) return;

        const audio = audioRefs.current[type];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(err => {
                // Auto-play policy might block this if no user interaction yet
                console.warn("Audio play blocked:", err);
            });
        }
    }, []);

    const toggleSound = useCallback((enabled: boolean) => {
        enabledRef.current = enabled;
    }, []);

    return { play, toggleSound };
};
