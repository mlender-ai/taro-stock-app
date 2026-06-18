import { describe, expect, it } from "vitest";
import { parseNaverInvestorFlow, latestInvestorFlow } from "../src/supply-demand";

// 네이버 frgn.naver 실제 행 구조(2행) — 날짜·종가·전일비·등락률·거래량·기관·외국인·보유주수·보유율.
// 기관/외국인만 부호(+/-) 동반. 등락률(+1.02%)은 % 라 순매매로 안 잡혀야 한다.
const HTML = `
<table>
<tr onmouseover="x">
  <td><span class="tah p10 gray03">2026.06.17</span></td>
  <td><span class="tah p11">346,500</span></td>
  <td><span class="tah p11 red02">3,500</span></td>
  <td><span class="tah p11 red01">+1.02%</span></td>
  <td><span class="tah p11">18,134,051</span></td>
  <td><span class="tah p11 red01">+1,133,803</span></td>
  <td><span class="tah p11 nv01">-2,000,080</span></td>
  <td><span class="tah p11">2,780,810,260</span></td>
  <td><span class="tah p11">47.57%</span></td>
</tr>
<tr onmouseover="x">
  <td><span class="tah p10 gray03">2026.06.16</span></td>
  <td><span class="tah p11">343,000</span></td>
  <td><span class="tah p11 nv02">1,000</span></td>
  <td><span class="tah p11 nv01">-0.29%</span></td>
  <td><span class="tah p11">15,000,000</span></td>
  <td><span class="tah p11 nv01">-500,000</span></td>
  <td><span class="tah p11 red01">+1,200,000</span></td>
  <td><span class="tah p11">2,778,000,000</span></td>
  <td><span class="tah p11">47.50%</span></td>
</tr>
</table>`;

describe("parseNaverInvestorFlow — 일별 외국인·기관 순매매(시점 명시)", () => {
  it("기관·외국인 순매매를 부호 그대로 파싱, 등락률은 제외", () => {
    const flows = parseNaverInvestorFlow(HTML);
    expect(flows).toHaveLength(2);
    expect(flows[0]).toEqual({ date: "2026-06-17", institutionNet: 1_133_803, foreignNet: -2_000_080 });
    expect(flows[1]).toEqual({ date: "2026-06-16", institutionNet: -500_000, foreignNet: 1_200_000 });
  });

  it("기준일(date)이 항상 부착된다 (point-in-time 원칙)", () => {
    for (const f of parseNaverInvestorFlow(HTML)) {
      expect(f.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("빈/깨진 HTML → 빈 배열(가짜 금지)", () => {
    expect(parseNaverInvestorFlow("")).toEqual([]);
    expect(parseNaverInvestorFlow("<table><tr><td>no data</td></tr></table>")).toEqual([]);
  });

  it("결정적 — 같은 입력 같은 출력", () => {
    expect(parseNaverInvestorFlow(HTML)).toEqual(parseNaverInvestorFlow(HTML));
  });
});

describe("latestInvestorFlow", () => {
  it("가장 최근 거래일을 고른다", () => {
    expect(latestInvestorFlow(parseNaverInvestorFlow(HTML))?.date).toBe("2026-06-17");
  });
  it("빈 입력 → null", () => {
    expect(latestInvestorFlow([])).toBeNull();
  });
});
