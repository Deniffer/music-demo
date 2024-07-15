import { MdLocalFireDepartment, MdOutlineRssFeed } from "react-icons/md";
import { getLatestSongs, getTrendingSongs } from "@/models/song";

import Scroll from "@/components/common/PlayList/Scroll";

export default async function HomePage() {
  const trendingSongs = await getTrendingSongs(1, 50);
  const trendingLoading = false;
  const latestSongs = await getLatestSongs(1, 50);
  const latestLoading = false;

  return (
    <div className="w-full md:max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">{"discover"}</h1>

      <div className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-x-2">
          <MdLocalFireDepartment />
          {"trending"}
        </h2>
        <Scroll loading={trendingLoading} songs={trendingSongs || []} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-x-2">
          <MdOutlineRssFeed />
          {"newest"}
        </h2>
        <Scroll loading={latestLoading} songs={latestSongs || []} />
      </div>
    </div>
  );
}
