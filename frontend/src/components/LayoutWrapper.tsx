import { motion } from 'framer-motion';
import Navbar from './Navbar';

interface LayoutWrapperProps {
    children: React.ReactNode;
    className?: string;
}

export default function LayoutWrapper({ children, className = "" }: LayoutWrapperProps) {
    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-black text-white font-sans selection:bg-white selection:text-black">
            {/* Ambient Starfield */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.05]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '48px 48px'
                }} />
                <div className="absolute inset-0 opacity-[0.01] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,.25)_50%),linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.02),rgba(255,255,255,.06))] bg-size-[100%_2px,3px_100%]" />
            </div>

            {/* Content Container */}
            <main className={`relative z-10 w-full flex flex-col items-center min-h-screen pt-4 pb-32 ${className}`}>
                {children}
            </main>

            <Navbar />
        </div>
    );
}
