// node test.js — 핵심 규칙 자체 점검
const assert = require('assert');
const L = require('./logic.js');

const iso = d => L.dayToDate(d).toISOString().slice(0, 10);
const sch = L.schedule(10);
assert.strictEqual(iso(sch.find(e => e.type === 'nat').day), '2028-04-12');
assert.strictEqual(iso(sch.find(e => e.type === 'pres').day), '2030-03-27');
assert.strictEqual(iso(sch.find(e => e.type === 'gov').day), '2030-06-12'); // 6/5 다음날 현충일 → 다음 주
// 공휴일 규칙 역산: 2022 대선 3/9(3/2 전날 삼일절), 2018 지방선거 6/13(6/6 현충일)
assert.strictEqual(iso(L.electionDay(new Date(Date.UTC(2022, 4, 9)), 70)), '2022-03-09');
assert.strictEqual(iso(L.electionDay(new Date(Date.UTC(2018, 5, 30)), 30)), '2018-06-13');
// 2026 지방선거(6/3)·2024 총선(4/10) 역산 검증
assert.strictEqual(iso(L.electionDay(new Date(Date.UTC(2026, 5, 30)), 30)), '2026-06-03');
assert.strictEqual(iso(L.electionDay(new Date(Date.UTC(2024, 4, 29)), 50)), '2024-04-10');

// 재·보궐선거: 4월 첫 수요일 1회. 준비 기간(50일)이 모자라면 다음 해 4월, 지선·대선 후보 등록 전(34일 전까지)에 사유가 확정되면 그 선거와 같은 날
const dd = (y, m, d) => L.dateToDay(new Date(Date.UTC(y, m - 1, d)));
assert.strictEqual(iso(L.byeDay(dd(2027, 1, 10)).day), '2027-04-07');
assert.strictEqual(iso(L.byeDay(dd(2027, 6, 1)).day), '2028-04-05'); // 10월 보궐은 없음
assert.strictEqual(iso(L.byeDay(dd(2027, 3, 31)).day), '2028-04-05'); // 4/7까지 7일뿐
const gov = sch.find(e => e.type === 'gov'), pres = sch.find(e => e.type === 'pres');
assert.strictEqual(L.byeDay(gov.day - L.JOINT_CUTOFF, sch).with, gov.key);
assert.strictEqual(L.byeDay(gov.day - L.JOINT_CUTOFF, sch).day, gov.day);
assert.strictEqual(L.byeDay(gov.day - L.JOINT_CUTOFF + 1, sch).with, null);
assert.strictEqual(L.byeDay(pres.day - 40, sch).with, pres.key);
assert.strictEqual(L.byeDay(dd(2027, 1, 10), sch).with, null); // 총선·먼 선거와는 동시 아님
// 단체장 보궐선거는 총선·대선과 동시 실시(지선은 임기 만료 선거라 대상 아님)
const nat0 = sch.find(e => e.type === 'nat'), H = ['nat', 'pres'];
assert.strictEqual(L.byeDay(nat0.day - 40, sch, 50, H).with, nat0.key);
assert.strictEqual(L.byeDay(nat0.day - 40, sch).with, null);
assert.strictEqual(L.byeDay(nat0.day - 20, sch, 50, H).with, null);
// 선거 주기: 총선·대선·지선 순환, 인접 간격 약 243일(수요일·공휴일 규칙으로 ±7일), 같은 유형은 약 730일 주기, 모두 수요일
const cad = L.cadence(122, 'gov', 24);
assert.deepStrictEqual(cad.slice(0, 6).map(e => e.type), ['nat', 'pres', 'gov', 'nat', 'pres', 'gov']);
const cd = [{ day: 122 }, ...cad].map(e => e.day);
for (let i = 1; i < cd.length; i++) assert(cd[i] - cd[i - 1] >= 236 && cd[i] - cd[i - 1] <= 257, `간격 ${cd[i] - cd[i - 1]}`);
for (const t0 of ['nat', 'pres', 'gov']) { const ds = cad.filter(e => e.type === t0).map(e => e.day); for (let i = 1; i < ds.length; i++) assert(Math.abs(ds[i] - ds[i - 1] - L.CYCLE) <= 14, t0); }
assert(cad.every(e => L.dayToDate(e.day).getUTCDay() === 3));
assert.strictEqual(cad[0].day, 367); // 새 게임 첫 총선(시작 365일째 이후 첫 수요일)
assert.strictEqual(L.REGIONS.reduce((a, r) => a + r.seats, 0), 254);
assert.strictEqual(Math.round(L.REGIONS.reduce((a, r) => a + r.voters * 1e6, 0)), L.LAW.voters);

