// 동네 고르기의 검색과 "내 위치로 찾기"(순수 함수). 동네 목록은 인자로 받는다.
// 목록(neighborhoods.ts)은 시트를 열 때 따로 불러오므로, 이 파일은 목록을 직접 import하지 않는다(타입만).

import { matchChosung } from "@/lib/hangul";
import { distanceKm } from "./describe";
import type { Neighborhood } from "./neighborhoods";

const collator = new Intl.Collator("ko-KR");

/**
 * 검색어로 동네 찾기(초성 지원). 빈 검색어면 빈 목록.
 * 순서: 이름이 검색어로 시작 → 이름 가운데에 있음 → 시도 이름에만 있음("서울", "강원"). 같으면 이름 가나다순, 그다음 시도 순.
 */
export function searchNeighborhoods(query: string, list: Neighborhood[]): Neighborhood[] {
  if (query.trim() === "") return [];
  const found: { n: Neighborhood; rank: number; at: number }[] = [];
  for (const n of list) {
    const inName = matchChosung(query, n.name);
    if (inName !== -1) {
      found.push({ n, rank: inName === 0 ? 0 : 1, at: inName });
      continue;
    }
    const inSido = Math.max(matchChosung(query, n.sido), matchChosung(query, n.label));
    if (inSido !== -1) found.push({ n, rank: 2, at: 0 });
  }
  found.sort(
    (a, b) =>
      a.rank - b.rank ||
      a.at - b.at ||
      collator.compare(a.n.name, b.n.name) || // 화면에 크게 보이는 이름(마포구, 목포시) 순
      collator.compare(a.n.sido, b.n.sido),
  );
  return found.map((f) => f.n);
}

/**
 * 가장 가까운 동네가 이보다 멀면 한국 밖으로 본다. 대표점은 시군구 안쪽 한 점이라 먼 섬은 꽤 떨어져 있다
 * (신안군 가거도, 옹진군 백령도는 대표점에서 100km 안팎).
 */
export const OUTSIDE_KOREA_KM = 150;

/**
 * 위치에서 가까운 동네 count곳(가까운 순). 시군구 경계가 아니라 대표점(먼 섬은 섬 위치도)까지 거리라서,
 * 경계 근처면 이웃 동네가 먼저 나올 수 있다. 그래서 하나를 바로 고르지 않고 몇 곳을 보여주고 사람이 고른다.
 */
export function nearestNeighborhoods(
  position: { lat: number; lon: number },
  list: Neighborhood[],
  count = 3,
): { neighborhood: Neighborhood; km: number }[] {
  return list
    .map((neighborhood) => ({
      neighborhood,
      km: Math.min(
        distanceKm(position, neighborhood),
        ...(neighborhood.islands ?? []).map((island) => distanceKm(position, island)),
      ),
    }))
    .sort((a, b) => a.km - b.km)
    .slice(0, count);
}
