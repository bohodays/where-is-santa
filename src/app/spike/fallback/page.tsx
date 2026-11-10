import type { Metadata } from 'next';
import { SantaStatus } from '@/components/SantaStatus';
import { FallbackMapSpike } from '@/components/spike/FallbackMapSpike';

// 지도 장애 대응 시험 화면. 시험이 끝나면 지운다. (spike/map-fallback 브랜치 전용)
export const metadata: Metadata = {
  title: '지도 장애 대응 시험',
  robots: { index: false, follow: false },
};

export default function FallbackSpikePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 px-4 py-6">
      <SantaStatus homeCityId="seoul" />
      <FallbackMapSpike />
    </main>
  );
}
