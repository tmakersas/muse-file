"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";

// A value hidden under a black marker bar that tears off when it scrolls into view.
// Tap it again to re-redact (people like doing that on video).
export default function Redacted({
  children,
  delay = 0,
  className = "",
  instant = false,
  armed = true,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  instant?: boolean;
  armed?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const [hidden, setHidden] = useState(false);
  const show = armed && (inView || instant) && !hidden;
  return (
    <span
      ref={ref}
      className={`relative inline-block cursor-pointer align-baseline ${className}`}
      onClick={() => setHidden((h) => !h)}
    >
      <span className={show ? "" : "opacity-0"} style={{ transition: "opacity .15s", transitionDelay: show ? `${delay + 0.12}s` : "0s" }}>
        {children}
      </span>
      <motion.span
        aria-hidden
        className="redact absolute -inset-x-1 inset-y-[0.08em] origin-right"
        initial={{ scaleX: 1, rotate: -0.6 }}
        animate={show ? { scaleX: 0, rotate: 0 } : { scaleX: 1, rotate: -0.6 }}
        transition={{ delay: show ? delay : 0, duration: 0.55, ease: [0.7, 0, 0.2, 1] }}
      />
    </span>
  );
}
