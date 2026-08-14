// 범주 편중 측정. saju-job.html의 <<CORE-START>>~<<CORE-END>> 구간을 그대로 떼어다 쓴다.
// 데이터·점수식을 여기 복사하지 않는다 — 복사하면 HTML과 갈라져서 측정이 거짓말이 된다.
//
// 사용: node sim_bias.js [html경로] [시행수] [w0|w1] [ss|noss] [norm|raw]
const fs = require('fs');
const path = require('path');

const HTML = process.argv[2] || path.join(__dirname, '..', 'index.html');
const N    = +(process.argv[3] || 50000);
const WMODE= process.argv[4] === 'w1' ? 1 : 0;
const ZON  = process.argv[5] === 'ss';
const NORM = process.argv[6] !== 'raw';

const src = fs.readFileSync(HTML, 'utf8');
const m = src.match(/\/\/ <<CORE-START>>[^\n]*\n([\s\S]*?)\/\/ <<CORE-END>>/);
if (!m) { console.error('CORE 마커를 못 찾음'); process.exit(1); }

const core = new Function(m[1] + '\nreturn {scoreCats, ALL, WSET, TR, CAT, SS, D, CATX};')();
const { scoreCats, ALL, WSET, TR, CAT, SS, D, CATX } = core;

// 재현 가능한 난수 — 같은 시드면 같은 표가 나온다.
let seed = 20260812;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

const W = WSET[WMODE];
const win = {}, appear = {};
let noResult = 0;

for (let k = 0; k < N; k++) {
  const picks = [0,1,2,3].map(() => ALL[Math.floor(rnd() * ALL.length)]);
  const { list } = scoreCats(picks, W, ZON, NORM);
  if (!list.length) { noResult++; continue; }
  win[list[0][0]] = (win[list[0][0]] || 0) + 1;
  for (const [c] of list) appear[c] = (appear[c] || 0) + 1;
}

const scored = N - noResult;
const cats = Object.keys(CATX).filter(c => c !== '기타');
for (const c of cats) if (!(c in win)) win[c] = 0;

const rows = Object.entries(win).sort((a, b) => b[1] - a[1]);
const rates = rows.map(([, v]) => v / scored);

// 지니계수 — 0이면 완전 균등, 1이면 한 범주 독식
const sorted = [...rates].sort((a, b) => a - b), n = sorted.length;
const mean = sorted.reduce((s, v) => s + v, 0) / n;
let g = 0;
for (let i = 0; i < n; i++) g += (2 * (i + 1) - n - 1) * sorted[i];
const gini = g / (n * n * mean);

// 어휘 배분도 같이 본다 — 편중의 원인이 여기 있으면 1위율만 봐선 모른다
const trCount = {}, trFirst = {}, catCount = {};
for (const [t, cs] of Object.entries(TR)) cs.forEach((c, i) => {
  trCount[c] = (trCount[c] || 0) + 1;
  if (i === 0) trFirst[c] = (trFirst[c] || 0) + 1;
});
for (const c of Object.values(CAT)) catCount[c] = (catCount[c] || 0) + 1;
const ssCount = {};
for (const v of Object.values(SS)) v.c.forEach(c => ssCount[c] = (ssCount[c] || 0) + 1);

console.log(`시행 ${N} · 유효 ${scored} · 배점 ${WMODE ? '월지중심' : '균등'} · 십신 ${ZON ? '켬' : '끔'} · 기저보정 ${NORM ? '켬' : '끔'}`);
console.log('범주'.padEnd(14) + '1위율'.padStart(8) + '등장률'.padStart(9) +
            '성향어휘'.padStart(9) + '(1순위)'.padStart(8) + '원문용어'.padStart(9) + '십신'.padStart(6));
console.log('-'.repeat(64));
for (const [c, v] of rows) {
  console.log(c.padEnd(14) +
    (v / scored * 100).toFixed(2).padStart(7) + '%' +
    ((appear[c] || 0) / scored * 100).toFixed(1).padStart(8) + '%' +
    String(trCount[c] || 0).padStart(8) +
    String(trFirst[c] || 0).padStart(8) +
    String(catCount[c] || 0).padStart(8) +
    String(ssCount[c] || 0).padStart(6));
}
const nz = rates.filter(v => v > 0);
console.log('-'.repeat(64));
console.log(`범주 수 ${n} · 최대 ${(Math.max(...rates) * 100).toFixed(2)}% · 최소 ${(Math.min(...rates) * 100).toFixed(2)}%`);
console.log(`최대/최소 배율 ${nz.length ? (Math.max(...rates) / Math.min(...nz)).toFixed(1) : '—'}배  (0%인 범주 ${rates.length - nz.length}개)`);
console.log(`상위5 점유 ${(rates.slice().sort((a,b)=>b-a).slice(0,5).reduce((s,v)=>s+v,0) * 100).toFixed(1)}%`);
console.log(`지니계수 ${gini.toFixed(3)}`);
