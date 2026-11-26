// 정당 키우기 — 순수 규칙(법률 수치·선거 산식). 브라우저와 node(test.js) 양쪽에서 사용.
(function (G) {
  // k, 이름, 22대 지역구 의석, 선거인(백만, 21대 대선 2025.6.3), 성향(-1 보수 ~ +1 진보, 근사), 타일맵 열/행, 21대 대선 투표율(%),
  // 성향 흔들림(게임마다 성향에 더하는 정규 잡음의 표준편차): 2006~2026 대선·총선·지선과 여론조사에서 '지역 보수 득표율 − 전국'이 선거마다 출렁인 폭(근사).
  //   예) 대선 보수 후보 득표율 편차 2012·2022·2025 — 대구 +28.5·+26.5·+26.4(작음), 세종 +0.3·−4.5·−8.0(큼), 부산은 대선 +8~10이나 2018 지선 민주 압승(지선까지 넣으면 큼)
  // 22대 국회 지역구(2024.4.10 총선): [선거구 이름, 그때 선거인 수, 성향 편차]. 지역 순서는 REGIONS와 같음, 전남광주는 광주 8곳 + 전남 10곳
  // 게임에선 지역 선거인(21대 대선)을 이 선거인 비율로 나눠 씀. 출처: 위키백과 '대한민국 제22대 국회의원 선거 (시·도)' 개표 결과(중앙선거관리위원회 자료)
  // 성향 편차(+ 진보, ±0.5 안): 그 선거구 22대 총선 지역구 득표의 진영 차 (진보 − 보수) ÷ (진보 + 보수)에서 시·도 평균(선거인 가중)을 뺀 값. 지역 성향(lean)에 더해 선거구 성향이 됨
  //   진보 = 민주·조국혁신·진보·새로운미래·녹색정의·새진보연합·소나무 등, 보수 = 국민의힘·개혁신당·자유통일·우리공화 등, 무소속은 뺌(한 진영 후보가 없으면 나머지 표를 상대 진영으로)
  //   후보 개인 바람이 당 성향을 가린 화성 을(개혁신당 이준석 당선)·순천광양곡성구례 을(국민의힘 이정현 23.7%)은 0
  const DISTS = {
    incheon: [["중구·강화군·옹진군", 218648, -0.2], ["동구·미추홀구 갑", 225741, -0.02], ["동구·미추홀구 을", 185368, -0.1], ["연수구 갑", 166126, -0.03], ["연수구 을", 156982, -0.06], ["남동구 갑", 208476, 0.05], ["남동구 을", 215847, -0.0], ["부평구 갑", 229074, 0.01], ["부평구 을", 206143, 0.13], ["계양구 갑", 120600, 0.08], ["계양구 을", 127351, -0.01], ["서구 갑", 174282, 0.07], ["서구 을", 167373, 0.04], ["서구 병", 179572, 0.06]],
    seoul: [["종로구", 126041, -0.02], ["중구·성동구 갑", 180528, -0.01], ["중구·성동구 을", 177422, -0.05], ["용산구", 188998, -0.11], ["광진구 갑", 150187, -0.01], ["광진구 을", 151508, -0.04], ["동대문구 갑", 151861, -0.01], ["동대문구 을", 154549, 0.03], ["중랑구 갑", 156202, 0.17], ["중랑구 을", 188139, 0.09], ["성북구 갑", 195813, 0.15], ["성북구 을", 178667, 0.07], ["강북구 갑", 132265, 0.08], ["강북구 을", 128295, 0.1], ["도봉구 갑", 136836, -0.05], ["도봉구 을", 138197, -0.01], ["노원구 갑", 224187, 0.12], ["노원구 을", 211043, 0.13], ["은평구 갑", 219044, 0.15], ["은평구 을", 195270, 0.14], ["서대문구 갑", 130042, -0.05], ["서대문구 을", 141489, 0.09], ["마포구 갑", 139968, -0.07], ["마포구 을", 182761, 0.16], ["양천구 갑", 195448, -0.05], ["양천구 을", 175761, 0.08], ["강서구 갑", 168119, 0.16], ["강서구 을", 171060, 0.03], ["강서구 병", 158668, 0.12], ["구로구 갑", 205069, 0.05], ["구로구 을", 141985, 0.13], ["금천구", 207518, 0.12], ["영등포구 갑", 193458, 0.03], ["영등포구 을", 141494, -0.05], ["동작구 갑", 180193, 0.03], ["동작구 을", 158571, -0.15], ["관악구 갑", 242617, 0.08], ["관악구 을", 204556, 0.16], ["서초구 갑", 154336, -0.43], ["서초구 을", 189614, -0.21], ["강남구 갑", 156085, -0.35], ["강남구 을", 168269, -0.24], ["강남구 병", 143901, -0.41], ["송파구 갑", 151559, -0.16], ["송파구 을", 191803, -0.21], ["송파구 병", 220956, -0.04], ["강동구 갑", 199231, -0.06], ["강동구 을", 198766, 0.01]],
    gyeonggi: [["수원시 갑", 200396, -0.01], ["수원시 을", 213733, 0.12], ["수원시 병", 182482, -0.01], ["수원시 정", 201075, -0.1], ["수원시 무", 227030, 0.06], ["성남시 수정구", 209986, 0.05], ["성남시 중원구", 186583, 0.08], ["성남시 분당구 갑", 214158, -0.19], ["성남시 분당구 을", 182451, -0.14], ["의정부시 갑", 177927, -0.02], ["의정부시 을", 222648, -0.01], ["안양시 만안구", 203664, 0.02], ["안양시 동안구 갑", 138721, 0.03], ["안양시 동안구 을", 129800, -0.04], ["부천시 갑", 232632, 0.1], ["부천시 을", 214471, 0.12], ["부천시 병", 233948, 0.12], ["광명시 갑", 113596, 0.06], ["광명시 을", 125172, 0.07], ["평택시 갑", 166864, 0.03], ["평택시 을", 159378, -0.03], ["평택시 병", 171693, 0.01], ["동두천시·양주시·연천군 갑", 218378, 0.09], ["동두천시·양주시·연천군 을", 125278, -0.19], ["안산시 갑", 170398, -0.01], ["안산시 을", 197297, 0.07], ["안산시 병", 181427, -0.04], ["고양시 갑", 228942, 0.17], ["고양시 을", 229773, 0.12], ["고양시 병", 236926, -0.04], ["고양시 정", 227947, -0.02], ["의왕시·과천시", 202961, -0.03], ["구리시", 161475, -0.04], ["남양주시 갑", 180754, -0.1], ["남양주시 을", 208484, 0.02], ["남양주시 병", 225084, -0.03], ["오산시", 193088, 0.06], ["시흥시 갑", 221338, 0.1], ["시흥시 을", 212474, 0.09], ["군포시", 226042, 0.02], ["하남시 갑", 144860, -0.11], ["하남시 을", 127378, 0.01], ["용인시 갑", 225977, -0.09], ["용인시 을", 229759, -0.01], ["용인시 병", 220492, -0.11], ["용인시 정", 223886, -0.06], ["파주시 갑", 226611, 0.15], ["파주시 을", 192812, -0.02], ["이천시", 188859, -0.15], ["안성시", 165008, -0.11], ["김포시 갑", 186262, -0.03], ["김포시 을", 209555, -0.01], ["화성시 갑", 221628, -0.0], ["화성시 을", 169135, 0.0], ["화성시 병", 207233, 0.13], ["화성시 정", 164120, 0.01], ["광주시 갑", 163581, 0.01], ["광주시 을", 170215, -0.02], ["포천시·가평군", 183868, -0.15], ["여주시·양평군", 211775, -0.19]],
    gangwon: [["춘천시·철원군·화천군·양구군 갑", 196972, 0.18], ["춘천시·철원군·화천군·양구군 을", 124089, -0.05], ["원주시 갑", 159375, 0.07], ["원주시 을", 148344, 0.16], ["강릉시", 183878, -0.05], ["동해시·태백시·삼척시·정선군", 196849, -0.19], ["속초시·인제군·고성군·양양군", 148964, -0.04], ["홍천군·횡성군·영월군·평창군", 173056, -0.07]],
    chungnam: [["천안시 갑", 216611, -0.03], ["천안시 을", 182191, 0.09], ["천안시 병", 154083, 0.09], ["공주시·부여군·청양군", 174418, -0.02], ["보령시·서천군", 128959, -0.09], ["아산시 갑", 125706, 0.07], ["아산시 을", 160464, 0.16], ["서산시·태안군", 204098, -0.08], ["논산시·계룡시·금산군", 180091, -0.01], ["당진시", 143594, -0.01], ["홍성군·예산군", 154563, -0.14]],
    sejong: [["갑", 171472, -0.0], ["을", 129759, 0.0]],
    chungbuk: [["청주시 상당구", 169036, 0.04], ["청주시 서원구", 161145, 0.02], ["청주시 흥덕구", 231288, 0.01], ["청주시 청원구", 158647, 0.04], ["충주시", 181005, -0.05], ["제천시·단양군", 139768, -0.06], ["보은군·옥천군·영동군·괴산군", 146169, -0.08], ["증평군·진천군·음성군", 185137, 0.05]],
    gyeongbuk: [["포항시 북구", 228023, 0.1], ["포항시 남구·울릉군", 203445, 0.07], ["경주시", 217609, 0.0], ["김천시", 118478, -0.01], ["안동시·예천군", 181285, 0.06], ["구미시 갑", 173050, 0.02], ["구미시 을", 164338, 0.14], ["영주시·영양군·봉화군", 129648, -0.01], ["영천시·청도군", 128322, -0.06], ["상주시·문경시", 144308, -0.08], ["경산시", 231226, -0.04], ["의성군·청송군·영덕군·울진군", 141262, -0.2], ["고령군·성주군·칠곡군", 160408, -0.09]],
    jeonbuk: [["전주시 갑", 163995, 0.02], ["전주시 을", 166404, -0.16], ["전주시 병", 212820, 0.02], ["군산시·김제시·부안군 갑", 214985, 0.0], ["군산시·김제시·부안군 을", 124423, 0.07], ["익산시 갑", 117633, 0.07], ["익산시 을", 116493, 0.01], ["정읍시·고창군", 137963, 0.01], ["남원시·장수군·임실군·순창군", 133870, 0.03], ["완주군·진안군·무주군", 128570, -0.05]],
    daejeon: [["동구", 190412, -0.05], ["중구", 195348, -0.08], ["서구 갑", 212533, 0.02], ["서구 을", 183839, -0.03], ["유성구 갑", 159614, 0.02], ["유성구 을", 144975, 0.14], ["대덕구", 149618, 0.02]],
    daegu: [["중구·남구", 204639, 0.11], ["동구·군위군 갑", 145881, -0.0], ["동구·군위군 을", 174984, -0.13], ["서구", 149953, 0.04], ["북구 갑", 152872, 0.03], ["북구 을", 208180, 0.0], ["수성구 갑", 201088, 0.15], ["수성구 을", 143624, -0.19], ["달서구 갑", 134682, 0.06], ["달서구 을", 195189, 0.04], ["달서구 병", 124723, -0.19], ["달성군", 214642, -0.02]],
    ulsan: [["중구", 179055, -0.1], ["남구 갑", 139853, -0.05], ["남구 을", 123722, -0.09], ["동구", 127134, 0.13], ["북구", 176056, 0.16], ["울주군", 188440, -0.04]],
    jeonnam: [["광주 동구·남구 갑", 136736, -0.05], ["광주 동구·남구 을", 133090, -0.07], ["광주 서구 갑", 124977, -0.01], ["광주 서구 을", 118893, -0.02], ["광주 북구 갑", 158463, -0.0], ["광주 북구 을", 202572, 0.01], ["광주 광산구 갑", 138064, 0.03], ["광주 광산구 을", 186787, 0.08], ["목포시", 181418, 0.04], ["여수시 갑", 120250, -0.05], ["여수시 을", 114061, 0.04], ["순천시·광양시·곡성군·구례군 갑", 191614, -0.02], ["순천시·광양시·곡성군·구례군 을", 218521, 0.0], ["나주시·화순군", 154071, -0.01], ["담양군·함평군·영광군·장성군", 151967, -0.0], ["고흥군·보성군·장흥군·강진군", 151441, -0.01], ["해남군·완도군·진도군", 124718, 0.02], ["영암군·무안군·신안군", 156151, 0.01]],
    gyeongnam: [["창원시 의창구", 182326, -0.02], ["창원시 성산구", 208594, 0.22], ["창원시 마산합포구", 155430, -0.15], ["창원시 마산회원구", 156812, -0.07], ["창원시 진해구", 158141, 0.12], ["진주시 갑", 167725, -0.04], ["진주시 을", 121959, -0.17], ["통영시·고성군", 147305, -0.1], ["사천시·남해군·하동군", 169430, -0.14], ["김해시 갑", 222271, 0.18], ["김해시 을", 223355, 0.25], ["밀양시·의령군·함안군·창녕군", 218917, -0.21], ["거제시", 191224, 0.06], ["양산시 갑", 151262, 0.02], ["양산시 을", 146338, 0.11], ["산청군·함양군·거창군·합천군", 154837, -0.29]],
    busan: [["중구·영도구", 132866, -0.0], ["서구·동구", 172850, -0.07], ["부산진구 갑", 160658, 0.04], ["부산진구 을", 161857, -0.02], ["동래구", 230465, -0.04], ["남구", 223869, 0.0], ["북구 갑", 121889, 0.14], ["북구 을", 117612, 0.04], ["해운대구 갑", 185494, 0.0], ["해운대구 을", 141382, -0.07], ["사하구 갑", 131310, 0.08], ["사하구 을", 130588, -0.04], ["금정구", 192113, -0.04], ["강서구", 111554, -0.02], ["연제구", 184060, 0.0], ["수영구", 155728, -0.02], ["사상구", 181823, 0.04], ["기장군", 146425, 0.05]],
    jeju: [["제주시 갑", 213825, 0.01], ["제주시 을", 194949, 0.12], ["서귀포시", 155750, -0.16]],
  };
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
  ].map(([k, n, seats, voters, lean, c, r, to, sw]) => ({ k, n, seats, voters, lean, c, r, to, sw, dists: DISTS[k] }));

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
  // 게임 선거 주기: 총선·지선·대선이 같은 2년(CYCLE일) 주기로 이 순서대로 돌아가며 CYCLE/3일(약 243일)마다 하나씩 열림.
  // 기준 선거(baseType, baseDay) 다음부터 n개. 날짜는 기준일에서 바로 계산해 오차가 쌓이지 않고, 수요일·공휴일 규칙은 electionDay와 같음
  const CYCLE = 730, ROT = ['nat', 'gov', 'pres'];
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

  // 인재 영입 조건: 당 인지도·신뢰(0~100)·대표 역량으로 등급 g(0~1)을 정하고, 그에 따라 후보 역량 상한(70~99)과
  // 점수 HI 이상 고능력자 기대 인원(hi: 0~0.62명, 제한 없던 때 평균 0.31명의 2배까지)을 정함. 등급 0.5가 예전 수준
  const TAL_HI = 0.9;
  const talentCap = (fame, trust, lead, bonus = 0) => { // bonus: 난이도 인재풀 등급 보정
    const g = cl(0.425 * fame / 100 + 0.425 * trust / 100 + 0.15 * (lead - 40) / 60 + bonus, 0, 1);
    return { g, skill: Math.round(70 + 29 * g), hi: 0.62 * g };
  };
  // 영입비: 점수 0.3까지는 3천만×e^점수, 그 위로 가팔라져 1.5면 약 100억
  const talentFee = s => 3e7 * Math.exp(s + 3.59 * Math.max(0, s - 0.3));

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

  // 다른 당 공세 기억: m = [공세 수, 역풍 수](논평은 0.5건, 매주 옅어짐). p0 = 신뢰 격차로 본 사전 역풍 확률(무게 2건).
  // 우리가 해명·반박으로 공세를 되받아칠수록 역풍 확률이 오르고, 다른 당은 그만큼 공세를 꺼림
  const bfRate = (m, p0) => ((m?.[1] || 0) + 2 * p0) / ((m?.[0] || 0) + 2);
  // 지지층 비용: 중도 쪽(우호+중립)이 두꺼운 당은 네거티브를 꺼리고, 충성층이 두꺼운 당은 덜 꺼림(결집). t = 그 당 전국 계층
  const baseCost = t => 0.8 * (t[1] + t[2]) - 2 * t[0];
  // 사건 공세 세기 s(0 침묵, 0.5 논평, 1 맹공)별 효용 = s × (이득 g − 역풍 확률 pb × 역풍 손해 b − 지지층 비용 + 보정 x) − s² × 위험 회피(pb × b / 2).
  // 역풍 위험이 애매하면 맹공보다 논평이 낫고, 크면 침묵이 나음. x: 방침·관계 보정
  const ATK_S = [0, 0.5, 1];
  const atkU = (g, b, pb, t, x = 0) => { const v = g - pb * b - baseCost(t) + x, r = pb * b / 2; return ATK_S.map(s => s * v - s * s * r); };
  // 다른 당 주간 방침: 효용 softmax. c: 다음 선거까지 주(wk), 선거운동기간(camp 0/1), 의석, 다른 당 최고와의 차(gap %p), 대통령 배출(pres)·지지율(appr),
  // 최근 악재 뒤 주(hit), 공세 역풍 확률(bf, bfRate), 신뢰 격차(tg = 우리 − 그 당), 전국 계층(t),
  // 선거 예측(없으면 예전 식): play = 승패 직전 경기에 걸린 몫(0~1쯤, 클수록 선거운동·공세가 값짐), thrP = 그 경기들에서 우리 당이 가장 센 상대인 비율(공세 역풍 기억은 우리 당을 칠 때만 걸림)
  const POSTURES = ['campaign', 'policy', 'attack', 'coalition', 'lowkey'];
  const rivalU = c => {
    const far = Math.min(c.wk, 52) / 52, near = c.wk <= 6 ? 1 : 0, fc = c.play != null, bf = fc ? 0.3 + c.thrP * (c.bf - 0.3) : c.bf;
    return [
      1.2 + 1.5 * near + c.camp - far + (fc ? c.play * near : 0), // 선거 총력: 선거가 가까울수록, 걸린 경기가 많을수록
      0.3 + 0.8 * far + Math.max(0, c.tg) / 20, // 민생 정책: 선거가 멀고, 신뢰가 우리보다 낮을수록(신뢰부터 다짐)
      -0.4 + (fc ? 0.6 * c.play : 0.8 * cl(-c.gap / 10, 0, 1)) + 0.4 * c.camp - 2.5 * bf - baseCost(c.t), // 공세: 걸린 경기가 많을수록 하고 싶지만 역풍을 맞아 왔거나 지지층이 중도 쪽이면 접음
      -0.2 + (c.seats < 20 ? 0.9 : 0) - 1.5 * c.seats / 300, // 연대: 작은 당
      -1 + (c.hit <= 4 ? 2.5 : 0) + 3 * Math.max(0, c.bf - 0.5) + (c.pres && c.appr < 35 ? 0.8 : 0), // 몸 낮추기: 악재·역풍 직후, 인기 없는 대통령의 당
    ];
  };
  const rivalPolicy = c => { const z = rivalU(c), m = Math.max(...z), e = z.map(x => Math.exp(x - m)), s = e.reduce((a, b) => a + b, 0); return e.map(x => x / s); };

  // 선거 예측(다른 당 AI): 지역구 득표는 후보마다 로그정규 잡음(σ 0.22)이 붙어 두 후보 차의 표준편차가 RACE_SD. 대선은 전국 운(σ 0.07)뿐이라 PRES_SD
  const RACE_SD = 0.22 * Math.SQRT2, PRES_SD = 0.1;
  const npdf = x => 0.3989423 * Math.exp(-x * x / 2);
  const ncdf = x => { const t = 1 / (1 + 0.2316419 * Math.abs(x)), p = npdf(x) * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; };
  // 한 경기 예측: w = { 당: 득표 무게 } → 당마다 { p 당선 확률, piv 득표 무게가 (로그로) 1 오를 때 당선 확률 증가, opp 가장 센 상대 }.
  // 가장 센 상대와의 로그 차로 근사하고 p는 합 1로 맞춤. piv가 큰 경기 = 승패 직전 경기
  function raceOdds(w, sd = RACE_SD) {
    const ids = Object.keys(w).filter(id => w[id] > 0), o = {};
    for (const id of ids) {
      const opp = ids.filter(x => x !== id).reduce((a, x) => !a || w[x] > w[a] ? x : a, null), z = opp ? Math.log(w[id] / w[opp]) / sd : 9;
      o[id] = { p: ncdf(z), piv: opp ? npdf(z) / sd : 0, opp };
    }
    const s = ids.reduce((a, id) => a + o[id].p, 0);
    for (const id of ids) o[id].p /= s;
    return o;
  }
  // 불출마 당 지지층 이동: 후보를 안 낸 당 몫의 TRANSFER가 같은 진영(노선 부호 같음) 출마 당들에 그 당 몫 비례로 감. 중도(0)거나 같은 진영 후보가 없으면 흩어짐.
  // w = { 당: 무게 }(안 나온 당 포함), ideo = { 당: 노선 }, run = 출마 당 → { 출마 당: 더해질 무게 }. 군소 정당이 같은 진영 표를 가르면 반대 진영이 이득(공천 전략의 근거)
  const TRANSFER = 0.5;
  function absentShift(w, ideo, run) {
    const add = Object.fromEntries(run.map(id => [id, 0]));
    for (const id in w) {
      if (run.includes(id) || !ideo[id]) continue;
      const to = run.filter(x => ideo[x] * ideo[id] > 0), t = to.reduce((a, x) => a + (w[x] || 0), 0);
      if (t > 0) for (const x of to) add[x] += TRANSFER * w[id] * (w[x] || 0) / t;
    }
    return add;
  }
  // 진영 당선 확률: 노선 부호가 g와 같은 당들의 p 합(raceOdds 결과)
  const campWin = (o, ideo, g) => Object.keys(o).filter(id => ideo[id] * g > 0).reduce((a, id) => a + o[id].p, 0);

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
  // 수요·공급(지방 정부 탭): 공급 비중(최근 성공 사업) − 수요 비중(최근 소식) = 틈 g. 화면엔 수치 없이 5단계(공백 | 부족 | 보통 | 과잉 | 포화)만.
  // 공급은 분야마다 1건씩 깔고 셈(첫 성공 한 번에 포화로 튀지 않게, 최근 6건만이라 빨리 바뀜). 수요 집계가 비면 네 분야 25%씩
  const share = (o, c, a = 0) => { const t = Object.values(o).reduce((x, y) => x + y, 0) + 4 * a; return t ? ((o[c] || 0) + a) / t : 0.25; };
  const demGap = (dem, sup, c) => share(sup, c, 1) - share(dem, c);
  const DS_LV = ['공백', '부족', '보통', '과잉', '포화'];
  const demLvl = g => g < -0.3 ? 0 : g < -0.1 ? 1 : g <= 0.1 ? 2 : g <= 0.25 ? 3 : 4;
  // 성공 효과 배율 = 언덕 모양 무리함수 2개: 위쪽 √((0.25 − g) / 0.45), 아래쪽 −1.8√(g − 0.25)가 과잉·포화 경계(0.25)에서 0으로 만나 거기서 가장 가파름.
  // 부족 한가운데(g = −0.2)가 1(기본 상승분), 공백은 최대 1.15, 보통 ≈ 0.9~0.58, 과잉 ≈ 0.58~0, 포화는 언제나 음수(지지도가 깎임), 바닥 −1
  const demMul = (dem, sup, c) => { const g = demGap(dem, sup, c); return g <= 0.25 ? Math.min(1.15, Math.sqrt((0.25 - g) / 0.45)) : Math.max(-1, -1.8 * Math.sqrt(g - 0.25)); };
  // 행정 성향 배율: 추진형(st > 0)은 성공 효과·실패 감점이 모두 크고 신중형은 작음(±25%)
  const styleMul = st => 1 + 0.25 * (st || 0);
  // 행정 사업 분야 효용(다른 당 지사·우리 자동화 지사가 분야를 고를 때): 기대 행정 지지도 변화 + 성향 선호(추진형은 개발·경제, 신중형은 돌봄·안전 쪽으로 최대 0.5)
  // 기대치 역효과: 잘한다던 분야(apt > 0)에서 실패하면 감점이 커짐(apt 20이면 2배), 성향 배율도 곱함. 특기가 지지도 폭에 들어가는 건 이 실패 감점뿐(성공 폭엔 없음)
  const flopMul = (a, st) => (1 + Math.max(0, a || 0) / 20) * styleMul(st);
  // p 성공률, up/dn 성공·실패 폭, dm 수요·공급 배율, a 그 분야 특기, st 성향. Jeff 학습으로 바꿀 땐 이 함수만 갈아 끼움
  const admU = (p, up, dn, dm, a, st, c) => p * up * dm * styleMul(st) - (1 - p) * dn * flopMul(a, st) + 0.5 * (st || 0) * (c === 'dev' || c === 'biz' ? 1 : -1);
  // softmax(온도 T)로 하나 고름(효용이 높을수록 자주, 늘 같은 답은 아님). r: 0~1 난수
  // 다른 당 지사의 분야 고르기: Jeff(jeff.routing.tools)가 고른 분야 확률을 조건부 로짓으로 배운 가중치(ADM_W, tools/jeff/fit_adm.py가 채움). 없으면 null → admU
  // x: 그 분야 { c 분야, p 성공률, up/dn 성공·실패 폭, dm 수요·공급 배율, a 특기, st 성향 }. 효용 = ADM_W · admFeat(x), softPick(T = 1)이면 Jeff 확률을 그대로 따라 함
  const admFeat = x => [x.p, x.p * x.up * x.dm * styleMul(x.st), (1 - x.p) * x.dn * flopMul(x.a, x.st), x.dm, (x.a || 0) / 20, (x.st || 0) * (x.c === 'dev' || x.c === 'biz' ? 1 : -1), x.c === 'care' ? 1 : 0, x.c === 'safe' ? 1 : 0, x.c === 'biz' ? 1 : 0];
  const ADM_W = [0.07,1.445,-0.184,-0.028,-0.149,0.316,1.3,0.757,0.599]; // fit_adm.py: 2000건, 검증 일치 74%
  const admJ = (x, W = ADM_W) => W ? admFeat(x).reduce((s, v, i) => s + v * W[i], 0) : null;
  function softPick(us, r, T = 1) {
    const m = Math.max(...us), e = us.map(u => Math.exp((u - m) / T)); let x = r * e.reduce((a, b) => a + b, 0);
    for (let i = 0; i < e.length; i++) if ((x -= e[i]) < 0) return i;
    return e.length - 1;
  }

  // 난이도: 배후 세력이 기준(지금 규칙 그대로). 쉬울수록 실패·악재·나쁜 효과·비용은 작게, 좋은 효과는 크게, 까다로운 조건은 느슨하게(0이면 없앰)
  // tip 튜토리얼·가이드 조언 | fail 실패·악재 확률 | good·bad 좋은·나쁜 효과 | cost 소모 비용 | upkeep 시설 유지비 | fundCap 후원 한도 | fundCd 후원의 밤 대기(일) | vote 우리 당 기본 득표력
  // rivCap 상대 후보 역량 상한 | tal 인재풀 등급 보정 | hate 혐오층 영향 | lowTr 낮은 신뢰의 지지율 둔화 | offPlus 노선 역풍이 늦게 오는 횟수 | stray 헤드라인 밖 역풍
  // side 중도 한쪽 노선 역풍 | cosign 공동발의 무산 확률 | memJoin 지역 당원 상한 | selfAct 돌출 행동 | autoFlop 자동화 실책 | inst 정책연구소 배분 의무 | tv 방송 광고 횟수 | broke 자금 고갈 버티는 날
  const DIFF = {
    rookie: { n: '신인 인사', tip: '실수의 대가가 가벼우니 여러 활동과 선택지를 마음껏 시험해 보며 게임의 흐름을 익혀 보세요.', d: '이제 막 정치판에 들어선 신인입니다. 하는 일이 대체로 잘 풀리고 실수는 가볍게 넘어가며, 자금도 넉넉합니다. 지지층 반발이나 당내 잡음처럼 발목을 잡는 일도 거의 없습니다.', money: 15e8, fail: 0.5, good: 1.5, bad: 0.5, cost: 0.5, upkeep: 0, fundCap: 2, fundCd: 14, vote: 1.1, rivCap: 70, tal: 0.2, hate: 0, lowTr: 0, offPlus: Infinity, stray: 0, side: 0, cosign: 0, memJoin: 0.5, selfAct: 0, autoFlop: 0, inst: 0, tv: 3, broke: 240 },
    veteran: { n: '노련한 인사', tip: '웬만한 실수는 만회할 수 있습니다. 쟁점을 짚는 정책 발표와 후원의 밤을 꾸준히 챙기면 무난하게 자랍니다.', d: '판을 읽을 줄 아는 정치인입니다. 웬만한 일은 뜻대로 풀리고 실수의 대가도 크지 않습니다. 여론과 조금 어긋난 행보에도 지지층이 너그러운 편입니다.', money: 10e8, fail: 0.7, good: 1.3, bad: 0.7, cost: 0.7, upkeep: 0.7, fundCap: 1.5, fundCd: 21, vote: 1.06, rivCap: 80, tal: 0.12, hate: 0.4, lowTr: 0.5, offPlus: 2, stray: 0, side: 0, cosign: 0.15, memJoin: 0.4, selfAct: 1, autoFlop: 1, inst: 1, tv: 2, broke: 180 },
    elder: { n: '원로 인사', tip: '노선에 맞는 행보를 지키고 자금 흐름을 꼼꼼히 살피세요. 무리한 선택은 대가가 따릅니다.', d: '산전수전 다 겪은 원로입니다. 정치판의 냉정한 규칙을 대부분 그대로 마주하지만, 쌓아 온 경험 덕에 조금은 여유가 있습니다.', money: 8e8, fail: 0.85, good: 1.15, bad: 0.85, cost: 0.85, upkeep: 0.85, fundCap: 1.2, fundCd: 28, vote: 1.03, rivCap: 90, tal: 0.06, hate: 0.7, lowTr: 1, offPlus: 1, stray: 1, side: 1, cosign: 0.3, memJoin: 0.35, selfAct: 1, autoFlop: 1, inst: 1, tv: 2, broke: 150 },
    shadow: { n: '배후 세력', tip: '후원의 밤을 놓치지 말고, 결과를 장담할 수 없는 선택은 신중하게 고르세요. 한 번의 악재가 오래 남습니다.', d: '정치판의 냉혹한 현실을 그대로 겪습니다. 작은 실수가 큰 대가로 돌아오고, 돈과 기회는 늘 빠듯합니다. 한 수 한 수를 따져야 살아남습니다.', money: 6e8, fail: 1, good: 1, bad: 1, cost: 1, upkeep: 1, fundCap: 1, fundCd: 30, vote: 1, rivCap: 99, tal: 0, hate: 1, lowTr: 1, offPlus: 0, stray: 1, side: 1, cosign: 0.3, memJoin: 0.3, selfAct: 1, autoFlop: 1, inst: 1, tv: 2, broke: 120 },
  };
  const okP = (p, f) => 1 - (1 - p) * f; // 성공 확률 p의 실패 몫(1−p)만 f배
  const goodBad = (d, df) => d > 0 ? d * df.good : d * df.bad;
  // 혐오층 영향을 h배로: 덜어낸 혐오층 몫은 중립으로 봄(화면의 지지층 비중은 그대로)
  const tierSoft = (t, h) => h === 1 || !t ? t : [t[0], t[1], t[2] + t[4] * (1 - h), t[3], t[4] * h];

  const L = { DIFF, okP, goodBad, tierSoft, REGIONS, LAW, EPOCH, dayToDate, dateToDay, electionDay, byeDay, JOINT_CUTOFF, CYCLE, ROT, cadence, schedule, hare, allocatePR, subsidyShares, refundRate, deposit, CW, candScore, TAL_HI, talentCap, talentFee,
    TIERS, tierMul, tierShift, tierRelax, tierAnchor, tierCross, tierSup, tierVote, POSTURES, bfRate, baseCost, atkU, rivalU, rivalPolicy, RACE_SD, PRES_SD, ncdf, raceOdds, TRANSFER, absentShift, campWin, PJ_CATS, APT_JOB, aptGen, areaSkill, DS_LV, demGap, demLvl, demMul, styleMul, flopMul, admU, admFeat, admJ, softPick };
  if (typeof module !== 'undefined') module.exports = L; else G.L = L;
})(this);
