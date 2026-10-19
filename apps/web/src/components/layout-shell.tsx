"use client";

import React from "react";
import clsx from "clsx";
import { useSidebar } from "@/components/sidebar-context";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={clsx(
        "min-h-screen flex flex-col transition-[padding] duration-300 ease-in-out md:pl-28"
      )}
    >
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
