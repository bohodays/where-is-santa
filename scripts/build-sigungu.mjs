// SGIS 경계(SHP)로 국내 시군구 대표 좌표 파일(src/lib/santa/sigungu.ts)을 만든다.
//
// 실행: node scripts/build-sigungu.mjs [SGIS 폴더 경로, 기본 ./SGIS]
// - 원본: 공공데이터포털 "국가데이터처_SGIS 행정구역 통계 및 경계" (이용허락범위 제한 없음)
//   https://www.data.go.kr/data/15129688/fileData.do  — SGIS 폴더는 저장소에 올리지 않는다(.gitignore)
// - 변환 도구: mapshaper(MPL-2.0)를 npx로 한 번 실행한다. 프로젝트 의존성에는 넣지 않는다.
// - 대표점: 가장 큰 영역 안쪽의 점(mapshaper -points inner). 섬이 많은 군은 가장 큰 섬 위에 찍힌다.
// - 기준 시점 이후 변경은 scripts/sigungu-changes.json에 적고, 새 구는 행정동 경계를 묶어 계산한다.
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAPSHAPER = 'mapshaper@0.7.97';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sgisDir = process.argv[2] ?? join(root, 'SGIS');
const changes = JSON.parse(readFileSync(join(root, 'scripts', 'sigungu-changes.json'), 'utf8'));
const outFile = join(root, 'src', 'lib', 'santa', 'sigungu.ts');

function findFile(pattern) {
  const boundaryDir = join(sgisDir, readdirSync(sgisDir).find((d) => d.includes('경계')) ?? '');
  for (const sub of readdirSync(boundaryDir)) {
    const dir = join(boundaryDir, sub);
    const hit = readdirSync(dir).find((f) => pattern.test(f));
    if (hit) return { dir, file: join(dir, hit), name: hit };
  }
  throw new Error(`SGIS 폴더에서 파일을 찾지 못함: ${pattern}`);
}

const q = (s) => `"${s}"`;
function mapshaper(args) {
  execSync(`npx -y ${MAPSHAPER} ${args.join(' ')}`, { stdio: ['ignore', 'ignore', 'inherit'], shell: true });
}

/** 점 GeoJSON을 [{props, lon, lat}]로 */
function readPoints(path) {
  const geo = JSON.parse(readFileSync(path, 'utf8'));
  return geo.features.map((f) => {
    if (f.geometry?.type !== 'Point') throw new Error(`점이 아닌 도형: ${JSON.stringify(f.properties)}`);
    const [lon, lat] = f.geometry.coordinates;
    return { props: f.properties, lon, lat };
  });
}

const sido = findFile(/^bnd_sido_.*\.shp$/i);
const sigungu = findFile(/^bnd_sigungu_.*\.shp$/i);
const dong = findFile(/^bnd_dong_.*\.shp$/i);
const baseDate = sigungu.name.match(/(\d{4}_\d)Q/)?.[1]?.replace('_', '년 ') + '분기';

