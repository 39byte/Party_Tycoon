// 정당 키우기 — 순수 규칙(법률 수치·선거 산식). 브라우저와 node(test.js) 양쪽에서 사용.
(function (G) {
  // k, 이름, 22대 지역구 의석, 선거인(백만, 근사), 성향(-1 보수 ~ +1 진보, 근사), 타일맵 열/행
  const REGIONS = [
    ['incheon', '인천', 14, 2.5, 0.10, 0, 0], ['seoul', '서울', 48, 8.3, 0.12, 1, 0],
    ['gyeonggi', '경기', 60, 11.5, 0.15, 2, 0], ['gangwon', '강원', 8, 1.3, -0.25, 3, 0],
    ['chungnam', '충남', 11, 1.8, -0.05, 0, 1], ['sejong', '세종', 2, 0.3, 0.25, 1, 1],
    ['chungbuk', '충북', 8, 1.4, 0.0, 2, 1], ['gyeongbuk', '경북', 13, 2.2, -0.6, 3, 1],
    ['jeonbuk', '전북', 10, 1.5, 0.75, 0, 2], ['daejeon', '대전', 7, 1.2, 0.1, 1, 2],
    ['daegu', '대구', 12, 2.0, -0.6, 2, 2], ['ulsan', '울산', 6, 0.9, -0.25, 3, 2],
    // 광주·전남은 2026.7.1 전남광주통합특별시로 통합(의석·선거인은 두 곳 합)
    ['jeonnam', '전남광주', 18, 2.8, 0.8, 0, 3],
    ['gyeongnam', '경남', 16, 2.8, -0.3, 2, 3], ['busan', '부산', 18, 2.9, -0.3, 3, 3],
    ['jeju', '제주', 3, 0.6, 0.15, 0, 4],
  ].map(([k, n, seats, voters, lean, c, r]) => ({ k, n, seats, voters, lean, c, r }));

  const LAW = {
    founders: 200, chapterFounders: 100,        // 정당법 제6조
    prepDays: 180,                              // 정당법 제8조: 결성신고 후 6개월
    minChapters: 5, chapterMembers: 1000,       // 정당법 제17조·제18조
    totalSeats: 300, prSeats: 46, districtSeats: 254,
    prThreshold: 0.03, prDistrictAlt: 5,        // 공직선거법 제189조 봉쇄조항
    caucus: 20,                                 // 국회법 제33조
    voters: 44_300_000,                         // 선거권자 총수(근사)
    subsidyUnit: 1_211,                         // 2026년 보조금 계상단가(원)
    womenSubsidyUnit: 100,                      // 여성추천보조금 단가(원)
    fundCap: 5_000_000_000,                     // 중앙당후원회 연간 모금한도(선거 있는 해 2배)
    age: { pres: 40, nat: 18, gov: 18 },        // 공직선거법 제16조
    deposit: { pres: 300_000_000, nat: 15_000_000, pr: 5_000_000, gov: 50_000_000 }, // 제56조
    campaignDays: { pres: 23, nat: 14, gov: 14 }, // 제33조 선거기간
    pollBan: 6,                                 // 제108조 여론조사 공표 금지
    regDeadline: { pres: 23, nat: 23, gov: 19 }, // 후보자등록 마감(선거일 전, 근사)
    nomDays: 60,                                // 공천 시작(선거일 전). 게임 속도를 위해 120일에서 줄임
  };

  // ---- 날짜: 게임 day 0 = 2026-11-01 ----
  const EPOCH = Date.UTC(2026, 10, 1);
  const DAY = 86400000;
  const dayToDate = d => new Date(EPOCH + d * DAY);
  const dateToDay = dt => Math.round((dt.getTime() - EPOCH) / DAY);
  const ymd = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
  function firstWedOnOrAfter(dt) {
    const x = new Date(dt.getTime());
    while (x.getUTCDay() !== 3) x.setUTCDate(x.getUTCDate() + 1);
    return x;
  }
  // 양력 고정 공휴일만 반영(설·추석·부처님오신날 등 음력 공휴일은 제외)
  const HOLI = ['01-01', '03-01', '05-05', '06-06', '08-15', '10-03', '10-09', '12-25'];
  const isHoli = dt => HOLI.includes(dt.toISOString().slice(5, 10));
  // 공직선거법 제34조: 임기만료일 전 N일 이후 첫 번째 수요일.
  // 그날이나 전날·다음날이 공휴일이면 다음 주 수요일(제34조 제2항)
  function electionDay(termEnd, before) {
    const d = new Date(termEnd.getTime());
    d.setUTCDate(d.getUTCDate() - before);
    const w = firstWedOnOrAfter(d);
    if ([-1, 0, 1].some(o => isHoli(new Date(w.getTime() + o * DAY)))) w.setUTCDate(w.getUTCDate() + 7);
    return dateToDay(w);
  }
  // 앞으로 `years`년간의 임기만료 선거 일정
  function schedule(years = 30) {
    const out = [];
    for (let y = 2028, n = 23; y < 2026 + years; y += 4, n++)
      out.push({ type: 'nat', name: `제${n}대 국회의원선거`, day: electionDay(ymd(y, 5, 29), 50) });
    for (let y = 2030, n = 21; y < 2026 + years; y += 5, n++)
      out.push({ type: 'pres', name: `제${n + 2}대 대통령선거`, day: electionDay(ymd(y, 6, 3), 70) });
    for (let y = 2030, n = 9; y < 2026 + years; y += 4, n++)
      out.push({ type: 'gov', name: `제${n}회 전국동시지방선거`, day: electionDay(ymd(y, 6, 30), 30) });
    out.forEach(e => (e.key = e.type + e.day));
    return out.sort((a, b) => a.day - b.day);
  }

  // 최대잉여(Hare)식 정수 배분
  function hare(total, weights) {
    const sum = weights.reduce((a, b) => a + b, 0);
    if (total <= 0 || sum <= 0) return weights.map(() => 0);
    const raw = weights.map(w => (total * w) / sum);
    const out = raw.map(Math.floor);
    let left = total - out.reduce((a, b) => a + b, 0);
    raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0])
      .slice(0, left).forEach(([, i]) => out[i]++);
    return out;
  }

  // 공직선거법 제189조 준연동형 비례대표 의석배분
  // parties: [{id, votes(비례 득표수), district(지역구 당선수)}], 지역구 당선 합계는 254 이하
  function allocatePR(parties, prSeats = LAW.prSeats, total = LAW.totalSeats) {
    const allVotes = parties.reduce((a, p) => a + p.votes, 0);
    const elig = parties.filter(p => p.votes > 0 && (p.votes / allVotes >= LAW.prThreshold || p.district >= LAW.prDistrictAlt));
    const res = Object.fromEntries(parties.map(p => [p.id, 0]));
    if (!elig.length) return res;
    const eVotes = elig.reduce((a, p) => a + p.votes, 0);
    const otherDistrict = LAW.districtSeats - elig.reduce((a, p) => a + p.district, 0);
    const base = total - otherDistrict;
    // 연동배분의석: ((기준의석 × 득표비율) − 지역구당선수) ÷ 2, 소수점 첫째자리 반올림, 1 미만은 0
    let s = elig.map(p => Math.max(0, Math.round((base * p.votes / eVotes - p.district) / 2)));
    const sum = s.reduce((a, b) => a + b, 0);
    if (sum < prSeats) {
      const extra = hare(prSeats - sum, elig.map(p => p.votes)); // 잔여배분의석
      s = s.map((v, i) => v + extra[i]);
    } else if (sum > prSeats) {
      s = hare(prSeats, s); // 조정의석
    }
    elig.forEach((p, i) => (res[p.id] = s[i]));
    return res;
  }

  // 정치자금법 제27조 경상·선거보조금 배분 비율
  // parties: [{id, seats, voteShare(최근 총선 비례 득표율 0~1), participated}]
  function subsidyShares(parties) {
    const res = Object.fromEntries(parties.map(p => [p.id, 0]));
    const caucus = parties.filter(p => p.seats >= LAW.caucus);
    const mid = parties.filter(p => p.seats >= 5 && p.seats < LAW.caucus);
    const small = parties.filter(p => p.seats < 5 && p.participated &&
      (p.voteShare >= 0.02 || (p.seats > 0 && p.voteShare >= 0.005)));
    let used = 0;
    if (caucus.length) { caucus.forEach(p => (res[p.id] += 0.5 / caucus.length)); used += 0.5; }
    mid.forEach(p => { res[p.id] += 0.05; used += 0.05; });
    small.forEach(p => { res[p.id] += 0.02; used += 0.02; });
    const rest = Math.max(0, 1 - used);
    const seatSum = parties.reduce((a, p) => a + p.seats, 0);
    const voteSum = parties.reduce((a, p) => a + (p.participated ? p.voteShare : 0), 0);
    parties.forEach(p => {
      if (seatSum) res[p.id] += rest * 0.5 * p.seats / seatSum;
      if (voteSum && p.participated) res[p.id] += rest * 0.5 * p.voteShare / voteSum;
    });
    return res;
  }

  // 공직선거법 제57조·제122조의2: 득표 15% 이상 전액, 10% 이상 절반
  const refundRate = share => (share >= 0.15 ? 1 : share >= 0.10 ? 0.5 : 0);

  // 기탁금(청년 감액: 29세 이하 50%, 30~39세 70%. 대통령선거 제외)
  function deposit(kind, age) {
    const base = LAW.deposit[kind];
    if (kind === 'pres') return base;
    return age < 30 ? base * 0.5 : age < 40 ? base * 0.7 : base;
  }

  const L = { REGIONS, LAW, EPOCH, dayToDate, dateToDay, electionDay, schedule, hare, allocatePR, subsidyShares, refundRate, deposit };
  if (typeof module !== 'undefined') module.exports = L; else G.L = L;
})(this);
