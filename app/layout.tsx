import "leaflet/dist/leaflet.css";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polar View | Arctic Sea Ice Concentration",
  description: "Explore Arctic sea ice concentration with animated daily layers."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#1b1b1b] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
