import type { ComponentPropsWithoutRef, ReactNode } from "react";

// 아이콘만 있는 버튼(설정, 시트 닫기). 글자가 없으니 label이 화면 낭독기에 읽히는 이름이 된다(CLAUDE.md: aria-label 필수).
// label을 필수 prop으로 두어, 빠뜨리면 타입 검사에서 걸린다.

type IconButtonProps = Omit<ComponentPropsWithoutRef<"button">, "aria-label" | "children"> & {
  /** 버튼 이름. 예) "설정", "닫기" */
  label: string;
  /** 아이콘(icons.tsx). 아이콘은 aria-hidden이다 */
  icon: ReactNode;
  /** float: 지도 위에 떠 있는 흰 원(그림자). plain: 시트 안(바탕 없음) */
  look?: "float" | "plain";
};

const LOOKS = {
  float: "bg-surface shadow-float",
  plain: "bg-transparent hover:bg-surface-muted",
};

export function IconButton({
  label,
  icon,
  look = "float",
  type = "button",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      className={[
        "focus-ring inline-flex h-touch w-touch shrink-0 items-center justify-center rounded-pill text-ink",
        "transition-[filter] active:brightness-95",
        LOOKS[look],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon}
    </button>
  );
}
