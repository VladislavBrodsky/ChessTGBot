import { motion } from 'framer-motion';
import Navbar from './Navbar';

interface LayoutWrapperProps {
    children: React.ReactNode;
    className?: string;
}

export default function LayoutWrapper({ children, className = "" }: LayoutWrapperProps) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-black text-white font-sans selection:bg-white selection:text-black pb-32">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Starfield Emulation (CSS dots) */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />

                {/* Subtle Scanlines */}
                <div className="absolute inset-0 opacity-[0.01] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,.25)_50%),linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.02),rgba(255,255,255,.06))] bg-[length:100%_2px,3px_100%]" />
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
