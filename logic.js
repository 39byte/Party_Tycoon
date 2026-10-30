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

  // 22대 국회의원선거(2024.4.10) 지역구 254곳. 시·도마다 REGIONS의 의석 수와 같은 길이. 끝 글자 갑·을·병·정·무는 세부 선거구
  // 전남광주(통합특별시)는 옛 광주 8곳 다음 옛 전남 10곳. 세종은 시 전체라 '갑'·'을'만
  const D = s => s.split(' ');
  const DISTRICTS = {
    seoul: D('종로구 중구성동구갑 중구성동구을 용산구 광진구갑 광진구을 동대문구갑 동대문구을 중랑구갑 중랑구을 성북구갑 성북구을 강북구갑 강북구을 도봉구갑 도봉구을 노원구갑 노원구을 은평구갑 은평구을 서대문구갑 서대문구을 마포구갑 마포구을 양천구갑 양천구을 강서구갑 강서구을 강서구병 구로구갑 구로구을 금천구 영등포구갑 영등포구을 동작구갑 동작구을 관악구갑 관악구을 서초구갑 서초구을 강남구갑 강남구을 강남구병 송파구갑 송파구을 송파구병 강동구갑 강동구을'),
    busan: D('중구영도구 서구동구 부산진구갑 부산진구을 동래구 남구 북구갑 북구을 해운대구갑 해운대구을 사하구갑 사하구을 금정구 강서구 연제구 수영구 사상구 기장군'),
    daegu: D('중구남구 동구군위군갑 동구군위군을 서구 북구갑 북구을 수성구갑 수성구을 달서구갑 달서구을 달서구병 달성군'),
    incheon: D('중구강화군옹진군 동구미추홀구갑 동구미추홀구을 연수구갑 연수구을 남동구갑 남동구을 부평구갑 부평구을 계양구갑 계양구을 서구갑 서구을 서구병'),
    daejeon: D('동구 중구 서구갑 서구을 유성구갑 유성구을 대덕구'),
    ulsan: D('중구 남구갑 남구을 동구 북구 울주군'),
    sejong: D('갑 을'),
    gyeonggi: D('수원시갑 수원시을 수원시병 수원시정 수원시무 성남시수정구 성남시중원구 성남시분당구갑 성남시분당구을 의정부시갑 의정부시을 안양시만안구 안양시동안구갑 안양시동안구을 부천시갑 부천시을 부천시병 광명시갑 광명시을 평택시갑 평택시을 평택시병 동두천시양주시연천군갑 동두천시양주시연천군을 안산시갑 안산시을 안산시병 고양시갑 고양시을 고양시병 고양시정 의왕시과천시 구리시 남양주시갑 남양주시을 남양주시병 오산시 시흥시갑 시흥시을 군포시 하남시갑 하남시을 용인시갑 용인시을 용인시병 용인시정 파주시갑 파주시을 이천시 안성시 김포시갑 김포시을 화성시갑 화성시을 화성시병 화성시정 광주시갑 광주시을 포천시가평군 여주시양평군'),
    gangwon: D('춘천시철원군화천군양구군갑 춘천시철원군화천군양구군을 원주시갑 원주시을 강릉시 동해시태백시삼척시정선군 속초시인제군고성군양양군 홍천군횡성군영월군평창군'),
    chungbuk: D('청주시상당구 청주시서원구 청주시흥덕구 청주시청원구 충주시 제천시단양군 보은군옥천군영동군괴산군 증평군진천군음성군'),
    chungnam: D('천안시갑 천안시을 천안시병 공주시부여군청양군 보령시서천군 아산시갑 아산시을 서산시태안군 논산시계룡시금산군 당진시 홍성군예산군'),
    jeonbuk: D('전주시갑 전주시을 전주시병 군산시김제시부안군갑 군산시김제시부안군을 익산시갑 익산시을 정읍시고창군 남원시장수군임실군순창군 완주군진안군무주군'),
    jeonnam: D('동구남구갑 동구남구을 서구갑 서구을 북구갑 북구을 광산구갑 광산구을 목포시 여수시갑 여수시을 순천시광양시곡성군구례군갑 순천시광양시곡성군구례군을 나주시화순군 담양군함평군영광군장성군 고흥군보성군장흥군강진군 해남군완도군진도군 영암군무안군신안군'),
    gyeongbuk: D('포항시북구 포항시남구울릉군 경주시 김천시 안동시예천군 구미시갑 구미시을 영주시영양군봉화군 영천시청도군 상주시문경시 경산시 의성군청송군영덕군울진군 고령군성주군칠곡군'),
    gyeongnam: D('창원시의창구 창원시성산구 창원시마산합포구 창원시마산회원구 창원시진해구 진주시갑 진주시을 통영시고성군 사천시남해군하동군 김해시갑 김해시을 밀양시의령군함안군창녕군 거제시 양산시갑 양산시을 산청군함양군거창군합천군'),
    jeju: D('제주시갑 제주시을 서귀포시'),
  };
  // 선거구 이름을 [기본 이름, 갑·을…]로: '송파구갑' → ['송파구', '갑'], '종로구' → ['종로구', ''], 세종 '갑' → ['', '갑']
  const distParts = d => { const m = /^(.*?)([갑을병정무]?)$/.exec(d); return [m[1], m[2]]; };

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

  const L = { REGIONS, DISTRICTS, distParts, LAW, EPOCH, dayToDate, dateToDay, electionDay, schedule, hare, allocatePR, subsidyShares, refundRate, deposit, CW, candScore };
  if (typeof module !== 'undefined') module.exports = L; else G.L = L;
})(this);
