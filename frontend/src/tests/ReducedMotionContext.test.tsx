import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  REDUCED_MOTION_STORAGE_KEY,
  ReducedMotionProvider,
  useReducedMotionPreference,
} from '@/context/ReducedMotionContext';

jest.mock('framer-motion', () => ({
  MotionConfig: ({ children, reducedMotion }: { children: React.ReactNode; reducedMotion: string }) => (
    <div data-testid="motion-config" data-reduced-motion={reducedMotion}>
      {children}
    </div>
  ),
}));

function PreferenceHarness() {
  const { reducedMotion, setReducedMotion } = useReducedMotionPreference();

  return (
    <button type="button" onClick={() => setReducedMotion(!reducedMotion)}>
      {reducedMotion ? 'Enabled' : 'Disabled'}
    </button>
  );
}

describe('ReducedMotionProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.reduceMotion;
  });

  it('restores a persisted preference and reduces Framer Motion globally', async () => {
    window.localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, 'true');

    render(
      <ReducedMotionProvider>
        <PreferenceHarness />
      </ReducedMotionProvider>,
    );

    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Enabled'));
    expect(document.documentElement).toHaveAttribute('data-reduce-motion', 'true');
    expect(screen.getByTestId('motion-config')).toHaveAttribute('data-reduced-motion', 'always');
  });

  it('persists toggle changes and returns Framer Motion to the OS preference', async () => {
    render(
      <ReducedMotionProvider>
        <PreferenceHarness />
      </ReducedMotionProvider>,
    );

    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-reduce-motion', 'false'));
    fireEvent.click(screen.getByRole('button'));

    expect(window.localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)).toBe('true');
    expect(document.documentElement).toHaveAttribute('data-reduce-motion', 'true');
    expect(screen.getByTestId('motion-config')).toHaveAttribute('data-reduced-motion', 'always');

    fireEvent.click(screen.getByRole('button'));

    expect(window.localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)).toBe('false');
    expect(document.documentElement).toHaveAttribute('data-reduce-motion', 'false');
    expect(screen.getByTestId('motion-config')).toHaveAttribute('data-reduced-motion', 'user');
  });
});
