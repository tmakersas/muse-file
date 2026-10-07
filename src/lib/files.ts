import snapshot from "@/data/snapshot.json";
import { analyze, type MuseFile, type Post } from "./analyze";

type Subject = { handle: string; name: string; tz: string; tzLabel: string; posts: Post[] };
const SUBJECTS = snapshot.subjects as unknown as Record<string, Subject>;

export const SNAPSHOT_DATE = snapshot.snapshot;
export const HANDLES = Object.keys(SUBJECTS);

const cache = new Map<string, MuseFile>();
export function getFile(handle: string): MuseFile | null {
  const k = handle.toLowerCase().replace(/^@/, "");
  const s = SUBJECTS[k];
  if (!s) return null;
  if (!cache.has(k)) cache.set(k, analyze(s.posts, { handle: s.handle, name: s.name, tz: s.tz, tzLabel: s.tzLabel }));
  return cache.get(k)!;
}

export function subjectName(handle: string) {
  return SUBJECTS[handle]?.name ?? handle;
}
