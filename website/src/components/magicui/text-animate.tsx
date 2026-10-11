"use client";

import React, { ElementType } from "react";
import { motion, Variants } from "framer-motion";

export type TextAnimateAnimation =
  | "blurIn"
  | "blurInUp"
  | "fadeIn"
  | "slideUp"
  | "scaleUp";

export type TextAnimateBy = "word" | "character" | "line";

interface TextAnimateProps {
  children: string;
  className?: string;
  as?: ElementType;
  animation?: TextAnimateAnimation;
  by?: TextAnimateBy;
  delay?: number;
  duration?: number;
  stagger?: number;
  once?: boolean;
}

const animationVariants: Record<TextAnimateAnimation, Variants> = {
  blurIn: {
    hidden: { opacity: 0, filter: "blur(10px)", y: 4 },
    show: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
    },
  },
  blurInUp: {
    hidden: { opacity: 0, filter: "blur(12px)", y: 20 },
    show: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
    },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0 },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1 },
  },
};

export function TextAnimate({
  children,
  className = "",
  as: Component = "span",
  animation = "blurInUp",
  by = "word",
  delay = 0,
  duration = 0.45,
  stagger = 0.04,
  once = true,
}: TextAnimateProps) {
  const segments = React.useMemo(() => {
    if (by === "character") {
      return children.split("");
    }
    if (by === "line") {
      return children.split("\n");
    }
    return children.split(" ");
  }, [children, by]);

  const selectedVariant = animationVariants[animation];

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: selectedVariant.hidden,
    show: {
      ...selectedVariant.show,
      transition: {
        duration,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <Component className={className}>
      <motion.span
        className="inline-block"
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once, margin: "-20px" }}
        aria-label={children}
      >
        {segments.map((segment, index) => (
          <motion.span
            key={index}
            variants={itemVariants}
            className="inline-block whitespace-pre"
          >
            {segment}
            {by === "word" && index < segments.length - 1 ? " " : ""}
          </motion.span>
        ))}
      </motion.span>
    </Component>
  );
}
