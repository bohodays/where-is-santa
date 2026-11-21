"use client";

import { useId, useState } from "react";
import { formatKstTime } from "@/lib/santa/format";
import type { Home } from "@/lib/santa/home";
import {
  nearestNeighborhoods,
  OUTSIDE_KOREA_KM,
  searchNeighborhoods,
} from "@/lib/santa/neighborhood-search";
import type { Neighborhood } from "@/lib/santa/neighborhoods";
import { Button } from "./Button";
import { CheckIcon, MapPinIcon, SearchIcon } from "./icons";

// 동네 고르기 시트의 내용(시안 4): 시·군·구 검색(초성), 결과마다 도착 시각, "내 위치로 찾기", 저장 안내.
// 시트 제목("우리 동네 고르기")은 쓰는 쪽(ModalSheet)이 붙인다.
// 고른 동네는 쓰는 쪽(useHome)이 이 기기에만 저장한다. 위치는 가까운 동네를 찾는 데만 쓰고 어디에도 보내지 않는다.

export type LocateFailure = "denied" | "unavailable";
/** 위치 찾기 실패. 권한 거부와 그 밖(위치 없음·시간 초과·지원 안 함)만 나눈다 */
export class LocateError extends Error {
  constructor(readonly reason: LocateFailure) {
    super(reason);
  }
}

/** 브라우저 위치(Geolocation API). 정확도는 낮게(시군구만 알면 된다), 10분 안의 값은 다시 쓴다 */
export function locateWithBrowser(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new LocateError("unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => reject(new LocateError(e.code === e.PERMISSION_DENIED ? "denied" : "unavailable")),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
    );
  });
}

type LocateState =
  | { kind: "idle" }
  | { kind: "finding" }
  | { kind: "found"; lat: number; lon: number }
  | { kind: "failed"; reason: LocateFailure };

type NeighborhoodPickerProps = {
  now: number | null;
  /** 지금 동네(고르기 전이면 기본 동네 서울 중구) */
  home: Home;
  /** 사람이 직접 고른 동네인가 */
  chosen: boolean;
  /** 시군구 목록. 따로 불러오므로(useNeighborhoods) 아직 없으면 null */
  neighborhoods: Neighborhood[] | null;
  loadFailed?: boolean;
  onPick: (n: Neighborhood) => void;
  /** 스토리·시험용으로 바꿔 끼운다. 기본은 브라우저 위치 */
  locate?: () => Promise<{ lat: number; lon: number }>;
  /** 스토리용: 처음 검색어 */
  defaultQuery?: string;
};

