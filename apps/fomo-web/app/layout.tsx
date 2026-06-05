import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FOMO Club",
  description: "투자자들이 \"나만 그런 게 아니구나\"를 확인하는 공간. FOMO Index는 감정 체감 지표이며 투자 조언이 아닙니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
