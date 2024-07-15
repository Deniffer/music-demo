"use client";

import { MdLocalFireDepartment, MdMusicNote } from "react-icons/md";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import Link from "next/link";

import { Nav } from "@/types/nav";
import { useAppStore } from "@/store/app";

export default function SideBar() {
  const pathname = usePathname();
  const musicNavs: Nav[] = [
    {
      title: "discover",
      url: `/`,
      icon: <MdMusicNote className="text-lg" />,
      active: pathname === "/",
    },
    {
      title: "trending",
      url: "/trending",
      icon: <MdLocalFireDepartment className="text-lg" />,
      active: pathname.includes("trending"),
    },
  ];

  const getNavUrl = (nav: Nav) => {
    return nav.url;
  };

  const Navs = (navs: Nav[]) => {
    return (
      <>
        {navs.map((nav: Nav, idx: number) => {
          return (
            <Link
              href={getNavUrl(nav) || ""}
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                useAppStore.setState({ isSiderOpen: false });
              }}
            >
              <Button
                key={idx}
                variant="ghost"
                className={`md:w-full hover:bg-base-100 justify-start gap-x-1 ${
                  nav.active
                    ? "text-primary hover:text-primary"
                    : "hover:text-base-content"
                }`}
              >
                {nav.icon}
                {nav.title}
              </Button>
            </Link>
          );
        })}
      </>
    );
  };

  return (
    <div className="pb-24">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <p className="mb-2 px-4 text-sm font-semibold tracking-tight">
            {"music-demo"}
          </p>
          <div className="space-y-1 w-40">{Navs(musicNavs)}</div>
        </div>
      </div>
    </div>
  );
}