assert.deepStrictEqual(L.hare(5, [1, 1, 1]), [2, 2, 1]);

// 준연동형: 지역구 없는 소수정당이 비례로 보정받는지
const pr = L.allocatePR([
  { id: 'A', votes: 36, district: 140 },
  { id: 'B', votes: 37, district: 110 },
  { id: 'C', votes: 15, district: 0 },
  { id: 'D', votes: 2, district: 1 },   // 봉쇄조항 미달
  { id: 'E', votes: 10, district: 0 },
]);
assert.strictEqual(Object.values(pr).reduce((a, b) => a + b, 0), 46);
assert.strictEqual(pr.D, 0);
assert(pr.C > pr.A, '연동 효과: 지역구 없는 C가 A보다 비례 의석이 많아야 함');

// 보조금: 합계 1, 교섭단체가 큰 몫
const sub = L.subsidyShares([
  { id: 'A', seats: 170, voteShare: 0.37, participated: true },
  { id: 'B', seats: 110, voteShare: 0.36, participated: true },
  { id: 'C', seats: 12, voteShare: 0.15, participated: true },
  { id: 'P', seats: 0, voteShare: 0.025, participated: true },
  { id: 'N', seats: 0, voteShare: 0, participated: false },
]);
assert(Math.abs(Object.values(sub).reduce((a, b) => a + b, 0) - 1) < 1e-9);
assert.strictEqual(sub.N, 0);
assert(sub.P > 0.02 && sub.C > sub.P);

assert.strictEqual(L.refundRate(0.15), 1);
assert.strictEqual(L.refundRate(0.12), 0.5);
assert.strictEqual(L.refundRate(0.09), 0);
assert.strictEqual(L.deposit('nat', 28), 7_500_000);
assert.strictEqual(L.deposit('pres', 28), 300_000_000);

// 후보 점수: 비중 역량 > 정당 지지율 > 전과 > 청렴 > 인지도, 지지율 높아도 후보가 형편없으면 짐
const swing = (k, lo, hi) => L.candScore({ skill: 60, integ: 60, fame: 30, rec: [], [k]: hi }) - L.candScore({ skill: 60, integ: 60, fame: 30, rec: [], [k]: lo });
const sw = { skill: swing('skill', 10, 100), party: Math.log(0.4 / 0.05), rec: L.candScore({ skill: 60, integ: 60, fame: 30 }) - L.candScore({ skill: 60, integ: 60, fame: 30, rec: [1, 2, 3, 4] }), integ: swing('integ', 10, 100), fame: swing('fame', 1, 95) };
assert(sw.skill > sw.party && sw.party > sw.rec && sw.rec > sw.integ && sw.integ > sw.fame, JSON.stringify(sw));
assert.strictEqual(L.candScore({ skill: 60, integ: 60, fame: 30, rec: [] }), 0);
const bad = Math.log(0.6) + L.candScore({ skill: 25, integ: 20, fame: 5, rec: ['a', 'b'] }), avg = Math.log(0.25);
assert(bad < avg, '지지율 60% 당의 형편없는 후보가 25% 당의 평범한 후보에게 져야 함');

