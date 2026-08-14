// 성향 어휘를 「분야어」와 「양태어」로 갈라놓고,
// 점수가 어느 쪽에서 얼마나 나오는지 · 양태어를 빼면 무엇이 무너지는지 잰다.
//
// 분야어 = 그 말만 듣고 직업 영역을 댈 수 있다 (심미 → 디자인, 언변 → 말하는 일)
// 양태어 = 「무슨 일」이 아니라 「어떻게」를 가리킨다 (폭발력, 인내, 성실, 권위)
//          → 직업 범주로 옮기려면 반드시 내 추가 가정이 들어간다
const fs = require('fs');
const path = require('path');

const HTML = process.argv[2] || path.join(__dirname, '..', 'index.html');
const src = fs.readFileSync(HTML, 'utf8');
const m = src.match(/\/\/ <<CORE-START>>[^\n]*\n([\s\S]*?)\/\/ <<CORE-END>>/);
const { scoreCats, ALL, WSET, D, TR, CAT } = new Function(m[1] + '\nreturn {scoreCats, ALL, WSET, D, TR, CAT};')();

const FIELD = new Set([   // 분야어 16
  '심미','손재주','언변','분석','상상력','창작','영성','축제성',
  '트렌드','표현욕','격식','기발함','체계','도회감','낭만','야행성',
]);
const ALLT = Object.keys(TR);
const MANNER = ALLT.filter(t => !FIELD.has(t));

console.log(`■ 성향 어휘 ${ALLT.length}개 = 분야어 ${ALLT.length - MANNER.length} + 양태어 ${MANNER.length}\n`);
console.log('  양태어: ' + MANNER.join(' · ') + '\n');

// --- 1. 어휘 하나가 갖는 무게 ---
// 점수 배분: 기둥 1표를 "항목 수"로 나눈다. 항목 = 원문 직업 용어 1개당 1, 성향 어휘 1개당 (가리키는 범주 수)
let jUnits = 0, tUnits = 0, jTerms = 0, tTerms = 0;
for (const p of ALL) {
  const e = D[p]; if (!e) continue;
  jTerms += e.j.length; jUnits += e.j.length;
  tTerms += e.t.length;
  for (const t of e.t) tUnits += (TR[t] || []).length;
}
console.log('■ 어휘 하나가 갖는 무게');
console.log(`  원문 직업 용어 ${jTerms}개 → 배분 항목 ${jUnits}개   (용어 1개당 ${(jUnits / jTerms).toFixed(2)}항목)`);
console.log(`  성향 어휘     ${tTerms}개 → 배분 항목 ${tUnits}개   (어휘 1개당 ${(tUnits / tTerms).toFixed(2)}항목)`);
console.log(`  → 성향 어휘 하나가 원문 직업 용어 하나의 ${(tUnits / tTerms / (jUnits / jTerms)).toFixed(1)}배 무게다.`);
console.log(`  전체 항목 중 성향 파생 비중 ${(tUnits / (tUnits + jUnits) * 100).toFixed(1)}%\n`);

// --- 2. 양태어가 점수에서 차지하는 몫 ---
let mUnits = 0, fUnits = 0;
for (const p of ALL) {
  const e = D[p]; if (!e) continue;
  for (const t of e.t) {
    const n = (TR[t] || []).length;
    if (FIELD.has(t)) fUnits += n; else mUnits += n;
  }
}
console.log('■ 성향 점수의 출처');
console.log(`  분야어 ${fUnits}항목 (${(fUnits / (fUnits + mUnits) * 100).toFixed(1)}%)  ·  양태어 ${mUnits}항목 (${(mUnits / (fUnits + mUnits) * 100).toFixed(1)}%)`);
console.log(`  전체 점수 대비 양태어 몫 ${(mUnits / (tUnits + jUnits) * 100).toFixed(1)}%\n`);

// --- 3. 범주별 양태어 의존도 ---
const dep = {};
for (const [t, cs] of Object.entries(TR)) {
  for (const c of cs) {
    dep[c] ||= { f: 0, m: 0, j: 0 };
    if (FIELD.has(t)) dep[c].f++; else dep[c].m++;
  }
}
for (const c of Object.values(CAT)) { dep[c] ||= { f: 0, m: 0, j: 0 }; dep[c].j++; }

console.log('■ 범주별 — 무엇이 이 범주를 가리키나');
console.log('범주'.padEnd(16) + '원문용어'.padStart(9) + '분야어'.padStart(8) + '양태어'.padStart(8) + '  양태어 의존');
console.log('-'.repeat(60));
const rows = Object.entries(dep).sort((a, b) =>
  (b[1].m / (b[1].m + b[1].f + b[1].j)) - (a[1].m / (a[1].m + a[1].f + a[1].j)));
for (const [c, v] of rows) {
  const tot = v.m + v.f + v.j;
  const r = v.m / tot;
  console.log(c.padEnd(16) + String(v.j).padStart(8) + String(v.f).padStart(8) + String(v.m).padStart(8) +
    '   ' + '█'.repeat(Math.round(r * 20)) + ' ' + (r * 100).toFixed(0) + '%');
}

// --- 4. 양태어를 빼면 자료 범위가 얼마나 무너지나 ---
let cov = 0, covNoManner = 0;
for (const p of ALL) {
  const e = D[p]; if (!e) continue;
  if (e.j.length || e.t.length) cov++;
  if (e.j.length || e.t.some(t => FIELD.has(t))) covNoManner++;
}
console.log(`\n■ 양태어를 직업 매핑에서 빼면`);
console.log(`  점수가 붙는 칸 ${cov}/60 → ${covNoManner}/60  (${cov - covNoManner}칸이 0점으로 떨어진다)`);
const lost = ALL.filter(p => { const e = D[p]; return e && (e.j.length || e.t.length) && !(e.j.length || e.t.some(t => FIELD.has(t))); });
console.log(`  잃는 칸: ${lost.map(p => `${p}(${D[p].m.split(' · ')[0]})`).join(' · ')}`);
