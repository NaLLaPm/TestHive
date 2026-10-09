import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SidebarProvider } from "@/components/sidebar-context";
import { LayoutContent } from "@/components/layout-shell";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "TestHive | Pixel OS Dashboard",
  description: "Test your digital product like 1,000 real personas with Pixel OS Material You UI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-text min-h-screen selection:bg-lavender selection:text-text antialiased">
        <Providers>
          <SidebarProvider>
            <Nav />
            <LayoutContent>{children}</LayoutContent>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}