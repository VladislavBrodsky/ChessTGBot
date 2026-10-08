'use client';

import React, { useState } from "react";
import { FaRobot, FaGamepad, FaAward } from "react-icons/fa";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { telegramHaptic } from "@/lib/telegram";
import { useTranslations } from "next-intl";

interface AiDifficultyDrawerProps {
  onClose: () => void;
  onSelect: (difficulty: string) => void;
  isCreating: boolean;
}

export default function AiDifficultyDrawer({ onClose, onSelect, isCreating }: AiDifficultyDrawerProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("medium");
  const t = useTranslations("Game");

  const options = [
    {
      id: "easy",
      title: t("ai_easy"),
      desc: "800 Elo",
      icon: <FaGamepad size={14} />,
      colorClass: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      activeBg: "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.12)]",
    },
    {
      id: "medium",
      title: t("ai_medium"),
      desc: "1200 Elo",
      icon: <FaAward size={14} />,
      colorClass: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      activeBg: "border-amber-500/50 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.12)]",
    },
    {
      id: "hard",
      title: t("ai_hard"),
      desc: "1600 Elo",
      icon: <FaRobot size={14} />,
      colorClass: "text-rose-400 border-rose-500/30 bg-rose-500/10",
      activeBg: "border-rose-500/50 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.12)]",
    },
  ];

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={t("ai_select_difficulty")}
      description={t("ai_difficulty_help")}
    >
      <div className="space-y-3 mb-2">
        {options.map((opt) => {
          const isSelected = selectedDifficulty === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={isCreating}
              onClick={() => {
                telegramHaptic('selection');
                setSelectedDifficulty(opt.id);
              }}
              className={`ui-tap-target w-full text-left rounded-2xl p-4 border transition-all duration-200 flex items-start gap-3 bg-brand-surface ${
                isSelected
                  ? opt.activeBg
                  : "border-brand-border hover:border-brand-border-opacity-20"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isSelected ? opt.colorClass : 'bg-brand-elevated border-brand-border text-brand-muted'
              }`}>
                {opt.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-brand-primary">
                  {opt.title}
                </span>
                <span className="text-caption text-brand-muted mt-1 leading-relaxed">
                  {opt.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <Button
        variant="primary"
        size="lg"
        isLoading={isCreating}
        onClick={() => onSelect(selectedDifficulty)}
        className="w-full normal-case font-semibold tracking-normal"
      >
        {t("ai_start_training")}
      </Button>
    </Drawer>
  );
}
