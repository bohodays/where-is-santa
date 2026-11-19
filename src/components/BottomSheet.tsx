import type { ComponentPropsWithoutRef } from "react";

// 고정형 바텀시트: 메인 화면 아래에 늘 떠 있는 판(카운트다운 카드가 들어간다). 닫기 없음.
// 열고 닫는 시트는 ModalSheet.

/** 시트 위쪽 가운데 손잡이 모양. 끌어 올리는 기능은 없어서 화면 낭독기에는 숨긴다 */
export function SheetHandle() {
  return <div aria-hidden="true" className="mx-auto h-1 w-10 shrink-0 rounded-pill bg-handle" />;
}

export function BottomSheet({ className, children, ...rest }: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      {...rest}
      className={[
        "flex flex-col gap-4 rounded-t-sheet bg-surface px-5 pt-3 shadow-sheet",
        // 아이폰 아래 홈 막대 영역(safe area)만큼 더 띄운다. layout.tsx의 viewportFit: "cover"가 있어야 값이 들어온다
        "pb-[max(28px,env(safe-area-inset-bottom))]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <SheetHandle />
      {children}
    </section>
  );
}
