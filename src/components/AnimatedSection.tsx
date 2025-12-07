"use client";

import { ReactNode } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

type AnimationType = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale" | "slide-up" | "slide-down";

type AnimatedSectionProps = {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  triggerOnce?: boolean;
};

/**
 * Reusable component for scroll animations
 * Uses GPU-accelerated transforms for optimal performance
 */
export function AnimatedSection({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 600,
  className = "",
  triggerOnce = true,
}: AnimatedSectionProps) {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
    triggerOnce,
    delay,
  });

  // Animation styles mapping (GPU-accelerated)
  const animationStyles: Record<AnimationType, { initial: string; animate: string }> = {
    "fade-up": {
      initial: "opacity: 0; transform: translate3d(0, 40px, 0);",
      animate: "opacity: 1; transform: translate3d(0, 0, 0);",
    },
    "fade-down": {
      initial: "opacity: 0; transform: translate3d(0, -40px, 0);",
      animate: "opacity: 1; transform: translate3d(0, 0, 0);",
    },
    "fade-left": {
      initial: "opacity: 0; transform: translate3d(40px, 0, 0);",
      animate: "opacity: 1; transform: translate3d(0, 0, 0);",
    },
    "fade-right": {
      initial: "opacity: 0; transform: translate3d(-40px, 0, 0);",
      animate: "opacity: 1; transform: translate3d(0, 0, 0);",
    },
    scale: {
      initial: "opacity: 0; transform: scale3d(0.9, 0.9, 1);",
      animate: "opacity: 1; transform: scale3d(1, 1, 1);",
    },
    "slide-up": {
      initial: "transform: translate3d(0, 100%, 0);",
      animate: "transform: translate3d(0, 0, 0);",
    },
    "slide-down": {
      initial: "transform: translate3d(0, -100%, 0);",
      animate: "transform: translate3d(0, 0, 0);",
    },
  };

  const currentAnimation = animationStyles[animation];

  return (
    <div
      ref={elementRef as any}
      className={className}
      style={{
        ...(isVisible ? {} : { willChange: "transform, opacity" }),
        transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        ...(isVisible
          ? Object.fromEntries(currentAnimation.animate.split(";").map((s) => s.trim().split(":").map((p) => p.trim())))
          : Object.fromEntries(currentAnimation.initial.split(";").map((s) => s.trim().split(":").map((p) => p.trim())))),
      }}
    >
      {children}
    </div>
  );
}

/**
 * Staggered animation wrapper for animating multiple children in sequence
 */
type StaggeredAnimationProps = {
  children: ReactNode[];
  animation?: AnimationType;
  staggerDelay?: number;
  className?: string;
};

export function StaggeredAnimation({
  children,
  animation = "fade-up",
  staggerDelay = 100,
  className = "",
}: StaggeredAnimationProps) {
  return (
    <>
      {children.map((child, index) => (
        <AnimatedSection
          key={index}
          animation={animation}
          delay={index * staggerDelay}
          className={className}
        >
          {child}
        </AnimatedSection>
      ))}
    </>
  );
}
