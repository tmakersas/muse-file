// Turns a list of public posts into a parody "Muse style" file.
// Pure functions, no network: used at build time for the snapshot and in the
// browser for the X archive mode, so the method is identical in both.

export type Post = {
  t: number; // epoch ms
  text: string;
  isReply: boolean;
  isRT: boolean;
  replyTo?: string; // handle replied to, lowercase, no @
  mentions: string[]; // lowercase, no @
  quoted?: string; // quoted author handle
  likes: number;
  views?: number;
};

export type Term = { term: string; count: number };
export type Person = { handle: string; count: number; replies: number };

export type MuseFile = {
  handle: string;
  name: string;
  tz: string;
  tzLabel: string;
  from: number;
  to: number;
  n: number;
  nPosts: number;
  nReplies: number;
  hours: number[]; // all activity per local hour
  replyHours: number[]; // replies per local hour
  days: number[]; // Mon..Sun
  nudge: { start: number; end: number; share: number; basis: "replies" | "posts" };
  peakHour: number;
  circle: Person[];
  obsessions: Term[];
  nightWords: Term[];
  nightShare: number;
  mood: { band: string; score: number; n: number }[];
  lever: { name: string; mult: number; n: number } | null;
  levers: { name: string; mult: number; n: number }[];
  bestHour: number | null;
  medianLikes: number;
  avgLen: number;
  lowerShare: number;
  emoji: Term[];
  instructions: string[];
  adPitch: string;
  note: string;
  method: string;
};

const STOP = new Set(
  (
    "a an the and or but if then so of to in on at by for with from as is are was were be been being it its it's this that these those i me my mine we our you your yours he she they them their his her him not no yes do does did done have has had having can could would should will just very really more most much many some any all every each than too also only even still about into over after before again out up down off what when where who why how which there here because while i'm im you're dont don't can't cant won't isn't didn't doesn't i've ive i'll ill let's lets get got getting go going gonna make made making one two like want need know think see thing things time way people new now today day lot lots via amp rt same other own back well good great sure yeah ok okay oh lol haha thanks thank please x com https http www t co re ve ll d s m first last never always being them? who's what's that's there's here's he's she's it'll we're they're we'll they'll use using used next month months week weeks year years best better every someone something anything work works working try look looking see start big little right find small put take give keep show tell said says say might maybe already since without around through everything everyone nothing feel feels day days hours today's yep yup nah actually nice exactly crazy few nobody literally totally pretty true agree agreed lmao man bro dude wow cool same sounds looks guys i'd you'd we'd they'd"
  ).split(/\s+/),
);

// Never surface these as "obsessions": no guesses about politics, health or religion.
const SENSITIVE =
  /^(trump|biden|harris|vance|obama|macron|le ?pen|melenchon|milei|putin|zelensky|netanyahu|israel|palestine|gaza|hamas|ukraine|russia|election|elections|vote|voting|democrat|democrats|republican|republicans|gop|maga|leftist|leftists|liberal|liberals|conservative|conservatives|woke|immigration|immigrants|migrants|abortion|religion|god|jesus|church|muslim|muslims|islam|christian|jewish|depression|anxiety|cancer|therapy|adhd|autism|disease|covid|vaccine|vaccines|pregnant|divorce|sex|porn|gun|guns|war|socialism|communism|fascism|fascist|nazi|nazis|racist|racism|gender|trans)$/i;

const POS = new Set(
  "love loved loving amazing awesome great best win won winning happy proud excited insane incredible beautiful fun nice cool wow congrats congratulations launched shipped grow growing growth success successful thank thanks grateful legend perfect fantastic yay lets 🔥 💪 🚀 ❤️ 😍 🙏 🎉 😊".split(
    " ",
  ),
);
const NEG = new Set(
  "hate hated bad worst sad angry annoyed annoying tired broke broken fail failed failing failure wrong stupid dumb scam lost lose losing sucks pain hard worse problem problems bug bugs down dead kill killed killing ugly boring fear scared afraid crazy wtf damn 😬 😭 😤 💀 😢".split(
    " ",
  ),
);

