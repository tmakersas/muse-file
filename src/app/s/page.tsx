import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { fmtHour } from "@/lib/analyze";
import { getFile, HANDLES, SNAPSHOT_DATE, subjectName } from "@/lib/files";
import { decodeFile } from "@/lib/share-server";

type Props = { searchParams: Promise<{ d?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { d } = await searchParams;
  const f = decodeFile(d);
  if (!f) return {};
  const title = `The file an AI would keep on @${f.handle}`;
  const description = `"This user responds better to short nudges between ${fmtHour(f.nudge.start)} and ${fmtHour(f.nudge.end)}." Built from their own X archive.`;
  const img = `/api/og?d=${d}`;
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title, description, images: [{ url: img, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [img], creator: "@tibo_maker" },
  };
}

export default async function Shared({ searchParams }: Props) {
  const { d } = await searchParams;
  const file = decodeFile(d);
  if (!file) redirect("/");
  const cabinet = HANDLES.map((h) => ({ handle: h, name: subjectName(h), n: getFile(h)!.n }));
  return <Shell file={file} cabinet={cabinet} snapshotDate={SNAPSHOT_DATE} shared />;
}
