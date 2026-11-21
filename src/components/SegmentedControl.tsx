"use client";

import { useId, useRef, type KeyboardEvent } from "react";

// 하나만 고르는 짧은 선택지(설정의 지도 밝기, 데모 속도).
// 라디오 그룹: Tab으로 그룹에 들어오면 고른 칸에 포커스가 가고, 화살표 키로 옮기면 바로 고른다(브라우저 라디오 버튼과 같다).
// 고른 칸은 진한 바탕 + 굵은 글자(색만으로 구분하지 않는다).

export type SegmentOption<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  label: string;
  /** 아래 작은 글자. 예) "자동: 우리 동네에 해가 지면 밤 지도로 바뀌어요." */
  description?: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  label,
  description,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const labelId = useId();
  const descriptionId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    const index = options.findIndex((o) => o.value === value);
    let next: number | null = null;
    if (step !== undefined) next = (index + step + options.length) % options.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = options.length - 1;
    if (next === null) return;
    event.preventDefault(); // 화살표로 화면이 스크롤되지 않게
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-body font-bold text-ink">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        onKeyDown={onKeyDown}
        className="grid auto-cols-fr grid-flow-col overflow-hidden rounded-input border-[1.5px] border-border"
      >
        {options.map((o, i) => {
          const selected = o.value === value;
          return (
            <button
              key={o.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              // 고른 칸만 Tab으로 들어간다. 나머지는 화살표로.
              // 포커스 링은 묶음 테두리에 잘리지 않게 칸 안쪽에 그린다. 고른 칸(진한 바탕)에서도 보이게 바깥쪽에 흰 띠를 둔다
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(o.value)}
              className={`focus-ring min-h-[46px] px-2 text-body focus-visible:shadow-[inset_0_0_0_2px_var(--color-focus-halo)] focus-visible:[outline-offset:-5px] ${
                i > 0 ? "border-l-[1.5px] border-border" : ""
              } ${selected ? "bg-ink font-bold text-surface" : "bg-surface text-ink"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {description && (
        <p id={descriptionId} className="text-caption text-ink-soft">
          {description}
        </p>
      )}
    </div>
  );
}
