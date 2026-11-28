import { ImageResponse } from "next/og";

// 아이폰 "홈 화면에 추가" 아이콘(180×180 PNG). 아이폰은 SVG 아이콘(icon.svg)을 쓰지 않는다.
// 아이폰이 모서리를 둥글게 깎으므로 꽉 찬 사각형 바탕(밤색) 위에 산타 표시를 그린다. 빌드 때 한 번 만든다.

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#0b1830",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 128,
            height: 128,
            borderRadius: 128,
            backgroundColor: "#d6453b",
            border: "6px solid #ffffff",
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: 72, height: 72 }}>
            <path d="M5 17 L12 4 L19 17 Z" fill="#ffffff" />
            <rect x="4" y="16" width="16" height="4" rx="2" fill="#ffffff" />
            <circle cx="12" cy="3.6" r="2" fill="#ffffff" />
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