// 지지층 계층: 비중 합 유지, 악재는 혐오층을, 호재는 충성층을 두껍게. 충성층 두꺼우면 악재 배율↓, 혐오층 두꺼우면 호재 배율↓
const T0 = [0.05, 0.15, 0.6, 0.15, 0.05], tsum = t => t.reduce((a, b) => a + b, 0);
const tb = L.tierShift(T0, -5), tg = L.tierShift(T0, 5);
assert(Math.abs(tsum(tb) - 1) < 1e-9 && Math.abs(tsum(tg) - 1) < 1e-9 && Math.abs(tsum(L.tierRelax(tb)) - 1) < 1e-9);
assert(tb[4] > T0[4] && tb[0] < T0[0] && tg[0] > T0[0] && tg[4] < T0[4]);
assert(Math.abs(L.tierMul(T0, -1) - 1) < 1e-9 && Math.abs(L.tierMul(T0, 1) - 1) < 1e-9);
assert(L.tierMul([0.4, 0.2, 0.3, 0.05, 0.05], -1) < 1 && L.tierMul([0.05, 0.05, 0.3, 0.2, 0.4], 1) < 1);
assert(L.tierSup([0.3, 0.2, 0.4, 0.05, 0.05], false) < L.tierSup(T0, false));
// 지지율에 맞춤: 지지율 3%인데 충성 15%·혐오 1%면 오래 지나 충성은 지지율 안으로, 혐오는 충성보다 두껍게
let ta = [0.15, 0.2, 0.5, 0.14, 0.01]; for (let i = 0; i < 365; i++) ta = L.tierAnchor(ta, 3);
assert(Math.abs(tsum(ta) - 1) < 1e-9 && ta[0] < 0.03 && ta[4] > ta[0]);
assert.deepStrictEqual(L.tierAnchor(T0, 40), T0); // 지지율 높으면 그대로
// 당끼리: 반대 진영 호감층 합 ≤ 1, 충성층 합 ≤ 1, 반대 진영 충성층은 상대 당을 싫어하게. 같은 진영은 함께 좋아해도 됨
let tc = { A: [0.5, 0.2, 0.2, 0.05, 0.05], B: [0.3, 0.2, 0.4, 0.05, 0.05], C: [0.3, 0.3, 0.3, 0.05, 0.05] };
const IDEO = { A: -1, B: 1, C: 0.5 }, like = t => t[0] + t[1];
for (let i = 0; i < 365; i++) tc = L.tierCross(tc, IDEO);
for (const id in tc) assert(Math.abs(tsum(tc[id]) - 1) < 1e-9 && Math.min(...tc[id]) >= 0);
assert(like(tc.A) + like(tc.B) <= 1 + 1e-9 && like(tc.A) + like(tc.C) <= 1 + 1e-9 && tc.A[0] + tc.B[0] + tc.C[0] <= 1 + 1e-9);
assert(tc.A[3] + tc.A[4] >= tc.B[0] + tc.C[0] - 0.01 && tc.B[3] + tc.B[4] >= tc.A[0] - 0.01);
const same = { B: [0.3, 0.3, 0.3, 0.05, 0.05], C: [0.3, 0.3, 0.3, 0.05, 0.05] };
assert.deepStrictEqual(L.tierCross(same, IDEO), same); // 같은 진영끼리는 그대로

// 다른 당 주간 방침: 가중치 없으면 null(예전 행동). 있으면 확률 합 1, 선거 2주 전 열세면 선거 먼 때보다 유세·공세 쪽, 정책은 덜
const rc = o => L.rivalFeat({ wk: 40, camp: 0, seats: 120, sup: 28, trend: 0, gap: -3, pres: 0, appr: 40, hit: 99, ...o });
const near = rc({ wk: 2, camp: 1, trend: -2 }), far = rc({});
assert.strictEqual(L.rivalPolicy(near, null), null);
const pNear = L.rivalPolicy(near), pFar = L.rivalPolicy(far), pi = k => L.POSTURES.indexOf(k);
if (pNear) {
  assert(Math.abs(pNear.reduce((a, b) => a + b) - 1) < 1e-9);
  assert(pNear[pi('campaign')] + pNear[pi('attack')] > pFar[pi('campaign')] + pFar[pi('attack')]);
  assert(pFar[pi('policy')] > pNear[pi('policy')]);
}

