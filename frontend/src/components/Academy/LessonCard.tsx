import { motion } from "framer-motion";
import { FaPlay, FaLock, FaCheckCircle, FaChevronRight } from "react-icons/fa";

interface LessonCardProps {
  title: string;
  description: string;
  progress: number;
  locked?: boolean;
  image?: string;
  difficulty?: string;
  duration?: string;
  onClick?: () => void;
}

const DIFFICULTY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  Beginner: {
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
  },
  Intermediate: {
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/25",
  },
  Advanced: {
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/25",
  },
  Expert: {
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/25",
  },
};

export default function LessonCard({
  title,
  description,
  progress,
  locked = false,
  difficulty = "Beginner",
  duration = "50 XP",
  onClick,
}: LessonCardProps) {
  const diff = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.Beginner;
  const isCompleted = progress >= 100;

  return (
    <motion.div
      whileHover={!locked ? { scale: 1.02, y: -2 } : {}}
      whileTap={!locked ? { scale: 0.98 } : {}}
      onClick={!locked ? onClick : undefined}
      className={`
        relative overflow-hidden rounded-2xl border transition-all duration-300
        ${locked
          ? "opacity-50 cursor-not-allowed border-brand-border-opacity-10 bg-brand-surface"
          : isCompleted
            ? "cursor-pointer border-emerald-500/30 bg-gradient-to-br from-emerald-500/8 to-brand-surface shadow-[0_4px_20px_rgba(16,185,129,0.12)] hover:shadow-[0_8px_32px_rgba(16,185,129,0.2)] hover:border-emerald-500/50"
            : "cursor-pointer glass-panel border-brand-border-opacity-10 hover:border-brand-primary/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
        }
      `}
    >
      {/* Glow effect for completed */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
      )}

      {/* Top accent line */}
      {isCompleted && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
      )}

      <div className="relative z-10 p-4 flex flex-col h-full">
        {/* Top row: difficulty badge + status icon */}
        <div className="flex justify-between items-center mb-3">
          <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg border ${diff.color} ${diff.bg} ${diff.border}`}>
            {difficulty}
          </span>
          {locked ? (
            <FaLock className="text-brand-primary/20 text-xs" />
          ) : isCompleted ? (
            <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
              <FaCheckCircle className="text-sm text-emerald-400" />
            </div>
          ) : (
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 rounded-full">
              {duration}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-black tracking-tight text-brand-primary uppercase leading-tight mb-1.5">
          {title}
        </h3>

        {/* Description */}
        <p className="text-[11px] text-brand-primary/60 font-medium leading-relaxed line-clamp-2 flex-1 mb-3">
          {description}
        </p>

        {/* Bottom: progress bar + CTA */}
        <div className="space-y-2">
          {/* Progress bar */}
          <div className="w-full h-1 bg-brand-border-opacity-10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${
                isCompleted
                  ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                  : "bg-gradient-to-r from-brand-primary/70 to-brand-primary/40"
              }`}
            />
          </div>

          {/* Status row */}
          <div className="flex justify-between items-center">
            <span className={`text-[10px] font-black uppercase tracking-wide ${
              isCompleted ? "text-emerald-400" : "text-brand-primary/40"
            }`}>
              {isCompleted ? "Completed ✓" : "Start learning"}
            </span>
            {!locked && (
              <motion.span
                whileHover={{ x: 2 }}
                className="flex items-center gap-1 text-[10px] font-black text-brand-primary/50 hover:text-brand-primary transition-colors"
              >
                {isCompleted ? "Review" : "Start"}
                <FaChevronRight size={6} />
              </motion.span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
