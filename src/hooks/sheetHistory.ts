// 모달 시트(ModalSheet)가 "뒤로 가기로 닫기"를 위해 방문 기록에 더한 칸이 지금 맨 위에 있는지 센다.
// 그 칸이 맨 위에 있는 동안 주소를 바꾸면(replaceState), 시트를 닫을 때 그 칸이 빠지면서 바꾼 주소도 사라진다.
// 그래서 주소를 바꾸는 쪽(useNow의 데모 주소)은 이 수가 0이 될 때까지 기다린다.
// history.state에 표시를 남기지 않고 메모리에 센다: 표시는 새로고침해도 남아서, 시트가 없는데도 "열려 있다"로 보였다.

let pushed = 0;

/** 시트가 방문 기록에 칸을 더했다 */
export function sheetEntryPushed(): void {
  pushed += 1;
}

/** 시트가 더한 칸이 빠진다(history.back() 또는 뒤로 가기) */
export function sheetEntryPopped(): void {
  pushed = Math.max(0, pushed - 1);
}

/** 시트가 더한 칸이 맨 위에 있나 */
export function sheetEntryOnTop(): boolean {
  return pushed > 0;
}
