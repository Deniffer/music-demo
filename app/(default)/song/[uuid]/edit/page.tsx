import { Content } from "@/components/EditSong/Content";
import { findByUuid } from "@/models/song";

export const runtime = "edge";

export default async function EditSongPage({
  params,
}: {
  params: { uuid: string };
}) {
  const { uuid } = params;
  const song = await findByUuid(uuid);

  if (!song) {
    return <div>Song not found</div>;
  }

  return <Content song={song} />;
}