export function NeighborhoodPicker({
  now,
  home,
  chosen,
  neighborhoods,
  loadFailed = false,
  onPick,
  locate = locateWithBrowser,
  defaultQuery = "",
}: NeighborhoodPickerProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [located, setLocated] = useState<LocateState>({ kind: "idle" });
  const inputId = useId();
  const hintId = useId();

  const findMe = () => {
    setLocated({ kind: "finding" });
    locate().then(
      ({ lat, lon }) => {
        setQuery(""); // 검색 결과 대신 위치 결과를 보인다
        setLocated({ kind: "found", lat, lon });
      },
      (error: unknown) =>
        setLocated({
          kind: "failed",
          reason: error instanceof LocateError ? error.reason : "unavailable",
        }),
    );
  };

  // 보여줄 목록과 그 위 안내 글자(화면 낭독기가 읽는다)
  let heading: string;
  let items: { n: Neighborhood; note?: string }[] = [];
  const searching = query.trim() !== "";
  const nearby =
    located.kind === "found" && neighborhoods ? nearestNeighborhoods(located, neighborhoods) : null;
  const outside = nearby !== null && nearby[0].km > OUTSIDE_KOREA_KM;

  if (loadFailed) {
    heading = "동네 목록을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.";
  } else if (!neighborhoods) {
    heading = "동네 목록을 불러오는 중…";
  } else if (searching) {
    const found = searchNeighborhoods(query, neighborhoods);
    heading = found.length > 0 ? `찾은 동네 ${found.length}곳` : "찾는 동네가 없어요";
    items = found.map((n) => ({ n }));
  } else if (nearby && !outside) {
    heading = `내 위치에서 가까운 동네 ${nearby.length}곳`;
    items = nearby.map(({ neighborhood, km }) => ({
      n: neighborhood,
      note: `내 위치에서 ${km < 1 ? "1km 안" : `약 ${Math.round(km)}km`}`,
    }));
  } else {
    heading = chosen ? "지금 고른 동네" : "지금은 기본 동네(서울 중구) 기준이에요";
    const current = neighborhoods.find((n) => n.id === home.id);
    items = current ? [{ n: current }] : [];
  }

  let locateMessage: string | null = null;
  if (located.kind === "failed") {
    locateMessage =
      located.reason === "denied"
        ? "위치 권한이 꺼져 있어요. 이름으로 찾아 주세요."
        : "위치를 찾지 못했어요. 이름으로 찾아 주세요.";
  } else if (outside) {
    locateMessage = "한국 밖에 있는 것 같아요. 이름으로 찾아 주세요.";
  }

  return (
    <div className="flex flex-col gap-4 break-keep">
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-body font-medium text-ink">
          시·군·구 이름
        </label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          {/* 16px 이상: 아이폰은 이보다 작은 입력창을 누르면 화면을 확대한다 */}
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-describedby={hintId}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            className="focus-ring h-[50px] w-full rounded-input border-[1.5px] border-border bg-surface pl-11 pr-3.5 text-body-lg text-ink focus:border-link"
          />
        </div>
        <p id={hintId} className="text-caption text-ink-soft">
          첫 글자만 써도 찾아요. 예: ㅁㅍ → 마포구
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {/* 결과 수가 바뀌면 화면 낭독기가 읽는다("찾은 동네 2곳") */}
        <p aria-live="polite" className="text-caption text-ink-soft">
          {heading}
        </p>
        {/*
          결과 칸은 3줄 높이(56px × 3 + 사이 8px × 2 = 11.5rem)를 늘 잡아 둔다. 결과가 0~3곳 사이로 바뀌는 동안
          아래 "내 위치로 찾기"가 위아래로 튀지 않는다. 큰 글씨에서도 같이 커지게 rem으로 둔다
        */}
        <div className="min-h-[11.5rem]">
          {items.length > 0 && (
            <ul className="flex flex-col gap-2">
              {items.map(({ n, note }) => {
                const selected = n.id === home.id;
                const detail = selected
                  ? chosen
                    ? "지금 고른 동네"
                    : "기본 동네"
                  : (note ??
                    (now === null ? null : `산타 도착 ${formatKstTime(n.arriveUtc, now)}`));
                return (
                  // list-enter: 새로 생긴 동네만 서서히 나타난다(globals.css). key가 id라 남아 있는 동네는 다시 움직이지 않는다
                  <li key={n.id} className="list-enter">
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onPick(n)}
                      className={`focus-ring flex min-h-14 w-full items-center justify-between gap-2 rounded-button px-4 py-2 text-left text-ink ${
                        selected
                          ? "border-2 border-ink bg-surface-muted"
                          : "border-[1.5px] border-border bg-surface"
                      }`}
                    >
                      <span className="flex flex-col gap-0.5">
                        <span className={`text-body-lg ${selected ? "font-bold" : "font-medium"}`}>
                          {n.name}
                        </span>
                        <span className="text-caption text-ink-soft">
                          {n.sido}
                          {detail && ` · ${detail}`}
                        </span>
                      </span>
                      {selected && <CheckIcon className="shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-caption text-ink-soft" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        또는
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="secondary"
          className="w-full font-medium"
          busy={located.kind === "finding"}
          onClick={findMe}
        >
          <MapPinIcon aria-hidden="true" />
          {located.kind === "finding" ? "위치 찾는 중…" : "내 위치로 찾기"}
        </Button>
        <p aria-live="polite" className="text-center text-caption text-ink-soft">
          {locateMessage}
        </p>
      </div>

      <p className="text-center text-caption text-ink-soft">
        고른 동네는 이 기기에만 저장돼요.
        <br />
        위치를 쓸 때도 가까운 시·군·구만 찾고 보내지 않아요.
      </p>
    </div>
  );
}
