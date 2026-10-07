import Shell from "@/components/Shell";
import { getFile, HANDLES, SNAPSHOT_DATE, subjectName } from "@/lib/files";
import { NOTES } from "@/lib/notes";

export default function Home() {
  const file = getFile("tibo_maker")!;
  const cabinet = HANDLES.map((h) => ({ handle: h, name: subjectName(h), n: getFile(h)!.n }));
  return <Shell file={file} analystNote={NOTES.tibo_maker} cabinet={cabinet} snapshotDate={SNAPSHOT_DATE} />;
}
