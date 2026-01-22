import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arctic Ice Mapper",
  description: "Explore animated snapshots of Arctic ice changes over time."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
