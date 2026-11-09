// MapLibre 워커 파일을 public/으로 복사한다. (dev·build 전에 자동 실행)
// webpack을 거치면 MapLibre가 워커 주소를 스스로 찾지 못해서, 정적 파일로 두고 setWorkerUrl로 알려준다.
// 파일 이름에 버전을 넣어 CDN 캐시가 버전마다 갈리게 한다.
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgDir = join(root, 'node_modules', 'maplibre-gl');
const { version } = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
const outDir = join(root, 'public', 'maplibre');
const outName = `maplibre-gl-worker-${version}.js`;

mkdirSync(outDir, { recursive: true });
for (const old of readdirSync(outDir)) {
  if (old !== outName) rmSync(join(outDir, old));
}
copyFileSync(join(pkgDir, 'dist', 'maplibre-gl-worker.mjs'), join(outDir, outName));
console.log(`MapLibre 워커 복사: public/maplibre/${outName}`);
