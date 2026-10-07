"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

// Types itself like a teletype once visible. Reduced motion: shows at once.
export default function Typed({
  text,
  speed = 22,
  delay = 0,
  className = "",
  caret = false,
  onDone,
}: {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  caret?: boolean;
  onDone?: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(text.length);
      onDone?.();
      return;
    }
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      i++;
      setN(i);
      if (i < text.length) timer = setTimeout(tick, speed * (text[i - 1] === "." || text[i - 1] === "," ? 6 : 1));
      else onDone?.();
    };
    timer = setTimeout(tick, delay * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, text]);
  const done = n >= text.length;
  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden>{text.slice(0, n)}</span>
      <span aria-hidden className={caret && !done ? "caret" : ""} />
      <span aria-hidden className="invisible">{text.slice(n)}</span>
    </span>
  );
}
