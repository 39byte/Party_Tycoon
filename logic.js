// 정당 키우기 — 순수 규칙(법률 수치·선거 산식). 브라우저와 node(test.js) 양쪽에서 사용.
(function (G) {
  // k, 이름, 22대 지역구 의석, 선거인(백만, 21대 대선 2025.6.3), 성향(-1 보수 ~ +1 진보, 근사), 타일맵 열/행, 21대 대선 투표율(%),
  // 성향 흔들림(게임마다 성향에 더하는 정규 잡음의 표준편차): 2006~2026 대선·총선·지선과 여론조사에서 '지역 보수 득표율 − 전국'이 선거마다 출렁인 폭(근사).
  //   예) 대선 보수 후보 득표율 편차 2012·2022·2025 — 대구 +28.5·+26.5·+26.4(작음), 세종 +0.3·−4.5·−8.0(큼), 부산은 대선 +8~10이나 2018 지선 민주 압승(지선까지 넣으면 큼)
  const REGIONS = [
    ['incheon', '인천', 14, 2.619348, 0.10, 0, 0, 77.7, 0.05], ['seoul', '서울', 48, 8.293885, 0.12, 1, 0, 80.1, 0.07],
    ['gyeonggi', '경기', 60, 11.715343, 0.15, 2, 0, 79.4, 0.05], ['gangwon', '강원', 8, 1.327019, -0.25, 3, 0, 77.6, 0.07],
    ['chungnam', '충남', 11, 1.839339, -0.05, 0, 1, 76.0, 0.06], ['sejong', '세종', 2, 0.307067, 0.25, 1, 1, 83.1, 0.09],
    ['chungbuk', '충북', 8, 1.379142, 0.0, 2, 1, 77.3, 0.06], ['gyeongbuk', '경북', 13, 2.213614, -0.6, 3, 1, 78.9, 0.06],
    ['jeonbuk', '전북', 10, 1.510908, 0.75, 0, 2, 82.5, 0.08], ['daejeon', '대전', 7, 1.241882, 0.1, 1, 2, 78.7, 0.06],
    ['daegu', '대구', 12, 2.049078, -0.6, 2, 2, 80.2, 0.05], ['ulsan', '울산', 6, 0.934509, -0.25, 3, 2, 80.1, 0.08],
    // 광주·전남은 2026.7.1 전남광주통합특별시로 통합(의석·선거인은 두 곳 합, 투표율은 선거인 가중 평균)
    ['jeonnam', '전남광주', 18, 2.753902, 0.8, 0, 3, 83.7, 0.08],
    ['gyeongnam', '경남', 16, 2.776028, -0.3, 2, 3, 78.5, 0.07], ['busan', '부산', 18, 2.865552, -0.3, 3, 3, 78.4, 0.08],
    ['jeju', '제주', 3, 0.565255, 0.15, 0, 4, 74.6, 0.08],
  ].map(([k, n, seats, voters, lean, c, r, to, sw]) => ({ k, n, seats, voters, lean, c, r, to, sw }));

  const LAW = {
    founders: 200, chapterFounders: 100,        // 정당법 제6조
    prepDays: 180,                              // 정당법 제8조: 결성신고 후 6개월
    minChapters: 5, chapterMembers: 1000,       // 정당법 제17조·제18조
    totalSeats: 300, prSeats: 46, districtSeats: 254,
    prThreshold: 0.03, prDistrictAlt: 5,        // 공직선거법 제189조 봉쇄조항
    caucus: 20,                                 // 국회법 제33조
    voters: 44_391_871,                         // 선거인 수(21대 대선, 국내)
    // 최근 20년 평균 투표율(%): 대선 2007~2025 63.0·75.8·77.2·77.1·79.4, 총선 2008~2024 46.1·54.2·58.0·66.2·67.0, 지선 2010~2026 54.5·56.8·60.2·50.9·61.0
    // last: 21대 대선 전국 투표율(지역 투표율 편차의 기준)
    turnout: { pres: 74.5, nat: 58.3, gov: 56.7, last: 79.38 },
    invalid: { pres: 0.007, nat: 0.015, pr: 0.044, gov: 0.02 }, // 무효표 비율(근사)
    subsidyUnit: 1_211,                         // 2026년 보조금 계상단가(원)
    womenSubsidyUnit: 100,                      // 여성추천보조금 단가(원)
    fundCap: 5_000_000_000,                     // 중앙당후원회 연간 모금한도(선거 있는 해 2배)
    age: { pres: 40, nat: 18, gov: 18 },        // 공직선거법 제16조
    deposit: { pres: 300_000_000, nat: 15_000_000, pr: 5_000_000, gov: 50_000_000 }, // 제56조
    campaignDays: { pres: 35, nat: 28, gov: 28 }, // 제33조 선거기간(대선 23·총선·지선 14일). 선거운동·공방을 길게 하려고 게임에선 늘림
    pollBan: 6,                                 // 제108조 여론조사 공표 금지
    regDeadline: { pres: 37, nat: 30, gov: 30 }, // 후보자등록 마감(선거일 전). 늘린 선거기간 전에 마감되게 당김
    nomDays: 75,                                // 공천 시작(선거일 전). 게임 속도를 위해 120일에서 줄임, 등록 마감을 당긴 만큼 늘림
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
  // 재·보궐선거일: 국회의원 보궐선거는 사유가 확정된 뒤 첫 4월 첫 수요일(제34조 공휴일 규칙 포함)에 하고,
  // 지방선거·대선의 후보 등록 전(선거일 JOINT_CUTOFF일 전까지)에 사유가 확정되면 그 선거와 같은 날 함(2026년 6·3 지선 동시 실시 사례).
  // 게임에선 공천·등록할 시간이 있도록 사유일부터 minLead일이 안 남은 4월은 건너뜀. JOINT_CUTOFF 34일은 6·3 지선의 4월 30일 기한을 일반화한 근사치
  const JOINT_CUTOFF = 34;
  // hosts: 같은 날 치를 수 있는 선거 유형(의원 보궐은 지선·대선, 단체장 보궐은 총선·대선)
  function byeDay(day, events = [], minLead = 50, hosts = ['gov', 'pres']) {
    let yy = dayToDate(day).getUTCFullYear(), base;
    while ((base = electionDay(ymd(yy, 4, 1), 0)) - day < minLead) yy++;
    const j = events.filter(e => hosts.includes(e.type) && e.day < base && e.day - day >= JOINT_CUTOFF).sort((a, b) => a.day - b.day)[0];
    return j ? { day: j.day, with: j.key } : { day: base, with: null };
  }
  // 게임 선거 주기: 총선·대선·지선이 같은 2년(CYCLE일) 주기로 이 순서대로 돌아가며 CYCLE/3일(약 243일)마다 하나씩 열림.
  // 기준 선거(baseType, baseDay) 다음부터 n개. 날짜는 기준일에서 바로 계산해 오차가 쌓이지 않고, 수요일·공휴일 규칙은 electionDay와 같음
  const CYCLE = 730, ROT = ['nat', 'pres', 'gov'];
  function cadence(baseDay, baseType, n) {
    const i0 = ROT.indexOf(baseType);
    return Array.from({ length: n }, (_, j) => ({ type: ROT[(i0 + j + 1) % 3], day: electionDay(dayToDate(baseDay + Math.round((j + 1) * CYCLE / 3)), 0) }));
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

  // 후보 개인 점수(로그 배율, 득표력에 exp(점수)배). 기준(0점) = 역량 60·청렴 60·인지도 30·전과 없음
  // 비중(최고~최저 후보 차이): 역량 2.9 > 정당 지지율(ln 지역 정당 득표력, 40% 대 5%면 2.1) > 전과 0.9(3건까지) > 청렴 0.8 > 인지도 0.55
  // 그래서 지지율이 높은 당이라도 역량·전과·청렴이 크게 처지는 후보는 짐
  const CW = { skill: 1.3, rec: 0.3, integ: 0.35, fame: 0.25 };
  const cl = (x, a, b) => Math.min(b, Math.max(a, x));
  const candScore = p => p ? CW.skill * cl((p.skill - 60) / 40, -1.25, 1) - CW.rec * Math.min(3, p.rec?.length || 0)
    + CW.integ * cl(((p.integ ?? 60) - 60) / 40, -1.25, 1) + CW.fame * cl((p.fame - 30) / 40, -0.75, 1.5) : 0;

  // 지지층 5계층 [충성, 우호, 중립, 적대, 혐오] 비중(합 1). 계층마다 사건에 흔들리는 정도가 다름: 중립이 가장 크고, 다음이 우호·적대
  // 악재엔 충성층이 거의 안 흔들리고(이미 등 돌린 혐오층도), 호재엔 혐오층이 거의 안 넘어옴
  const TIERS = ['충성', '우호', '중립', '적대', '혐오'];
  const TIER_NEG = [0.2, 0.7, 1, 0.7, 0.3], TIER_POS = [0.3, 0.7, 1, 0.7, 0.2];
  const TIER_REF = [0.05, 0.15, 0.6, 0.15, 0.05]; // 이 분포일 때 배율 1
  const tierW = (t, w) => t.reduce((a, x, i) => a + x * w[i], 0);
  // 신뢰 변화 배율: 중립층이 두꺼운 당일수록 크게, 충성(악재)·혐오(호재)가 두꺼울수록 작게
  const tierMul = (t, d) => { const w = d < 0 ? TIER_NEG : TIER_POS; return tierW(t, w) / tierW(TIER_REF, w); };
  // 사건 하나에 계층이 한 칸씩 이동: 악재(d<0)면 혐오 쪽으로, 호재면 충성 쪽으로. 흔들리는 정도가 큰 계층일수록 많이 움직임(신뢰 1당 1%, 한 번에 최대 30%)
  function tierShift(t, d, rate = 0.01) {
    const w = d < 0 ? TIER_NEG : TIER_POS, p = Math.min(0.3, Math.abs(d) * rate), o = t.slice();
    for (let i = 0; i < 5; i++) { const j = d < 0 ? i + 1 : i - 1; if (j < 0 || j > 4) continue; const m = t[i] * p * w[i]; o[i] -= m; o[j] += m; }
    return o;
  }
  // 평소엔 양 끝 계층이 천천히 중립 쪽으로 돌아옴(하루 r)
  function tierRelax(t, r = 0.0015) {
    const o = t.slice(), mv = (i, j) => { const m = t[i] * r; o[i] -= m; o[j] += m; };
    mv(0, 1); mv(1, 2); mv(3, 2); mv(4, 3);
    return o;
  }
  // 지지율(%)과 계층을 맞춤(하루에 어긋난 몫의 r씩): 충성층은 지지자 안에서만 나옴(지지율의 80%까지, 넘는 몫은 우호층으로),
  // 지지율이 낮을수록 혐오층이 충성층보다 두꺼워야 함(지지율 10%면 같게, 3%면 1.35배, 30% 이상은 제한 없음. 모자란 몫은 중립층에서)
  function tierAnchor(t, sup, r = 0.05) {
    const o = t.slice(), cap = sup / 100 * 0.8;
    if (o[0] > cap) { const m = (o[0] - cap) * r; o[0] -= m; o[1] += m; }
    const need = o[0] * cl(1.5 - sup / 20, 0, 1.5) - o[4];
    if (need > 0) { const m = Math.min(need * r, o[2]); o[2] -= m; o[4] += m; }
    return o;
  }
  // 한 지역 안에서 당끼리 계층을 맞춤(ts = {당: 계층}, ideo = {당: 노선}). 노선 부호가 반대면 반대 진영, 중도(0)는 어느 쪽과도 반대 아님
  // ① 충성은 한 당에만: 충성층 합이 1을 넘으면 넘는 비율만큼 우호층으로
  // ② 반대 진영 두 당을 동시에 좋아할(충성+우호) 수 없음: 두 당의 호감층 합이 1을 넘으면 넘는 몫을 호감층 크기 비례로 중립층으로(우호부터, 모자라면 충성)
  // ③ 한 당의 충성층은 반대 진영 당들을 싫어함: 반대 진영 충성층 합만큼은 적대+혐오가 되도록 하루에 모자란 몫의 r씩 적대층으로(중립층부터, 모자라면 우호·충성층에서)
  // 같은 진영 여러 당을 함께 좋아하거나, 여러 당을 함께 싫어하거나, 어느 당도 좋아하지 않는 건 막지 않음
  function tierCross(ts, ideo, r = 0.05) {
    const ids = Object.keys(ts), o = Object.fromEntries(ids.map(id => [id, ts[id].slice()]));
    const opp = (a, b) => ideo[a] * ideo[b] < 0, like = t => t[0] + t[1];
    const L0 = ids.reduce((a, id) => a + o[id][0], 0);
    if (L0 > 1) for (const id of ids) { const m = o[id][0] * (1 - 1 / L0); o[id][0] -= m; o[id][1] += m; }
    const drop = (t, m) => { const a = Math.min(m, t[1]); t[1] -= a; t[0] -= m - a; t[2] += m; };
    for (const a of ids) for (const b of ids) if (a < b && opp(a, b)) {
      const la = like(o[a]), lb = like(o[b]), ex = la + lb - 1;
      if (ex > 0) { drop(o[a], ex * la / (la + lb)); drop(o[b], ex * lb / (la + lb)); }
    }
    for (const y of ids) {
      const need = ids.filter(x => opp(x, y)).reduce((a, x) => a + ts[x][0], 0) - o[y][3] - o[y][4];
      let m = need * r;
      if (need > 0) for (const i of [2, 1, 0]) { const a = Math.min(m, o[y][i]); o[y][i] -= a; o[y][3] += a; m -= a; }
    }
    return o;
  }
  // 다른 당 법안 당론의 지지층 효과. op: 당론이 여론과 맞는 정도(0~1, 0이면 효과 없음) → 혐오→적대, 적대→중립으로 끌어당김(최대 7%)
  // ln: 당론이 노선과 맞는 정도(0~1) → 우호→충성으로 굳히지만 적대→혐오도 굳음(최대 5%)
  function tierVote(t, op, ln) {
    const o = t.slice(), mv = (i, j, p) => { const m = t[i] * p; o[i] -= m; o[j] += m; };
    if (op > 0) { mv(4, 3, op * 0.07); mv(3, 2, op * 0.07); }
    if (ln > 0) { mv(1, 0, ln * 0.05); mv(3, 4, ln * 0.05); }
    return o;
  }
  // 지지율이 따라가는 속도 배율: 충성층이 두꺼우면 덜 빠지고(다른 당으로 덜 넘어감), 혐오층이 두꺼우면 덜 오름
  const tierSup = (t, up) => cl((1 - 2 * t[up ? 4 : 0]) / 0.9, 0.3, 1.2);

  // 다른 당 주간 방침: tools/jeff에서 Jeff(jeff.routing.tools)가 고른 확률을 softmax 회귀로 배운 가중치(RIV_W, fit.py가 채움). 없으면 null
  // c: 다음 선거까지 주(wk), 선거운동기간(camp 0/1), 의석, 전국 지지율(%), 4주 변화(%p), 다른 당 최고와의 차(%p), 대통령 배출(pres 0/1), 대통령 지지율, 최근 악재 뒤 주(hit)
  const POSTURES = ['campaign', 'policy', 'attack', 'coalition', 'lowkey'];
  const rivalFeat = c => [1, Math.min(c.wk, 52) / 52, c.wk <= 6 ? 1 : 0, c.camp, c.seats / 300, c.seats < 20 ? 1 : 0, c.sup / 50, c.trend / 5, c.gap / 10, c.pres, c.pres ? (c.appr - 50) / 20 : 0, c.hit <= 4 ? 1 : 0];
  const RIV_W = [[2.027,-1.755,0.108,-0.627,0.411,-0.346,0.237,0.018,-0.006,-0.571,-0.999,-1.798],[-0.168,1.552,-0.339,-0.173,-0.022,-0.029,0.205,0.041,-0.066,0.003,0.178,-0.274],[-0.889,-0.431,0.217,0.572,0.092,-0.428,-0.319,-0.046,-0.131,-0.206,-0.149,-0.221],[0.248,0.113,0.069,0.166,-1.654,0.941,0.06,-0.024,-0.065,-0.467,0.163,-0.904],[-1.218,0.521,-0.056,0.062,1.172,-0.139,-0.182,0.012,0.268,1.241,0.808,3.198]]; // fit.py: 3000건, 검증 일치 82%
  const rivalPolicy = (f, W = RIV_W) => {
    if (!W) return null; // 학습 전: 방침 없음(예전 행동 그대로)
    const z = W.map(w => w.reduce((s, x, i) => s + x * f[i], 0)), m = Math.max(...z), e = z.map(x => Math.exp(x - m)), s = e.reduce((a, b) => a + b, 0);
    return e.map(x => x / s);
  };

  // 행정 분야별 특기(숨은 값): apt = { care 돌봄·복지, safe 안전, biz 경제·일자리, dev 개발 }, 4분야 합 0 → 분야 역량(역량 + apt) 평균이 역량
  // 출신 직업 기본값(행마다 합 0) + 분야마다 정규 잡음(표준편차 6), ±20. 성향 st: −1 신중형 ~ +1 추진형(표준편차 0.5 + 직업 기울기)
  const PJ_CATS = ['care', 'safe', 'biz', 'dev'];
  const APT_JOB = [[/의사/, [12, 1, -6, -7]], [/시민운동|시민사회/, [12, 0, -3, -9]], [/노동/, [4, 1, 6, -11]], [/청년/, [5, -4, 4, -5]], [/교수/, [4, -3, 4, -5]],
    [/장성/, [-8, 12, -4, 0]], [/검사|판사/, [-2, 10, -6, -2]], [/변호사/, [-2, 6, -2, -2]], [/기업인/, [-10, -4, 11, 3]], [/지방의원/, [-2, -2, -2, 6]],
    [/고위공무원/, [-1, 1, -1, 1]], [/언론인/, [1, 1, -1, -1]], [/방송인/, [1, -1, 1, -1]]];
  const STYLE_JOB = [[/기업인/, 0.3], [/장성/, 0.2], [/고위공무원/, -0.3], [/의사/, -0.2]];
  function aptGen(job, g) { // g: 표준정규 난수
    const j = job || '', b = (APT_JOB.find(([rx]) => rx.test(j)) || [0, [0, 0, 0, 0]])[1];
    let a = b.map(x => x + g() * 6);
    for (let i = 0; i < 4; i++) { const m = a.reduce((s, x) => s + x, 0) / 4; a = a.map(x => cl(x - m, -20, 20)); } // 평균 0으로 맞추고 자름(반복하면 합이 0에 붙음)
    return { apt: Object.fromEntries(PJ_CATS.map((c, i) => [c, +a[i].toFixed(1)])), st: +cl(g() * 0.5 + ((STYLE_JOB.find(([rx]) => rx.test(j)) || [0, 0])[1]), -1, 1).toFixed(2) };
  }
  const areaSkill = (skill, apt, c) => skill + (apt?.[c] || 0);
  // 주민 관심 배율(지방 정부 탭 수요·공급): 분야 수요 비중(최근 소식)이 공급 비중(최근 성공 사업)보다 클수록 성공 효과가 큼(0.4~1.4배). 집계가 비면 네 분야 25%씩
  const share = (o, c) => { const t = Object.values(o).reduce((a, b) => a + b, 0); return t ? (o[c] || 0) / t : 0.25; };
  const demMul = (dem, sup, c) => cl(1 + 1.6 * (share(dem, c) - share(sup, c)), 0.4, 1.4);
  // 행정 성향 배율: 추진형(st > 0)은 성공 효과·실패 감점이 모두 크고 신중형은 작음(±25%)
  const styleMul = st => 1 + 0.25 * (st || 0);
  // 기대치 역효과: 잘한다던 분야(apt > 0)에서 실패하면 감점이 커짐(apt 20이면 2배), 성향 배율도 곱함
  const flopMul = (a, st) => (1 + Math.max(0, a || 0) / 20) * styleMul(st);
  // 행정 사업 분야 효용(다른 당 지사·우리 자동화 지사가 분야를 고를 때): 기대 행정 지지도 변화 + 성향 선호(추진형은 개발·경제, 신중형은 돌봄·안전 쪽으로 최대 0.5)
  // p 성공률, up/dn 성공·실패 폭, dm 주민 관심 배율, a 그 분야 특기, st 성향. Jeff 학습으로 바꿀 땐 이 함수만 갈아 끼움
  const admU = (p, up, dn, dm, a, st, c) => p * up * dm * styleMul(st) - (1 - p) * dn * flopMul(a, st) + 0.5 * (st || 0) * (c === 'dev' || c === 'biz' ? 1 : -1);
  // softmax(온도 T)로 하나 고름(효용이 높을수록 자주, 늘 같은 답은 아님). r: 0~1 난수
  function softPick(us, r, T = 1) {
    const m = Math.max(...us), e = us.map(u => Math.exp((u - m) / T)); let x = r * e.reduce((a, b) => a + b, 0);
    for (let i = 0; i < e.length; i++) if ((x -= e[i]) < 0) return i;
    return e.length - 1;
  }

  const L = { REGIONS, LAW, EPOCH, dayToDate, dateToDay, electionDay, byeDay, JOINT_CUTOFF, CYCLE, ROT, cadence, schedule, hare, allocatePR, subsidyShares, refundRate, deposit, CW, candScore,
    TIERS, tierMul, tierShift, tierRelax, tierAnchor, tierCross, tierSup, tierVote, POSTURES, rivalFeat, rivalPolicy, PJ_CATS, APT_JOB, aptGen, areaSkill, demMul, styleMul, flopMul, admU, softPick };
  if (typeof module !== 'undefined') module.exports = L; else G.L = L;
})(this);
