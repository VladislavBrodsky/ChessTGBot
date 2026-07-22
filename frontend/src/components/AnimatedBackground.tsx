/**
 * Shared ambient page field.
 *
 * This deliberately stays static: it sits behind every scrollable dashboard
 * surface, where animated blur filters and pointer-driven state updates are
 * disproportionately expensive in Telegram WebViews.
 */
export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <div className="absolute inset-0 bg-brand-void" />

      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: [
            'radial-gradient(ellipse 76% 54% at 16% 0%, var(--bg-orb-1) 0%, transparent 72%)',
            'radial-gradient(ellipse 68% 48% at 96% 42%, var(--bg-orb-2) 0%, transparent 74%)',
            'radial-gradient(ellipse 62% 46% at 44% 100%, var(--bg-orb-3) 0%, transparent 76%)',
          ].join(', '),
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--bg-dot-color) 1px, transparent 0)',
          backgroundSize: '36px 36px',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 35%, transparent 18%, var(--color-brand-void) 92%)',
        }}
      />
    </div>
  );
}
