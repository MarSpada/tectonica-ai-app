"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface StaggerEntranceOptions {
  childSelector?: string;
  axis?: "x" | "y";
  distance?: number;
  duration?: number;
  stagger?: number;
  delay?: number;
  ease?: string;
}

export function useStaggerEntrance<T extends HTMLElement>(
  options: StaggerEntranceOptions = {}
) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const {
      childSelector = "> *",
      axis = "y",
      distance = 30,
      duration = 0.5,
      stagger = 0.04,
      delay = 0,
      ease = "power2.out",
    } = options;

    const targets = el.querySelectorAll(childSelector === "> *" ? ":scope > *" : childSelector);
    gsap.fromTo(targets,
      { [axis]: distance, opacity: 0 },
      { [axis]: 0, opacity: 1, duration, stagger, delay, ease }
    );
    // No cleanup — entrance animations complete once and elements stay visible.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return containerRef;
}
