// 실험 옵션(aw·bx·cm·dp)을 하나씩 얹어가며 1위율이 어떻게 움직이는지 잰다.
// 옵션이 페이지 안에 들어온 뒤로는 소스를 문자열로 고칠 필요가 없다 — OPT만 바꾼다.
//
// 사용: node sim_stages.js [html경로] [시행수]
const fs = require('fs');
const path = require('path');

const HTML = process.argv[2] || path.join(__dirname, '..', 'index.html');
const N = +(process.argv[3] || 30000);
const src = fs.readFileSync(HTML, 'utf8');
const m = src.match(/\/\/ <<CORE-START>>[^\n]*\n([\s\S]*?)\/\/ <<CORE-END>>/);
const core = new Function(m[1] +
  '\nreturn {scoreCats, ALL, WSET, D, TR, CAT, OPT, MANNER, catsOf, traitsOf};')();
const { scoreCats, ALL, WSET, D, OPT, catsOf, traitsOf } = core;

const STAGES = [
  ['0 현행                 ', {}],
  ['1 +aw 어휘 무게         ', { aw: 1 }],
  ['2 +aw+bx 직업없음칸 뺌   ', { aw: 1, bx: 1 }],
  ['3 +aw+bx+dp 폭발력      ', { aw: 1, bx: 1, dp: 1 }],
  ['4 +전부, 양태어 뺌       ', { aw: 1, bx: 1, dp: 1, cm: 1 }],
  ['— bx만                 ', { bx: 1 }],
  ['— dp만                 ', { dp: 1 }],
  ['— cm만                 ', { cm: 1 }],
];

const WATCH = ['체육', '의료·구호', '법·질서', '조직·행정', '금융·상업'];
console.log(`시행 ${N} · 균등 배점 · 십신 끔 · 기저보정 켬\n`);
console.log('옵션'.padEnd(24) + WATCH.map(c => c.padStart(10)).join('') +
  '지니'.padStart(8) + '점수붙는칸'.padStart(11) + '성향비중'.padStart(10));
console.log('-'.repeat(24 + WATCH.length * 10 + 29));

for (const [name, opt] of STAGES) {
  for (const k of Object.keys(OPT)) OPT[k] = !!opt[k];

  let seed = 20260812;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const win = {}, cats = new Set(); let scored = 0;
  for (let k = 0; k < N; k++) {
    const picks = [0, 1, 2, 3].map(() => ALL[Math.floor(rnd() * ALL.length)]);
    const { list } = scoreCats(picks, WSET[0], false, true);
    if (!list.length) continue;
    scored++;
    win[list[0][0]] = (win[list[0][0]] || 0) + 1;
    for (const [c] of list) cats.add(c);
  }
  const rates = [...cats].map(c => (win[c] || 0) / scored);
  const sorted = [...rates].sort((a, b) => a - b), n = sorted.length;
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  let g = 0; for (let i = 0; i < n; i++) g += (2 * (i + 1) - n - 1) * sorted[i];

  // 커버리지 · 성향 비중은 점수 배분과 같은 규칙으로 센다
  let cov = 0, tW = 0, jW = 0;
  for (const p of ALL) {
    const e = D[p]; if (!e) continue;
    const ts = traitsOf(p).filter(t => catsOf(t).length);
    if (e.j.length || ts.length) cov++;
    jW += e.j.length;
    for (const t of ts) { const cs = catsOf(t); tW += OPT.aw ? 1 : cs.length; }
  }
  console.log(name.padEnd(24) +
    WATCH.map(c => ((win[c] || 0) / scored * 100).toFixed(2).padStart(9) + '%').join('') +
    (g / (n * n * mean)).toFixed(3).padStart(8) +
    `${cov}/60`.padStart(11) +
    (tW / (tW + jW) * 100).toFixed(1).padStart(9) + '%');
}
for (const k of Object.keys(OPT)) OPT[k] = false;
