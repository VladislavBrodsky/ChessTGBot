'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClock, FaChevronDown } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { telegramHaptic } from '@/lib/telegram';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function NewsSection() {
    const t = useTranslations('News');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const newsItems = [
        {
            id: 3,
            tag: t('item3_tag'),
            title: t('item3_title'),
            desc: t('item3_desc'),
            fullText: t('item3_fullText'),
            date: t('item3_date'),
            isHighlight: true
        },
        {
            id: 1,
            tag: t('item1_tag'),
            title: t('item1_title'),
            desc: t('item1_desc'),
            fullText: t('item1_fullText'),
            date: t('item1_date'),
            isHighlight: false
        },
        {
            id: 2,
            tag: t('item2_tag'),
            title: t('item2_title'),
            desc: t('item2_desc'),
            fullText: t('item2_fullText'),
            date: t('item2_date'),
            isHighlight: false
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
                            className="w-full"
                        >
                            <Card variant="glass" className={`relative p-4 group hover:bg-brand-bg-opacity-10 transition-all cursor-pointer overflow-hidden ${isExpanded ? 'bg-brand-bg-opacity-10 ring-1 ring-brand-border-opacity-20' : ''} ${item.isHighlight ? 'shadow-[0_0_15px_rgba(168,85,247,0.3)] border-purple-500/40 ring-1 ring-purple-500/30 bg-gradient-to-br from-brand-bg/80 via-purple-900/10 to-brand-bg' : ''}`}>
                            <div className="flex items-start justify-between mb-2">
                                <Badge variant={item.isHighlight ? "primary" : "secondary"} className={`opacity-90 ${item.isHighlight ? 'bg-gradient-to-r from-purple-500 to-orange-500 text-white border-none shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'opacity-80'}`}>
                                    {item.tag}
                                </Badge>
                                <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${item.isHighlight ? 'text-orange-400 opacity-80' : 'text-brand-primary opacity-35'}`}>
                                    <FaClock />
                                    {item.date}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <h4 className={`text-sm font-black transition-colors ${item.isHighlight ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-purple-400 to-brand-primary animate-pulse' : (isExpanded ? 'text-brand-primary' : 'text-brand-primary opacity-90 group-hover:text-brand-primary')}`}>
                                    {item.title}
                                </h4>
                                <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    className={`opacity-20 ${item.isHighlight ? 'text-purple-400 opacity-60' : 'text-brand-primary'}`}
                                >
                                    <FaChevronDown fontSize={12} />
                                </motion.div>
                            </div>

                            <p className={`text-[10px] font-medium leading-relaxed mt-1 ${item.isHighlight ? 'text-brand-primary opacity-60' : 'text-brand-primary opacity-40'}`}>
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
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
