"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { MuseFile } from "@/lib/analyze";
import { fmtHour } from "@/lib/analyze";
import Redacted from "./Redacted";
import Typed from "./Typed";
import NudgeClock from "./NudgeClock";

const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function fileNo(h: string) {
  let x = 2166136261;
  for (const ch of h.toLowerCase()) x = Math.imul(x ^ ch.charCodeAt(0), 16777619);
  return `MX-${(x >>> 0).toString(36).toUpperCase().slice(0, 5)}`;
}

function Sec({ n, title, children, className = "" }: { n: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border-t border-dashed border-ink/25 pt-6 ${className}`}>
      <h2 className="mb-5 flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink/55 sm:text-[11px]">
        <span className="text-stamp">{n}</span>
        <span>{title}</span>
      </h2>
      {children}
    </section>
  );
}

// Is the subject inside their own nudge window right now, in their clock?
function WindowNow({ tz, start, end }: { tz: string; start: number; end: number }) {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => {
      const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(new Date())) % 24;
      const span = (end - start + 24) % 24 || 24;
      const inside = (h - start + 24) % 24 < span;
      const wait = (start - h + 24) % 24;
      setMsg(inside ? "subject is inside the nudge window right now" : `nudge window opens in ${wait}h`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [tz, start, end]);
  if (!msg) return null;
  return (
    <span className={msg.startsWith("subject") ? "text-stamp" : ""}>
      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${msg.startsWith("subject") ? "animate-pulse bg-stamp" : "bg-paper/40"}`} />
      {msg}
    </span>
  );
}