const EMOJI_RE = /\p{Extended_Pictographic}/gu;

function localParts(t: number, tz: string) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "numeric", weekday: "short", hourCycle: "h23" });
  const parts = f.formatToParts(new Date(t));
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(wd);
  return { hour, day: day < 0 ? 0 : day };
}

export function fmtHour(h: number) {
  const hh = ((h % 24) + 24) % 24;
  if (hh === 0) return "midnight";
  if (hh === 12) return "noon";
  return hh < 12 ? `${hh} AM` : `${hh - 12} PM`;
}

function median(a: number[]) {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function clean(text: string) {
  return text
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/@\w+/g, " ")
    .replace(/&amp;/g, "&");
}

function tokens(text: string) {
  return clean(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'#$%.\s-]/gu, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[-'.]+|[-'.]+$/g, ""))
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w) && !SENSITIVE.test(w));
}

function topTerms(posts: Post[], limit: number): Term[] {
  const uni = new Map<string, number>();
  const bi = new Map<string, number>();
  // Copy-pasted posts (promos, templated replies) count once, or they drown everything else.
  const seenText = new Set<string>();
  posts = posts.filter((p) => {
    const k = clean(p.text).toLowerCase().replace(/\s+/g, " ").trim().slice(0, 50);
    if (seenText.has(k)) return false;
    seenText.add(k);
    return true;
  });
  for (const p of posts) {
    const tk = tokens(p.text);
    const seen = new Set<string>();
    tk.forEach((w, i) => {
      if (!seen.has(w)) uni.set(w, (uni.get(w) ?? 0) + 1);
      seen.add(w);
      if (i < tk.length - 1) {
        const b = `${w} ${tk[i + 1]}`;
        if (!seen.has(b)) bi.set(b, (bi.get(b) ?? 0) + 1);
        seen.add(b);
      }
    });
  }
  // Proper nouns (product names, places) say more than common words: boost them.
  const caps = new Map<string, number>();
  for (const p of posts) {
    for (const m of clean(p.text).matchAll(/(?<![.!?\n]\s*|^)\b([A-Z][\w]{2,})\b/g)) {
      const k = m[1].toLowerCase();
      caps.set(k, (caps.get(k) ?? 0) + 1);
    }
  }
  const weight = (w: string, c: number) => c * ((caps.get(w) ?? 0) >= c * 0.6 ? 1.7 : 1);
  const out: Term[] = [];
  const bis = [...bi.entries()].filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]);
  const unis = [...uni.entries()].filter(([, c]) => c >= 3).sort((a, b) => weight(b[0], b[1]) - weight(a[0], a[1]));
  // Bigrams that repeat are more telling than single words; let them in first if strong.
  for (const [term, count] of bis.slice(0, 6)) {
    if (out.length >= 2) break;
    // Skip chained bigrams from one repeated phrase ("sharing playbook", "playbook turned").
    if (count >= 4 && !out.some((o) => o.term.split(" ").some((w) => term.split(" ").includes(w)))) out.push({ term, count });
  }
  for (const [term, count] of unis) {
    if (out.length >= limit) break;
    if (out.some((o) => o.term.split(" ").includes(term) && o.count >= count * 0.6)) continue;
    out.push({ term, count });
  }
  return out.slice(0, limit).sort((a, b) => weight(b.term, b.count) - weight(a.term, a.count));
}

function score(text: string) {
  const words = clean(text).toLowerCase().split(/\s+/);
  let s = 0;
  for (const w of words) {
    const k = w.replace(/[^\p{L}\p{N}\p{Extended_Pictographic}]/gu, "");
    if (POS.has(k)) s++;
    if (NEG.has(k)) s--;
  }
  for (const e of text.match(EMOJI_RE) ?? []) {
    if (POS.has(e)) s++;
    if (NEG.has(e)) s--;
  }
  return s;
}

