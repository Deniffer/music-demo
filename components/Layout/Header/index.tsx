"use client";

import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import Link from "next/link";

import { useAppStore } from "@/store/app";
import SideBar from "../SideBar";
import Theme from "@/components/common/Theme";

export default function () {
  const { isSiderOpen, setIsSiderOpen } = useAppStore();

  return (
    <header className="flex h-16 left-0 right-0 fixed bg-base-100 z-50 items-center gap-4 border-b border-base-300 px-4 lg:h-[80px] lg:px-6">
      {/* <Sheet open={isSiderOpen} onOpenChange={setIsSiderOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="bg-base-200 border-base-300 shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" onClick={() => setIsSiderOpen(true)} />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex flex-col py-8 px-4 bg-base-200 border-base-300 overflow-y-auto"
          data-theme={"light"}
        >
          <SideBar />
        </SheetContent>
      </Sheet> */}

      <div className="mr-8">
        <Link href="/" className="flex items-center gap-x-2 font-semibold">
          {/* <img src="/logo.png" className="w-16 h-16" /> */}
          <span className="hidden md:block text-2xl font-medium">
            Music-Demo
          </span>
        </Link>
      </div>

      <Theme />
    </header>
  );
}
