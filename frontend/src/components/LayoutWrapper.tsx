'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LayoutWrapperProps {
    children: React.ReactNode;
    className?: string;
}

export default function LayoutWrapper({ children, className = "" }: LayoutWrapperProps) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-nebula-void text-white font-sans selection:bg-nebula-cyan selection:text-nebula-dark">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Main Gradient */}
                <div className="absolute inset-0 bg-antigravity-gradient opacity-80" />

                {/* Floating Orbs */}
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-nebula-purple opacity-20 blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-nebula-cyan opacity-10 blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

                {/* Grid Overlay (Optional for Cyberpunk feel) */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
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
        </div>
    );
}