// 행정 특기: 4분야 합 ≈ 0(분야 역량 평균 = 역량), ±20 안, 직업 경향(의사는 돌봄, 장성은 안전이 평균적으로 가장 높음), 성향 −1~1
{ let s = 7; const u = () => (s = (s * 16807) % 2147483647) / 2147483647, g = () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u());
  const avg = (job, c) => { let t = 0; for (let i = 0; i < 300; i++) t += L.aptGen(job, g).apt[c]; return t / 300; };
  for (let i = 0; i < 300; i++) {
    const { apt, st } = L.aptGen(['의사', '기업인', '예비역 장성', '', undefined][i % 5], g), v = Object.values(apt);
    assert(Math.abs(v.reduce((a, b) => a + b, 0)) < 0.5 && v.every(x => x >= -20 && x <= 20) && st >= -1 && st <= 1);
  }
  for (const [job, c] of [['의사', 'care'], ['예비역 장성', 'safe'], ['기업인', 'biz'], ['전직 지방의원', 'dev']])
    assert(L.PJ_CATS.every(o => o === c || avg(job, c) > avg(job, o)), job);
  assert.strictEqual(L.areaSkill(60, { dev: 8 }, 'dev'), 68);
  assert.strictEqual(L.areaSkill(60, null, 'dev'), 60);
}
// 수요·공급 5단계와 언덕 배율: 부족 한가운데 1, 공백이 가장 크지만 1.15까지, 비면 보통(1보다 작음), 과잉·포화 경계에서 0, 포화는 언제나 음수, 바닥 −1
{ const near = (a, b) => Math.abs(a - b) < 1e-9;
  assert.strictEqual(L.demLvl(L.demGap({}, {}, 'dev')), 2);
  assert(L.demMul({}, {}, 'dev') < 0.8 && L.demMul({}, {}, 'dev') > 0.7);
  assert(near(L.demGap({ dev: 9, care: 11 }, {}, 'dev'), -0.2) && near(L.demMul({ dev: 9, care: 11 }, {}, 'dev'), 1));
  assert.strictEqual(L.demLvl(-0.2), 1);
  assert.strictEqual(L.demLvl(L.demGap({ care: 1 }, {}, 'care')), 0);
  assert(L.demMul({ care: 1 }, {}, 'care') > 1 && L.demMul({ care: 99 }, {}, 'care') === 1.15);
  assert.strictEqual(L.demLvl(L.demGap({}, { dev: 1 }, 'dev')), 2); // 첫 성공 한 번으로 과잉·포화가 되지 않음
  assert.strictEqual(L.demLvl(L.demGap({ care: 1 }, { dev: 12 }, 'dev')), 4);
  assert(L.demMul({ care: 1 }, { dev: 12 }, 'dev') < 0);
  const m = n => L.demMul({ care: 1, dev: 1 }, { dev: n }, 'dev'); // 개발 공급을 늘려 가며
  for (let n = 0; n < 12; n++) assert(m(n + 1) < m(n)); // 공백→포화로 갈수록 줄어듦
  const lo = L.demMul({ care: 9 }, { dev: 12 }, 'dev'); assert(lo < -0.6 && lo >= -1); // 최근 12건을 한 분야로 채우면 기본 상승분의 60% 넘게 깎임
  for (let n = 0; n <= 12; n++) { const d = { care: 1 }, u = { dev: n }; assert((L.demLvl(L.demGap(d, u, 'dev')) === 4) === (L.demMul(d, u, 'dev') < 0)); } } // 포화면 반드시 음수, 그 밖엔 음수가 아님
// 성향: 추진형 1.25배·신중형 0.75배(특기는 성공률에만 들어가고 오르내림 폭엔 없음)
{ assert.strictEqual(L.styleMul(1), 1.25); assert.strictEqual(L.styleMul(-1), 0.75); assert.strictEqual(L.styleMul(), 1); assert.strictEqual(L.flopMul, undefined); }
// 분야 선택: 효용이 높은 분야를 더 자주 고르되 독점하지 않음, 추진형은 개발을 신중형보다 높게 침
{ const us = [L.admU(0.7, 3, 1, 1, 0, 'care'), L.admU(0.5, 8, 1, 1.15, 0, 'biz')], n = [0, 0];
  for (let i = 0; i < 1000; i++) n[L.softPick(us, (i + 0.5) / 1000)]++;
  assert(n[1] > n[0] && n[0] > 0);
  assert.strictEqual(L.softPick([1, 1, 1], 0), 0); assert.strictEqual(L.softPick([1, 1, 1], 0.999), 2);
  assert(L.admU(0.6, 7, 3, 1, 1, 'dev') > L.admU(0.6, 7, 3, 1, -1, 'dev')); }

console.log('ok');

// 법안 당론 지지층: 여론 맞음 → 적대·혐오가 줄고, 노선 맞음 → 충성·혐오가 늘고, 둘 다 0이면 그대로. 합은 1 유지
{ const t0 = [0.1, 0.2, 0.4, 0.2, 0.1], s = t => t.reduce((a, b) => a + b, 0);
  const p = L.tierVote(t0, 1, 0), q = L.tierVote(t0, 0, 1);
  assert(p[4] < t0[4] && p[3] + p[4] < t0[3] + t0[4] && Math.abs(s(p) - 1) < 1e-9);
  assert(q[0] > t0[0] && q[4] > t0[4] && Math.abs(s(q) - 1) < 1e-9);
  assert.deepStrictEqual(L.tierVote(t0, 0, 0), t0); }
