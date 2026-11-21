// 지도 위 짧은 출처. 지도 영역은 화면 낭독기에서 숨기므로(aria-hidden), 출처는 지도 밖 글자로 따로 둔다.
// 모든 출처와 이용 조건은 설정 화면의 출처 상자(AttributionBox, 순서 5번)에 자세히 적는다.

type MapAttributionProps = {
  /** tiles: OpenFreeMap 타일 지도, outline: 자체 윤곽 지도(Natural Earth) */
  mode: "tiles" | "outline";
};

export function MapAttribution({ mode }: MapAttributionProps) {
  return (
    <p className="text-attribution text-map-attribution">
      {mode === "tiles"
        ? "© OpenFreeMap © OpenMapTiles © OpenStreetMap · 도시 GeoNames"
        : "Made with Natural Earth · 도시 GeoNames"}
    </p>
  );
}
