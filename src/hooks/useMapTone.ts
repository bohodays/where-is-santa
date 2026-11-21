"use client";

import { useEffect } from "react";
import { mapToneAt, type MapToneSetting } from "@/lib/santa/sun";

/**
 * 지도 밝기(낮/밤)를 정해 <html data-map-tone="day">로 켠다. 디자인 토큰(--map-*)이 이 속성을 따라 바뀌고,
 * 지도(SantaMap)는 속성이 바뀌면 색만 다시 칠한다. 바텀시트·버튼·북극 마을 그림은 바뀌지 않는다(docs/design-tokens.md).
 * - 자동: 우리 동네 기준 해 뜬 뒤~해 지기 전이 낮(동네를 안 고르면 서울 중구)
 * - 설정에서 "밝게"·"어둡게"를 고르면 그대로(설정 화면은 순서 5번)
 * 1초마다 바뀌는 now를 받지만 낮/밤이 실제로 바뀔 때만 속성을 건드린다(tone이 같으면 effect가 다시 돌지 않는다).
 */
export function useMapTone(
  now: number | null,
  home: { lat: number; lon: number },
  setting: MapToneSetting = "auto",
): "day" | "night" | null {
  const tone = now === null ? null : mapToneAt(now, home, setting);

  useEffect(() => {
    if (tone === null) return;
    const html = document.documentElement;
    if (tone === "day") html.dataset.mapTone = "day";
    else delete html.dataset.mapTone; // 밤 지도가 기본(속성 없음)
  }, [tone]);

  return tone;
}
