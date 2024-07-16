"use client";

import { useAppStore } from "@/store/app";

import { BsMoonStars, BsSun } from "react-icons/bs";

export default function Theme() {
  const { theme, setTheme } = useAppStore();
  const handleThemeChange = function (_theme: string) {
    setTheme(_theme);
  };

  return (
    <>
      {theme === "dark" ? (
        <BsSun
          className="cursor-pointer text-lg size-6"
          onClick={() => handleThemeChange("light")}
        />
      ) : (
        <BsMoonStars
          className="cursor-pointer text-lg size-6"
          onClick={() => handleThemeChange("dark")}
        />
      )}
    </>
  );
}
