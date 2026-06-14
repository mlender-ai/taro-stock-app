import type { Metadata } from "next";
import "./globals.css";

/**
 * 메타데이터 — OG 태그 + Twitter Card 추가로 SNS 공유 시 프리뷰 카드 노출.
 * 투자 조언/가짜 수치 표현 금지. 정체성 카피만.
 * @author 안티그래비티
 */
export const metadata: Metadata = {
  title: "FOMO Club",
  description: "투자자들이 \"나만 그런 게 아니구나\"를 확인하는 공간. FOMO Index는 감정 체감 지표이며 투자 조언이 아닙니다.",
  openGraph: {
    title: "FOMO Club",
    description: "나만 그런 게 아니구나 — 오늘 다들 뭐에 쏠렸는지 보고, 안 따라가도 괜찮다는 걸 확인하는 곳.",
    siteName: "FOMO Club",
    images: [{ url: "/og-image.png", width: 1024, height: 1024, alt: "FOMO Club" }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FOMO Club",
    description: "나만 그런 게 아니구나 — 오늘 다들 뭐에 쏠렸는지 보고, 안 따라가도 괜찮다는 걸 확인하는 곳.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
