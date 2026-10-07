"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { fmtHour } from "@/lib/analyze";

// 24-hour activity clock. Midnight on top, clockwise. Red arc = nudge window.
// The thin hand is the subject's local time right now.
export default function NudgeClock({
  hours,
  replyHours,
  start,
  end,
  tz,
}: {
  hours: number[];
  replyHours: number[];
  start: number;
  end: number;
  tz: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const read = () => {
      const p = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
      const h = Number(p.find((x) => x.type === "hour")?.value ?? 0);
      const m = Number(p.find((x) => x.type === "minute")?.value ?? 0);
      setNow((h % 24) + m / 60);
    };
    read();
    const id = setInterval(read, 30000);
    return () => clearInterval(id);
  }, [tz]);

  const S = 390;
  const c = S / 2;
  const r0 = 62;
  const r1 = 150;
  const max = Math.max(1, ...hours);
  const ang = (h: number) => (h / 24) * Math.PI * 2 - Math.PI / 2;
  const pt = (h: number, r: number) => [c + Math.cos(ang(h)) * r, c + Math.sin(ang(h)) * r] as const;

  const wedge = (h: number, rIn: number, rOut: number, pad = 0.08) => {
    const a = h + pad;
    const b = h + 1 - pad;
    const [x1, y1] = pt(a, rIn);
    const [x2, y2] = pt(a, rOut);
    const [x3, y3] = pt(b, rOut);
    const [x4, y4] = pt(b, rIn);
    return `M${x1},${y1} L${x2},${y2} A${rOut},${rOut} 0 0 1 ${x3},${y3} L${x4},${y4} A${rIn},${rIn} 0 0 0 ${x1},${y1} Z`;
  };
  const span = (end - start + 24) % 24 || 24;
  const arcR = r1 + 9;
  const [ax, ay] = pt(start, arcR);
  const [bx, by] = pt(start + span, arcR);
  const inWin = (h: number) => (h - start + 24) % 24 < span;

  const nowRate = now === null ? 0 : hours[Math.floor(now)] / max;

  return (
    <div className="relative">
      <svg ref={ref} viewBox={`0 0 ${S} ${S}`} className="w-full max-w-[360px]" role="img" aria-label="Activity by hour of day">
        <circle cx={c} cy={c} r={r1} fill="none" stroke="rgba(27,25,21,.12)" strokeDasharray="2 4" />
        <circle cx={c} cy={c} r={r0 - 6} fill="none" stroke="rgba(27,25,21,.18)" />
        {hours.map((v, h) => {
          const len = r0 + 4 + (v / max) * (r1 - r0 - 4);
          const rv = replyHours[h] / max;
          return (
            <g key={h}>
              <motion.path
                d={wedge(h, r0, len)}
                fill={inWin(h) ? "#c62a1f" : "#1b1915"}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={inView ? { opacity: 0.18 + 0.82 * (v / max), scale: 1 } : {}}
                style={{ transformOrigin: `${c}px ${c}px` }}
                transition={{ delay: 0.03 * ((h - start + 24) % 24), duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              />
              {rv > 0 && (
                <path d={wedge(h, r0, r0 + 4 + rv * (r1 - r0 - 4), 0.36)} fill="#ece5d3" opacity={0.55} />
              )}
            </g>
          );
        })}
        <motion.path
          d={`M${ax},${ay} A${arcR},${arcR} 0 ${span > 12 ? 1 : 0} 1 ${bx},${by}`}
          fill="none"
          stroke="#c62a1f"
          strokeWidth={3}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ delay: 0.9, duration: 0.8 }}
        />
        {[0, 6, 12, 18].map((h) => {
          const [x, y] = pt(h, r1 + 22);
          return (
            <text key={h} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="rgba(27,25,21,.6)" fontFamily="var(--font-space)">
              {h === 0 ? "00h" : `${h}h`}
            </text>
          );
        })}
        {now !== null && (
          <g>
            <line x1={pt(now, r0 - 6)[0]} y1={pt(now, r0 - 6)[1]} x2={pt(now, r1 + 6)[0]} y2={pt(now, r1 + 6)[1]} stroke="#1b1915" strokeWidth={1.4} />
            <circle cx={pt(now, r1 + 6)[0]} cy={pt(now, r1 + 6)[1]} r={3.5} fill="#1b1915" />
          </g>
        )}
        <text x={c} y={c - 8} textAnchor="middle" fontSize="9" letterSpacing="2" fill="rgba(27,25,21,.55)" fontFamily="var(--font-space)">
          NUDGE
        </text>
        <text x={c} y={c + 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="#c62a1f" fontFamily="var(--font-space)">
          {fmtHour(start).replace(" ", "")}-{fmtHour(end).replace(" ", "")}
        </text>
      </svg>
      {now !== null && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/60">
          Hand = subject&apos;s time now ({tz.split("/").pop()?.replace("_", " ")}). Activity at this hour:{" "}
          <b className="text-ink">{Math.round(nowRate * 100)}% of peak</b>
        </p>
      )}
    </div>
  );
}
