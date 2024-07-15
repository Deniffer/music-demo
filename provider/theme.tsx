"use client";

import { Inter } from "next/font/google";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <body className={`w-screen h-screen`} data-theme={"light"}>
      {children}
    </body>
  );
}
