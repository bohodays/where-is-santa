"use client";

import { useId } from "react";

// 켜기/끄기 한 줄(설정 시안 5): 왼쪽 이름(+ 설명), 오른쪽 스위치.
// <button role="switch" aria-checked>: 화면 낭독기가 "큰 글씨, 스위치, 꺼짐"처럼 읽는다. 이름은 옆 글자(aria-labelledby).
// 켜짐/꺼짐은 색만이 아니라 동그라미 위치로도 알 수 있다. 꺼짐 색은 흰 바탕과 3:1 이상(토큰 테스트).

type SwitchProps = {
  label: string;
  /** 이름 아래 작은 글자. 예) "기기 설정을 따라 켜져 있어요" */
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function Switch({ label, description, checked, onCheckedChange }: SwitchProps) {
  const labelId = useId();
  const descriptionId = useId();
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 border-b border-line py-1.5">
      <span className="flex flex-col gap-0.5 break-keep">
        <span id={labelId} className="text-body-lg text-ink">
          {label}
        </span>
        {description && (
          <span id={descriptionId} className="text-caption text-ink-soft">
            {description}
          </span>
        )}
      </span>
      {/* 누르는 칸은 44px 높이, 보이는 막대는 32px */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={() => onCheckedChange(!checked)}
        className="focus-ring flex h-touch w-[52px] shrink-0 items-center rounded-pill"
      >
        <span
          aria-hidden="true"
          className={`flex h-8 w-full items-center rounded-pill p-[3px] transition-colors ${
            checked ? "justify-end bg-ink" : "justify-start bg-switch-off"
          }`}
        >
          <span className="size-[26px] rounded-pill bg-surface shadow-float" />
        </span>
      </button>
    </div>
  );
}
