'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { FaChessKnight, FaWallet, FaShareAlt, FaCrown, FaArrowRight, FaArrowLeft, FaTimes } from 'react-icons/fa';
import { useTranslations } from 'next-intl';

interface OnboardingProps {
  onClose: () => void;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export default function Onboarding({ onClose }: OnboardingProps) {
  const t = useTranslations('Onboarding');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for back, 1 for next

  const slides = [
    {
      title: t('slide1_title'),
      subtitle: t('slide1_subtitle'),
      description: t('slide1_desc'),
      icon: <FaChessKnight className="text-brand-primary text-6xl animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />,
      gradient: "from-blue-600/25 to-cyan-500/10",
      accentColor: "text-blue-400"
    },
    {
      title: t('slide2_title'),
      subtitle: t('slide2_subtitle'),
      description: t('slide2_desc'),
      icon: <FaWallet className="text-emerald-400 text-6xl drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />,
      gradient: "from-emerald-600/25 to-teal-500/10",
      accentColor: "text-emerald-400"
    },
    {
      title: t('slide3_title'),
      subtitle: t('slide3_subtitle'),
      description: t('slide3_desc'),
      icon: <FaShareAlt className="text-amber-400 text-6xl drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />,
      gradient: "from-amber-600/25 to-orange-500/10",
      accentColor: "text-amber-400"
    },
    {
      title: t('slide4_title'),
      subtitle: t('slide4_subtitle'),
      description: t('slide4_desc'),
      icon: <FaCrown className="text-brand-gold text-6xl drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]" />,
      gradient: "from-brand-gold/15 to-brand-gold/5",
      accentColor: "text-brand-gold"
    }
  ];

  const handleComplete = useCallback(() => {
    localStorage.setItem("onboarding_completed", "true");
    onClose();
  }, [onClose]);

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => {
      if (prev < slides.length - 1) {
        setDirection(1);
        return prev + 1;
      } else {
        handleComplete();
        return prev;
      }
    });
  }, [slides.length, handleComplete]);

  const handleBack = useCallback(() => {
    setCurrentSlide((prev) => {
      if (prev > 0) {
        setDirection(-1);
        return prev - 1;
      }
      return prev;
    });
  }, []);

  // Prevent background scroll when overlay is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalOverflowX = document.body.style.overflowX;
    document.body.style.overflow = 'hidden';
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overflowX = originalOverflowX;
    };
  }, []);

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handleBack();
      else if (e.key === 'Escape') handleComplete();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handleBack, handleComplete]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.95
    })
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-desc"
    >

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel w-[calc(100%-2rem)] max-w-[420px] max-h-[95vh] rounded-[32px] p-6 sm:p-8 shadow-premium flex flex-col justify-between min-h-[450px] sm:min-h-[500px] relative z-10 overflow-y-auto no-scrollbar"
      >
        {/* Skip button top right */}
        <button
          onClick={handleComplete}
          className="absolute top-5 right-5 text-brand-muted hover:text-brand-primary transition-colors p-2 z-20 rounded-full focus:outline-none"
          title={t('skip')}
          aria-label={t('skip')}
        >
          <FaTimes className="text-xl" />
        </button>

        {/* Content Slider */}
        <div className="relative flex-grow w-full flex flex-col justify-center items-center text-center py-2 sm:py-4">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }: PanInfo) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold) {
                  handleNext();
                } else if (swipe > swipeConfidenceThreshold) {
                  handleBack();
                }
              }}
              className="w-full flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing"
            >
              {/* Slide Icon */}
              <div className={`mb-6 p-6 rounded-3xl bg-white/5 border border-white/10 shadow-inner flex items-center justify-center bg-gradient-to-br ${slides[currentSlide].gradient}`}>
                {slides[currentSlide].icon}
              </div>

              {/* Title & Subtitle */}
              <span className={`text-xs font-black tracking-[0.2em] uppercase mb-3 ${slides[currentSlide].accentColor}`}>
                {slides[currentSlide].subtitle}
              </span>
              <h2 id="onboarding-title" className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
                {slides[currentSlide].title}
              </h2>

              {/* Description */}
              <p id="onboarding-desc" className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed max-w-[320px]">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Section */}
        <div className="mt-6 sm:mt-8 flex flex-col items-center gap-6 sm:gap-8 relative z-10">
          {/* Slide Indicator Dots */}
          <div className="flex justify-center gap-2.5" role="tablist" aria-label="Onboarding Progress">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentSlide ? 1 : -1);
                  setCurrentSlide(idx);
                }}
                role="tab"
                aria-selected={idx === currentSlide}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all duration-500 focus:outline-none ${
                  idx === currentSlide 
                    ? 'w-10 bg-brand-primary shadow-[0_0_12px_rgba(99,102,241,0.6)]' 
                    : 'w-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex w-full gap-4">
            {currentSlide > 0 && (
              <button
                onClick={handleBack}
                aria-label={t('back')}
                className="glass-button flex items-center justify-center w-14 h-14 rounded-2xl transition-all active:scale-95 focus:outline-none flex-shrink-0"
              >
                <FaArrowLeft className="text-lg" />
              </button>
            )}

            <button
              onClick={handleNext}
              aria-label={currentSlide === slides.length - 1 ? t('get_started') : t('next')}
              className={`flex flex-1 items-center justify-center gap-2 px-6 h-14 rounded-2xl font-black text-sm tracking-[0.15em] uppercase shadow-lg transition-all active:scale-95 focus:outline-none ${
                currentSlide === slides.length - 1
                  ? 'action-button bg-brand-primary text-white'
                  : 'glass-button bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {currentSlide === slides.length - 1 ? (
                t('get_started')
              ) : (
                <>
                  {t('next')} <FaArrowRight className="text-sm" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
