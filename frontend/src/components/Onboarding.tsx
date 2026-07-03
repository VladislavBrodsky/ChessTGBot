'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChessKnight, FaWallet, FaShareAlt, FaCrown, FaArrowRight, FaArrowLeft, FaTimes } from 'react-icons/fa';

interface OnboardingProps {
  onClose: () => void;
}

export default function Onboarding({ onClose }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for back, 1 for next

  const slides = [
    {
      title: "FinChess Matrix Arena",
      subtitle: "Play-to-Earn Web3 Chess",
      description: "Welcome to FinChess, the ultimate decentralized chess league built directly inside Telegram. Match against global players in real-time, hone your skills against advanced chess engines, and compete to win real USDT stakes.",
      icon: <FaChessKnight className="text-brand-primary text-6xl animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />,
      gradient: "from-blue-600/25 to-cyan-500/10",
      accentColor: "text-blue-400"
    },
    {
      title: "Fair ELO Matchmaking",
      subtitle: "Match, Wager & Payout",
      description: "Our dynamic matchmaking algorithm ensures you always play against opponents of a comparable ELO rating. Select your wager tier, lock your stakes securely, and claim 97% of the prize pool when you secure checkmate.",
      icon: <FaWallet className="text-emerald-400 text-6xl drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />,
      gradient: "from-emerald-600/25 to-teal-500/10",
      accentColor: "text-emerald-400"
    },
    {
      title: "Three-Tier Referral Network",
      subtitle: "Drive Virality & Earn Passive Commissions",
      description: "Recruit other players using your unique referral code. As a Premium member, you will earn dynamic USDT rake commissions up to 3 tiers deep from every single cash match played by your invitees.",
      icon: <FaShareAlt className="text-amber-400 text-6xl drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />,
      gradient: "from-amber-600/25 to-orange-500/10",
      accentColor: "text-amber-400"
    },
    {
      title: "XP Progression & Premium",
      subtitle: "Claim Elite Privileges",
      description: "Earn Experience Points (XP) by completing daily tasks and playing matches. Save your XP to upgrade to Premium for free—unlocking 2x rewards multipliers, priority matching, custom 3D themes, and AI-powered game reviews.",
      icon: <FaCrown className="text-purple-400 text-6xl drop-shadow-[0_0_15px_rgba(192,132,252,0.5)]" />,
      gradient: "from-purple-600/25 to-pink-500/10",
      accentColor: "text-purple-400"
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
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center premium-liquid-mesh-container bg-black/80 backdrop-blur-md px-4 modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-desc"
    >
      <div className="premium-liquid-mesh-blob1" />
      <div className="premium-liquid-mesh-blob2" />
      <div className="premium-liquid-mesh-blob3" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel w-full max-w-md rounded-3xl p-8 shadow-premium overflow-hidden flex flex-col justify-between min-h-[480px] relative z-10"
      >
        {/* Skip button top right */}
        <button
          onClick={handleComplete}
          className="absolute top-4 right-4 text-brand-muted hover:text-white transition-colors p-2 z-20 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
          title="Skip onboarding"
          aria-label="Skip onboarding"
        >
          <FaTimes className="text-lg" />
        </button>

        {/* Content Slider */}
        <div className="relative flex-grow flex flex-col justify-center items-center text-center min-h-[280px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
            >
              {/* Slide Icon */}
              <div className={`mb-6 p-6 rounded-3xl bg-white/5 border border-white/10 shadow-inner flex items-center justify-center bg-gradient-to-br ${slides[currentSlide].gradient}`}>
                {slides[currentSlide].icon}
              </div>

              {/* Title & Subtitle */}
              <span className={`text-[10px] font-black tracking-[0.2em] uppercase mb-2 ${slides[currentSlide].accentColor}`}>
                {slides[currentSlide].subtitle}
              </span>
              <h2 id="onboarding-title" className="text-2xl font-black text-white tracking-tight mb-4 leading-snug drop-shadow-md">
                {slides[currentSlide].title}
              </h2>

              {/* Description */}
              <p id="onboarding-desc" className="text-brand-muted text-sm leading-relaxed max-w-[300px]">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Section */}
        <div className="mt-10 flex flex-col items-center gap-6 relative z-10">
          {/* Slide Indicator Dots */}
          <div className="flex justify-center gap-2" role="tablist" aria-label="Onboarding Progress">
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
                className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  idx === currentSlide 
                    ? 'w-8 bg-purple-500 shadow-[0_0_8px_#a855f7]' 
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center w-full gap-4">
            <button
              onClick={handleBack}
              disabled={currentSlide === 0}
              aria-label="Previous slide"
              className={`glass-button flex items-center gap-2 px-5 py-3.5 font-bold text-xs tracking-wider uppercase transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <FaArrowLeft className="text-[10px]" /> Back
            </button>

            <button
              onClick={handleNext}
              aria-label={currentSlide === slides.length - 1 ? "Get Started" : "Next slide"}
              className={`flex flex-1 items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-black text-xs tracking-wider uppercase shadow-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                currentSlide === slides.length - 1
                  ? 'action-button bg-purple-600 text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {currentSlide === slides.length - 1 ? (
                "Get Started"
              ) : (
                <>
                  Next <FaArrowRight className="text-[10px]" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
