"use client";

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import { SheetHandle } from "./BottomSheet";
import { IconButton } from "./IconButton";
import { CloseIcon } from "./icons";

// 모달형 바텀시트: 도착 순서, 동네 고르기, 설정 등. 브라우저의 <dialog>를 showModal()로 연다.
// <dialog>가 해 주는 것(직접 만들지 않는다):
// - 뒤 화면을 조작할 수 없게 막는다(inert). 포커스가 시트 밖으로 나가지 않는다
// - 열 때 시트 안 첫 번째 버튼(닫기)으로 포커스를 옮기고, 닫으면 연 버튼으로 포커스를 돌려준다
// - Esc로 닫힌다. role="dialog"와 모달이라는 정보가 화면 낭독기에 전해진다
// 모양과 애니메이션은 globals.css의 .modal-sheet.

type ModalSheetProps = {
  open: boolean;
  /** 닫기 버튼, Esc, 바깥(어두운 곳) 누르기 모두 여기로 온다. 여기서 open을 false로 바꾼다 */
  onClose: () => void;
  title: string;
  /** 제목 아래 작은 글자. 예) "한국 시각 기준" */
  subtitle?: string;
  children: ReactNode;
};

export function ModalSheet({ open, onClose, title, subtitle, children }: ModalSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // React의 open 값과 <dialog>의 실제 상태를 맞춘다.
  // open 속성을 직접 쓰면 모달이 아닌 창으로 열려서(뒤 화면 막기·Esc가 없다) 꼭 showModal()을 쓴다
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // 시트 내용이 dialog를 꽉 채우므로, 클릭 대상이 dialog 자신이면 바깥 어두운 곳(::backdrop)을 누른 것이다
  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    // 닫기는 키보드(Esc)와 닫기 버튼으로도 되므로, 바깥 클릭은 마우스·손가락용 보조 수단이다
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="modal-sheet"
      onClose={onClose}
      onClick={onBackdropClick}
    >
      <div className="flex max-h-[inherit] flex-col gap-3 pt-3">
        <SheetHandle />
        <div className="flex items-center justify-between gap-2 px-5">
          <div className="flex flex-col gap-0.5">
            <h2 id={titleId} className="text-title font-bold text-ink">
              {title}
            </h2>
            {subtitle && <p className="text-caption text-ink-soft">{subtitle}</p>}
          </div>
          <IconButton label="닫기" icon={<CloseIcon />} look="plain" onClick={onClose} />
        </div>
        {/*
          내용이 길면 이 부분만 스크롤된다. 제목과 닫기 버튼은 늘 보인다.
          tabIndex={0}: 안에 누를 것이 없는 긴 글(도착 순서 목록)도 키보드로 들어와 화살표 키로 스크롤할 수 있게 한다.
          포커스 링은 시트 가장자리에 잘리지 않게 안쪽(-3px)에 그린다. 흰 시트 안이라 흰 띠는 필요 없다.
        */}
        <div
          tabIndex={0}
          className="focus-ring min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(24px,env(safe-area-inset-bottom))] focus-visible:shadow-none focus-visible:[outline-offset:-3px]"
        >
          {children}
        </div>
      </div>
    </dialog>
  );
}