function Countdown() {
  const [s, setS] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const left = 3600 - (d.getUTCMinutes() * 60 + d.getUTCSeconds());
      setS(`${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{s ?? "--:--"}</span>;
}

export default function Dossier({
  file,
  intro = true,
  analystNote,
  live = false,
}: {
  file: MuseFile;
  intro?: boolean;
  analystNote?: string;
  live?: boolean;
}) {
  const [opened, setOpened] = useState(!intro);
  const no = useMemo(() => fileNo(file.handle), [file.handle]);
  const maxCircle = Math.max(1, ...file.circle.map((c) => c.count));
  const maxObs = Math.max(1, ...file.obsessions.map((c) => c.count));
  const moodMax = Math.max(0.01, ...file.mood.map((m) => Math.abs(m.score)));
  const inWindow = Math.round(file.nudge.share * 100);

  return (
    <div className="relative">
      <svg width="0" height="0" className="absolute">
        <filter id="rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" />
        </filter>
      </svg>

      {/* Teletype header on the dark desk */}
      <div className="mx-auto max-w-3xl px-4 pt-6 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-paper/55 sm:px-6 sm:text-[11px]">
        <div className="flex justify-between gap-4">
          <span>{live ? "Your file // built in this browser" : `Muse-style file // ${no}`}</span>
          <span className="text-right">
            next update <Countdown />
          </span>
        </div>
        <div className="mt-2">
          <WindowNow tz={file.tz} start={file.nudge.start} end={file.nudge.end} />
        </div>
        <p className="mt-4 min-h-[3.2em] normal-case tracking-normal text-paper/80 sm:text-[13px]">
          {intro ? (
            <Typed
              caret
              speed={14}
              text={`> subject @${file.handle} loaded. ${file.n} public posts, ${fmtDate(file.from)} to ${fmtDate(file.to)}. compiling file...`}
              onDone={() => setTimeout(() => setOpened(true), 250)}
            />
          ) : (
            <span>{`> subject @${file.handle}. ${file.n} public posts, ${fmtDate(file.from)} to ${fmtDate(file.to)}. file compiled.`}</span>
          )}
        </p>
      </div>

      {/* The sheet */}
      <motion.article
        initial={intro ? { y: 160, opacity: 0, rotate: -3 } : false}
        animate={opened ? { y: 0, opacity: 1, rotate: 0 } : {}}
        transition={{ type: "spring", stiffness: 90, damping: 16 }}
        className="paper relative mx-3 mt-3 max-w-3xl overflow-hidden sm:mx-auto rounded-[3px] px-5 pb-10 pt-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,.8),0_2px_0_rgba(255,255,255,.4)_inset] sm:px-12 sm:pb-14 sm:pt-10"
      >
        <div className="grain absolute inset-0" />
        {/* punch holes */}
        <div className="absolute left-2 top-1/4 hidden h-3 w-3 rounded-full bg-night/90 sm:block" />
        <div className="absolute left-2 top-3/4 hidden h-3 w-3 rounded-full bg-night/90 sm:block" />

        <div className="relative">
          <div className="flex items-start justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/60 sm:text-[11px]">
            <div>
              <div>File no. {no}</div>
              <div className="mt-1">Classification: public posts only</div>
            </div>
            <div className="text-right">
              <div>Window {fmtDate(file.from)} to {fmtDate(file.to)}</div>
              <div className="mt-1">Clock: {file.tzLabel}</div>
            </div>
          </div>

          {/* stamp */}
          <motion.div
            initial={{ scale: 2.6, opacity: 0, rotate: -24 }}
            animate={opened ? { scale: 1, opacity: 0.88, rotate: -11 } : {}}
            transition={{ delay: 0.55, type: "spring", stiffness: 520, damping: 22 }}
            className="stamp pointer-events-none relative z-10 ml-auto mt-5 w-fit px-3 py-1.5 text-center font-mono text-[11px] font-bold uppercase leading-tight sm:absolute sm:right-4 sm:top-16 sm:mt-0 sm:text-sm"
          >
            Updated hourly
            <br />
            <span className="text-[9px] sm:text-[10px]">do not show subject</span>
          </motion.div>

          {/* subject */}
          <div className="mt-5 flex items-center gap-4 sm:mt-10 sm:gap-6">
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.handle === "you" ? "data:image/gif;base64,R0lGODlhAQABAAAAACw=" : `https://unavatar.io/x/${file.handle}?fallback=false`}
                alt=""
                width={96}
                height={96}
                className="h-18 w-18 rotate-[-3deg] border-4 border-white object-cover shadow-md grayscale contrast-125 sm:h-24 sm:w-24"
                onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
              />
              <div className="absolute -top-3 left-1/2 h-6 w-2.5 -translate-x-1/2 rounded-full border-2 border-zinc-500/80" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/55">Subject</div>
              <h1 className="truncate font-serif text-4xl leading-none sm:text-6xl">@{file.handle}</h1>
              <div className="mt-1.5 font-mono text-[10px] text-ink/60 sm:text-xs">
                {file.nPosts} posts · {file.nReplies} replies · {file.circle.length ? `${file.circle.length}+ associates` : "no associates on file"}
              </div>
            </div>
          </div>

          {/* the line */}
          <div className="mt-9 sm:mt-12">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-stamp">Instruction 01</div>
            <p className="mt-3 font-serif text-[2.15rem] leading-[1.02] tracking-[-0.01em] sm:text-[3.7rem]">
              This user responds better to short nudges between{" "}
              <Redacted delay={1.0} armed={opened} instant>
                <span className="italic text-stamp">{fmtHour(file.nudge.start)}</span>
              </Redacted>{" "}
              and{" "}
              <Redacted delay={1.35} armed={opened} instant>
                <span className="italic text-stamp">{fmtHour(file.nudge.end)}</span>
              </Redacted>
              .
            </p>
            <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-ink/75 sm:text-sm">
              Muse&apos;s real instructions contain the line{" "}
              &quot;this user responds better to short nudges after 10 PM&quot; (TIME, Oct 6). This is the same
              line, computed from @{file.handle}&apos;s own {file.nudge.basis}:{" "}
              <Redacted delay={1.7} armed={opened} instant>
                <b>{inWindow}%</b>
              </Redacted>{" "}
              of them land in that 3-hour window.
            </p>
          </div>

          {(analystNote || file.note) && (
            <div className="mt-8 border-l-2 border-stamp/70 pl-4 text-[13px] leading-relaxed text-ink/85 sm:text-[15px]">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">Analyst note</div>
              {analystNote ?? file.note}
            </div>
          )}

          <div className="mt-10 grid gap-10">
            <Sec n="02" title="Nudge window · activity by hour">
              <div className="grid items-center gap-6 sm:grid-cols-[360px_1fr]">
                <NudgeClock hours={file.hours} replyHours={file.replyHours} start={file.nudge.start} end={file.nudge.end} tz={file.tz} />
                <ul className="space-y-3 text-sm leading-relaxed">
                  <li>
                    Most active hour: <Redacted><b>{fmtHour(file.peakHour)}</b></Redacted>
                  </li>
                  {file.bestHour !== null && (
                    <li>
                      Posts that get the most likes go out around <Redacted delay={0.2}><b>{fmtHour(file.bestHour)}</b></Redacted>
                    </li>
                  )}
                  <li>
                    After 10 PM: <Redacted delay={0.3}><b>{Math.round(file.nightShare * 100)}%</b></Redacted> of everything posted
                  </li>
                  <li className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                    Dark wedges = all activity. Light inner bars = replies. Red = window.
                  </li>
                </ul>
              </div>
            </Sec>

            <Sec n="03" title="Inner circle · who the subject answers">
              {file.circle.length ? (
                <ol className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                  {file.circle.map((p, i) => (
                    <motion.li
                      key={p.handle}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-3"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://unavatar.io/x/${p.handle}?fallback=false`}
                        alt=""
                        width={40}
                        height={40}
                        loading="lazy"
                        className="h-10 w-10 shrink-0 border-2 border-white object-cover grayscale shadow-sm"
                        style={{ rotate: `${((i * 37) % 7) - 3}deg` }}
                        onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
                      />
                      <div className="min-w-0">
                        <a href={`https://x.com/${p.handle}`} target="_blank" rel="noreferrer" className="block truncate text-sm font-bold hover:text-stamp">
                          @{p.handle}
                        </a>
                        <div className="mt-1 h-1.5 bg-ink/10">
                          <div className="h-full bg-ink" style={{ width: `${(p.count / maxCircle) * 100}%` }} />
                        </div>
                        <div className="mt-1 font-mono text-[10px] text-ink/55">
                          {p.count}x{p.replies ? ` · ${p.replies} replies` : ""}
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-ink/60">Not enough replies on file to map a circle.</p>
              )}
            </Sec>

            <Sec n="04" title="Recurring obsessions">
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3">
                {file.obsessions.map((o, i) => (
                  <motion.span
                    key={o.term}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="font-serif leading-none"
                    style={{ fontSize: `${1.1 + (o.count / maxObs) * 1.9}rem` }}
                  >
                    <span className={i < 2 ? "marker" : ""}>{o.term}</span>
                    <sup className="ml-1 font-mono text-[10px] text-ink/50">{o.count}</sup>
                  </motion.span>
                ))}
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">
                Number = posts that use it. Politics, health and religion are filtered out on purpose.
              </p>
            </Sec>

            <Sec n="05" title="What works on this subject">
              {file.levers.length ? (
                <div className="space-y-3">
                  {file.levers.map((l, i) => (
                    <div key={l.name} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                      <div>
                        <div>Posts with {l.name}</div>
                        <div className="mt-1 h-2 bg-ink/10">
                          <motion.div
                            className={i === 0 ? "h-full bg-stamp" : "h-full bg-ink/70"}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${Math.min(100, (l.mult / Math.max(...file.levers.map((x) => x.mult))) * 100)}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                          />
                        </div>
                      </div>
                      <Redacted delay={0.15 + i * 0.12}>
                        <span className="font-mono text-lg font-bold tabular-nums">{l.mult.toFixed(1)}x</span>
                      </Redacted>
                    </div>
                  ))}
                  <p className="pt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">
                    Median likes with the trait vs without, original posts only. Median: {Math.round(file.medianLikes)} likes.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-ink/60">Not enough original posts to compare formats.</p>
              )}
            </Sec>

            <Sec n="06" title="Mood by hour">
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                {file.mood.map((m) => {
                  const v = m.score / moodMax;
                  return (
                    <div key={m.band} className="text-center">
                      <div className="relative mx-auto h-28 w-full border-x border-dashed border-ink/15">
                        <div className="absolute inset-x-0 top-1/2 h-px bg-ink/30" />
                        <motion.div
                          className={`absolute inset-x-[22%] ${v >= 0 ? "bottom-1/2 bg-ink" : "top-1/2 bg-stamp"}`}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${Math.abs(v) * 50}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7 }}
                        />
                      </div>
                      <div className="mt-2 font-mono text-[10px] text-ink/70">{m.band}h</div>
                      <div className="font-mono text-[9px] text-ink/45">{m.n} posts</div>
                    </div>
                  );
                })}
              </div>
              {file.nightWords.length > 0 && (
                <p className="mt-5 text-sm leading-relaxed">
                  Words that show up after 10 PM far more than in daytime:{" "}
                  {file.nightWords.map((w, i) => (
                    <span key={w.term}>
                      <Redacted delay={0.1 * i}>
                        <b>&quot;{w.term}&quot;</b>
                      </Redacted>
                      {i < file.nightWords.length - 1 ? ", " : "."}
                    </span>
                  ))}
                </p>
              )}
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">
                Word-list score: positive words minus negative words, per post. Crude on purpose, like the real thing.
              </p>
            </Sec>

            <Sec n="07" title="How an ad system would sell to this subject">
              <div className="relative border-2 border-ink bg-white/40 p-4 sm:p-6">
                <div className="absolute -top-2.5 left-4 bg-paper px-2 font-mono text-[9px] uppercase tracking-[0.2em]">Recommended creative</div>
                <p className="font-serif text-2xl leading-tight sm:text-3xl">{file.adPitch}</p>
              </div>
            </Sec>

            <Sec n="08" title="Handler instructions">
              <ol className="space-y-3">
                {file.instructions.map((ins, i) => (
                  <li key={i} className="grid grid-cols-[2rem_1fr] text-[13px] leading-relaxed sm:text-[15px]">
                    <span className="font-mono text-stamp">{String(i + 1).padStart(2, "0")}</span>
                    <Typed text={ins} speed={9} delay={i * 0.15} />
                  </li>
                ))}
              </ol>
            </Sec>
          </div>

          <div className="mt-12 flex flex-wrap items-end justify-between gap-4 border-t border-ink/30 pt-4 font-mono text-[9px] uppercase tracking-[0.18em] text-ink/50 sm:text-[10px]">
            <span>
              Compiled from {file.n} public posts. No DMs, no private data, no guesses about health, politics or private life.
            </span>
            <span className="font-type text-base normal-case tracking-normal text-ink/70 italic">(not Meta)</span>
          </div>
        </div>
      </motion.article>
    </div>
  );
}
