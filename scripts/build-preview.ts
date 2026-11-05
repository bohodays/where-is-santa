// src/*.ts의 경로 로직을 그대로 브라우저용 JS로 바꿔 확인용 화면에 넣는다.
// 화면과 테스트가 같은 코드를 쓰게 하려고, 복붙 대신 빌드로 만든다.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const files = ['src/lib/santa/cities.ts', 'src/lib/santa/route.ts', 'src/lib/santa/santa.ts'];

const core = files
  .map((f) => {
    const js = stripTypeScriptTypes(readFileSync(f, 'utf8'));
    return js
      .split('\n')
      .filter((line) => !/^\s*import\s/.test(line))
      .map((line) => line.replace(/^export\s+/, ''))
      .join('\n');
  })
  .join('\n');

const template = readFileSync('scripts/preview.template.html', 'utf8');
mkdirSync('preview', { recursive: true });
writeFileSync('preview/index.html', template.replace('/*__SANTA_CORE__*/', core));
console.log('preview/index.html 생성 완료');
