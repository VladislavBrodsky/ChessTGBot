'use client';

import React, { useId } from 'react';
import { selectionKeyboard } from './selectionKeyboard';
import { motion } from 'framer-motion';
import { telegramHaptic } from '@/lib/telegram';

export interface TabOption<T extends string = string> {
  id: T;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface TabsProps<T extends string = string> {
  tabs: TabOption<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
  'aria-label'?: string;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  'aria-label': ariaLabel = 'View options',
}: TabsProps<T>) {
  const indicatorId = useId();
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      className={`flex items-center gap-1.5 p-1 bg-brand-elevated border border-brand-border rounded-2xl overflow-x-auto no-scrollbar ${className}`}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(event) => selectionKeyboard(event, index, tabs.length, (next) => { telegramHaptic('selection'); onChange(tabs[next].id); })}
            onClick={() => {
              telegramHaptic('selection');
              onChange(tab.id);
            }}
            className={`ui-tap-target
              relative flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold normal-case tracking-normal transition-colors duration-200 cursor-pointer shrink-0 select-none min-h-11
              ${isActive ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-primary'}
            `}
          >
            {isActive && (
              <motion.div
                layoutId={`${indicatorId}-active`}
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className="absolute inset-0 bg-brand-surface border border-brand-border rounded-xl shadow-sm z-0"
              />
            )}

            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && <span className="text-sm">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`
                    px-1.5 py-0.5 rounded-full text-caption font-semibold leading-none
                    ${isActive ? 'bg-brand-elevated text-brand-primary' : 'bg-brand-surface text-brand-muted border border-brand-border'}
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
