import { motion } from 'framer-motion';
import Navbar from './Navbar';

interface LayoutWrapperProps {
    children: React.ReactNode;
    className?: string;
}

export default function LayoutWrapper({ children, className = "" }: LayoutWrapperProps) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-nebula-void text-white font-sans selection:bg-nebula-cyan selection:text-nebula-dark pb-32">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Main Gradient */}
                <div className="absolute inset-0 bg-antigravity-gradient opacity-90" />

                {/* Starfield Emulation (CSS dots) */}
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />

                {/* Dynamic Nebula Clouds */}
                <div className="absolute top-[-20%] left-[-10%] w-screen h-[100vw] rounded-full bg-nebula-purple opacity-[0.15] blur-[150px] animate-pulse-slow mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] rounded-full bg-nebula-cyan opacity-[0.08] blur-[120px] animate-pulse-slow mix-blend-screen" style={{ animationDelay: '3s' }} />

                {/* Subtle Scanlines */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,.25)_50%),linear-gradient(90deg,rgba(255,0,0,.06),rgba(0,255,0,.02),rgba(0,0,255,.06))] bg-size-[100%_2px,3px_100%]" />
            </div>

            {/* Content Container */}
            <main className={`relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 ${className}`}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-7xl mx-auto flex flex-col items-center"
                >
                    {children}
                </motion.div>
            </main>

            {/* Global Navigation */}
            <Navbar />
        </div>
    );
}
