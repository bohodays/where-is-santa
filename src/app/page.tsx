import { MainScreen } from "@/components/MainScreen";

// 메인 화면. 시각을 읽는 MainScreen은 클라이언트 컴포넌트라, 서버는 시각 없는 첫 화면(자리만 잡힌 시트)을 보낸다.
export default function Home() {
  return <MainScreen />;
}
