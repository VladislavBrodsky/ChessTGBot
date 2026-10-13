"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useShowcaseActivity } from "../home/useShowcaseActivity";

export interface AnimatedListProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
  maxItems?: number;
}

export const AnimatedList = React.memo(
  ({ className = "", children, delay = 1000, maxItems = 4 }: AnimatedListProps) => {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children]
    );
    const { ref: containerRef, active: isVisible } = useShowcaseActivity();

    useEffect(() => {
      if (!isVisible || paused || childrenArray.length === 0) return;
      const interval = setInterval(() => {
        setIndex((prevIndex) => (prevIndex + 1) % childrenArray.length);
      }, Math.max(1000, delay));

      return () => clearInterval(interval);
    }, [isVisible, paused, childrenArray.length, delay]);

    const itemsToShow = useMemo(() => {
      if (childrenArray.length === 0) return [];
      const count = Math.min(maxItems, childrenArray.length);
      const result = [];
      for (let i = 0; i < count; i++) {
        const itemIndex = (index - i + childrenArray.length) % childrenArray.length;
        result.push(childrenArray[itemIndex]);
      }
      return result;
    }, [index, childrenArray, maxItems]);

    return (
      <div ref={containerRef} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}
        className={`flex flex-col items-stretch gap-2.5 ${className}`}>
        <AnimatePresence initial={false} mode="popLayout">
          {itemsToShow.map((item, i) => (
            <AnimatedListItem
              key={
                React.isValidElement(item) && item.key != null
                  ? String(item.key)
                  : `item-${(index - i + childrenArray.length) % childrenArray.length}`
              }
            >
              {item}
            </AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedList.displayName = "AnimatedList";

export const AnimatedListItem = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(function AnimatedListItem({ children }, ref) {
  const reduced = useReducedMotion();
  const animations = {
    initial: reduced ? false as const : { y: -8, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: reduced ? 0 : 0.2 },
  };

  return (
    <motion.div ref={ref} {...animations} layout={reduced ? false : "position"} className="relative mx-auto w-full">
      {children}
    </motion.div>
  );
});
