'use client';

import { useRouter } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import LessonViewer, { LessonStep } from "@/components/Academy/LessonViewer";
import { FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

// Mock Data can stay here or be passed as props
const OPENING_LESSON_STEPS: LessonStep[] = [
    {
        id: '1',
        type: 'text',
        title: 'Control the Center',
        content: '<p>The most important principle in the opening is to <strong>control the center</strong> (squares d4, e4, d5, e5).</p><p class="mt-2">By controlling these squares, you give your pieces mobility and restrict your opponent.</p>'
    },
    {
        id: '2',
        type: 'interactive_board',
        title: 'Your Turn',
        content: 'Play 1. e4 to stake a claim in the center.',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        solution: ['e2e4']
    },
    {
        id: '3',
        type: 'text',
        title: 'Develop User Pieces',
        content: '<p>Don\'t move the same piece twice! Get your Knights and Bishops out specifically to influence the center.</p>'
    },
    {
        id: '4',
        type: 'interactive_board',
        title: 'Develop the Knight',
        content: 'Develop your Knight to f3 to support the center.',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        solution: ['g1f3']
    }
];

export default function LessonClient() {
    const router = useRouter();
    const [completed, setCompleted] = useState(false);

    const handleComplete = () => {
        setCompleted(true);
    };

    if (completed) {
        return (
            <LayoutWrapper className="pb-32 pt-6">
                <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-panel p-8 rounded-3xl border border-brand-primary/20"
                    >
                        <h1 className="text-3xl font-black italic text-brand-primary mb-2">LESSON COMPLETE!</h1>
                        <p className="text-brand-primary/60 mb-8 font-medium">You have mastered the basics of Opening Principles.</p>

                        <div className="flex gap-4 justify-center">
                            <Link href="/academy">
                                <button className="px-6 py-3 bg-brand-primary text-black font-black uppercase tracking-widest rounded-xl hover:bg-white transition-colors">
                                    Back to Academy
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </LayoutWrapper>
        );
    }

    return (
        <LayoutWrapper className="pb-32 pt-6">
            <div className="w-full max-w-md mx-auto px-4 h-full">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/academy" className="p-3 glass-panel rounded-xl text-brand-primary hover:text-white transition-colors">
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tight text-white">Opening Principles</h1>
                        <p className="text-[10px] text-brand-primary/50 font-bold uppercase tracking-widest">Beginner Track</p>
                    </div>
                </div>

                <LessonViewer
                    steps={OPENING_LESSON_STEPS}
                    onComplete={handleComplete}
                />
            </div>
        </LayoutWrapper>
    );
}
