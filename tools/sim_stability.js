// 설정을 전부 돌려보면 추천이 얼마나 흔들리나.
// 배점2 × 십신2 × 기저보정2 × 실험옵션4개(2^4) = 128가지 설정.
// 같은 사주를 128번 채점해서 1위·TOP3가 얼마나 유지되는지 센다.
const fs = require('fs');
const path = require('path');

const HTML = process.argv[2] || path.join(__dirname, '..', 'index.html');
const CHARTS = +(process.argv[3] || 2000);
const src = fs.readFileSync(HTML, 'utf8');
const m = src.match(/\/\/ <<CORE-START>>[^\n]*\n([\s\S]*?)\/\/ <<CORE-END>>/);
const { scoreCats, ALL, WSET, OPT } = new Function(m[1] + '\nreturn {scoreCats, ALL, WSET, OPT};')();

const COMBOS = [];
for (const w of [0, 1]) for (const z of [0, 1]) for (const nm of [0, 1])
  for (const aw of [0, 1]) for (const bx of [0, 1]) for (const cm of [0, 1]) for (const dp of [0, 1])
    COMBOS.push({ w, z, nm, aw, bx, cm, dp });

let seed = 20260812;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

const top1Stab = [], top3Stab = [], nDistinct = [];
let flipAny = 0;

for (let c = 0; c < CHARTS; c++) {
  const picks = [0, 1, 2, 3].map(() => ALL[Math.floor(rnd() * ALL.length)]);
  const win = {}, inTop3 = {};
  let valid = 0;
  for (const o of COMBOS) {
    OPT.aw = !!o.aw; OPT.bx = !!o.bx; OPT.cm = !!o.cm; OPT.dp = !!o.dp;
    const { list } = scoreCats(picks, WSET[o.w], !!o.z, !!o.nm);
    if (!list.length) continue;
    valid++;
    win[list[0][0]] = (win[list[0][0]] || 0) + 1;
    for (const [cat] of list.slice(0, 3)) inTop3[cat] = (inTop3[cat] || 0) + 1;
  }
  if (!valid) continue;
  const best = Math.max(...Object.values(win));
  top1Stab.push(best / valid);
  nDistinct.push(Object.keys(win).length);
  if (Object.keys(win).length > 1) flipAny++;
  // 최빈 TOP3 세 개가 평균적으로 얼마나 유지되나
  const t3 = Object.entries(inTop3).sort((a, b) => b[1] - a[1]).slice(0, 3);
  top3Stab.push(t3.reduce((s, x) => s + x[1] / valid, 0) / t3.length);
}

const avg = a => a.reduce((s, v) => s + v, 0) / a.length;
const pct = a => { const s = [...a].sort((x, y) => x - y); return q => s[Math.floor(q * (s.length - 1))]; };
const q1 = pct(top1Stab);

console.log(`사주 ${top1Stab.length}개 × 설정 ${COMBOS.length}가지\n`);
console.log(`■ 1위 범주`);
console.log(`  설정을 바꾸면 1위가 바뀌는 사주  ${(flipAny / top1Stab.length * 100).toFixed(1)}%`);
console.log(`  최빈 1위가 유지되는 비율 평균     ${(avg(top1Stab) * 100).toFixed(1)}%`);
console.log(`  하위25% 사주는 ${(q1(0.25) * 100).toFixed(0)}% 이하 · 중앙값 ${(q1(0.5) * 100).toFixed(0)}% · 상위25% ${(q1(0.75) * 100).toFixed(0)}% 이상`);
console.log(`  한 사주가 설정에 따라 갖는 서로 다른 1위 개수 평균 ${avg(nDistinct).toFixed(2)}개 (최대 ${Math.max(...nDistinct)}개)\n`);
console.log(`■ TOP3`);
console.log(`  최빈 TOP3 세 범주가 유지되는 비율 평균 ${(avg(top3Stab) * 100).toFixed(1)}%`);

const bins = [0, .5, .7, .85, .95, 1.01];
const lbl = ['~50%', '50~70%', '70~85%', '85~95%', '95%~'];
const cnt = lbl.map(() => 0);
for (const v of top1Stab) for (let i = 0; i < bins.length - 1; i++)
  if (v >= bins[i] && v < bins[i + 1]) { cnt[i]++; break; }
console.log(`\n■ 1위 안정도 분포`);
lbl.forEach((l, i) => console.log(`  ${l.padStart(7)}  ${'█'.repeat(Math.round(cnt[i] / top1Stab.length * 40))} ${(cnt[i] / top1Stab.length * 100).toFixed(1)}%`));

for (const k of Object.keys(OPT)) OPT[k] = false;
