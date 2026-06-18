'use client';

import { useState, useEffect } from 'react';
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
      icon: <FaChessKnight className="text-brand-primary text-6xl animate-pulse" />,
      gradient: "from-blue-600/25 to-cyan-500/10",
      accentColor: "text-blue-400"
    },
    {
      title: "Fair ELO Matchmaking",
      subtitle: "Match, Wager & Payout",
      description: "Our dynamic matchmaking algorithm ensures you always play against opponents of a comparable ELO rating. Select your wager tier, lock your stakes securely, and claim 97% of the prize pool when you secure checkmate.",
      icon: <FaWallet className="text-emerald-400 text-6xl" />,
      gradient: "from-emerald-600/25 to-teal-500/10",
      accentColor: "text-emerald-400"
    },
    {
      title: "Three-Tier Referral Network",
      subtitle: "Drive Virality & Earn Passive Commissions",
      description: "Recruit other players using your unique referral code. As a Premium member, you will earn dynamic USDT rake commissions up to 3 tiers deep from every single cash match played by your invitees.",
      icon: <FaShareAlt className="text-amber-400 text-6xl" />,
      gradient: "from-amber-600/25 to-orange-500/10",
      accentColor: "text-amber-400"
    },
    {
      title: "XP Progression & Premium",
      subtitle: "Claim Elite Privileges",
      description: "Earn Experience Points (XP) by completing daily tasks and playing matches. Save your XP to upgrade to Premium for free—unlocking 2x rewards multipliers, priority matching, custom 3D themes, and AI-powered game reviews.",
      icon: <FaCrown className="text-purple-400 text-6xl" />,
      gradient: "from-purple-600/25 to-pink-500/10",
      accentColor: "text-purple-400"
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    onClose();
  };

  // Prevent background scroll when overlay is active, restoring original style rules on cleanup
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

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0
    })
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-void/90 backdrop-blur-md px-6 modal-backdrop">
      {/* Background Matrix/Nebula Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br ${slides[currentSlide].gradient} blur-[120px] transition-all duration-1000 ease-in-out`} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border-muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--border-muted)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md bg-brand-surface/40 border border-brand-border-opacity-20 rounded-2xl backdrop-blur-xl p-8 shadow-2xl overflow-hidden flex flex-col justify-between min-h-[460px]"
      >
        {/* Skip button top right */}
        <button
          onClick={handleComplete}
          className="absolute top-4 right-4 text-brand-muted hover:text-brand-primary transition-colors p-2 z-10"
          title="Skip onboarding"
        >
          <FaTimes className="text-lg" />
        </button>

        {/* Content Slider */}
        <div className="relative flex-grow flex flex-col justify-center items-center text-center">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex flex-col items-center justify-center"
            >
              {/* Slide Icon */}
              <div className="mb-6 p-5 rounded-2xl bg-brand-void/60 border border-brand-border shadow-inner flex items-center justify-center">
                {slides[currentSlide].icon}
              </div>

              {/* Title & Subtitle */}
              <span className={`text-xs font-semibold tracking-wider uppercase mb-1 ${slides[currentSlide].accentColor}`}>
                {slides[currentSlide].subtitle}
              </span>
              <h2 className="text-2xl font-bold text-brand-primary tracking-tight mb-4 leading-snug">
                {slides[currentSlide].title}
              </h2>

              {/* Description */}
              <p className="text-brand-muted text-sm leading-relaxed max-w-sm">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Section */}
        <div className="mt-8 flex flex-col items-center gap-6">
          {/* Slide Indicator Dots */}
          <div className="flex justify-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentSlide ? 1 : -1);
                  setCurrentSlide(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlide 
                    ? 'w-6 bg-brand-primary shadow-lg' 
                    : 'w-2 bg-brand-border hover:bg-brand-muted/60'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center w-full gap-4">
            {currentSlide > 0 ? (
              <button
                onClick={handleBack}
                className="glass-button flex items-center gap-2 px-5 py-3 font-semibold text-sm tracking-wide transition-all active:scale-98"
              >
                <FaArrowLeft className="text-[10px]" /> Back
              </button>
            ) : (
              <div /> // spacer
            )}

            <button
              onClick={handleNext}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all active:scale-98 ${
                currentSlide === slides.length - 1
                  ? 'action-button w-full'
                  : 'bg-brand-primary hover:opacity-90 text-brand-void'
              }`}
            >
              {currentSlide === slides.length - 1 ? (
                "Get Started"
              ) : (
                <>
                  Next <FaArrowRight className="text-xs" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
