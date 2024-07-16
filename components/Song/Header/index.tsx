"use client";

import { MdHeadset, MdOutlinePlayArrow } from "react-icons/md";

import { AiOutlineLike } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import moment from "moment";

import { Song } from "@/types/song";
import { useAppStore } from "@/store/app";
import Share from "@/components/common/Share";
import { EditIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ({ song }: { song: Song }) {
  const { appendPlaylist, currentSong, setCurrentSong, setCurrentSongIndex } =
    useAppStore();

  const router = useRouter();

  const playSong = function (song: Song) {
    appendPlaylist(song);
    setCurrentSong(song);
    setCurrentSongIndex(0);
  };

  return (
    <div className="flex items-center gap-x-8 border-b border-base-300 pb-8">
      {song.image_url && (
        <Image
          src={song.image_url}
          alt={song.title || ""}
          width={160}
          height={160}
          className="hidden md:block rounded-lg"
        />
      )}

      <div className="flex flex-col gap-y-2 mr-8">
        <h1 className="text-xl font-medium">{song.title || "No Title"}</h1>
        <p className="text-md">{song.tags}</p>
        <p className="text-md">
          {moment(song.created_at).format("MMMM Do, YYYY")}
        </p>

        <div className="mt-2 flex gap-x-2 md:gap-x-4 text-md text-base-content">
          {currentSong && currentSong.uuid === song.uuid ? (
            <Button size="sm" variant={"outline"}>
              <img src="/playing.gif" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant={"outline"}
              onClick={() => playSong(song)}
            >
              <MdOutlinePlayArrow className="text-2xl" />
              {"play"}
            </Button>
          )}
          <Button size="sm" variant={"outline"}>
            <MdHeadset className="text-xl" />
            {song.play_count}
          </Button>
          <Button size="sm" variant={"outline"}>
            <AiOutlineLike className="text-xl" />
            {song.upvote_count}
          </Button>

          <Button
            size="sm"
            variant={"outline"}
            onClick={() => router.push(`/song/${song.uuid}/edit`)}
          >
            <EditIcon className="text-2xl" />
          </Button>

          <Button size="sm" variant={"outline"}>
            <Share song={song} />
          </Button>
          {/* <Button
            size="sm"
            className="hidden md:flex items-center gap-x-1 bg-base-300 text-base-content"
          >
            <MdOutlineDownload className="text-2xl" />
          </Button> */}
        </div>
      </div>
    </div>
  );
}
