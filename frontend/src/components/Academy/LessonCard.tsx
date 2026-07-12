import { motion } from "framer-motion";
import { FaPlay, FaLock, FaCheckCircle } from "react-icons/fa";

interface LessonCardProps {
 title: string;
 description: string;
 progress: number;
 locked?: boolean;
 image?: string; // Optional background image or icon
 difficulty?: string;
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
 relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 shadow-sm
 ${locked
 ? "bg-brand-surface border-brand-border-opacity-5 opacity-60 cursor-not-allowed"
 : progress >= 100
 ? "bg-gradient-to-br from-emerald-900/10 to-brand-surface border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20 cursor-pointer hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]"
 : "glass-panel border-brand-border-opacity-10 bg-brand-surface cursor-pointer hover:bg-brand-bg-opacity-5"
 }
 `}
 >
 {/* Background Gradient/Image Placeholder */}
 <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

 <div className="relative z-10 flex flex-col h-full justify-between">
 <div>
 <div className="flex justify-between items-start mb-3">
 <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${progress >= 100 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-brand-primary/5 border-brand-border-opacity-10 text-brand-primary opacity-80'}`}>
 {difficulty}
 </span>
 {locked ? (
 <FaLock className="text-brand-primary opacity-30" />
 ) : progress >= 100 ? (
 <FaCheckCircle className="text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] rounded-full animate-pulse" />
 ) : (
 <div className="text-[10px] font-bold text-brand-primary opacity-40">{duration}</div>
 )}
 </div>

 <h3 className="text-lg font-black tracking-tight text-brand-primary mb-1 uppercase">{title}</h3>
 <p className="text-xs text-brand-primary opacity-60 font-medium leading-relaxed">{description}</p>
 </div>

  <div className="mt-4">
    {/* Progress Bar */}
    <div className="w-full h-1.5 bg-brand-void/50 rounded-full overflow-hidden mb-2 border border-brand-border-opacity-5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        className={`h-full rounded-full bg-gradient-to-r ${
          progress >= 100 
            ? 'from-emerald-400 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
            : 'from-brand-primary to-cyan-400 shadow-[0_0_8px_rgba(255,255,255,0.2)]'
        }`}
      />
    </div>
    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
      <span className={progress >= 100 ? 'text-emerald-400' : 'text-brand-primary/55'}>
        {progress}% Completed
      </span>
      {!locked && (
        <span className="flex items-center gap-1 text-brand-primary hover:text-brand-primary/80 transition-colors">
          Start <FaPlay size={7} />
        </span>
      )}
    </div>
  </div>
 </div>
 </motion.div>
 );
}
