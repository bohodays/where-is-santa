"use client";

import { useId, useState } from "react";
import type { Home } from "@/lib/santa/home";
import {
  cleanGreeting,
  DEFAULT_GREETING,
  GREETING_MAX,
  greetingLength,
  shareCardText,
  sharePath,
} from "@/lib/santa/share";
import { Button } from "./Button";
import { ShareCardArt } from "./ShareCardArt";

// 공유 시트의 내용(시안 2 "친구에게 알려주기"): 카드 미리보기, 인사말(40자), 링크 복사, 메신저로 보내기.
// 시트 제목은 쓰는 쪽(ModalSheet)이 붙인다.
// 링크는 /s/<우리 동네>?m=<인사말>. 받는 사람은 자기 동네 기준으로 본다. 인사말은 주소에 담겨 미리보기 제목이 된다.

type ShareData = { title?: string; text?: string; url: string };

type SharePanelProps = {
  /** 카드에 넣을 동네(보내는 사람의 동네) */
  home: Pick<Home, "id" | "name" | "arriveUtc">;
  /** 사람이 직접 고른 동네인가. 아니면 기본 동네라는 안내와 "동네 고르기"를 보인다 */
  chosen: boolean;
  onPickHome: () => void;
  /** 링크 앞부분. 기본은 지금 주소(https://where-is-santa.vercel.app) */
  origin?: string;
  /** 스토리·시험용으로 바꿔 끼운다. 기본은 브라우저 클립보드 */
  copy?: (text: string) => Promise<void>;
  /** 스토리·시험용. 기본은 Web Share API(휴대폰 공유 창). 없는 브라우저면 "메신저로 보내기"를 숨긴다 */
  share?: ((data: ShareData) => Promise<void>) | null;
  /** 스토리용: 처음 인사말 */
  defaultGreeting?: string;
};

type Status = "idle" | "copied" | "copyFailed" | "shareFailed";

const STATUS_TEXT: Record<Status, string> = {
  idle: "",
  copied: "복사했어요. 메신저 대화창에 붙여 넣어 보내 주세요.",
  copyFailed: "복사하지 못했어요. 아래 주소를 길게 눌러 복사해 주세요.",
  shareFailed: "보내지 못했어요. 링크 복사로 보내 주세요.",
};

function browserCopy(text: string): Promise<void> {
  if (!navigator.clipboard) return Promise.reject(new Error("클립보드 없음"));
  return navigator.clipboard.writeText(text);
}

function browserShare(): ((data: ShareData) => Promise<void>) | null {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return null;
  return (data) => navigator.share(data);
}

/** 1200px 그림을 컨테이너 너비에 맞춰 줄인다(100cqw = 그림 너비) */
const toContainerWidth = (px: number) => `${((px / 1200) * 100).toFixed(3)}cqw`;
const SCREEN_FONTS = { display: "var(--font-display)", sans: "var(--font-sans)" };

export function SharePanel({
  home,
  chosen,
  onPickHome,
  origin,
  copy = browserCopy,
  share,
  defaultGreeting = DEFAULT_GREETING,
}: SharePanelProps) {
  const [greeting, setGreeting] = useState(defaultGreeting);
  const [status, setStatus] = useState<Status>("idle");
  // 시트가 열린 뒤에만 그려지므로(ModalSheet) 브라우저 값을 바로 읽어도 서버 렌더와 어긋나지 않는다
  const [shareFn] = useState(() => (share === undefined ? browserShare() : share));
  const [base] = useState(() => origin ?? window.location.origin);
  const greetingId = useId();
  const countId = useId();
  const noteId = useId();

  const length = greetingLength(greeting);
  const tooLong = length > GREETING_MAX;
  const cleaned = cleanGreeting(greeting);
  const url = base + sharePath(home.id, cleaned);
  const card = shareCardText(home.name, home.arriveUtc);

  const onCopy = () => {
    copy(url).then(
      () => setStatus("copied"),
      () => setStatus("copyFailed"),
    );
  };

  const onShare = () => {
    if (!shareFn) return;
    shareFn({ title: "산타 어디쯤", text: cleaned || undefined, url }).catch((error: unknown) => {
      // 공유 창에서 그냥 닫은 것은 실패가 아니다
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("shareFailed");
    });
  };

  return (
    <div className="flex flex-col gap-5 break-keep">
      <div className="flex flex-col gap-2">
        <p className="text-caption text-ink-soft">링크를 보내면 이렇게 보여요</p>
        <div className="overflow-hidden rounded-card border border-line">
          <div className="[container-type:inline-size]">
            <ShareCardArt {...card} u={toContainerWidth} fonts={SCREEN_FONTS} />
          </div>
          {/* 메신저가 그림 아래에 보여주는 제목(인사말)과 주소 */}
          <div className="flex flex-col gap-0.5 bg-surface-muted px-3.5 py-3">
            <p className="text-body font-bold text-ink">{cleaned || card.headline}</p>
            <p className="text-caption text-ink-soft">
              {new URL(base).host} · 받는 사람의 동네 기준으로 열려요
            </p>
          </div>
        </div>
        {!chosen && (
          <div className="flex flex-wrap items-center justify-between gap-x-3">
            <p className="text-caption text-ink-soft">지금은 기본 동네({home.name}) 카드예요.</p>
            <Button variant="quiet" onClick={onPickHome}>
              우리 동네 고르기
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={greetingId} className="text-body font-medium text-ink">
          인사말
        </label>
        {/* 16px 이상: 아이폰은 이보다 작은 입력창을 누르면 화면을 확대한다 */}
        <textarea
          id={greetingId}
          rows={2}
          value={greeting}
          onChange={(e) => {
            setGreeting(e.target.value);
            setStatus("idle"); // 링크가 바뀌었으니 "복사했어요"를 지운다
          }}
          aria-describedby={`${countId} ${noteId}`}
          aria-invalid={tooLong || undefined}
          className="focus-ring resize-none rounded-input border-[1.5px] border-border bg-surface px-3.5 py-3 text-body-lg text-ink focus:border-link aria-[invalid=true]:border-now"
        />
        <div className="flex items-start justify-between gap-3 text-caption">
          <p id={noteId} className="text-ink-soft">
            인사말은 링크에 담겨 받는 사람에게 보여요.
          </p>
          <p
            id={countId}
            className={`shrink-0 ${tooLong ? "font-bold text-now" : "text-ink-soft"}`}
          >
            {length} / {GREETING_MAX}자
          </p>
        </div>
        <p aria-live="polite" className="text-caption font-bold text-now empty:hidden">
          {tooLong ? `인사말은 ${GREETING_MAX}자까지 쓸 수 있어요.` : ""}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className={shareFn ? "grid grid-cols-2 gap-2.5" : "grid"}>
          <Button disabled={tooLong} onClick={onCopy}>
            링크 복사
          </Button>
          {shareFn && (
            <Button variant="secondary" disabled={tooLong} onClick={onShare}>
              메신저로 보내기
            </Button>
          )}
        </div>
        <p aria-live="polite" className="text-center text-caption text-ink-soft empty:hidden">
          {STATUS_TEXT[status]}
        </p>
        {status === "copyFailed" && (
          <input
            readOnly
            value={url}
            aria-label="공유 링크"
            onFocus={(e) => e.currentTarget.select()}
            className="focus-ring h-[50px] w-full rounded-input border-[1.5px] border-border bg-surface px-3.5 text-body text-ink"
          />
        )}
      </div>
    </div>
  );
}
