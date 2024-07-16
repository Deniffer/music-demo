import { findByUuid, getRandomSongs } from "@/models/song";
import React from "react";

import Crumb from "@/components/common/Crumb";

import { Nav } from "@/types/nav";
import Header from "@/components/Song/Header";
import Lyrics from "@/components/Song/Content/Lyrics";
import RecommandList from "@/components/Song/Content/RecommandList";

export default async function ({ params }: { params: { uuid: string } }) {
  let song = await findByUuid(params.uuid);

  const randomSongs = await getRandomSongs(1, 20);

  const crumbNavs: Nav[] = [
    {
      title: "home",
      url: "/",
    },
    {
      title: song?.title || "",
      active: true,
    },
  ];

  return (
    <div className="pb-24">
      <Crumb navs={crumbNavs} />

      {song && (
        <>
          <Header song={song} />
          <div className="flex flex-wrap items-start gap-x-8 mt-8">
            <div className="w-full md:flex-1">
              <Lyrics song={song} />
            </div>
            <div className="md:w-96 md:mx-8 border-t md:border-t-0 mt-8 md:mt-0 md:border-l border-base-200 md:px-8 truncate">
              <div className="mt-4">
                <h2 className="text-lg mb-4 font-medium">{"Recommended"}</h2>
                {randomSongs && <RecommandList songs={randomSongs} />}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
