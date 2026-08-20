'use client';

import React, { useState } from "react";
import { FaRobot, FaGamepad, FaAward } from "react-icons/fa";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { telegramHaptic } from "@/lib/telegram";

interface AiDifficultyDrawerProps {
  locale: string;
  onClose: () => void;
  onSelect: (difficulty: string) => void;
  isCreating: boolean;
}

const localTranslations: Record<string, any> = {
  en: {
    select_difficulty: "Select AI Difficulty",
    easy_title: "🟢 Easy Mode",
    easy_desc: "800 ELO. Bot searches 2 moves ahead and makes occasional mistakes. Best for learning.",
    medium_title: "🟡 Medium Mode",
    medium_desc: "1200 ELO. Bot searches 3 moves ahead. Plays balanced, solid chess.",
    hard_title: "🔴 Hard Mode",
    hard_desc: "1600 ELO. Bot searches 4 moves ahead. Plays tactically sharp chess.",
    start_game: "Start Training Session",
    close: "Close"
  },
  ru: {
    select_difficulty: "Выберите сложность ИИ",
    easy_title: "🟢 Легкий режим",
    easy_desc: "800 ELO. Бот думает на 2 хода вперед и допускает ошибки. Идеально для обучения.",
    medium_title: "🟡 Средний режим",
    medium_desc: "1200 ELO. Бот думает на 3 хода вперед. Играет в сбалансированные шахматы.",
    hard_title: "🔴 Сложный режим",
    hard_desc: "1600 ELO. Бот думает на 4 хода вперед. Играет в тактически сильные шахматы.",
    start_game: "Начать тренировку",
    close: "Закрыть"
  },
  es: {
    select_difficulty: "Seleccionar Dificultad I.A.",
    easy_title: "🟢 Modo Fácil",
    easy_desc: "800 ELO. El bot busca 2 jugadas por adelantado y comete errores ocasionales. Ideal para aprender.",
    medium_title: "🟡 Modo Medio",
    medium_desc: "1200 ELO. El bot busca 3 jugadas por adelantado. Juega al ajedrez de forma equilibrada.",
    hard_title: "🔴 Modo Difícil",
    hard_desc: "1600 ELO. El bot busca 4 jugadas por adelantado. Ofrece un desafío muy fuerte.",
    start_game: "Iniciar Sesión de Entrenamiento",
    close: "Cerrar"
  },
  fr: {
    select_difficulty: "Sélectionner la Difficulté I.A.",
    easy_title: "🟢 Mode Facile",
    easy_desc: "800 ELO. Le bot anticipe de 2 coups et fait des erreurs occasionnelles. Idéal pour débuter.",
    medium_title: "🟡 Mode Moyen",
    medium_desc: "1200 ELO. Le bot anticipe de 3 coups. Joue aux échecs de manière équilibrée.",
    hard_title: "🔴 Mode Difficile",
    hard_desc: "1600 ELO. Le bot anticipe de 4 coups. Représente un défi tactique de taille.",
    start_game: "Démarrer l'Entraînement",
    close: "Fermer"
  },
  zh: {
    select_difficulty: "选择人机难度",
    easy_title: "🟢 简单模式",
    easy_desc: "800 ELO。人机提前计算2步并偶尔失误。适合新手学习。",
    medium_title: "🟡 中等模式",
    medium_desc: "1200 ELO。人机提前计算3步。提供扎实平衡的棋局。",
    hard_title: "🔴 困难模式",
    hard_desc: "1600 ELO。人机提前计算4步。战术敏锐，极具挑战性。",
    start_game: "开始训练",
    close: "关闭"
  }
};

export default function AiDifficultyDrawer({ locale, onClose, onSelect, isCreating }: AiDifficultyDrawerProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("medium");
  const trans = localTranslations[locale] || localTranslations["en"];

  const options = [
    {
      id: "easy",
      title: trans.easy_title,
      desc: trans.easy_desc,
      icon: <FaGamepad size={14} />,
      colorClass: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      activeBg: "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.12)]",
    },
    {
      id: "medium",
      title: trans.medium_title,
      desc: trans.medium_desc,
      icon: <FaAward size={14} />,
      colorClass: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      activeBg: "border-amber-500/50 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.12)]",
    },
    {
      id: "hard",
      title: trans.hard_title,
      desc: trans.hard_desc,
      icon: <FaRobot size={14} />,
      colorClass: "text-rose-400 border-rose-500/30 bg-rose-500/10",
      activeBg: "border-rose-500/50 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.12)]",
    },
  ];

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={trans.select_difficulty}
      description="Select training level to practice vs the chess engine."
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
              className={`w-full text-left rounded-2xl p-4 border transition-all duration-200 flex items-start gap-3 bg-brand-surface ${
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
                <span className="text-xs font-bold text-brand-primary">
                  {opt.title}
                </span>
                <span className="text-[11px] text-brand-muted mt-1 leading-relaxed">
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
        className="w-full uppercase font-black tracking-wider"
      >
        {isCreating ? "Initializing..." : trans.start_game}
      </Button>
    </Drawer>
  );
}
