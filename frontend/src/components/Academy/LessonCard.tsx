import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { motion } from "framer-motion";
import { FaLock, FaCheckCircle, FaChevronRight } from "react-icons/fa";

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

export default function LessonCard({
  title,
  description,
  progress,
  locked = false,
  difficulty = "Beginner",
  duration = "50 XP",
  onClick,
}: LessonCardProps) {
  const t = useTranslations('Academy');
  const tc = useTranslations('Common');
  const difficulties: Record<string, string> = { beginner: t('difficulty_beginner'), intermediate: t('difficulty_intermediate'), advanced: t('difficulty_advanced') };
  const isCompleted = progress >= 100;

  return (
    <motion.div
      whileHover={!locked ? { scale: 1.02, y: -2 } : {}}
      whileTap={!locked ? { scale: 0.98 } : {}}
      onClick={!locked ? onClick : undefined}
      className={`
        relative overflow-hidden rounded-2xl border transition-colors duration-200 bg-brand-surface border-brand-border
        ${locked
          ? "opacity-60 cursor-not-allowed"
          : isCompleted
            ? "cursor-pointer ui-stat--accent hover:border-brand-border-opacity-30"
            : "cursor-pointer hover:border-brand-border-opacity-30 hover:bg-brand-elevated"
        }
      `}
      role={!locked && onClick ? 'button' : undefined}
      tabIndex={!locked && onClick ? 0 : undefined}
      onKeyDown={(event) => { if (!locked && onClick && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onClick(); } }}
      aria-disabled={locked || undefined}
    >

      <div className="relative z-10 p-4 flex flex-col h-full">
        {/* Top row: difficulty badge + status icon */}
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
          <Badge variant="secondary">{difficulties[difficulty.toLowerCase()] ?? difficulty}</Badge>
          {locked ? (
            <Badge variant="secondary" icon={<FaLock />}>{tc('locked')}</Badge>
          ) : isCompleted ? (
            <Badge variant="emerald" icon={<FaCheckCircle />}>{tc('completed')}</Badge>
          ) : (
            <Badge variant="secondary">{duration}</Badge>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold tracking-tight text-brand-primary normal-case leading-tight mb-1.5 header-balanced">
          {title}
        </h4>

        {/* Description */}
        <p className="text-caption text-brand-muted font-medium leading-relaxed line-clamp-2 flex-1 mb-3 text-pretty">
          {description}
        </p>

        {/* Bottom: progress bar + CTA */}
        <div className="space-y-2">
          {/* Progress bar */}
          <div className="w-full h-1 bg-brand-elevated rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${isCompleted ? "bg-brand-action" : "bg-brand-muted"}`}
            />
          </div>

          {/* Status row */}
          <div className="flex justify-between items-center">
            <span className={`text-caption font-medium ${isCompleted ? "text-brand-success" : "text-brand-muted"}`}>
              {isCompleted ? tc('completed') : t('start_learning')}
            </span>
            {!locked && (
              <motion.span
                whileHover={{ x: 2 }}
                className="flex items-center gap-1 text-caption font-semibold text-brand-muted hover:text-brand-primary transition-colors"
              >
                {isCompleted ? t('lesson_review') : t('lesson_start')}
                <FaChevronRight size={6} />
              </motion.span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
