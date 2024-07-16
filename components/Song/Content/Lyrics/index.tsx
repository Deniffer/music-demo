import { Song } from "@/types/song";

export default function ({ song }: { song: Song }) {
  return (
    <div className="mt-4">
      <h2 className="text-lg font-medium">{"Lyrics"}</h2>
      <div className="mt-4 min-h-xs max-w-md whitespace-pre truncate leading-loose">
        {song.lyrics}
      </div>
    </div>
  );
}
