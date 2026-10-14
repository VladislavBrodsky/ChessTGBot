'use client';

import type { ReactNode } from 'react';
import React, {
  createContext,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import type {
  GlobalOptions as ConfettiGlobalOptions,
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
} from 'canvas-confetti';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/Button';

export type ConfettiRef = {
  fire: (options?: ConfettiOptions) => Promise<void> | void;
};

type Props = React.ComponentPropsWithRef<'canvas'> & {
  options?: ConfettiOptions;
  globalOptions?: ConfettiGlobalOptions;
  manualstart?: boolean;
  children?: ReactNode;
};

const ConfettiContext = createContext<ConfettiRef | null>(null);

const ConfettiComponent = forwardRef<ConfettiRef, Props>((props, ref) => {
  const {
    options,
    globalOptions = { resize: true, useWorker: true },
    manualstart = false,
    children,
    className,
    ...rest
  } = props;

  const canvasNodeRef = useRef<HTMLCanvasElement | null>(null);
  const instanceRef = useRef<ConfettiInstance | null>(null);
  const optionsRef = useRef(options);
  const globalOptionsRef = useRef(globalOptions);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    globalOptionsRef.current = globalOptions;
  }, [globalOptions]);

  useEffect(() => {
    if (canvasNodeRef.current && !instanceRef.current) {
      instanceRef.current = confetti.create(canvasNodeRef.current, {
        resize: true,
        useWorker: true,
        ...globalOptionsRef.current,
      });
    }

    return () => {
      instanceRef.current?.reset();
      instanceRef.current = null;
    };
  }, []);

  const fire = useCallback(async (opts: ConfettiOptions = {}) => {
    try {
      await instanceRef.current?.({
        ...optionsRef.current,
        ...opts,
      });
    } catch (error) {
      console.error('Confetti error:', error);
    }
  }, []);

  const api = useMemo<ConfettiRef>(() => ({ fire }), [fire]);

  useImperativeHandle(ref, () => api, [api]);

  useEffect(() => {
    if (!manualstart) {
      void fire();
    }
  }, [manualstart, fire]);

  return (
    <ConfettiContext.Provider value={api}>
      <canvas ref={canvasNodeRef} className={className} {...rest} />
      {children}
    </ConfettiContext.Provider>
  );
});

ConfettiComponent.displayName = 'Confetti';

export const Confetti = ConfettiComponent;

export interface ConfettiButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  options?: ConfettiOptions & ConfettiGlobalOptions & { canvas?: HTMLCanvasElement };
}

export const ConfettiButton = forwardRef<HTMLButtonElement, ConfettiButtonProps>(
  ({ options, children, onClick, ...props }, ref) => {
    const handleClick: ConfettiButtonProps['onClick'] = async (event) => {
      try {
        onClick?.(event);
        if (event?.defaultPrevented) return;

        const target = event?.currentTarget;
        if (target && 'getBoundingClientRect' in target) {
          const rect = target.getBoundingClientRect();
          const origin = {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          };

          await confetti({
            zIndex: 9999,
            ...options,
            origin,
          });
        }
      } catch (error) {
        console.error('Confetti button error:', error);
      }
    };

    return (
      <Button ref={ref} type="button" onClick={handleClick} {...props}>
        {children}
      </Button>
    );
  }
);

ConfettiButton.displayName = 'ConfettiButton';

/**
 * Direct imperative trigger for celebratory events (unboxing, match win, level up).
 * Uses Web3Chess obsidian-compatible luxury gold & gem confetti colors.
 */
export async function fireGlobalConfetti(opts?: ConfettiOptions) {
  if (typeof window === 'undefined') return;
  try {
    await confetti({
      zIndex: 10000,
      particleCount: 85,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#34D399', '#8B5CF6', '#F5C451', '#38BDF8', '#FF4500'],
      ...opts,
    });
  } catch (e) {
    console.error('fireGlobalConfetti error:', e);
  }
}
