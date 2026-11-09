import type { Metadata } from 'next';
import { MapSpike } from '@/components/spike/MapSpike';

// 지도 성능 시험 화면. 시험이 끝나면 지운다. (spike/maplibre 브랜치 전용)
export const metadata: Metadata = {
  title: '지도 성능 시험',
  robots: { index: false, follow: false },
};

export default function MapSpikePage() {
  return <MapSpike />;
}