const work = mkdtempSync(join(tmpdir(), 'sigungu-'));
try {
  // 1) 시도 이름표
  mapshaper(['-i', q(sido.file.replace(/\.shp$/i, '.dbf')), 'encoding=utf8', '-o', q(join(work, 'sido.json')), 'format=json']);
  const sidoNames = Object.fromEntries(JSON.parse(readFileSync(join(work, 'sido.json'), 'utf8')).map((r) => [r.SIDO_CD, r.SIDO_NM]));

  // 2) 시군구 대표점 (UTM-K에서 안쪽 점을 구한 뒤 위경도로)
  mapshaper(['-i', q(sigungu.file), 'encoding=utf8', '-points', 'inner', '-proj', 'wgs84', '-o', q(join(work, 'sigungu.geojson')), 'format=geojson']);
  const basePoints = readPoints(join(work, 'sigungu.geojson'));

  // 3) 새 구: 행정동을 묶어서 대표점
  const groups = changes.changes.flatMap((c) => c.add);
  const mappingCsv = ['ADM_CD,GROUP_ID', ...groups.flatMap((g) => g.dongs.map((d) => `${d},${g.id}`))].join('\n');
  writeFileSync(join(work, 'mapping.csv'), mappingCsv);
  mapshaper([
    '-i', q(dong.file), 'encoding=utf8',
    '-join', q(join(work, 'mapping.csv')), 'keys=ADM_CD,ADM_CD', 'field-types=ADM_CD:str',
    '-filter', q('!!GROUP_ID'), // 새 구에 들어가는 행정동만 남긴다 (참·거짓을 돌려줘야 한다)
    '-dissolve', 'GROUP_ID',
    '-points', 'inner', '-proj', 'wgs84',
    '-o', q(join(work, 'groups.geojson')), 'format=geojson',
  ]);
  const groupPoints = new Map(readPoints(join(work, 'groups.geojson')).map((p) => [p.props.GROUP_ID, p]));

  // 4) 검증: 없어지는 시군구의 행정동이 새 구에 빠짐없이 한 번씩 들어갔는지
  mapshaper(['-i', q(dong.file.replace(/\.shp$/i, '.dbf')), 'encoding=utf8', '-o', q(join(work, 'dong.json')), 'format=json']);
  const allDongs = JSON.parse(readFileSync(join(work, 'dong.json'), 'utf8')).map((r) => r.ADM_CD);
  const baseCodes = new Set(basePoints.map((p) => p.props.SIGUNGU_CD));
  for (const change of changes.changes) {
    for (const code of change.remove) if (!baseCodes.has(code)) throw new Error(`[${change.title}] 없는 시군구 코드: ${code}`);
    const expected = allDongs.filter((d) => change.remove.some((code) => d.startsWith(code))).sort();
    const assigned = change.add.flatMap((g) => g.dongs).sort();
    if (new Set(assigned).size !== assigned.length) throw new Error(`[${change.title}] 두 번 들어간 행정동이 있음`);
    if (expected.join() !== assigned.join()) {
      const missing = expected.filter((d) => !assigned.includes(d));
      const extra = assigned.filter((d) => !expected.includes(d));
      throw new Error(`[${change.title}] 행정동 배정이 맞지 않음. 빠짐: ${missing} / 남는 것: ${extra}`);
    }
    for (const g of change.add) if (!groupPoints.has(g.id)) throw new Error(`대표점을 못 구함: ${g.id}`);
  }

  // 5) 합치고 검사한 뒤 파일로
  const removed = new Set(changes.changes.flatMap((c) => c.remove));
  const round = (v) => Math.round(v * 10000) / 10000; // 약 11m. 도착 시각에는 0.01도(2.4초)도 충분하다
  const rows = [
    ...basePoints
      .filter((p) => !removed.has(p.props.SIGUNGU_CD))
      .map((p) => ({ id: p.props.SIGUNGU_CD, sido: p.props.SIGUNGU_CD.slice(0, 2), name: p.props.SIGUNGU_NM, lat: p.lat, lon: p.lon })),
    ...groups.map((g) => ({ id: g.id, sido: g.sido, name: g.name, lat: groupPoints.get(g.id).lat, lon: groupPoints.get(g.id).lon })),
  ]
    .map((r) => ({ id: r.id, sido: sidoNames[r.sido], name: r.name, lat: round(r.lat), lon: round(r.lon) }))
    .sort((a, b) => a.sido.localeCompare(b.sido, 'ko') || a.name.localeCompare(b.name, 'ko'));

  const expectedCount = basePoints.length - removed.size + groups.length;
  if (rows.length !== expectedCount) throw new Error(`개수가 맞지 않음: ${rows.length} (예상 ${expectedCount})`);
  for (const r of rows) {
    if (!r.sido) throw new Error(`시도 이름 없음: ${r.id}`);
    if (!(r.lat > 33 && r.lat < 38.7 && r.lon > 124.5 && r.lon < 132)) throw new Error(`한국 밖 좌표: ${r.id} ${r.lat},${r.lon}`);
  }

  const lines = rows.map(
    (r) => `  { id: '${r.id}', sido: '${r.sido}', name: '${r.name}', lat: ${r.lat}, lon: ${r.lon} },`,
  );
  const header = `// 자동 생성 파일. 직접 고치지 말고 scripts/build-sigungu.mjs를 실행한다.
// 원본: 국가데이터처 SGIS 행정구역 경계 ${baseDate} 기준 (공공데이터포털, 이용허락범위 제한 없음)
// 기준 시점 이후 변경: ${changes.changes.map((c) => `${c.effective} ${c.title}`).join(' / ')}
// 좌표: 시군구 영역 안쪽의 대표점(WGS84). 섬이 많은 군은 가장 큰 섬 위에 있다.

export type Sigungu = {
  id: string; // SGIS 시군구 코드. 기준 시점 이후 새로 생긴 구는 'x-'로 시작한다
  sido: string; // 시도 이름
  name: string; // 시군구 이름. 일반구는 '수원시 장안구'처럼 시 이름을 붙인다
  lat: number;
  lon: number;
};

export const SIGUNGU: Sigungu[] = [
`;
  writeFileSync(outFile, `${header}${lines.join('\n')}\n];\n`);
  console.log(`시군구 ${rows.length}곳 → ${outFile.replace(root, '.')}`);
} finally {
  if (existsSync(work)) rmSync(work, { recursive: true, force: true });
}
