'use client';

import React, { useState } from 'react';
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
      isHighlight: true,
    },
    {
      id: 1,
      tag: t('item1_tag'),
      title: t('item1_title'),
      desc: t('item1_desc'),
      fullText: t('item1_fullText'),
      date: t('item1_date'),
      isHighlight: false,
    },
    {
      id: 2,
      tag: t('item2_tag'),
      title: t('item2_title'),
      desc: t('item2_desc'),
      fullText: t('item2_fullText'),
      date: t('item2_date'),
      isHighlight: false,
    },
  ];

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
    telegramHaptic('light');
  };

  return (
    <section aria-labelledby="news-heading" className="w-full space-y-3">
      <h2 id="news-heading" className="sr-only">Latest Updates & Announcements</h2>
      {newsItems.map((item, idx) => {
        const isExpanded = expandedId === item.id;
        return (
          <article
            key={item.id}
            aria-expanded={isExpanded}
            onClick={() => toggleExpand(item.id)}
            className="w-full cursor-pointer focus:outline-none"
          >
            <Card
              variant={item.isHighlight ? 'premium' : 'x-panel'}
              className={`p-4 transition-all duration-200 ${
                isExpanded ? 'border-brand-primary/30' : 'hover:border-brand-border-opacity-30'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <Badge
                  variant={item.isHighlight ? 'primary' : 'secondary'}
                  className={item.isHighlight ? 'bg-gradient-to-r from-purple-500 to-amber-500 text-white border-none' : ''}
                >
                  {item.tag}
                </Badge>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-brand-muted">
                  <FaClock className="text-[9px]" />
                  <span>{item.date}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <h3 className={`text-xs font-black uppercase tracking-wide transition-colors ${
                  item.isHighlight ? 'text-purple-300' : isExpanded ? 'text-brand-primary' : 'text-brand-primary/90'
                }`}>
                  {item.title}
                </h3>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className="text-brand-muted shrink-0"
                >
                  <FaChevronDown fontSize={11} />
                </motion.div>
              </div>

              <p className="text-[11px] text-brand-muted font-medium leading-relaxed mt-1">
                {item.desc}
              </p>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 pt-3 border-t border-brand-border"
                  >
                    <p className="text-[11px] text-brand-primary/80 font-normal leading-relaxed">
                      {item.fullText}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </article>
        );
      })}
    </section>
  );
}
