import { SITE } from "@/lib/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import { fmtHour } from "@/lib/analyze";
import { getFile, HANDLES, SNAPSHOT_DATE, subjectName } from "@/lib/files";
import { NOTES } from "@/lib/notes";

type Props = { params: Promise<{ handle: string }> };

export function generateStaticParams() {
  return HANDLES.map((handle) => ({ handle }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const f = getFile(handle);
  if (!f) return {};
  const title = `The file an AI would keep on @${f.handle}`;
  const description = `"This user responds better to short nudges between ${fmtHour(f.nudge.start)} and ${fmtHour(f.nudge.end)}." Built from ${f.n} public posts.`;
  const img = `${SITE}/api/og?h=${f.handle}`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/f/${f.handle}` },
    openGraph: { title, description, images: [{ url: img, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [img], creator: "@tibo_maker" },
  };
}

export default async function FilePage({ params }: Props) {
  const { handle } = await params;
  const file = getFile(handle);
  if (!file) notFound();
  const cabinet = HANDLES.map((h) => ({ handle: h, name: subjectName(h), n: getFile(h)!.n }));
  return <Shell file={file} analystNote={NOTES[file.handle]} cabinet={cabinet} snapshotDate={SNAPSHOT_DATE} />;
}
