"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface AnimatedListProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
  maxItems?: number;
}

export const AnimatedList = React.memo(
  ({ className = "", children, delay = 1000, maxItems = 4 }: AnimatedListProps) => {
    const [index, setIndex] = useState(0);
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children]
    );

    useEffect(() => {
      if (childrenArray.length === 0) return;
      const interval = setInterval(() => {
        setIndex((prevIndex) => (prevIndex + 1) % childrenArray.length);
      }, delay);

      return () => clearInterval(interval);
    }, [childrenArray.length, delay]);

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
      <div className={`flex flex-col items-center gap-2.5 ${className}`}>
        <AnimatePresence initial={false}>
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

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  const animations = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: "spring" as const, stiffness: 350, damping: 40 },
  };

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  );
}
