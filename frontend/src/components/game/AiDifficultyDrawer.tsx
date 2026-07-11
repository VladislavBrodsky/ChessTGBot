'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaRobot, FaGamepad, FaAward } from "react-icons/fa";
import { useNavbarHideWhileMounted } from "@/context/NavbarContext";

interface AiDifficultyDrawerProps {
  locale: string;
  onClose: () => void;
  onSelect: (difficulty: string) => void;
  isCreating: boolean;
}

const localTranslations: { [locale: string]: any } = {
  en: {
    select_difficulty: "Select AI Difficulty",
    easy_title: "🟢 Easy Mode",
    easy_desc: "800 ELO. Bot searches 2 moves ahead and makes occasional mistakes. Best for learning and testing.",
    medium_title: "🟡 Medium Mode",
    medium_desc: "1200 ELO. Bot searches 3 moves ahead. Plays balanced and solid chess.",
    hard_title: "🔴 Hard Mode",
    hard_desc: "1600 ELO. Bot searches 4 moves ahead. Plays tactically sharp and challenging chess.",
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
  const [canClose, setCanClose] = useState<boolean>(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("medium");

  // The navbar is otherwise still visible on this page (/game is not a
  // "main navbar page") and its fixed bottom position overlaps the
  // "Start Training Session" button, silently swallowing taps on it.
  useNavbarHideWhileMounted();

  const trans = localTranslations[locale] || localTranslations["en"];

  // Cooldown to prevent instant closing on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanClose(true);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bottom-drawer-backdrop z-[100]">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={() => { if (canClose && !isCreating) onClose(); }}
        className="absolute inset-0 bg-[rgba(0,0,0,0.5)]" style={{ touchAction: 'none' }}
      />
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }} 
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="bottom-drawer-sheet relative z-10"
      >
        <div className="bottom-drawer-handle" />
        
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-3">
            <FaRobot className="text-emerald-500 text-lg" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-brand-primary">
            {trans.select_difficulty}
          </h2>
          <p className="text-[10px] font-bold text-brand-primary/45 uppercase tracking-[0.2em] mb-5">
            TRAINING ARENA
          </p>
        </div>
        
        {/* Difficulty List */}
        <div className="w-full flex flex-col gap-3.5 mb-6">
          
          {/* Easy Card */}
          <button
            onClick={() => setSelectedDifficulty("easy")}
            disabled={isCreating}
            className={`w-full text-left rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex items-start gap-3 bg-brand-surface ${
              selectedDifficulty === "easy" 
                ? "border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.12)] bg-emerald-500/5" 
                : "border-brand-border-opacity-10 hover:border-brand-border-opacity-20"
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              selectedDifficulty === "easy"
                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                : "bg-brand-bg-opacity-5 border-brand-border-opacity-10 text-brand-primary opacity-50"
            }`}>
              <FaGamepad size={13} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-xs font-black tracking-wide uppercase ${
                selectedDifficulty === "easy" ? "text-emerald-400" : "text-brand-primary"
              }`}>
                {trans.easy_title}
              </span>
              <span className="text-[10px] font-medium text-brand-primary opacity-55 mt-1 leading-relaxed">
                {trans.easy_desc}
              </span>
            </div>
          </button>

          {/* Medium Card */}
          <button
            onClick={() => setSelectedDifficulty("medium")}
            disabled={isCreating}
            className={`w-full text-left rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex items-start gap-3 bg-brand-surface ${
              selectedDifficulty === "medium" 
                ? "border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.12)] bg-amber-500/5" 
                : "border-brand-border-opacity-10 hover:border-brand-border-opacity-20"
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              selectedDifficulty === "medium"
                ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                : "bg-brand-bg-opacity-5 border-brand-border-opacity-10 text-brand-primary opacity-50"
            }`}>
              <FaAward size={12} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-xs font-black tracking-wide uppercase ${
                selectedDifficulty === "medium" ? "text-amber-400" : "text-brand-primary"
              }`}>
                {trans.medium_title}
              </span>
              <span className="text-[10px] font-medium text-brand-primary opacity-55 mt-1 leading-relaxed">
                {trans.medium_desc}
              </span>
            </div>
          </button>

          {/* Hard Card */}
          <button
            onClick={() => setSelectedDifficulty("hard")}
            disabled={isCreating}
            className={`w-full text-left rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex items-start gap-3 bg-brand-surface ${
              selectedDifficulty === "hard" 
                ? "border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.12)] bg-rose-500/5" 
                : "border-brand-border-opacity-10 hover:border-brand-border-opacity-20"
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              selectedDifficulty === "hard"
                ? "bg-rose-500/20 border-rose-500/30 text-rose-400"
                : "bg-brand-bg-opacity-5 border-brand-border-opacity-10 text-brand-primary opacity-50"
            }`}>
              <FaRobot size={12} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-xs font-black tracking-wide uppercase ${
                selectedDifficulty === "hard" ? "text-rose-400" : "text-brand-primary"
              }`}>
                {trans.hard_title}
              </span>
              <span className="text-[10px] font-medium text-brand-primary opacity-55 mt-1 leading-relaxed">
                {trans.hard_desc}
              </span>
            </div>
          </button>

        </div>
        
        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          <motion.button
            whileTap={!isCreating ? { scale: 0.98 } : {}}
            onClick={() => onSelect(selectedDifficulty)}
            disabled={isCreating}
            className="w-full bg-brand-primary text-brand-void py-4 rounded-2xl flex items-center justify-center gap-3 text-xs uppercase font-black tracking-[0.2em] cursor-pointer shadow-neon disabled:opacity-50"
          >
            <span>{isCreating ? "INITIALIZING..." : trans.start_game}</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
