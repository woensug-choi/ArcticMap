import "ol/ol.css";
import "./globals.css";
import type { Metadata } from "next";
import LanguageProvider from "@/components/LanguageProvider";

export const metadata: Metadata = {
  title: "Polar View | Arctic Sea Ice Concentration", //  브라우저 탭 제목, 검색 엔진, 링크 공유시 미리보기 설명 
  description: "Explore Arctic sea ice concentration with animated daily layers."
};

export default function RootLayout({ // /app 아래의 모든 페이지. page/tsx, layout.tsx 전부 여기로 들어옴
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#1b1b1b] text-slate-100 antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
