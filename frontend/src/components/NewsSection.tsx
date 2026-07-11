'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClock, FaChevronDown } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { telegramHaptic } from '@/lib/telegram';

export default function NewsSection() {
    const t = useTranslations('News');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const newsItems = [
        {
            id: 1,
            tag: t('item1_tag'),
            title: t('item1_title'),
            desc: t('item1_desc'),
            fullText: t('item1_fullText'),
            date: t('item1_date')
        },
        {
            id: 2,
            tag: t('item2_tag'),
            title: t('item2_title'),
            desc: t('item2_desc'),
            fullText: t('item2_fullText'),
            date: t('item2_date')
        }
    ];

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);

        telegramHaptic('light');
    };

    return (
        <div className="w-full space-y-4">
            <div className="space-y-3">
                {newsItems.map((item, idx) => {
                    const isExpanded = expandedId === item.id;
                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => toggleExpand(item.id)}
                            className={`glass-panel p-4 group hover:bg-brand-bg-opacity-10 transition-all cursor-pointer overflow-hidden ${isExpanded ? 'bg-brand-bg-opacity-10 ring-1 ring-brand-border-opacity-20' : ''}`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <span className="px-2 py-0.5 rounded-md bg-brand-bg-opacity-10 text-[10px] font-black text-brand-primary tracking-widest">
                                    {item.tag}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-primary opacity-35 uppercase">
                                    <FaClock />
                                    {item.date}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <h4 className={`text-sm font-black text-brand-primary opacity-90 transition-colors ${isExpanded ? 'text-brand-primary' : 'group-hover:text-brand-primary'}`}>
                                    {item.title}
                                </h4>
                                <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    className="text-brand-primary opacity-20"
                                >
                                    <FaChevronDown fontSize={12} />
                                </motion.div>
                            </div>

                            <p className="text-[10px] font-medium text-brand-primary opacity-40 leading-relaxed mt-1">
                                {item.desc}
                            </p>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-4 pt-4 border-t border-brand-border-opacity-5"
                                    >
                                        <p className="text-[10px] font-medium text-brand-primary opacity-75 leading-relaxed">
                                            {item.fullText}
                                        </p>
                                        <div className="mt-4 flex gap-2">
                                            <div className="h-0.5 w-8 bg-brand-primary rounded-full" />
                                            <div className="h-0.5 w-2 bg-brand-bg-opacity-20 rounded-full" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