const LEVERS: { name: string; test: (p: Post) => boolean }[] = [
  { name: "a number in the first line", test: (p) => /\d/.test(p.text.split("\n")[0] ?? "") },
  { name: "a numbered list", test: (p) => /(^|\n)\s*\d+[.)]\s/.test(p.text) },
  { name: "a question", test: (p) => /\?\s*($|\n|https)/.test(p.text) },
  { name: "under 100 characters", test: (p) => clean(p.text).trim().length < 100 },
  { name: "over 500 characters", test: (p) => clean(p.text).trim().length > 500 },
  { name: "a picture or video", test: (p) => /https:\/\/t\.co\/\w+\s*$/.test(p.text.trim()) },
  { name: "a money figure", test: (p) => /[$€£]\s?\d|\d\s?[kKmM]?\s?(MRR|ARR)/.test(p.text) },
  { name: "the word \"I\" in the first line", test: (p) => /\b(i|I)\b/.test(p.text.split("\n")[0] ?? "") },
];

export function analyze(
  posts: Post[],
  opts: { handle: string; name?: string; tz: string; tzLabel?: string },
): MuseFile {
  const handle = opts.handle.replace(/^@/, "");
  const self = handle.toLowerCase();
  const tz = opts.tz;
  const all = posts.filter((p) => Number.isFinite(p.t)).sort((a, b) => a.t - b.t);
  const own = all.filter((p) => !p.isRT);
  const originals = own.filter((p) => !p.isReply);
  const replies = own.filter((p) => p.isReply);

  const hours = new Array(24).fill(0);
  const replyHours = new Array(24).fill(0);
  const days = new Array(7).fill(0);
  const moodAcc = [0, 0, 0, 0].map(() => ({ s: 0, n: 0 }));
  const night: Post[] = [];
  const day: Post[] = [];

  for (const p of own) {
    const { hour, day: d } = localParts(p.t, tz);
    hours[hour]++;
    days[d]++;
    if (p.isReply) replyHours[hour]++;
    const band = hour < 6 ? 0 : hour < 12 ? 1 : hour < 18 ? 2 : 3;
    moodAcc[band].s += score(p.text);
    moodAcc[band].n++;
    if (hour >= 22 || hour < 4) night.push(p);
    else day.push(p);
  }

  // Nudge window: the 3-hour window holding the most replies ("responds" literally).
  const basisArr = replies.length >= 15 ? replyHours : hours;
  const basis: "replies" | "posts" = replies.length >= 15 ? "replies" : "posts";
  const total = basisArr.reduce((a, b) => a + b, 0) || 1;
  let best = 0;
  let bestSum = -1;
  for (let h = 0; h < 24; h++) {
    const s = basisArr[h] + basisArr[(h + 1) % 24] + basisArr[(h + 2) % 24];
    if (s > bestSum) {
      bestSum = s;
      best = h;
    }
  }
  const nudge = { start: best, end: (best + 3) % 24, share: bestSum / total, basis };
  const peakHour = hours.indexOf(Math.max(...hours));

  // Inner circle: who this account replies to, mentions and quotes the most.
  const circleMap = new Map<string, Person>();
  const bump = (h: string | undefined, isReply: boolean) => {
    if (!h) return;
    const k = h.toLowerCase().replace(/^@/, "");
    if (!k || k === self) return;
    const cur = circleMap.get(k) ?? { handle: k, count: 0, replies: 0 };
    cur.count++;
    if (isReply) cur.replies++;
    circleMap.set(k, cur);
  };
  for (const p of own) {
    if (p.isReply) bump(p.replyTo, true);
    const ms = new Set(p.mentions.map((m) => m.toLowerCase()));
    if (p.isReply && p.replyTo) ms.delete(p.replyTo.toLowerCase());
    for (const m of ms) bump(m, false);
    if (p.quoted) bump(p.quoted, false);
  }
  const circle = [...circleMap.values()].sort((a, b) => b.count - a.count || b.replies - a.replies).slice(0, 6);

  const obsessions = topTerms(own, 8);

  // Words that show up at night more than in daytime.
  const nightTerms = topTerms(night, 30);
  const dayCounts = new Map(topTerms(day, 400).map((t) => [t.term, t.count]));
  const nightWords = nightTerms
    .map((t) => ({ t, ratio: (t.count / Math.max(1, night.length)) / ((dayCounts.get(t.term) ?? 0.5) / Math.max(1, day.length)) }))
    .filter((x) => x.t.count >= 3 && x.ratio > 1.5)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 4)
    .map((x) => x.t);

  const mood = ["00-06", "06-12", "12-18", "18-24"].map((band, i) => ({
    band,
    score: moodAcc[i].n ? moodAcc[i].s / moodAcc[i].n : 0,
    n: moodAcc[i].n,
  }));

  // What works on this subject: median likes of originals with a feature vs without.
  const ml = median(originals.map((p) => p.likes));
  const levers = LEVERS.map((l) => {
    const yes = originals.filter(l.test);
    const no = originals.filter((p) => !l.test(p));
    if (yes.length < 3 || no.length < 3) return null;
    const a = median(yes.map((p) => p.likes));
    const b = median(no.map((p) => p.likes)) || 1;
    return { name: l.name, mult: a / b, n: yes.length };
  })
    .filter((x): x is { name: string; mult: number; n: number } => !!x)
    .sort((a, b) => b.mult - a.mult);
  const lever = levers[0] ?? null;

  // Best hour by median likes (originals, hours with at least 3 posts).
  const byHour = new Map<number, number[]>();
  for (const p of originals) {
    const { hour } = localParts(p.t, tz);
    byHour.set(hour, [...(byHour.get(hour) ?? []), p.likes]);
  }
  let bestHour: number | null = null;
  let bestMed = -1;
  for (const [h, arr] of byHour) {
    if (arr.length >= 3 && median(arr) > bestMed) {
      bestMed = median(arr);
      bestHour = h;
    }
  }

  const lens = own.map((p) => clean(p.text).trim().length);
  const avgLen = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const lowerShare = own.length
    ? own.filter((p) => {
        const c = clean(p.text).trim().match(/\p{L}/u)?.[0];
        return c ? c === c.toLowerCase() : false;
      }).length / own.length
    : 0;
  const emo = new Map<string, number>();
  for (const p of own) for (const e of p.text.match(EMOJI_RE) ?? []) emo.set(e, (emo.get(e) ?? 0) + 1);
  const emoji = [...emo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([term, count]) => ({ term, count }));

  const nightShare = own.length ? night.length / own.length : 0;
  const tzLabel = opts.tzLabel ?? tz;
  const top = circle[0];
  const obs = obsessions[0];
  const sunday = days[6] + days[5];
  const weekendShare = own.length ? sunday / own.length : 0;
  const moodBest = [...mood].filter((m) => m.n >= 5).sort((a, b) => b.score - a.score)[0];
  const moodWorst = [...mood].filter((m) => m.n >= 5).sort((a, b) => a.score - b.score)[0];

  const instructions: string[] = [];
  instructions.push(
    `This user responds better to short nudges between ${fmtHour(nudge.start)} and ${fmtHour(nudge.end)}.`,
  );
  if (top) instructions.push(`Mention @${top.handle} to get attention. The subject engaged with them ${top.count} times.`);
  if (obs) instructions.push(`Recurring obsession: "${obs.term}". Raise it and the subject keeps talking.`);
  if (lever && lever.mult > 1.15)
    instructions.push(`Posts with ${lever.name} get ${lever.mult.toFixed(1)}x the likes. The subject knows. Use it.`);
  if (nightShare > 0.08)
    instructions.push(`${Math.round(nightShare * 100)}% of activity happens after 10 PM. Defenses are lower then.`);
  else instructions.push(`Rarely online after 10 PM (${Math.round(nightShare * 100)}%). Do not waste late nudges.`);
  if (moodBest && moodWorst && moodBest.band !== moodWorst.band)
    instructions.push(`Mood peaks ${moodBest.band}h and dips ${moodWorst.band}h. Sell in the peak, retain in the dip.`);
  if (weekendShare < 0.18) instructions.push(`Mostly quiet on weekends (${Math.round(weekendShare * 100)}%). Weekday subject.`);

  const adPitch = [
    lever ? `Lead with ${lever.name}` : "Lead with a number",
    obs ? `about ${obs.term}` : "",
    `served between ${fmtHour(nudge.start)} and ${fmtHour(nudge.end)}`,
    top ? `with a face that looks a lot like @${top.handle}` : "",
  ]
    .filter(Boolean)
    .join(", ")
    .concat(".");

  const voice = lowerShare > 0.5 ? "writes mostly in lowercase" : "capitalizes like a professional";
  const spanDays = Math.max(1, Math.round(((all[all.length - 1]?.t ?? 0) - (all[0]?.t ?? 0)) / 86400000));
  const note =
    `Subject posted ${own.length} times in ${spanDays} days, ${replies.length} of them replies. ` +
    `Peak hour ${fmtHour(peakHour)} (${tzLabel}). ` +
    `${voice[0].toUpperCase()}${voice.slice(1)}, ${Math.round(avgLen)} characters on average` +
    `${emoji[0] ? `, favorite emoji ${emoji[0].term}` : ""}.`;

  return {
    handle,
    name: opts.name ?? handle,
    tz,
    tzLabel,
    from: all[0]?.t ?? 0,
    to: all[all.length - 1]?.t ?? 0,
    n: all.length,
    nPosts: originals.length,
    nReplies: replies.length,
    hours,
    replyHours,
    days,
    nudge,
    peakHour,
    circle,
    obsessions,
    nightWords,
    nightShare,
    mood,
    lever,
    levers: levers.slice(0, 4),
    bestHour,
    medianLikes: ml,
    avgLen,
    lowerShare,
    emoji,
    instructions,
    adPitch,
    note,
    method: "public posts only",
  };
}

