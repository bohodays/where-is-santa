"use client";

import { useState } from "react";
import {
  DEFAULT_DEMO_SPEED,
  DEMO_SPEEDS,
  demoSpeedLabel,
  nearestDemoSpeed,
  type DemoSpeed,
} from "@/lib/santa/clock";
import { Button } from "./Button";
import { SegmentedControl } from "./SegmentedControl";

// 데모 시트의 내용(시안 "3. 시즌 전 — 데모 모드"). 시트 제목은 ModalSheet가 붙인다("미리 체험해 보기"/"데모 모드").
// - 데모 전: 시간 흐름을 고르고 "이브 밤으로 시간 이동". 우리 동네 도착 20분 전으로 간다(결정 2026-11-22)
// - 데모 중: 시간 흐름을 바꾸면 바로 반영된다(지금 데모 시각에서 이어서). 처음부터 다시 보기, 데모 끝내기
// 시계를 바꾸는 일은 쓰는 쪽(MainScreen → useNow)이 한다. 여기서는 고른 값을 알려 주기만 한다.

const SPEED_OPTIONS = DEMO_SPEEDS.map((s) => ({
  value: String(s) as `${DemoSpeed}`,
  label: demoSpeedLabel(s),
}));

type DemoPanelProps = {
  /** 데모 중이면 지금 배속, 아니면 null */
  activeSpeed: number | null;
  /** 우리 동네 이름. 아직 모르면 null */
  homeName: string | null;
  /** 이브 밤(우리 동네 도착 20분 전)으로 시간 이동. 데모 중에는 "처음부터 다시 보기" */
  onStart: (speed: DemoSpeed) => void;
  /** 데모 중 배속 바꾸기 */
  onSpeedChange: (speed: DemoSpeed) => void;
  /** 데모 끝내기(지금 시각으로) */
  onStop: () => void;
};

export function DemoPanel({
  activeSpeed,
  homeName,
  onStart,
  onSpeedChange,
  onStop,
}: DemoPanelProps) {
  const active = activeSpeed !== null;
  // 데모 전에는 고른 값을 여기서 기억했다가 "시간 이동"을 누를 때 쓴다
  const [picked, setPicked] = useState<DemoSpeed>(DEFAULT_DEMO_SPEED);
  const speed = active ? nearestDemoSpeed(activeSpeed) : picked;
  const where = homeName ?? "우리 동네";

  return (
    <div className="flex flex-col gap-5">
      <p className="text-body text-ink-soft">
        {active
          ? "지금은 데모 시각이에요. 시간 흐름을 바꾸거나 처음부터 다시 볼 수 있어요."
          : `크리스마스이브 밤, 산타가 ${where}에 오기 20분 전으로 시간을 옮겨요.`}
      </p>
      <SegmentedControl
        label="시간 흐름"
        options={SPEED_OPTIONS}
        value={`${speed}`}
        onChange={(value) => {
          const next = Number(value) as DemoSpeed;
          if (active) onSpeedChange(next);
          else setPicked(next);
        }}
      />
      <div className="flex flex-col gap-3">
        <Button onClick={() => onStart(speed)}>
          {active ? "처음부터 다시 보기" : "이브 밤으로 시간 이동"}
        </Button>
        {active && (
          <Button variant="secondary" onClick={onStop}>
            데모 끝내기
          </Button>
        )}
        <p className="text-center text-caption text-ink-soft">
          {active
            ? "데모를 끝내면 지금 시각으로 돌아와요."
            : "체험 중에는 화면 위에 '데모 모드'가 표시돼요."}
        </p>
      </div>
    </div>
  );
}
