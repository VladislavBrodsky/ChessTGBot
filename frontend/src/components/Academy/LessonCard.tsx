import { motion } from "framer-motion";
import { FaPlay, FaLock, FaCheckCircle, FaStar } from "react-icons/fa";

interface LessonCardProps {
    title: string;
    description: string;
    progress: number;
    locked?: boolean;
    image?: string; // Optional background image or icon
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    duration?: string;
    onClick?: () => void;
}

export default function LessonCard({
    title,
    description,
    progress,
    locked = false,
    difficulty = 'Beginner',
    duration = '5 min',
    onClick
}: LessonCardProps) {

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={!locked ? onClick : undefined}
            className={`
                relative overflow-hidden rounded-2xl p-5 border
                ${locked
                    ? "bg-brand-primary/5 border-brand-primary/10 opacity-70 cursor-not-allowed"
                    : "glass-panel border-brand-primary/10 cursor-pointer hover:shadow-premium"
                }
            `}
        >
            {/* Background Gradient/Image Placeholder */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <span className={`
                            text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md
                            ${difficulty === 'Beginner' ? 'bg-green-500/10 text-green-400' :
                                difficulty === 'Intermediate' ? 'bg-yellow-500/10 text-yellow-400' :
                                    'bg-red-500/10 text-red-400'}
                        `}>
                            {difficulty}
                        </span>
                        {locked ? (
                            <FaLock className="text-brand-primary/30" />
                        ) : progress >= 100 ? (
                            <FaCheckCircle className="text-green-400" />
                        ) : (
                            <div className="text-[10px] font-bold text-brand-primary/50">{duration}</div>
                        )}
                    </div>

                    <h3 className="text-lg font-black italic tracking-tight text-white mb-1">{title}</h3>
                    <p className="text-xs text-brand-primary/60 font-medium leading-relaxed">{description}</p>
                </div>

                <div className="mt-4">
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-brand-primary/10 rounded-full overflow-hidden mb-2">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-brand-primary"
                        />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-brand-primary/40">
                        <span>{progress}% Competed</span>
                        {!locked && <span className="flex items-center gap-1 text-brand-primary">Start <FaPlay size={8} /></span>}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
