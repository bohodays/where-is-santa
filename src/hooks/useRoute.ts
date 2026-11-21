"use client";

import { useEffect, useState } from "react";
import { buildRoute, type Stop } from "@/lib/santa/route";
import { ROUTE_YEAR } from "@/lib/santa/route-summary";

/*
 * 전체 경로(661곳)를 필요할 때만 불러온다. 첫 화면 JS에 넣지 않아 공개 전 방문(북극 마을 화면)이 가볍다.
 * import()로 부르면 Next.js(webpack)가 stops.ts와 데이터를 별도 파일(chunk)로 나누고, 이 줄이 실행될 때 받는다.
 * 페이지 안에서 한 번만 받는다(promise를 모듈 변수에 둔다). 실패하면 다음에 다시 시도할 수 있게 비운다.
 */
let loading: Promise<Stop[]> | null = null;

function loadRoute(): Promise<Stop[]> {
  loading ??= import("@/lib/santa/stops")
    .then(({ STOPS }) => buildRoute(STOPS, ROUTE_YEAR))
    .catch((error: unknown) => {
      loading = null;
      throw error;
    });
  return loading;
}

export type RouteState =
  | { status: "idle" } // 아직 부르지 않음
  | { status: "loading" }
  | { status: "ready"; route: Stop[] }
  | { status: "failed" }; // 네트워크 끊김 등. 글자(카운트다운)는 그대로 쓸 수 있다

/** shouldLoad가 true가 되면 전체 경로를 불러온다. 한 번 불러오면 false로 바뀌어도 그대로 둔다 */
export function useRoute(shouldLoad: boolean): RouteState {
  const [state, setState] = useState<RouteState>({ status: "idle" });

  useEffect(() => {
    if (!shouldLoad) return;
    let alive = true; // 다 받기 전에 화면이 사라지면 상태를 바꾸지 않는다
    // 함수형 업데이트: 이미 받아 둔 경로가 있으면 그대로 둔다("불러오는 중"으로 깜빡이지 않게)
    setState((prev) => (prev.status === "ready" ? prev : { status: "loading" }));
    loadRoute().then(
      (route) => alive && setState({ status: "ready", route }),
      () => alive && setState({ status: "failed" }),
    );
    return () => {
      alive = false;
    };
  }, [shouldLoad]);

  return state;
}
