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
  ({ className = "", children, delay = 2500, maxItems = 4 }: AnimatedListProps) => {
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children]
    );

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      if (childrenArray.length === 0) return;
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % childrenArray.length);
      }, delay);
      return () => clearInterval(interval);
    }, [childrenArray.length, delay]);

    // Keep up to `maxItems` items visible, cycling seamlessly
    const visibleItems = useMemo(() => {
      if (childrenArray.length === 0) return [];
      const list = [];
      for (let i = 0; i < Math.min(maxItems, childrenArray.length); i++) {
        const idx = (currentIndex - i + childrenArray.length) % childrenArray.length;
        list.push(childrenArray[idx]);
      }
      return list;
    }, [childrenArray, currentIndex, maxItems]);

    return (
      <div className={`flex flex-col items-center gap-2.5 ${className}`}>
        <AnimatePresence initial={false}>
          {visibleItems.map((item, i) => (
            <motion.div
              key={React.isValidElement(item) && item.key != null ? String(item.key) : `item-${i}-${currentIndex}`}
              initial={{ scale: 0.88, opacity: 0, y: -16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              layout
              className="w-full"
            >
              {item}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedList.displayName = "AnimatedList";
