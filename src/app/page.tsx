import { SantaStatus } from '@/components/SantaStatus';

// 1주차 임시 화면: 경로 로직이 앱 안에서 도는지만 확인한다.
// 지도(MapLibre)와 시안 UI는 3주차에 붙인다.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-end gap-4 px-4 pb-8 pt-6">
      <SantaStatus homeCityId="seoul" />
    </main>
  );
}
