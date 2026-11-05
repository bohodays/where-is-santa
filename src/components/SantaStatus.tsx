'use client';

import { CITIES } from '@/lib/santa/cities';
import { buildRoute } from '@/lib/santa/route';
import { santaAt, timeUntil } from '@/lib/santa/santa';
import { useNow } from '@/hooks/useNow';

const ROUTE = buildRoute(CITIES, 2026);
const HOUR = 3_600_000;
const MIN = 60_000;

function formatLeft(ms: number): string {
  if (ms <= 0) return '산타가 다녀갔어요';
  const h = Math.floor(ms / HOUR);
  const m = Math.floor((ms % HOUR) / MIN);
  if (h > 0) return `${h}시간 ${m}분`;
  return m > 0 ? `${m}분` : '1분 이내';
}

export function SantaStatus({ homeCityId }: { homeCityId: string }) {
  const now = useNow();
  const home = ROUTE.find((s) => s.id === homeCityId);

  if (now === null || !home) {
    return <p className="text-white/70">산타 위치를 불러오는 중…</p>;
  }

  const santa = santaAt(now, ROUTE);
  const where =
    santa.status === 'before'
      ? '산타는 북극에서 출발 준비 중'
      : santa.status === 'after'
        ? '산타는 북극으로 돌아갔어요'
        : santa.status === 'visiting'
          ? `지금 산타는 ${santa.prev?.name}에서 선물 배달 중`
          : `지금 산타는 ${santa.prev?.name}에서 ${santa.next?.name}(으)로 가는 중`;

  return (
    <section aria-live="polite" className="flex flex-col gap-4 rounded-3xl bg-surface p-5">
      <p className="text-[15px] font-bold">{where}</p>
      <div className="flex flex-col gap-1">
        <p className="text-[15px] text-ink-soft">{home.name}까지</p>
        <p className="font-display text-5xl leading-tight">{formatLeft(timeUntil(home.id, now, ROUTE))}</p>
      </div>
      <p className="text-[13px] text-ink-soft">
        지나온 도시 {santa.visitedCount.toLocaleString('ko-KR')}곳 · 남은 도시{' '}
        {(ROUTE.length - santa.visitedCount).toLocaleString('ko-KR')}곳
      </p>
    </section>
  );
}
