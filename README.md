# The file an AI would keep on you

TIME read the instructions behind Meta's Muse (Oct 6 2026): it updates a file on each user every hour, with notes like "this user responds better to short nudges after 10 PM".

This site builds that file from public X posts only. Parody of the format, not Meta's file, not affiliated with Meta.

Live: https://muse-file.vercel.app

## What is on the file
- Nudge window: the 3-hour window holding the most replies, in the subject's clock
- Inner circle: accounts the subject replies to, mentions and quotes most
- Recurring obsessions: repeated terms, copy-pasted posts counted once, politics, health and religion filtered out
- What works: median likes of original posts with a trait vs without
- Mood by hour: crude word-list score, on purpose
- How an ad system would sell to the subject, and handler instructions

## Data
- Cabinet: snapshot of public posts taken 2026-10-07 (`src/data/snapshot.json`, built by `scripts/build-data.py`)
- Your file: drop your X archive (.zip or data/tweets.js). It is parsed in the browser. Nothing is uploaded or stored. Share links carry the computed stats only, no posts.

## Stack
Next.js App Router, TypeScript, Tailwind v4, motion, `next/og` share cards, zip.js.

made by [@tibo_maker](https://x.com/tibo_maker)
