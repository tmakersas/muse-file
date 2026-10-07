import { getFile, HANDLES } from "../src/lib/files";
for (const h of HANDLES) { const f = getFile(h)!; console.log(h, f.n, JSON.stringify({nudge:f.nudge, peak:f.peakHour, circle:f.circle.map(c=>c.handle+":"+c.count), obs:f.obsessions.map(o=>o.term+":"+o.count), night:f.nightWords, lever:f.lever, ad:f.adPitch})); }
