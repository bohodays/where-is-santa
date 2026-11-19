import type { ComponentPropsWithoutRef } from "react";

// 글자가 있는 버튼. 동작은 Button(<button>), 다른 화면·시트로 가는 것은 LinkButton(<a href>).
// 상태가 없는 컴포넌트라 'use client'가 없다. 클라이언트 컴포넌트 안에서 onClick과 함께 쓴다.

export type ButtonVariant = "primary" | "secondary" | "quiet";

const BASE =
  "focus-ring inline-flex items-center justify-center gap-2 text-center transition-[filter] active:brightness-95 " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-wait aria-disabled:opacity-70";

// 높이는 h-가 아니라 min-h-로 둔다. 큰 글씨 모드에서 글자가 두 줄이 되어도 버튼 밖으로 넘치지 않는다.
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "min-h-button rounded-button px-5 py-2 text-body-lg font-bold bg-action text-on-action",
  secondary:
    "min-h-button rounded-button px-5 py-2 text-body-lg font-bold border border-border bg-surface text-ink",
  quiet:
    "min-h-touch rounded-input px-1 text-body font-medium text-link underline underline-offset-4 hover:text-link-hover",
};

function buttonClass(variant: ButtonVariant, className?: string): string {
  return [BASE, VARIANTS[variant], className].filter(Boolean).join(" ");
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  /** 진행 중(복사 중 등). 다시 눌리지 않지만 포커스는 남는다. 글자는 쓰는 쪽에서 바꾼다("복사 중…") */
  busy?: boolean;
};

export function Button({
  variant = "primary",
  busy = false,
  type = "button",
  className,
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      // type 기본값을 "button"으로. 지정하지 않으면 form 안에서 "submit"이 되어 누를 때 폼이 제출된다
      type={type}
      className={buttonClass(variant, className)}
      // disabled는 포커스를 빼앗아 화면 낭독기 사용자가 위치를 잃는다. 진행 중에는 aria-disabled로 막는다
      aria-disabled={busy || undefined}
      aria-busy={busy || undefined}
      onClick={busy ? undefined : onClick}
    />
  );
}

type LinkButtonProps = ComponentPropsWithoutRef<"a"> & {
  href: string;
  variant?: ButtonVariant;
};

export function LinkButton({ variant = "quiet", className, ...rest }: LinkButtonProps) {
  return <a {...rest} className={buttonClass(variant, className)} />;
}
