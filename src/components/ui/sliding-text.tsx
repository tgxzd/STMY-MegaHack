"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SlidingTextProps {
  texts: string[];
  duration?: number;
  className?: string;
}

export function SlidingText({
  texts,
  duration = 2000,
  className,
}: SlidingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((currentIndex + 1) % texts.length);
    }, duration);

    return () => clearInterval(interval);
  }, [currentIndex, texts.length, duration]);

  return (
    <div className="relative h-16 overflow-hidden">
      {texts.map((text, index) => (
        <div
          key={text}
          className={cn(
            "absolute w-full transition-all duration-500 ease-in-out",
            index === currentIndex
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0",
            className
          )}
        >
          {text}
        </div>
      ))}
    </div>
  );
} 