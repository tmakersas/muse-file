import type { MuseFile } from "./analyze";

// Shared files live entirely in the URL: deflate + base64url. No server storage, no database.
const b64url = (bytes: Uint8Array) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export function slim(f: MuseFile): MuseFile {
  return { ...f, method: "" };
}

export async function encodeFile(f: MuseFile): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(slim(f)));
  const cs = new CompressionStream("deflate-raw");
  const buf = await new Response(new Blob([json]).stream().pipeThrough(cs)).arrayBuffer();
  return b64url(new Uint8Array(buf));
}
