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

assert.strictEqual(L.REGIONS.reduce((a, r) => a + r.seats, 0), 254);

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

console.log('ok');
