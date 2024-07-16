import { Nav } from "@/types/nav";


import { getTrendingSongs } from "@/models/song";
import Crumb from "@/components/common/Crumb";
import PlayList from "@/components/common/PlayList";

export default async function () {
  const songs = await getTrendingSongs(1, 50);
  const loading = false;

  const crumbNavs: Nav[] = [
    {
      title: "home",
      url: "/",
    },
    {
      title: "trending",
      active: true,
    },
  ];

  return (
    <div>
      <Crumb navs={crumbNavs} />

      <div className="flex items-center justify-between mb-4">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            {"trending"}
          </h1>
          <p className="text-sm text-muted-foreground"></p>
        </div>
      </div>

      <PlayList loading={loading} songs={songs || []} />
    </div>
  );
}
