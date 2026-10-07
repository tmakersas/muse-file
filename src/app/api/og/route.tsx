import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fmtHour, type MuseFile } from "@/lib/analyze";
import { getFile } from "@/lib/files";
import { decodeFile } from "@/lib/share-server";

const font = (f: string) => readFile(join(process.cwd(), "assets", f));

function Clock({ f, size }: { f: MuseFile; size: number }) {
  const c = size / 2;
  const r0 = size * 0.2;
  const r1 = size * 0.46;
  const max = Math.max(1, ...f.hours);
  const span = (f.nudge.end - f.nudge.start + 24) % 24 || 24;
  const ang = (h: number) => (h / 24) * Math.PI * 2 - Math.PI / 2;
  const pt = (h: number, r: number) => [c + Math.cos(ang(h)) * r, c + Math.sin(ang(h)) * r];
  const wedge = (h: number, rIn: number, rOut: number) => {
    const a = h + 0.1;
    const b = h + 0.9;
    const [x1, y1] = pt(a, rIn);
    const [x2, y2] = pt(a, rOut);
    const [x3, y3] = pt(b, rOut);
    const [x4, y4] = pt(b, rIn);
    return `M${x1},${y1} L${x2},${y2} A${rOut},${rOut} 0 0 1 ${x3},${y3} L${x4},${y4} A${rIn},${rIn} 0 0 0 ${x1},${y1} Z`;
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r1} fill="none" stroke="rgba(27,25,21,0.15)" strokeDasharray="3 5" />
      {f.hours.map((v, h) => {
        const inWin = (h - f.nudge.start + 24) % 24 < span;
        return (
          <path
            key={h}
            d={wedge(h, r0, r0 + 4 + (v / max) * (r1 - r0 - 4))}
            fill={inWin ? "#c62a1f" : "#1b1915"}
            fillOpacity={0.2 + 0.8 * (v / max)}
          />
        );
      })}
    </svg>
  );
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const f = (sp.get("d") ? decodeFile(sp.get("d")) : null) ?? getFile(sp.get("h") ?? "tibo_maker") ?? getFile("tibo_maker")!;
  const [serif, serifItalic, type, typeBold, mono] = await Promise.all([
    font("InstrumentSerif-Regular.ttf"),
    font("InstrumentSerif-Italic.ttf"),
    font("CourierPrime-Regular.ttf"),
    font("CourierPrime-Bold.ttf"),
    font("SpaceMono-Bold.ttf"),
  ]);
  const fonts = [
    { name: "Serif", data: serif, weight: 400 as const, style: "normal" as const },
    { name: "Serif", data: serifItalic, weight: 400 as const, style: "italic" as const },
    { name: "Type", data: type, weight: 400 as const, style: "normal" as const },
    { name: "Type", data: typeBold, weight: 700 as const, style: "normal" as const },
    { name: "Mono", data: mono, weight: 700 as const, style: "normal" as const },
  ];
  const circle = f.circle.slice(0, 3).map((c) => "@" + c.handle).join("  ");
  const obs = f.obsessions.slice(0, 3).map((o) => o.term).join(" · ");
  const handleSize = f.handle.length > 12 ? 40 : 48;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0b0a09", padding: "34px 40px", fontFamily: "Type" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            background: "#ece5d3",
            color: "#1b1915",
            padding: "30px 44px",
            transform: "rotate(-0.8deg)",
            position: "relative",
            boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Mono", fontSize: 15, letterSpacing: 3, color: "rgba(27,25,21,0.6)" }}>
            <span>MUSE-STYLE FILE · PUBLIC POSTS ONLY</span>
            <span>{f.n} POSTS</span>
          </div>
          <div style={{ display: "flex", marginTop: 22, alignItems: "center", gap: 26 }}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", fontFamily: "Mono", fontSize: 14, letterSpacing: 4, color: "#c62a1f" }}>SUBJECT</div>
              <div style={{ display: "flex", fontFamily: "Serif", fontSize: handleSize, lineHeight: 1 }}>@{f.handle}</div>
              <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Serif", fontSize: 58, lineHeight: 1.02, marginTop: 22, letterSpacing: -0.5 }}>
                <span>This user responds better to short nudges between&nbsp;</span>
                <span style={{ fontStyle: "italic", color: "#c62a1f" }}>{fmtHour(f.nudge.start)}</span>
                <span>&nbsp;and&nbsp;</span>
                <span style={{ fontStyle: "italic", color: "#c62a1f" }}>{fmtHour(f.nudge.end)}</span>
                <span>.</span>
              </div>
            </div>
            <Clock f={f} size={250} />
          </div>
          <div style={{ display: "flex", marginTop: "auto", gap: 40, fontSize: 21 }}>
            {circle && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontFamily: "Mono", fontSize: 12, letterSpacing: 3, color: "rgba(27,25,21,0.55)" }}>INNER CIRCLE</span>
                <span style={{ fontWeight: 700 }}>{circle}</span>
              </div>
            )}
            {obs && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontFamily: "Mono", fontSize: 12, letterSpacing: 3, color: "rgba(27,25,21,0.55)" }}>OBSESSIONS</span>
                <span style={{ fontWeight: 700 }}>{obs}</span>
              </div>
            )}
          </div>
          <div
            style={{
              position: "absolute",
              right: 46,
              top: 70,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              border: "4px solid #c62a1f",
              color: "#c62a1f",
              padding: "6px 14px",
              fontFamily: "Mono",
              fontSize: 22,
              letterSpacing: 3,
              transform: "rotate(-11deg)",
              opacity: 0.85,
            }}
          >
            <span>UPDATED HOURLY</span>
            <span style={{ fontSize: 12 }}>DO NOT SHOW SUBJECT</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts, headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}