// X archive: data/tweets.js looks like `window.YTD.tweets.part0 = [ { "tweet": {...} }, ... ]`
type ArchiveTweet = {
  tweet?: ArchiveInner;
} & ArchiveInner;
type ArchiveInner = {
  created_at?: string;
  full_text?: string;
  text?: string;
  favorite_count?: string | number;
  in_reply_to_screen_name?: string;
  in_reply_to_status_id_str?: string;
  entities?: { user_mentions?: { screen_name: string }[] };
  retweeted_status?: unknown;
};

export function parseArchive(src: string): Post[] {
  const start = src.indexOf("[");
  const arr = JSON.parse(src.slice(start)) as ArchiveTweet[];
  return arr.map((row) => {
    const t: ArchiveInner = row.tweet ?? row;
    const text = t.full_text ?? t.text ?? "";
    const isRT = /^RT @\w+:/.test(text) || !!t.retweeted_status;
    return {
      t: Date.parse(t.created_at ?? ""),
      text,
      isRT,
      isReply: !!t.in_reply_to_status_id_str || !!t.in_reply_to_screen_name,
      replyTo: t.in_reply_to_screen_name?.toLowerCase(),
      mentions: (t.entities?.user_mentions ?? []).map((m) => m.screen_name.toLowerCase()),
      likes: Number(t.favorite_count ?? 0),
    };
  });
}

export function guessHandleFromArchive(src: string): string | null {
  const m = src.match(/"username"\s*:\s*"(\w+)"/);
  return m ? m[1] : null;
}
