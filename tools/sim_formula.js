// 순위 공식 후보 비교. scoreCats가 돌려주는 tot(점수)·np(기여 기둥 수)를 재조합해
// 어느 공식이 범주 편중을 가장 잘 잡는지 같은 표본으로 나란히 잰다.
const fs = require('fs');
const path = require('path');

const HTML = process.argv[2] || path.join(__dirname, '..', 'index.html');
const N    = +(process.argv[3] || 30000);

const src = fs.readFileSync(HTML, 'utf8');
const m = src.match(/\/\/ <<CORE-START>>[^\n]*\n([\s\S]*?)\/\/ <<CORE-END>>/);
const core = new Function(m[1] + '\nreturn {scoreCats, ALL, WSET, D, TR, CAT, CATX};')();
const { scoreCats, ALL, WSET, D, TR, CAT, CATX } = core;

// 기저질량 base(c) — 60칸 전체에서 그 범주가 평균적으로 받는 몫.
// 흔한 범주일수록 크다. 이걸로 나누면 "평균 대비 얼마나 가리키나"가 된다.
const base = {};
for (const p of ALL) {
  const e = D[p]; if (!e) continue;
  const local = {};
  e.j.forEach(t => { const c = CAT[t] || '기타'; local[c] = (local[c] || 0) + 1; });
  e.t.forEach(t => (TR[t] || []).forEach(c => { local[c] = (local[c] || 0) + 1; }));
  const n = Object.values(local).reduce((s, v) => s + v, 0);
  if (!n) continue;
  for (const [c, v] of Object.entries(local)) base[c] = (base[c] || 0) + v / n / 60;
}
const BMIN = Math.min(...Object.values(base));

const VARIANTS = {
  'tot×np        (현행)': (tot, np, c) => tot * np,
  'tot×np^0.5        ': (tot, np, c) => tot * Math.sqrt(np),
  'tot만              ': (tot, np, c) => tot,
  'tot/base×np       ': (tot, np, c) => tot / (base[c] || BMIN) * np,
  'tot/base×np^0.5   ': (tot, np, c) => tot / (base[c] || BMIN) * Math.sqrt(np),
  'tot/sqrt(base)×np ': (tot, np, c) => tot / Math.sqrt(base[c] || BMIN) * np,
};

const wins = {}, cats = new Set();
for (const k of Object.keys(VARIANTS)) wins[k] = {};

let seed = 20260812;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const W = WSET[0];

let scored = 0;
for (let k = 0; k < N; k++) {
  const picks = [0, 1, 2, 3].map(() => ALL[Math.floor(rnd() * ALL.length)]);
  const { list } = scoreCats(picks, W, false);
  if (!list.length) continue;
  scored++;
  for (const [c] of list) cats.add(c);
  for (const [name, f] of Object.entries(VARIANTS)) {
    let bc = null, bv = -Infinity;
    for (const [c, v] of list) { const s = f(v.tot, v.np, c); if (s > bv) { bv = s; bc = c; } }
    wins[name][bc] = (wins[name][bc] || 0) + 1;
  }
}

const ART = new Set(['순수예술', '글쓰기·서사', '음악·사운드', '영상·사진']);
console.log(`시행 ${scored} · 배점 균등 · 십신 끔\n`);
console.log('공식'.padEnd(22) + '지니'.padStart(7) + '최대'.padStart(8) + '최소'.padStart(8) +
            '배율'.padStart(8) + '상위5'.padStart(8) + '예술계4합'.padStart(11) + '  1위 범주');
console.log('-'.repeat(88));
for (const [name, w] of Object.entries(wins)) {
  const rates = [...cats].map(c => (w[c] || 0) / scored);
  const sorted = [...rates].sort((a, b) => a - b), n = sorted.length;
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  let g = 0; for (let i = 0; i < n; i++) g += (2 * (i + 1) - n - 1) * sorted[i];
  const gini = g / (n * n * mean);
  const nz = rates.filter(v => v > 0);
  const top = Object.entries(w).sort((a, b) => b[1] - a[1])[0];
  const art = [...ART].reduce((s, c) => s + (w[c] || 0) / scored, 0);
  console.log(name.padEnd(22) +
    gini.toFixed(3).padStart(7) +
    (Math.max(...rates) * 100).toFixed(1).padStart(7) + '%' +
    (Math.min(...rates) * 100).toFixed(1).padStart(7) + '%' +
    (nz.length ? (Math.max(...rates) / Math.min(...nz)).toFixed(0) + '배' : '—').padStart(8) +
    (rates.slice().sort((a, b) => b - a).slice(0, 5).reduce((s, v) => s + v, 0) * 100).toFixed(0).padStart(7) + '%' +
    (art * 100).toFixed(1).padStart(10) + '%' +
    `  ${top[0]} ${(top[1] / scored * 100).toFixed(1)}%`);
}
console.log('\n기저질량 base(c) — 작을수록 희귀한 범주');
console.log(Object.entries(base).sort((a, b) => b[1] - a[1])
  .map(([c, v]) => `${c} ${(v * 100).toFixed(2)}`).join(' · '));
