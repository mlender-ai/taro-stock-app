import { NextRequest, NextResponse } from "next/server";

// 데일리 무료 카드 — Prisma 없이 in-memory로 구현
// 실제로는 drawHistory에서 오늘 무료 뽑기 여부를 체크
// Phase 1: 간단한 in-memory 기반 (서버 재시작 시 리셋)
// TODO: DB 기반으로 전환 시 Prisma migration 필요

const dailyDraws = new Map<string, string>(); // userId -> dateKey

function getTodayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

// 간단한 토큰 파싱 (기존 auth 패턴 재활용)
function getUserId(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const payload = JSON.parse(Buffer.from(token.split(".")[1]!, "base64").toString());
    return (payload.userId as string) ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    // 비로그인 사용자도 데일리 카드 확인 가능 (제한적)
    return NextResponse.json({ available: true, drawnToday: false });
  }

  const today = getTodayKST();
  const lastDraw = dailyDraws.get(userId);
  const drawnToday = lastDraw === today;

  return NextResponse.json({
    available: !drawnToday,
    drawnToday,
    date: today,
  });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const today = getTodayKST();
  const lastDraw = dailyDraws.get(userId);

  if (lastDraw === today) {
    return NextResponse.json({
      error: "오늘 이미 무료 카드를 뽑았습니다",
      code: "ALREADY_DRAWN",
    }, { status: 409 });
  }

  dailyDraws.set(userId, today);

  // 랜덤 카드 + 메시지 생성
  const DAILY_CARDS = [
    { id: 0, name: "The Fool", nameKo: "광대", symbol: "0", message: "새로운 시작의 에너지가 느껴집니다. 오늘 시장에서 예상치 못한 기회를 만날 수 있습니다." },
    { id: 1, name: "The Magician", nameKo: "마법사", symbol: "I", message: "당신의 판단력이 빛나는 날입니다. 가진 도구를 최대한 활용하세요." },
    { id: 2, name: "The High Priestess", nameKo: "여사제", symbol: "II", message: "직감이 데이터보다 앞서는 순간이 있습니다. 내면의 목소리에 귀 기울이세요." },
    { id: 3, name: "The Empress", nameKo: "여황제", symbol: "III", message: "풍요와 성장의 기운입니다. 장기 투자에 좋은 시그널이 보입니다." },
    { id: 4, name: "The Emperor", nameKo: "황제", symbol: "IV", message: "체계적 접근이 수익으로 이어집니다. 규칙을 세우고 지키세요." },
    { id: 5, name: "The Hierophant", nameKo: "교황", symbol: "V", message: "검증된 방법론을 따르세요. 기본에 충실할 때 안정적 수익이 옵니다." },
    { id: 6, name: "The Lovers", nameKo: "연인", symbol: "VI", message: "중요한 선택의 기로에 있습니다. 심장과 머리가 같은 방향을 가리킬 때 행동하세요." },
    { id: 7, name: "The Chariot", nameKo: "전차", symbol: "VII", message: "강한 추진력의 날입니다. 목표를 정했다면 주저 없이 실행하세요." },
    { id: 8, name: "Strength", nameKo: "힘", symbol: "VIII", message: "인내가 시장을 이기는 유일한 무기입니다. 흔들리지 마세요." },
    { id: 9, name: "The Hermit", nameKo: "은둔자", symbol: "IX", message: "한 발 물러서 전체 그림을 보세요. 관망이 최선의 전략일 때가 있습니다." },
    { id: 10, name: "Wheel of Fortune", nameKo: "운명의 수레바퀴", symbol: "X", message: "시장의 사이클을 읽으세요. 변화는 이미 시작되었습니다." },
    { id: 11, name: "Justice", nameKo: "정의", symbol: "XI", message: "균형 잡힌 포트폴리오가 답입니다. 편향된 베팅을 점검하세요." },
    { id: 12, name: "The Hanged Man", nameKo: "매달린 사람", symbol: "XII", message: "관점을 바꾸면 보이지 않던 것이 보입니다. 역발상의 시간입니다." },
    { id: 13, name: "Death", nameKo: "죽음", symbol: "XIII", message: "끝은 새로운 시작입니다. 손절은 패배가 아니라 전략입니다." },
    { id: 14, name: "Temperance", nameKo: "절제", symbol: "XIV", message: "조급함을 내려놓으세요. 적절한 타이밍은 기다리는 자에게 옵니다." },
    { id: 15, name: "The Devil", nameKo: "악마", symbol: "XV", message: "탐욕과 두려움을 경계하세요. 감정적 매매가 가장 큰 적입니다." },
    { id: 16, name: "The Tower", nameKo: "탑", symbol: "XVI", message: "예상치 못한 변동이 올 수 있습니다. 리스크 관리를 점검하세요." },
    { id: 17, name: "The Star", nameKo: "별", symbol: "XVII", message: "희망적인 신호가 보입니다. 장기적 비전을 믿으세요." },
    { id: 18, name: "The Moon", nameKo: "달", symbol: "XVIII", message: "불확실성 속에서 확실한 것을 찾으세요. 모든 것이 보이는 것과 다를 수 있습니다." },
    { id: 19, name: "The Sun", nameKo: "태양", symbol: "XIX", message: "밝은 에너지가 시장을 감싸고 있습니다. 자신감을 가지되 과신은 경계하세요." },
    { id: 20, name: "Judgement", nameKo: "심판", symbol: "XX", message: "지난 투자를 돌아볼 시간입니다. 과거에서 배움을 얻고 앞으로 나아가세요." },
    { id: 21, name: "The World", nameKo: "세계", symbol: "XXI", message: "한 사이클이 완성되는 날입니다. 성과를 정리하고 다음 여정을 준비하세요." },
  ];

  const card = DAILY_CARDS[Math.floor(Math.random() * DAILY_CARDS.length)]!;
  const isReversed = Math.random() > 0.65;

  return NextResponse.json({
    success: true,
    card: {
      ...card,
      isReversed,
      message: isReversed
        ? `(역방향) ${card.message.replace("합니다", "할 수 있지만, 조심스러운 접근이 필요합니다")}`
        : card.message,
    },
    date: today,
  });
}
