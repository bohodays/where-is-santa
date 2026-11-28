import { Button } from "./Button";

// 공유 링크로 들어온 사람에게 처음 보이는 시트의 내용("친구가 보낸 산타 소식").
// 보낸 사람의 인사말과, 시간은 보낸 사람이 아니라 내 동네 기준이라는 안내. 동네를 아직 안 골랐으면 고르기를 권한다.
// 시트 제목은 쓰는 쪽(ModalSheet)이 붙인다. 상태가 없어 'use client'가 없다.

type ReceivedPanelProps = {
  /** 다듬은 인사말(cleanGreeting). 비어 있으면 안내만 보인다 */
  greeting: string;
  /** 지금 동네 이름(받는 사람) */
  homeName: string;
  /** 사람이 직접 고른 동네인가 */
  chosen: boolean;
  onPickHome: () => void;
  onClose: () => void;
};

export function ReceivedPanel({
  greeting,
  homeName,
  chosen,
  onPickHome,
  onClose,
}: ReceivedPanelProps) {
  return (
    <div className="flex flex-col gap-4 break-keep">
      {greeting && (
        <figure className="flex flex-col gap-1 rounded-card bg-surface-muted px-4 py-3.5">
          <figcaption className="text-caption text-ink-soft">친구가 보낸 인사</figcaption>
          <blockquote className="text-body-lg font-bold text-ink">{greeting}</blockquote>
        </figure>
      )}
      <p className="text-body text-ink">
        산타가 오는 시간은 링크를 보낸 친구가 아니라 <strong>내 동네</strong> 기준으로 보여요.
      </p>
      {chosen ? (
        <>
          <p className="text-body text-ink-soft">지금 동네: {homeName}</p>
          <Button className="w-full" onClick={onClose}>
            산타 보러 가기
          </Button>
        </>
      ) : (
        <>
          <p className="text-body text-ink-soft">
            아직 동네를 고르지 않아서 지금은 {homeName} 기준이에요.
          </p>
          <div className="flex flex-col items-center gap-1">
            <Button className="w-full" onClick={onPickHome}>
              우리 동네 고르기
            </Button>
            <Button variant="quiet" onClick={onClose}>
              {homeName} 기준으로 볼게요
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
