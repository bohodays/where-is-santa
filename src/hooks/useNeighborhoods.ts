"use client";

import { useEffect, useState } from "react";
import type { Neighborhood } from "@/lib/santa/neighborhoods";

/*
 * 동네 고르기 목록(시군구 256곳)을 시트를 열 때만 불러온다. 첫 화면 JS에 넣지 않는다(useRoute와 같은 방법).
 * 페이지 안에서 한 번만 받고, 실패하면 다음에 다시 시도할 수 있게 비운다.
 */
let loading: Promise<Neighborhood[]> | null = null;

function loadNeighborhoods(): Promise<Neighborhood[]> {
  loading ??= import("@/lib/santa/neighborhoods")
    .then(({ NEIGHBORHOODS }) => NEIGHBORHOODS)
    .catch((error: unknown) => {
      loading = null;
      throw error;
    });
  return loading;
}

export type NeighborhoodsState =
  | { status: "idle" | "loading" | "failed" }
  | { status: "ready"; neighborhoods: Neighborhood[] };

/** shouldLoad가 true가 되면 목록을 불러온다. 한 번 불러오면 그대로 둔다 */
export function useNeighborhoods(shouldLoad: boolean): NeighborhoodsState {
  const [state, setState] = useState<NeighborhoodsState>({ status: "idle" });

  useEffect(() => {
    if (!shouldLoad) return;
    let alive = true;
    setState((prev) => (prev.status === "ready" ? prev : { status: "loading" }));
    loadNeighborhoods().then(
      (neighborhoods) => alive && setState({ status: "ready", neighborhoods }),
      () => alive && setState({ status: "failed" }),
    );
    return () => {
      alive = false;
    };
  }, [shouldLoad]);

  return state;
}
