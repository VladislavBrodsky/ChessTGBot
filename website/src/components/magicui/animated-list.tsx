"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children]
    );
    const { ref: containerRef, active: isVisible } = useShowcaseActivity();

    useEffect(() => {
      if (!isVisible || childrenArray.length === 0) return;
      const interval = setInterval(() => {
        setIndex((prevIndex) => (prevIndex + 1) % childrenArray.length);
      }, delay);

      return () => clearInterval(interval);
    }, [isVisible, childrenArray.length, delay]);

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
      <div ref={containerRef} className={`flex flex-col items-center gap-2.5 ${className}`}>
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
  const animations = {
    initial: { y: -8, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  };

  return (
    <motion.div ref={ref} {...animations} layout="position" className="relative mx-auto w-full">
      {children}
    </motion.div>
  );
});
