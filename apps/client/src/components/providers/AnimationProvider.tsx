"use client";

import { LazyMotion, domAnimation } from "motion/react";

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}
