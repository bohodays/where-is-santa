import { demoSpeedLabel } from "@/lib/santa/clock";
import { Button } from "./Button";

// 데모 중 화면 맨 위 띠: "데모 모드 · 1초 = 1분" + "바꾸기"(데모 시트를 연다).
// 색만으로 구분하지 않게 글자로 "데모 모드"라고 쓴다(docs/components.md).
// 서버는 주소의 ?demo=를 모르는 정적 페이지라, 띠를 늘 넣어 두고 <html data-demo="on">이 없으면 숨긴다(globals.css .demo-only).
// <head> 스크립트(DEMO_BOOT_SCRIPT)가 첫 화면 전에 속성을 켜므로, 데모 주소로 들어와도 띠가 나중에 생기며 화면이 밀리지 않는다.

type DemoBadgeProps = {
  /** 데모 배속. 시계를 읽기 전(첫 화면)에는 null: 띠 자리만 잡고 글자는 "데모 모드"만 */
  speed: number | null;
  onOpen?: () => void;
};

export function DemoBadge({ speed, onOpen }: DemoBadgeProps) {
  return (
    <div className="demo-only flex min-h-touch shrink-0 items-center justify-between gap-3 bg-night px-4 py-1 text-body text-scene-text">
      <p>
        <strong className="font-bold text-gold">데모 모드</strong>
        {speed !== null && ` · ${demoSpeedLabel(speed)}`}
      </p>
      {onOpen && (
        <Button
          variant="secondary"
          className="!min-h-touch shrink-0 !rounded-pill !px-4 !py-1 !text-body"
          aria-label="데모 바꾸기"
          onClick={onOpen}
        >
          바꾸기
        </Button>
      )}
    </div>
  );
}
