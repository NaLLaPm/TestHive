import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
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
          <Nav />
          <div className="md:pl-64 min-h-screen flex flex-col">
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}