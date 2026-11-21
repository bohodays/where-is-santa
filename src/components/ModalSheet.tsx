"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type TransitionEvent,
} from "react";
import { SheetHandle } from "./BottomSheet";
import { IconButton } from "./IconButton";
import { CloseIcon } from "./icons";

// 모달형 바텀시트: 도착 순서, 동네 고르기, 설정 등. 브라우저의 <dialog>를 showModal()로 연다.
// <dialog>가 해 주는 것(직접 만들지 않는다):
// - 뒤 화면을 조작할 수 없게 막는다(inert). 포커스가 시트 밖으로 나가지 않는다
// - 열 때 시트 안 첫 번째 버튼(닫기)으로 포커스를 옮기고, 닫으면 연 버튼으로 포커스를 돌려준다
// - Esc로 닫힌다. role="dialog"와 모달이라는 정보가 화면 낭독기에 전해진다
// 모양과 애니메이션은 globals.css의 .modal-sheet.

/** 닫히는 애니메이션(globals.css .modal-sheet, 0.3초)보다 조금 길게. transitionend가 안 올 때만 쓴다 */
const CLOSE_FALLBACK_MS = 400;

type ModalSheetProps = {
  open: boolean;
  /** 닫기 버튼, Esc, 바깥(어두운 곳) 누르기 모두 여기로 온다. 여기서 open을 false로 바꾼다 */
  onClose: () => void;
  title: string;
  /** 제목 아래 작은 글자. 예) "한국 시각 기준" */
  subtitle?: string;
  /** 열려 있을 때와 닫히며 내려가는 동안만 그린다 */
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

  // 휴대폰 "뒤로 가기"로 시트를 닫는다(결정 2026-11-22).
  // 열 때 방문 기록에 한 칸을 더하고(주소는 그대로), 뒤로 가기(popstate)가 오면 그 칸이 빠진 것이니 닫는다.
  // 버튼·Esc·바깥으로 닫으면 더한 칸을 history.back()으로 되돌려, 다음 뒤로 가기가 페이지를 제대로 떠나게 한다.
  // 열림 → 닫힘이 바뀔 때만 다룬다. 화면에 붙을 때·떨어질 때 다루면, 개발 모드(StrictMode)가 effect를 두 번 돌려
  // 더하고 되돌리기가 엇갈려 시트가 열리자마자 닫힌다.
  const pushedRef = useRef(false); // 방문 기록에 칸을 더해 두었나
  const closingByBackRef = useRef(false); // 뒤로 가기로 닫는 중인가(그러면 history.back()을 또 하지 않는다)
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open && !pushedRef.current) {
      window.history.pushState(window.history.state, "");
      pushedRef.current = true;
    }
    if (!open && pushedRef.current) {
      pushedRef.current = false;
      if (!closingByBackRef.current) window.history.back();
      closingByBackRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    const onBack = () => {
      if (!pushedRef.current) return; // 우리가 더한 칸이 아니다(다른 이유의 뒤로 가기)
      closingByBackRef.current = true;
      onCloseRef.current();
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, []);

  // 내용은 열려 있을 때와 닫히며 내려가는 동안만 그린다.
  // - 닫혀 있는 동안 그리지 않으면 1초마다 목록을 다시 계산하지 않고, 다시 열 때 처음 모습(지금 줄로 스크롤)부터 보인다
  // - 닫기를 누르자마자 지우면 시트가 제목 줄 높이(114px)로 줄어든 채 내려가 "순식간에" 사라져 보였다(2026-11-21)
  const [closing, setClosing] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    // 렌더링 중에 이전 값과 비교해 바로 맞춘다(effect를 거치면 한 번 비어 있는 화면이 그려진다)
    setPrevOpen(open);
    setClosing(!open);
  }
  // 내려가기가 끝나면(transitionend) 내용을 지운다. 애니메이션이 없는 브라우저는 이 이벤트가 오지 않아 시간으로도 지운다
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => setClosing(false), CLOSE_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [closing]);
  const onTransitionEnd = (event: TransitionEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget && event.propertyName === "transform" && !open) {
      setClosing(false);
    }
  };

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
      onTransitionEnd={onTransitionEnd}
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
          {(open || closing) && children}
        </div>
      </div>
    </dialog>
  );
}
