'use client';

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useAnimationsEnabled } from '@/hooks/useAnimationsEnabled';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { FaChessKnight, FaCheck, FaCrown, FaShareAlt, FaWallet } from 'react-icons/fa';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import { Backdrop } from '@/components/ui/Backdrop';
import { Button } from '@/components/ui/Button';
import { useDialogAccessibility } from '@/hooks/useDialogAccessibility';
import { telegramHaptic } from '@/lib/telegram';

interface OnboardingProps {
  onClose: () => void;
}

type Tone = 'success' | 'gold' | 'info' | 'premium';
interface Slide { id: string; tone: Tone; icon: ReactNode; subtitle: string; title: string; description: string; chips: string[]; disclosure?: boolean }

const SWIPE_DISTANCE = 56;

/**
 * First-run walkthrough: four short steps (what it is, how matches work, friends, progress). Compact, centered, one
 * primary action, a visible risk note on the stakes step, and nothing that promises income.
 */
export default function Onboarding({ onClose }: OnboardingProps) {
  const t = useTranslations('Onboarding');
  const animations = useAnimationsEnabled();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const slides: Slide[] = useMemo(() => [
    { id: 'welcome', tone: 'success', icon: <FaChessKnight />, subtitle: t('slide1_subtitle'), title: t('slide1_title'), description: t('slide1_desc'), chips: [t('slide1_b1'), t('slide1_b2'), t('slide1_b3')] },
    { id: 'matches', tone: 'gold', icon: <FaWallet />, subtitle: t('slide2_subtitle'), title: t('slide2_title'), description: t('slide2_desc'), chips: [t('slide2_b1'), t('slide2_b2'), t('slide2_b3')], disclosure: true },
    { id: 'friends', tone: 'info', icon: <FaShareAlt />, subtitle: t('slide3_subtitle'), title: t('slide3_title'), description: t('slide3_desc'), chips: [t('slide3_b1'), t('slide3_b2'), t('slide3_b3')] },
    { id: 'progress', tone: 'premium', icon: <FaCrown />, subtitle: t('slide4_subtitle'), title: t('slide4_title'), description: t('slide4_desc'), chips: [t('slide4_b1'), t('slide4_b2'), t('slide4_b3')] },
  ], [t]);
  const last = slides.length - 1;
  const slide = slides[index];

  const complete = useCallback(() => {
    try { localStorage.setItem('onboarding_completed', 'true'); } catch { /* storage blocked: the sheet just shows again */ }
    onClose();
  }, [onClose]);
  const dialogRef = useDialogAccessibility(mounted, complete);

  const go = useCallback((target: number) => {
    const clamped = Math.max(0, Math.min(last, target));
    if (clamped === index) return;
    setDirection(clamped > index ? 1 : -1);
    setIndex(clamped);
    telegramHaptic('selection');
  }, [index, last]);
  const next = useCallback(() => (index === last ? complete() : go(index + 1)), [index, last, complete, go]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(index + 1);
      else if (event.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index]);

  const onDragEnd = (_: unknown, { offset }: PanInfo) => {
    if (offset.x < -SWIPE_DISTANCE) go(index + 1);
    else if (offset.x > SWIPE_DISTANCE) go(index - 1);
  };

  if (!mounted) return null;
  return createPortal(
    <motion.div
      ref={dialogRef}
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: animations ? 0.25 : 0 }}
      className="ob-overlay"
      data-tone={slide.tone}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-desc"
    >
      <Backdrop />
      <div className="ob-shell">
        <header className="ob-top">
          <div className="ob-steps" role="tablist" aria-label={t('progress')}>
            {slides.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={t('go_to', { n: i + 1 })}
                className="ob-step"
                data-state={i < index ? 'done' : i === index ? 'active' : 'todo'}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <button type="button" className="ob-skip" onClick={complete}>{t('skip')}</button>
        </header>

        <div className="ob-stage">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.section
              key={slide.id}
              custom={direction}
              variants={{
                enter: (dir: number) => ({ opacity: 0, x: animations ? dir * 32 : 0 }),
                center: { opacity: 1, x: 0 },
                exit: (dir: number) => ({ opacity: 0, x: animations ? dir * -32 : 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: animations ? 0.28 : 0, ease: [0.16, 1, 0.3, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={onDragEnd}
              className="ob-slide"
              aria-label={t('step_of', { current: index + 1, total: slides.length })}
            >
              <div className="ui-medallion" aria-hidden="true">{slide.icon}</div>
              <p className="ob-eyebrow t-eyebrow">{slide.subtitle}</p>
              <h2 id="onboarding-title" className="ob-title t-title-1">{slide.title}</h2>
              <p id="onboarding-desc" className="ob-desc">{slide.description}</p>
              <ul className="ob-chips">
                {slide.chips.map(chip => (
                  <li key={chip} className="ob-chip"><FaCheck size={10} aria-hidden="true" />{chip}</li>
                ))}
              </ul>
              {slide.disclosure && <p className="ob-disclosure">{t('disclosure')}</p>}
            </motion.section>
          </AnimatePresence>
        </div>

        <footer className="ob-actions">
          {index > 0 && (
            <Button variant="outline" size="lg" className="ob-back" aria-label={t('back')} onClick={() => go(index - 1)}>
              <FiArrowLeft size={20} className="rtl:rotate-180" aria-hidden="true" />
            </Button>
          )}
          <Button variant="primary" size="lg" className="ob-next" onClick={next} rightIcon={index === last ? undefined : <FiArrowRight size={18} className="rtl:rotate-180" aria-hidden="true" />}>
            {index === last ? t('get_started') : t('next')}
          </Button>
        </footer>
      </div>
    </motion.div>, document.body
  );
}
