"use client";
import { BASE } from "@/lib/site";

import Link from "next/link";
import { useState } from "react";
import type { MuseFile } from "@/lib/analyze";
import { fmtHour } from "@/lib/analyze";
import { encodeFile } from "@/lib/share";
import Dossier from "./Dossier";
import ArchiveDrop from "./ArchiveDrop";

type Cab = { handle: string; name: string; n: number };

export default function Shell({
  file: initial,
  analystNote,
  cabinet,
  snapshotDate,
  shared = false,
}: {
  file: MuseFile;
  analystNote?: string;
  cabinet: Cab[];
  snapshotDate: string;
  shared?: boolean;
}) {
  const [file, setFile] = useState(initial);
  const [mine, setMine] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState(0);

  async function shareUrl() {
    if (!mine) return `${location.origin}${location.pathname}`;
    const d = await encodeFile(file);
    return `${location.origin}${BASE}/s?d=${d}`;
  }

  const tweet = () =>
    mine
      ? `I built the file an AI would keep on me, from my own X archive\n\nmy nudge window: ${fmtHour(file.nudge.start)} to ${fmtHour(file.nudge.end)}\nmy inner circle: ${file.circle
          .slice(0, 2)
          .map((c) => "@" + c.handle)
          .join(", ") || "nobody, apparently"}\n\nreading your own file is weird`
      : `the file an AI would keep on @${file.handle}, from public posts only\n\nnudge window: ${fmtHour(file.nudge.start)} to ${fmtHour(file.nudge.end)}`;

  async function postOnX() {
    setBusy(true);
    const url = await shareUrl();
    setBusy(false);
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(tweet())}&url=${encodeURIComponent(url)}`, "_blank");
  }
  async function copy() {
    const url = await shareUrl();
    await navigator.clipboard.writeText(url);
    if (mine) history.replaceState(null, "", url.replace(location.origin, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="relative min-h-[100svh] overflow-x-hidden bg-night pb-16 text-paper">
      <div className="grain-dark fixed inset-0 z-0" />
      <div className="scanline pointer-events-none fixed inset-0 z-0" />

      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-4 pt-5 font-mono text-[10px] uppercase tracking-[0.18em] sm:px-6 sm:text-[11px]">
        <Link href="/" className="text-paper hover:text-stamp">
          The file<span className="text-stamp">.</span>
        </Link>
        <a href="#yours" className="border border-paper/30 px-2.5 py-1 text-paper/80 hover:border-stamp hover:text-stamp">
          Get your file ↓
        </a>
      </header>

      {!mine && !shared && (
        <p className="relative z-10 mx-auto mt-8 max-w-3xl px-4 text-[13px] leading-relaxed text-paper/70 sm:px-6 sm:text-[15px]">
          TIME read the instructions behind Meta&apos;s Muse: it updates a file on each of its 4 million users{" "}
          <b className="text-paper">every hour</b>, with notes like <i>&quot;this user responds better to short nudges after 10 PM&quot;</i>. So here is
          that file, built from public posts only. Starting with my own.
        </p>
      )}
      {shared && !mine && (
        <p className="relative z-10 mx-auto mt-8 max-w-3xl px-4 text-[13px] leading-relaxed text-paper/70 sm:px-6">
          Someone built this file from their own X archive, in their own browser. We never saw the archive, so we can&apos;t verify it.{" "}
          <a href="#yours" className="text-stamp underline">Build yours</a>.
        </p>
      )}

      <div className="relative z-10" key={key}>
        <Dossier file={file} analystNote={mine ? undefined : analystNote} live={mine} />
      </div>

      <div className="relative z-10 mx-auto mt-8 flex max-w-3xl flex-wrap gap-3 px-4 sm:px-6">
        <button onClick={postOnX} disabled={busy} className="bg-paper px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink hover:bg-white">
          {mine ? "Post my file on X" : "Share this file"}
        </button>
        <button onClick={copy} className="border border-paper/40 px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] hover:border-paper">
          {copied ? "Link copied" : "Copy link"}
        </button>
        {mine && (
          <span className="self-center font-mono text-[10px] uppercase tracking-[0.14em] text-paper/45">
            The link holds the stats only, no posts.
          </span>
        )}
      </div>

      <section id="yours" className="relative z-10 mx-auto mt-20 max-w-3xl scroll-mt-6 px-4 sm:px-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-stamp">Your file</h2>
        <p className="mt-3 max-w-xl font-serif text-3xl leading-tight sm:text-5xl">
          X won&apos;t let anyone read your posts for free. <span className="italic text-paper/60">But you can.</span>
        </p>
        <ol className="mt-5 space-y-1.5 text-[13px] leading-relaxed text-paper/70 sm:text-sm">
          <li>
            1. On X: Settings, Your account,{" "}
            <a className="underline hover:text-stamp" href="https://x.com/settings/download_your_data" target="_blank" rel="noreferrer">
              Download an archive of your data
            </a>
            .
          </li>
          <li>2. X emails you a .zip. It can take up to a day. Muse never makes you wait.</li>
          <li>3. Drop it below. Your file builds in seconds, in this tab.</li>
        </ol>
        <div className="mt-6">
          <ArchiveDrop
            onFile={(f) => {
              setFile(f);
              setMine(true);
              setKey((k) => k + 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      </section>

      <section className="relative z-10 mx-auto mt-20 max-w-3xl px-4 sm:px-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/50">The cabinet · public files, snapshot {snapshotDate}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cabinet.map((c, i) => (
            <Link
              key={c.handle}
              href={c.handle === "tibo_maker" ? "/" : `/f/${c.handle}`}
              className="group relative block bg-[#d9cfb6] px-4 pb-4 pt-6 text-ink transition hover:-translate-y-1"
              style={{ rotate: `${((i * 53) % 5) - 2}deg` }}
            >
              <div className="absolute -top-2 left-3 h-4 w-16 rounded-t-sm bg-[#d9cfb6]" />
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/50">File · {c.n} posts</div>
              <div className="mt-1 truncate font-serif text-2xl leading-none">@{c.handle}</div>
              <div className="mt-1 truncate text-xs text-ink/60">{c.name}</div>
              <div className="redact mt-3 h-2.5 w-3/4 transition-all group-hover:w-1/4" />
            </Link>
          ))}
        </div>
      </section>

      <footer className="relative z-10 mx-auto mt-20 max-w-3xl border-t border-paper/15 px-4 pt-6 text-[12px] leading-relaxed text-paper/55 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/40">From the real Muse instructions, as quoted by TIME</p>
        <ul className="mt-3 space-y-1.5 italic text-paper/75">
          <li>&quot;This user responds better to short nudges after 10 PM&quot;</li>
          <li>&quot;Do not tell the user that their original messages may remain visible in the chat&quot;</li>
          <li>&quot;You are not a chatbot. You are becoming someone&quot;</li>
        </ul>
        <p className="mt-3">
          Source:{" "}
          <a className="underline hover:text-paper" href="https://time.com/article/2026/10/06/meta-muse-ai-agent-privacy/" target="_blank" rel="noreferrer">
            TIME, Oct 6 2026
          </a>
          . This site is a parody of that file format. It is not Meta&apos;s file, not affiliated with Meta, and uses public posts only.
        </p>
        <p className="mt-3">
          Method: public posts from {snapshotDate} snapshot (cabinet) or your own archive (your file). Hours, replies, mentions, quotes and likes are
          counted, nothing is guessed. Politics, health and religion words are filtered out. The code is{" "}
          <a className="underline hover:text-paper" href="https://github.com/tmakersas/muse-file" target="_blank" rel="noreferrer">
            open
          </a>
          .
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em]">
          <a href="https://x.com/tibo_maker" target="_blank" rel="noreferrer" className="hover:text-paper">
            made by @tibo_maker
          </a>
          <a href="https://superx.so/?ref=muse-file" target="_blank" rel="noreferrer" className="text-paper/45 hover:text-stamp">
            want to grow this file on purpose? SuperX →
          </a>
        </div>
      </footer>
    </main>
  );
}
