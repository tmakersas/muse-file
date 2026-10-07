"use client";

import { useRef, useState } from "react";
import { analyze, guessHandleFromArchive, parseArchive, type MuseFile, type Post } from "@/lib/analyze";

// Reads an X archive (.zip or data/tweets.js) entirely in the browser.
// Nothing is uploaded: the file never leaves this tab.
export default function ArchiveDrop({ onFile }: { onFile: (f: MuseFile) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  async function handle(file: File) {
    try {
      setState("opening archive...");
      let posts: Post[] = [];
      let handle: string | null = null;
      if (/\.zip$/i.test(file.name)) {
        const { ZipReader, BlobReader, TextWriter } = await import("@zip.js/zip.js");
        const zip = new ZipReader(new BlobReader(file));
        const entries = await zip.getEntries();
        const tweetFiles = entries.filter((e) => /(^|\/)tweets(-part\d+)?\.js$/i.test(e.filename) && !e.directory);
        const account = entries.find((e) => /(^|\/)account\.js$/i.test(e.filename));
        if (!tweetFiles.length) throw new Error("no data/tweets.js in this zip");
        for (const e of tweetFiles) {
          setState(`reading ${e.filename.split("/").pop()}...`);
          if ("getData" in e && e.getData) posts = posts.concat(parseArchive(await e.getData(new TextWriter())));
        }
        if (account && "getData" in account && account.getData) handle = guessHandleFromArchive(await account.getData(new TextWriter()));
        await zip.close();
      } else {
        setState("reading tweets.js...");
        posts = parseArchive(await file.text());
      }
      if (!posts.length) throw new Error("no posts found");
      // Keep the last 12 months so the file describes you now, not you in 2014.
      const newest = Math.max(...posts.map((p) => p.t));
      const recent = posts.filter((p) => p.t > newest - 365 * 86400000);
      const use = recent.length >= 60 ? recent : posts;
      if (!handle) {
        const asked = window.prompt("Your X handle (for the file header)?", "") ?? "";
        handle = asked.replace(/[^\w]/g, "").slice(0, 15) || "you";
      }
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      setState(`analyzing ${use.length.toLocaleString("en-US")} posts...`);
      await new Promise((r) => setTimeout(r, 60));
      const f = analyze(use, { handle, tz, tzLabel: `${tz.split("/").pop()?.replace(/_/g, " ")} (your browser clock)` });
      setState(null);
      onFile(f);
    } catch (err) {
      setState(`could not read it: ${(err as Error).message}. Try data/tweets.js from the unzipped archive.`);
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handle(f);
      }}
      onClick={() => input.current?.click()}
      className={`group relative cursor-pointer border-2 border-dashed px-5 py-8 text-center transition sm:py-10 ${
        over ? "border-stamp bg-stamp/10" : "border-paper/25 hover:border-paper/60"
      }`}
    >
      <input
        ref={input}
        type="file"
        accept=".zip,.js,application/zip,text/javascript"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
        }}
      />
      <div className="font-serif text-3xl leading-tight text-paper sm:text-4xl">
        Drop your X archive <span className="italic text-stamp">here.</span>
      </div>
      <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-paper/65">
        The .zip X sends you, or just <code className="text-paper">data/tweets.js</code> from inside it. It is read in this tab.
        Nothing is uploaded, nothing is stored.
      </p>
      {state && <p className="mt-4 font-mono text-xs text-stamp">{state}</p>}
    </div>
  );
}
