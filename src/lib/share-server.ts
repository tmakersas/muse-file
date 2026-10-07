import { inflateRawSync } from "node:zlib";
import type { MuseFile } from "./analyze";

export function decodeFile(d: string | null | undefined): MuseFile | null {
  if (!d || d.length > 12000) return null;
  try {
    const buf = Buffer.from(d.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    const f = JSON.parse(inflateRawSync(buf).toString("utf8")) as MuseFile;
    if (!f || typeof f.handle !== "string" || !Array.isArray(f.hours) || f.hours.length !== 24) return null;
    f.handle = f.handle.replace(/[^\w]/g, "").slice(0, 15) || "anonymous";
    const cut = (x: unknown, n = 60) => String(x ?? "").slice(0, n);
    f.circle = (f.circle ?? []).slice(0, 6).map((c) => ({ ...c, handle: cut(c.handle, 15).replace(/[^\w]/g, "") }));
    f.obsessions = (f.obsessions ?? []).slice(0, 8).map((o) => ({ ...o, term: cut(o.term, 32) }));
    f.nightWords = (f.nightWords ?? []).slice(0, 4).map((o) => ({ ...o, term: cut(o.term, 32) }));
    f.instructions = (f.instructions ?? []).slice(0, 8).map((x) => cut(x, 220));
    f.levers = (f.levers ?? []).slice(0, 4).map((l) => ({ ...l, name: cut(l.name, 40) }));
    f.adPitch = cut(f.adPitch, 260);
    f.note = cut(f.note, 400);
    f.tzLabel = cut(f.tzLabel, 60);
    return f;
  } catch {
    return null;
  }
}
