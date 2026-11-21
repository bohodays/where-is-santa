"use client";

import type { Settings } from "@/lib/santa/settings";
import type { MapToneSetting } from "@/lib/santa/sun";
import { AttributionBox } from "./AttributionBox";
import { SegmentedControl } from "./SegmentedControl";
import { Switch } from "./Switch";

// 설정 시트의 내용(시안 5): 지도 밝기, 큰 글씨, 고대비, 움직임 줄이기, 맨 아래 출처.
// 바꾸면 바로 반영되고 이 기기에 저장된다(useSettings). 시트 제목 "설정"은 ModalSheet가 붙인다.
// 소리 켜기는 소리 기능을 만들 때 넣는다(기획서 2026-11-22 결정: 누를 때 아무 일도 없는 스위치는 두지 않는다).

const MAP_TONES = [
  { value: "auto", label: "자동" },
  { value: "day", label: "밝게" },
  { value: "night", label: "어둡게" },
] as const satisfies readonly { value: MapToneSetting; label: string }[];

const MAP_TONE_HELP: Record<MapToneSetting, string> = {
  auto: "자동: 우리 동네에 해가 지면 밤 지도로 바뀌어요.",
  day: "밝게: 늘 낮 지도로 보여요.",
  night: "어둡게: 늘 밤 지도로 보여요.",
};

type SettingsPanelProps = {
  settings: Settings;
  /** 움직임 줄이기가 실제로 켜져 있나(저장 값, 없으면 기기 설정) */
  reduceMotion: boolean;
  deviceReducedMotion: boolean;
  onChange: (patch: Partial<Omit<Settings, "reduceMotion">>) => void;
  onReduceMotionChange: (on: boolean) => void;
};

export function SettingsPanel({
  settings,
  reduceMotion,
  deviceReducedMotion,
  onChange,
  onReduceMotionChange,
}: SettingsPanelProps) {
  let motionHelp: string | undefined;
  if (deviceReducedMotion && settings.reduceMotion === null)
    motionHelp = "기기 설정을 따라 켜져 있어요";
  if (deviceReducedMotion && settings.reduceMotion === false)
    motionHelp = "기기 설정과 달리 꺼 두었어요";

  return (
    <div className="flex flex-col gap-5">
      <SegmentedControl
        label="지도 밝기"
        description={MAP_TONE_HELP[settings.mapTone]}
        options={MAP_TONES}
        value={settings.mapTone}
        onChange={(mapTone) => onChange({ mapTone })}
      />
      <div className="flex flex-col border-t border-line">
        <Switch
          label="큰 글씨"
          checked={settings.largeText}
          onCheckedChange={(largeText) => onChange({ largeText })}
        />
        <Switch
          label="고대비"
          checked={settings.highContrast}
          onCheckedChange={(highContrast) => onChange({ highContrast })}
        />
        <Switch
          label="움직임 줄이기"
          description={motionHelp}
          checked={reduceMotion}
          onCheckedChange={onReduceMotionChange}
        />
      </div>
      <AttributionBox />
    </div>
  );
}
