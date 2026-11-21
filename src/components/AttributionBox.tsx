// 지도·데이터 출처 상자(설정 맨 아래). 지도 위 출처(MapAttribution)는 글자만 두고, 링크는 여기에 모은다.
// 링크는 새 창으로 연다: 설정을 보다가 눌러도 산타 화면이 그대로 남는다. 새 창이라는 것은 화면 낭독기용 글자로도 알린다.
// 링크 글자 대비는 토큰 테스트가 검사한다(link 색 × surface-muted 바탕). 줄 간격을 넓게 두어 링크끼리 붙지 않게 한다.

const LINK_CLASS =
  "focus-ring rounded-sm text-link underline underline-offset-2 hover:text-link-hover";

function Source({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={LINK_CLASS}>
      {children}
      <span className="sr-only"> (새 창)</span>
    </a>
  );
}

export function AttributionBox() {
  return (
    <section
      aria-labelledby="attribution-title"
      className="flex flex-col gap-1.5 rounded-button bg-surface-muted px-4 py-3.5 break-keep"
    >
      <h3 id="attribution-title" className="text-body font-bold text-ink">
        지도·데이터 출처
      </h3>
      <p className="text-fine text-ink-soft">
        지도 © <Source href="https://openfreemap.org">OpenFreeMap</Source> ©{" "}
        <Source href="https://openmaptiles.org">OpenMapTiles</Source> ©{" "}
        <Source href="https://www.openstreetmap.org/copyright">OpenStreetMap</Source> 기여자
        <br />
        세계 도시 <Source href="https://www.geonames.org">GeoNames</Source> · 국내 시군구
        국가데이터처 SGIS
        <br />
        지도를 못 불러올 때 Made with{" "}
        <Source href="https://www.naturalearthdata.com">Natural Earth</Source>
      </p>
    </section>
  );
}
