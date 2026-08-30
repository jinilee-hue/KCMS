/*
 * PCMS 공용 "MAP REPORT CARD"(성적표) 팝업 컴포넌트
 *
 * 정본 문서(single source of truth): docs/screens/ET_입학관리/공통MAPReportCard모달_spec.md
 * 기능/문구/예외처리를 바꿀 때는 이 파일과 위 spec.md를 함께 갱신한다.
 *
 * 배경(2026-07-28 결정: docs/decisions/DECISION_LOG.md 참조):
 *  PCMS-SCR-ET-02-001(예비생정보)/PCMS-SCR-ET-02-002(입학 등록관리) 두 화면에 "성적표(MAP REPORT
 *  CARD)" 팝업 마크업+로직이 거의 동일하게 복사·붙여넣기되어 있었다(sms-modal.js로 통합하기 전의
 *  SMS 발송 모달, memo-modal.js로 통합하기 전의 상담 이력 모달과 동일한 문제 — 한 화면에서 수정해도
 *  다른 화면엔 반영되지 않는 사례를 막기 위해 이 파일로 로직을 한 곳에 모았다.
 *
 * 이 컴포넌트의 변천 과정(같은 기능이 요청에 따라 여러 차례 방식이 바뀜, 참고용):
 *  ① 2026-07-23~24: 화면 내 모달(div overlay)로 최초 구현.
 *  ② 2026-07-28: 모달 헤더바를 드래그해 위치 이동 가능하도록 개선.
 *  ③ 2026-07-28: 모달을 가로/세로 리사이즈 가능하도록 개선(네이티브 CSS resize).
 *  ④ 2026-07-28: "성적표를 다른 모니터에 띄워둔 채 SMS발송/상담 이력은 메인 창에서" 같은 현장
 *     사용 패턴을 확인 — 모달(같은 브라우저 창 안)로는 근본적으로 불가능함을 파악하고, 실제 KCMS와
 *     동일하게 별도 브라우저 창(window.open)으로 전환. 새 창은 OS/브라우저가 기본 제공하는
 *     드래그·리사이즈·다른 모니터 이동을 그대로 활용할 수 있어 ②③에서 흉내 내던 코드를 대체함.
 *  ⑤ 2026-07-28: 두 화면에 각각 따로 구현되어 있던 ①~④의 코드를 이 공용 컴포넌트로 통합. 통합하며
 *     "캠퍼스용"/"학부모용" 2개 탭을 하나의 팝업 안에서 전환하는 방식을 한때 시도했으나(같은 창에서
 *     반대쪽도 바로 볼 수 있게 하려는 의도), "캠퍼스용"/"학부모용" 버튼은 완전히 분리된 별개 팝업으로
 *     떠야 한다는 요청에 따라 즉시 되돌림(아래 ⑥).
 *  ⑥ 2026-07-28(이번): 탭 전환 UI를 제거하고, `openMapReportCard(opts)` 1회 호출은 항상 `opts.variant`
 *     로 지정한 캠퍼스용/학부모용 중 하나만 그리는 완전히 독립된 팝업 창을 연다. "캠퍼스용" 버튼과
 *     "학부모용" 버튼은 각각 별개의 `openMapReportCard()` 호출이며, 서로 다른 창으로 열린다.
 *  ⑦ 2026-07-29: "Test Result, Overall/Analysis" 2단 드롭다운 셀렉터 추가(Overall/Analysis 1차 선택 →
 *     Analysis 선택 시 opts.subjects 기반 과목 목록 2차 표출 → 과목 선택 시 표/그래프가 그 과목 1건으로
 *     필터링).
 *  ⑧ 2026-07-29: "Standard"를 단일 숫자에서 학년별 시험 레벨 기준점 사다리(opts.standardLevels +
 *     각 행의 standardValues)로 확장. 캠퍼스용은 사다리 전체 컬럼을 항상 표출하고 합격한 레벨 컬럼만
 *     핑크톤(.stdhit) 하이라이트, 학부모용은 컬럼 1개만 표출(합격 시 합격 레벨/핑크톤, 불합격 시 사다리
 *     최저 커트라인 레벨/핑크톤 없음). `opts.standardLevels` 미지정 시(기존 화면 호출) 예전처럼 각 행의
 *     `standard` 단일 값 1컬럼만 표시하는 구버전 동작을 그대로 유지(하위호환, 아래 옵션 표 참조).
 *  ⑨ 2026-07-29(이번): "Subject(mm:ss)" 컬럼의 과목명/응시시간 표시를 한 줄에 이어붙이던 것("과목명
 *     (mm:ss)")에서, 헤더 "Subject<br>(mm:ss)"와 같은 2행 구조에 맞춰 과목명 다음 줄에 시험응시 시간이
 *     표출되도록 `<br>`로 줄바꿈(요청 — 응시시간 정보가 없던 일부 과목도 이번에 채워 넣음, §15 참조).
 *
 * 빌드 스텝이 없는 정적 ui.html 목업이므로 ES module이 아닌 평범한 <script src> include로 동작한다.
 *
 * 사용법 — 각 화면의 </body> 직전, 화면 전용 <script> 보다 "먼저" 이 스크립트를 로드한 뒤:
 *   <script src="../../design-system/active/components/map-report-modal.js"><\/script>
 *   <script>
 *     document.getElementById('printReportBtn').addEventListener('click', function(){
 *       openMapReportCard({
 *         studentName:'홍길동', studentEname: 'Gildong Hong',      // 학생 국/영문명(영문명 없으면 생략 가능)
 *         gradeLevel: 'ELE', testDateLong: 'June 30, 2026', testedLevel: 'ELE',
 *         standardLevels: ['MAG3', 'S3', 'MGT3', 'GT3'],        // "MAP 유형"별 시험 레벨 기준점 사다리(왼쪽=높은 레벨)
 *         subjects: [                                           // 과목별 채점 결과 — standardValues는 standardLevels와 같은 순서/길이
 *           {name:'Speaking', time:'', total:20, score:11, standardValues:[17,15,13,7], pctStudent:55.0, pctPoly:77.5, rank:'AA'},
 *           {name:'Listening', time:'05:48', total:10, score:3, standardValues:[8,7,6,3], pctStudent:30.0, pctPoly:78.8, rank:'AA'}
 *         ],
 *         totalRow: {name:'Total', total:30, score:14, standardValues:[25,22,19,10], pctStudent:46.7, pctPoly:78.0, rank:'AA'},
 *         starReading: '2.0', starReadingStandardValues: [4.8, 4.2, 3.7, null],   // 레벨별 값 없으면 null → '-' 표시
 *         resultLabel: 'GT3',                                  // 합격: standardLevels 중 하나(합격 레벨명) / 불합격: 'Placement Review'
 *         comment: 'For the Entrance Test taken on ...',
 *         variant: 'campus'                                    // 'campus'|'parent', 필수(선택 시 기본 'campus')
 *       });
 *     });
 *   <\/script>
 *
 * "Standard"는 학년마다 기준점 사다리 구성이 다르므로(예: ELE는 MAG3/S3/MGT3/GT3 4단계) `standardLevels`를
 * 호출 화면이 매번 넘긴다. `standardLevels`를 생략하면(기존 PCMS-SCR-ET-02-001/002 호출처럼) 각 subject/
 * totalRow의 `standard`(단일 숫자) 필드 1개만 그대로 1컬럼으로 표시하는 구버전 동작으로 자동 전환된다
 * (하위호환 — 기존 화면은 코드 수정 없이 계속 동작).
 *
 * "캠퍼스용"/"학부모용"은 완전히 분리된 별개 팝업이다 — 한 번의 openMapReportCard() 호출은
 * opts.variant로 지정한 한 종류만 그리며, 같은 창 안에서 다른 종류로 전환하는 탭 UI는 없다.
 * 화면에 "캠퍼스용"/"학부모용" 버튼이 각각 있다면 각 버튼 클릭 핸들러에서 variant만 다르게 지정해
 * openMapReportCard()를 두 번(따로) 호출하면 된다.
 *
 * 이 컴포넌트는 호출 화면의 CSS/DOM에 전혀 의존하지 않는다 — window.open()으로 연 새 창에 필요한
 * 스타일을 전부 자체 포함한 완전한 HTML 문서를 그려 넣으므로(document.write), 각 화면은 opts로
 * 순수 데이터만 넘기면 된다. rank/resultLabel 등 "학생 성적을 어떻게 채점·판정하는지"는 화면마다
 * 다를 수 있는 도메인 로직이라 이 컴포넌트가 계산하지 않고, 호출하는 화면이 미리 계산해 넘긴다.
 */
(function (global) {
  function esc(s) { return String(s == null ? '' : s); }
  // "입력된 점수가 없을 경우, -로 표출"(General Analysis 정책) — 값이 없을 때 toFixed() 등을
  // 호출하면 크래시하므로 표에 넣기 전에 항상 이 두 헬퍼로 감싼다.
  function orDash(v) { return (v === null || v === undefined || v === '') ? '-' : esc(v); }
  function pctOrDash(v) { return (v === null || v === undefined || v === '') ? '-' : Number(v).toFixed(1); }

  // "Standard" 컬럼은 상담(MAP)예약 시 선택한 "MAP 유형"에 따라 POLY TEST가 설정해 둔 학년별 시험
  // 레벨 기준점(예: ELE의 MAG3/S3/MGT3/GT3)의 사다리 구조다. 캠퍼스용은 그 사다리 전체 컬럼을 항상
  // 다 보여주고(합격/불합격 무관), 합격한 학생만 본인이 합격한 레벨 컬럼 전체에 핑크톤(.stdhit)이
  // 켜진다. `ctx`가 없으면(=`rpt.standardLevels` 미지정, 구버전 화면 호출) 예전처럼 단일 `row.standard`
  // 값 1컬럼만 표시하고 하이라이트 로직은 적용하지 않는다(하위호환).
  // "복수 기준점이 있는 경우, 셀 통합해서 점수 보여줌"(General Analysis 정책) — 같은 행에서 인접한
  // 기준점 레벨들의 값이 서로 같으면 colspan으로 병합해 1칸에 보여준다('-'인 빈 값은 병합하지 않음).
  // 합격 레벨(ctx.hitIdx)이 병합된 범위 안에 들어오면 그 병합 셀 전체에 하이라이트를 켠다.
  function campusStandardCellsHtml(row, ctx) {
    if (!ctx) return '<td>' + orDash(row.standard) + '</td>';
    var vals = row.standardValues || [];
    var html = '';
    var i = 0;
    while (i < ctx.standardLevels.length) {
      var j = i;
      while (j + 1 < ctx.standardLevels.length && vals[j + 1] != null && vals[j + 1] === vals[i]) { j++; }
      var span = j - i + 1;
      var hit = ctx.hitIdx >= i && ctx.hitIdx <= j;
      var display = (vals[i] != null) ? vals[i] : '-';
      html += '<td' + (span > 1 ? ' colspan="' + span + '"' : '') + (hit ? ' class="stdhit"' : '') + '>' + display + '</td>';
      i = j + 1;
    }
    return html;
  }
  function campusRowHtml(row, idx, ctx) {
    var subjAttr = (idx != null) ? ' data-subj="' + idx + '"' : '';
    return '<tr' + subjAttr + '>' +
      '<td class="l">' + esc(row.name) + (row.time ? '<br><span style="color:var(--txt-mut);font-weight:400;font-size:10px;">(' + row.time + ')</span>' : '') + '</td>' +
      '<td>' + orDash(row.total) + '</td>' +
      '<td class="scorecell">' + orDash(row.score) + '</td>' +
      campusStandardCellsHtml(row, ctx) +
      '<td>' + pctOrDash(row.pctStudent) + deltaHtml(row) + '</td>' +
      '<td>' + pctOrDash(row.pctPoly) + '</td>' +
      rankCellsHtml(row.pctStudent) +
    '</tr>';
  }
  function campusChartHtml(rpt) {
    return rpt.subjects.map(function (s, idx) {
      return '' +
        '<div class="bargrp" data-subj="' + idx + '">' +
          '<div class="bar student" style="height:' + s.pctStudent + '%;" title="Student ' + s.pctStudent + '% — ' + esc(s.name) + '"><span class="val">' + s.pctStudent + '</span></div>' +
          '<div class="bar poly" style="height:' + s.pctPoly + '%;" title="POLY ' + s.pctPoly + '% — ' + esc(s.name) + '"><span class="val">' + s.pctPoly + '</span></div>' +
          '<span class="bar-label">' + s.name + '</span>' +
        '</div>';
    }).join('');
  }
  // Rank(v2, 2026-08-03 — "POLY Test 성적표 기능정리" v0.3 문서 5·9페이지 원본과 동일한 형태로 수정,
  // PCMS-SCR-ET-02-011 "Test 결과정보" 표에 먼저 적용한 것과 동일 규칙을 이 공용 컴포넌트에도 반영).
  // BA/50%/AA 라벨 밑에 눈금선이 이어진 연속 트랙을 두고, 학생 Percentage(pctStudent, 0~100) 위치에
  // 맞춰 빨간 구간 바를 표시한다. 눈금은 트랙 양끝(0/100%)과 BA|50% 경계(50%)만 둔다 —
  // 50%|AA 경계선(75%)은 헤더 라벨로 이미 구분되는데 선까지 겹쳐 트랙이 복잡해 보였다(2026-08-24 요청).
  // 헤더는 BA/50%/AA 3칸(colspan="3")이지만 본문 셀은 이 3칸 너비 전체를 트랙으로 쓰기 위해 하나로
  // 합친다. General Analysis 정책상 이 Rank 구조는 캠퍼스용/학부모용이 동일 — 두 variant 모두 이
  // 함수를 공유한다(캠퍼스용/학부모용 차이는 Standard 노출 범위뿐, §8 참조).
  // Rank 헤더(BA / 50% / AA) — 종전엔 <th> 3칸 균등분할이라 밴드 경계(0-50 / 50-75 / 75-100)와
  // 어긋나 있었다(실측: BA|50% 경계가 트랙의 24.4% 에 그려짐, 실제 밴드 경계는 50%. 25.6%p 오차).
  // 헤더도 본문 트랙과 똑같은 기하(좌우 padding 10px + margin 0 2px)를 쓰는 한 칸으로 합치고,
  // 라벨을 밴드 비율(50% / 25% / 25%)에 맞춰 절대 배치해 눈금과 정확히 일치시킨다(2026-08-24 요청).
  function rankHeadHtml() {
    return '<th colspan="3" class="rankhead"><div class="rankbandwrap">' +
      '<span class="rankband" style="left:0;width:50%;">BA</span>' +
      '<span class="rankband" style="left:50%;width:25%;">50%</span>' +
      '<span class="rankband" style="left:75%;width:25%;">AA</span>' +
    '</div></th>';
  }
  function rankCellsHtml(pctStudent) {
    if (pctStudent === null || pctStudent === undefined || pctStudent === '') return '<td colspan="3" class="rankcell"></td>';
    var pct = Math.max(0, Math.min(100, pctStudent));
    return '<td colspan="3" class="rankcell"><div class="ranktrack">' +
      '<span class="ranktick" style="left:0%"></span>' +
      '<span class="ranktick" style="left:50%"></span>' +
      '<span class="ranktick" style="left:100%"></span>' +
      '<span class="rankseg" style="left:' + pct + '%"></span>' +
    '</div></td>';
  }
  // 학부모용은 사다리 전체가 아니라 컬럼 1개만 보여준다: 합격 시엔 본인이 합격한 레벨 컬럼(핑크톤 켜짐),
  // 불합격 시엔 사다리에서 가장 낮은(가장 마지막) 커트라인 레벨 컬럼(핑크톤 꺼짐 — "그 기준선도
  // 통과하지 못했다"는 의미)만 보여준다. `ctx`가 없으면 구버전과 동일하게 `row.standard` 1컬럼.
  function parentStandardCellHtml(row, ctx) {
    if (!ctx) return '<td>' + orDash(row.standard) + '</td>';
    var vals = row.standardValues || [];
    var v = (vals[ctx.showIdx] != null) ? vals[ctx.showIdx] : '-';
    return '<td' + (ctx.isHit ? ' class="stdhit"' : '') + '>' + v + '</td>';
  }
  function parentRowHtml(row, idx, ctx) {
    var subjAttr = (idx != null) ? ' data-subj="' + idx + '"' : '';
    return '<tr' + subjAttr + '>' +
      '<td class="l">' + esc(row.name) + (row.time ? '<br><span style="color:var(--txt-mut);font-weight:400;font-size:10px;">(' + row.time + ')</span>' : '') + '</td>' +
      '<td>' + orDash(row.total) + '</td>' +
      '<td class="scorecell">' + orDash(row.score) + '</td>' +
      parentStandardCellHtml(row, ctx) +
      '<td>' + pctOrDash(row.pctStudent) + '</td>' +
      /* Poly 칸 삭제(2026-08-24 요청) — 학부모용은 POLY 평균을 노출하지 않는 정책이라 전 행이
         무조건 '-' 였고, 헤더만 "Poly" 로 남아 "데이터가 비어 있는 것"처럼 읽혔다. 범례에도
         Poly 가 없으므로 열 자체를 없앤다(헤더는 buildParentBodyHtml 에서 1칸으로 축소). */
      rankCellsHtml(row.pctStudent) +
    '</tr>';
  }
  function parentChartHtml(subjects) {
    return subjects.map(function (s, idx) {
      return '' +
        '<div class="bargrp" data-subj="' + idx + '">' +
          '<div class="bar student" style="height:' + s.pctStudent + '%;" title="Student ' + s.pctStudent + '% — ' + esc(s.name) + '"><span class="val">' + s.pctStudent + '</span></div>' +
          '<span class="bar-label">' + s.name + '</span>' +
        '</div>';
    }).join('');
  }

  // General Analysis 범위 선택 — 종전엔 "Test Result, Overall/Analysis" 2단 드롭다운이었다.
  // 선택지가 Overall + 과목 4~6개뿐인데 펼치기 → Analysis → 과목 3단계를 요구했고, 왼쪽은 라디오
  // 오른쪽은 칩이라 위계도 섞여 보였다(2026-08-24 요청 "더 나은 UI"). 한 줄 탭 바로 바꿔
  // 선택지를 전부 드러내고 클릭 1번으로 전환한다. 중간 단계였던 "Analysis"는 별도 항목이 아니라
  // "과목 탭을 고른 상태" 자체로 흡수했다 — 고르면 그 과목 1건만, Overall 이면 전체 + Total/StarReading.
  function resultTabsHtml(rpt) {
    var subjTabs = rpt.subjects.map(function (s, i) {
      return '<button type="button" class="rpt-tab" data-idx="' + i + '" onclick="rptPickSubject(' + i + ')">' + esc(s.name) + '</button>';
    }).join('');
    return '' +
      '<div class="rpt-tabs" id="rptTabs">' +
        '<button type="button" class="rpt-tab active" id="rptTabOverall" onclick="rptPickOverall()">Overall</button>' +
        subjTabs +
      '</div>';
  }

  function infoBoxHtml(rpt) {
    var nameLine = esc(rpt.studentName) + (rpt.studentEname ? ' (' + rpt.studentEname + ')' : '');
    return '<div class="rpt-sect">• Student Information</div>' +
      '<div class="rpt-infobox">' +
        '<div class="rpt-avatar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg></div>' +
        '<div class="rpt-infogrid">' +
          '<div class="row"><span class="k">• Name</span><span class="v">' + nameLine + '</span></div>' +
          '<div class="row"><span class="k">• Grade Level</span><span class="v">' + esc(rpt.gradeLevel) + '</span></div>' +
          '<div class="row"><span class="k">• Test Date</span><span class="v">' + esc(rpt.testDateLong) + '</span></div>' +
          '<div class="row"><span class="k">• Tested Level</span><span class="v">' + esc(rpt.testedLevel) + '</span></div>' +
        '</div>' +
      '</div>';
  }

  // C. 결론 요약 블록(2026-08-24 요청) — 표 아래 "Result :" 한 줄이 표보다 시각적 무게가 낮아
  // 정작 가장 먼저 읽어야 할 판정 결과가 묻혔다. 학생정보 바로 아래에 판정/총점/평균대비를
  // 큰 글씨로 한 번 더 얹는다(표 아래 Result 줄은 인쇄 시 표와 함께 읽히므로 그대로 유지).
  // 평균 대비는 색이 아니라 ▲/▼ 글리프가 의미를 나른다 — 흑백 인쇄와 색각 이상에서도 읽히도록.
  function verdictHtml(rpt, withPoly) {
    var t = rpt.totalRow || {};
    var items = '<div class="v-item v-main"><span class="k">Result</span><span class="v">' + esc(rpt.resultLabel) + '</span></div>' +
      '<div class="v-item"><span class="k">Total Score</span><span class="v">' + orDash(t.score) + '<em> / ' + orDash(t.total) + '</em></span></div>';
    if (withPoly && t.pctStudent != null && t.pctPoly != null) {
      var d = Number(t.pctStudent) - Number(t.pctPoly);
      var up = d >= 0;
      items += '<div class="v-item"><span class="k">vs POLY avg</span><span class="v ' + (up ? 'up' : 'down') + '">' +
        '<i class="arw">' + (up ? '\u25B2' : '\u25BC') + '</i> ' + Math.abs(d).toFixed(1) + '<em>%p</em></span></div>';
    }
    return '<div class="rpt-verdict">' + items + '</div>';
  }

  // D. Student 백분율 옆 POLY 평균 대비 차이(2026-08-24 요청) — 두 숫자가 나란히 있을 뿐이라
  // 어느 과목이 평균에 못 미치는지 한눈에 안 들어왔다. 값 아래 작은 ▲/▼ + 차이를 붙인다.
  function deltaHtml(row) {
    if (row.pctStudent == null || row.pctStudent === '' || row.pctPoly == null || row.pctPoly === '') return '';
    var d = Number(row.pctStudent) - Number(row.pctPoly);
    var up = d >= 0;
    return '<span class="dlt ' + (up ? 'up' : 'down') + '">' + (up ? '\u25B2' : '\u25BC') + Math.abs(d).toFixed(1) + '</span>';
  }

  function buildCampusBodyHtml(rpt) {
    var ctx = null;
    var stdHeadRow1 = '<th rowspan="2">Standard</th>';
    var stdHeadRow2 = '';
    if (rpt.standardLevels && rpt.standardLevels.length) {
      ctx = { standardLevels: rpt.standardLevels, hitIdx: rpt.standardLevels.indexOf(rpt.resultLabel) };
      stdHeadRow1 = '<th colspan="' + rpt.standardLevels.length + '">Standard</th>';
      stdHeadRow2 = rpt.standardLevels.map(function (lv) { return '<th>' + esc(lv) + '</th>'; }).join('');
    }
    var starStdHtml = ctx ? campusStandardCellsHtml({ standardValues: rpt.starReadingStandardValues }, ctx) : '<td>-</td>';
    var tbodyHtml = rpt.subjects.map(function (row, idx) { return campusRowHtml(row, idx, ctx); }).join('') +
      '<tr class="totalrow">' + campusRowHtml(rpt.totalRow, null, ctx).replace('<tr>', '') +
      '<tr class="starrow"><td class="l">StarReading <span class="scalenote">(GE)</span></td><td>-</td><td class="scorecell">' + orDash(rpt.starReading) + '</td>' + starStdHtml + '<td>-</td><td>-</td><td colspan="3" class="rankcell"></td></tr>';
    return '' +
      '<div class="rpt-title">MAP REPORT CARD</div>' +
      infoBoxHtml(rpt) +
      verdictHtml(rpt, true) +
      '<div class="rpt-sect">• General Analysis</div>' +
      resultTabsHtml(rpt) +
      '<table class="rpt-table"><thead><tr>' +
        '<th rowspan="2">Subject<br>(mm:ss)</th><th rowspan="2">Total<br>Score</th><th rowspan="2">Score</th>' + stdHeadRow1 +
        '<th colspan="2">Percentage(%)</th><th colspan="3">Rank</th>' +
      '</tr><tr>' + stdHeadRow2 + '<th>Student</th><th>Poly</th>' + rankHeadHtml() + '</tr></thead><tbody id="rptSubjTbody">' + tbodyHtml + '</tbody></table>' +
      '<div class="rpt-resultline">Result : ' + esc(rpt.resultLabel) + '</div>' +
      '<div class="rpt-chart" id="rptChartWrap">' +
        '<div class="rpt-legend"><span><span class="dot student"></span>Student</span><span><span class="dot poly"></span>Poly</span></div>' +
        '<div class="rpt-plot">' + campusChartHtml(rpt) + '</div>' +
      '</div>' +
      '<div class="rpt-sect">• Overall Comment</div>' +
      '<div class="rpt-comment">' + esc(rpt.comment) + '</div>';
  }
  function buildParentBodyHtml(rpt) {
    var ctx = null;
    var stdHeadRow1 = '<th rowspan="2">Standard</th>';
    var stdHeadRow2 = '';
    if (rpt.standardLevels && rpt.standardLevels.length) {
      var passedIdx = rpt.standardLevels.indexOf(rpt.resultLabel);
      var showIdx = passedIdx >= 0 ? passedIdx : (rpt.standardLevels.length - 1);
      ctx = { standardLevels: rpt.standardLevels, showIdx: showIdx, isHit: passedIdx >= 0 };
      stdHeadRow1 = '<th>Standard</th>';
      stdHeadRow2 = '<th>' + esc(rpt.standardLevels[showIdx]) + '</th>';
    }
    var starStdHtml = ctx ? parentStandardCellHtml({ standardValues: rpt.starReadingStandardValues }, ctx) : '<td>-</td>';
    var tbodyHtml = rpt.subjects.map(function (row, idx) { return parentRowHtml(row, idx, ctx); }).join('') +
      '<tr class="totalrow">' + parentRowHtml(rpt.totalRow, null, ctx).replace('<tr>', '') +
      '<tr class="starrow"><td class="l">StarReading <span class="scalenote">(GE)</span></td><td>-</td><td class="scorecell">' + orDash(rpt.starReading) + '</td>' + starStdHtml + '<td>-</td><td colspan="3" class="rankcell"></td></tr>';
    return '' +
      '<div class="rpt-title">MAP REPORT CARD</div>' +
      infoBoxHtml(rpt) +
      verdictHtml(rpt, false) +
      '<div class="rpt-sect">• General Analysis</div>' +
      resultTabsHtml(rpt) +
      '<table class="rpt-table"><thead><tr>' +
        '<th rowspan="2">Subject<br>(mm:ss)</th><th rowspan="2">Total<br>Score</th><th rowspan="2">Score</th>' + stdHeadRow1 +
        '<th rowspan="2">Percentage<br>(%)</th><th colspan="3">Rank</th>' +
      '</tr><tr>' + stdHeadRow2 + rankHeadHtml() + '</tr></thead><tbody id="rptSubjTbody">' + tbodyHtml + '</tbody></table>' +
      '<div class="rpt-resultline">Result : ' + esc(rpt.resultLabel) + '</div>' +
      '<div class="rpt-chart" id="rptChartWrap">' +
        '<div class="rpt-legend"><span><span class="dot student"></span>Student</span></div>' +
        '<div class="rpt-plot">' + parentChartHtml(rpt.subjects) + '</div>' +
      '</div>' +
      '<div class="rpt-sect">• Overall Comment</div>' +
      '<div class="rpt-comment">' + esc(rpt.comment) + '</div>';
  }

  function documentHtml(title, printedAt, bodyHtml, subjectNames, studentName) {
    return '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>' + title + '</title><style>' +
      ':root{--line:#cfd6e0;--tbl-bd-soft:#e3e8ef;--txt:#1f2937;--txt-mut:#5b6776;'+
      /* 전체 컬러톤을 파란색 계열로 통일(2026-08-24 요청). 이 컴포넌트는 window.open 으로 띄운
         새 창이라 호출 화면의 토큰을 물려받지 못하므로 필요한 값을 여기서 정의한다.
         --gnb 는 본문 화면의 [검색] 버튼(.btn.s)과 같은 네이비 — 폴리 그래프에 쓴다. */
      '--pb:#0066FF;--pb-dark:#0052CC;--pb-deeper:#003D99;--pb-light:#EAF1FB;'+
      /* Rank 구간 바 전용 옅은 파랑 — 막대가 트랙 위에 얹히는 표시라 강조색(--pb)은 과했다(2026-08-24 요청) */
      '--pb-soft:#9CC0FF;--gnb:#2C3E5A;'+
      /* Total / StarReading / Result 행 색은 MAP 결과 탭(02-011 table.scoretbl)과 같은 값을
         쓴다 — 같은 성적표를 두 화면이 다른 색으로 보여주면 안 된다(2026-08-24 요청).
         --pb-light(#EAF1FB) = Total, --pb-light2(#DCE7F7) = StarReading(같은 hue 에서 명도만
         95%→92%), --danger-bg/--danger-txt = Result. */
      '--pb-light2:#DCE7F7;--danger-bg:#fdecec;--danger-txt:#b42318;}' +
      'body{margin:0;font-family:Pretendard,Pretendard Variable,Malgun Gothic,맑은 고딕,Dotum,돋움,sans-serif;background:#fff;color:var(--txt);}' +
      '.rpt-topbar{display:flex;align-items:center;gap:8px;padding:10px 16px;border-bottom:1px solid var(--tbl-bd-soft);background:#f7f9fc;position:sticky;top:0;}' +
      '.rpt-topbar .rpt-date{font-size:11px;color:var(--txt-mut);margin-right:auto;}' +
      '.rpt-printbtn{height:26px;padding:0 12px;border:1px solid var(--tbl-bd-soft);border-radius:3px;background:#fff;color:var(--txt);font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;}' +
      '.rpt-printbtn:hover{background:#eef1f5;}' +
      '.rpt-body{padding:22px 26px;max-width:640px;margin:0 auto;}' +
      '.rpt-title{text-align:center;font-size:21px;font-weight:700;letter-spacing:.5px;color:#1f2937;margin-bottom:18px;}' +
      '.rpt-sect{font-size:12px;font-weight:700;color:var(--txt);margin:16px 0 8px;}' +
      '.rpt-infobox{display:flex;gap:16px;align-items:center;border:1px solid var(--tbl-bd-soft);border-radius:6px;padding:12px 16px;}' +
      '.rpt-avatar{flex:0 0 auto;width:42px;height:42px;border-radius:50%;background:#eef1f5;color:var(--txt-mut);display:flex;align-items:center;justify-content:center;}' +
      '.rpt-infogrid{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;}' +
      '.rpt-infogrid .row{display:flex;justify-content:space-between;font-size:12px;gap:8px;}' +
      '.rpt-infogrid .k{color:var(--txt-mut);white-space:nowrap;}' +
      '.rpt-infogrid .v{font-weight:700;color:var(--txt);}' +
      /* C. 결론 요약 블록 — 판정 결과 / 총점 / POLY 평균 대비 3칸. 판정 칸만 옅은 파랑으로 눌러
         "먼저 읽어야 할 값"을 만든다. ▲/▼ 는 색이 아니라 글리프가 의미를 나르므로 흑백 인쇄에서도
         읽힌다(빨강은 쓰지 않는다 — 성적표 톤이 파란 계열이고, 낙제 낙인처럼 읽히는 것도 피한다). */
      '.rpt-verdict{display:flex;border:1px solid var(--pb);border-radius:6px;overflow:hidden;margin:12px 0 0;}' +
      /* 칸 구분선(2026-08-24 요청) — 셀 높이를 꽉 채우던 border-right 는 3칸을 각각 다른 표처럼
         갈라 놓았다. ::before 세로선으로 바꿔 위아래를 22% 씩 비우고, Result 다음 칸 앞 선은
         지운다 — Result 칸은 옅은 파랑 배경이라 색만으로 이미 경계가 읽힌다. */
      '.rpt-verdict .v-item{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 12px;}' +
      '.rpt-verdict .v-item + .v-item::before{content:\'\';position:absolute;left:0;top:22%;bottom:22%;width:1px;background:var(--tbl-bd-soft);}' +
      '.rpt-verdict .v-main + .v-item::before{display:none;}' +
      '.rpt-verdict .k{font-size:10px;letter-spacing:.4px;text-transform:uppercase;color:var(--txt-mut);}' +
      '.rpt-verdict .v{font-size:18px;font-weight:700;color:var(--txt);line-height:1.15;}' +
      '.rpt-verdict .v em{font-style:normal;font-size:12px;font-weight:600;color:var(--txt-mut);}' +
      '.rpt-verdict .v-main{background:var(--pb-light);}' +
      '.rpt-verdict .v-main .v{color:var(--pb-deeper);font-size:22px;}' +
      '.rpt-verdict .v.up{color:var(--pb);}' +
      '.rpt-verdict .v.down{color:var(--danger-txt);}' +
      '.rpt-verdict .v .arw{font-style:normal;font-size:.7em;vertical-align:1px;}' +
      /* D. Student 백분율 아래 POLY 평균 대비 차이 */
      'table.rpt-table .dlt{display:block;font-size:9px;font-weight:700;line-height:1.25;margin-top:1px;}' +
      'table.rpt-table .dlt.up{color:var(--pb);}' +
      'table.rpt-table .dlt.down{color:var(--danger-txt);}' +
      /* General Analysis 범위 탭 — 표 바로 위에 밑줄 탭 한 줄. 탭 줄의 1px 밑줄과 선택 탭의 2px
         밑줄이 같은 선 위에 놓이도록 탭을 margin-bottom:-1px 로 1px 내린다. 과목이 많아 한 줄을
         넘치면 가로 스크롤 — 줄바꿈은 표 위 여백이 들쭉날쭉해져 지면이 흔들린다. */
      '.rpt-tabs{display:flex;gap:2px;overflow-x:auto;border-bottom:1px solid var(--line);margin:0 0 10px;}' +
      '.rpt-tab{flex:0 0 auto;background:none;border:0;border-bottom:3px solid transparent;padding:9px 14px;font-family:inherit;font-size:12px;font-weight:700;color:var(--txt-mut);cursor:pointer;white-space:nowrap;}' +
      '.rpt-tab:hover{color:var(--pb);}' +
      '.rpt-tab.active{color:var(--pb-deeper);border-bottom-color:var(--pb);}' +
      /* 다른 화면 표와 같은 상단 라인 규칙(§12+§14)을 이 표에도 적용한다(2026-08-24 요청) —
         첫 헤더 행의 회색 border-top 은 빼고, 파란 1px 을 표 상단에 오버레이로 한 줄만 그린다.
         table.grid 가 쓰는 방식과 같다(th border-top:0 + 오버레이 하나). collapse 표라 보더를
         그대로 두면 파란 선 아래 회색 선이 겹쳐 2px 로 보인다. */
      'table.rpt-table{width:100%;border-collapse:collapse;font-size:10.8px;position:relative;}' +
      'table.rpt-table th,table.rpt-table td{border:1px solid var(--tbl-bd-soft);padding:5px 6px;text-align:center;}' +
      'table.rpt-table > thead > tr:first-child > th{border-top:0;}' +
      'table.rpt-table::before{content:\'\';position:absolute;top:0;left:0;right:0;height:1px;background:var(--pb);pointer-events:none;z-index:2;}' +
      'table.rpt-table thead th{background:#F4F7FD;color:#2C3E5A;font-weight:700;}' +
      '#rptSubjTbody td{border-bottom:0;}' +
      '#rptSubjTbody tr:first-child td{border-top:0;}' +
      '#rptSubjTbody tr:last-child td{border-bottom:1px solid var(--tbl-bd-soft);}' +
      'table.rpt-table td.l{text-align:left;font-weight:700;}' +
      'table.rpt-table td.scorecell{font-weight:700;}' +
      'table.rpt-table tr.totalrow td{background:var(--pb-light);font-weight:700;}' +
      /* F. StarReading 행은 척도가 다른 별개 지표다(Score 2.0 vs Standard 4.8/4.2/3.7 = GE 척도).
         종전엔 2px 회색선으로 갈랐으나, 기준 화면인 MAP 결과 탭(table.scoretbl)엔 그 선이 없어
         같은 표가 두 화면에서 다르게 보였다(2026-08-24 요청). 구분은 배경색 한 단계 + 라벨 (GE)
         가 맡고, 위 경계선은 Total 행의 1px #7B9BB7 하나로 통일한다. */
      'table.rpt-table tr.starrow td{background:var(--pb-light2);}' +
      'table.rpt-table tr.starrow .scalenote{font-weight:400;font-size:9px;color:var(--txt-mut);}' +
      'table.rpt-table td.stdhit{background:var(--pb-light);color:var(--pb-deeper);font-weight:700;}' +
      'table.rpt-table tr.totalrow td.stdhit{background:var(--pb-light);}' +
      'table.rpt-table td.rankcell{padding:2px 10px;}' +
      /* 헤더 밴드 라벨 — 본문 .ranktrack 과 같은 좌우 인셋(padding 10px + margin 2px)을 써야
         라벨과 눈금이 같은 좌표계에 놓인다. */
      'table.rpt-table th.rankhead{padding:5px 10px;}' +
      /* min-width 필수 — 밴드 라벨이 absolute 라 열 폭에 기여하지 않아, 없으면 Rank 3열이
         최소폭으로 무너지고 BA/50%/AA 가 겹쳐 찍힌다(실측 확인). 종전 트랙 폭(89px)보다
         조금 넉넉히 잡아 라벨이 서로 닿지 않게 한다. */
      'th.rankhead .rankbandwrap{position:relative;height:12px;margin:0 2px;min-width:104px;}' +
      'th.rankhead .rankband{position:absolute;top:0;line-height:12px;text-align:center;font-size:10px;font-weight:700;color:#2C3E5A;}' +
      '.ranktrack{position:relative;height:14px;margin:0 2px;}' +
      '.ranktrack::before{content:\'\';position:absolute;left:0;right:0;top:50%;height:1px;background:#c3ccd9;transform:translateY(-50%);}' +
      '.ranktrack .ranktick{position:absolute;top:50%;width:1px;height:9px;background:#c3ccd9;transform:translate(-50%,-50%);}' +
      /* 구간 바 폭 22px → 8px. 트랙이 89px 뿐이라 22px 은 ±12%p 를 덮어 55 와 60 이 사실상
         같은 위치로 보였다(2026-08-24 실측). 8px 이면 5%p 차이(≈4.5px)가 눈에 들어온다. */
      '.ranktrack .rankseg{position:absolute;top:50%;width:8px;height:12px;background:var(--pb-soft);border-radius:2px;transform:translate(-50%,-50%);}' +
      /* Result 줄을 General Analysis 표에 붙인다(2026-08-24 요청) — 표와 판정 결과는 한 덩어리로
         읽혀야 하는데 10px 떠 있어 별개 배너처럼 보였다. 위쪽 margin/라운드를 없애고 표 테두리와
         같은 색 1px 로 이어 붙인다. */
      '.rpt-resultline{text-align:center;background:var(--danger-bg);color:var(--danger-txt);font-weight:700;padding:6px;border:1px solid var(--tbl-bd-soft);border-top:0;border-radius:0;margin:0 0 20px;font-size:12px;}' +
      /* 세로축 라인(border-left) 제거 — 눈금·축 라벨이 없는 그래프라 왼쪽 선이 축으로 읽히지
         않고 장식으로만 남아 있었다(2026-08-24 요청). 바닥선(border-bottom)은 막대가 서는
         기준선이라 유지한다. */
      /* 종전엔 아래 padding 26px 때문에 막대가 회색 기준선에서 26px 떠 있었고, 과목명은 그
         빈 띠(선 위쪽)에 들어가 있었다(2026-08-24 요청). padding-bottom 을 0 으로 만들어
         막대를 선에 붙이고, 과목명은 .bar-label 의 bottom 음수값으로 선 아래에 놓는다.
         선 아래 글자 자리는 margin-bottom 26px 으로 확보한다. */
      '.rpt-chart{height:150px;padding:22px 6px 0;border-bottom:1px solid var(--tbl-bd-soft);position:relative;margin-bottom:26px;}' +
      /* 막대가 바닥에 정렬되는 플롯 영역(.rpt-chart 의 content box 와 같은 좌표계). */
      '.rpt-plot{position:relative;height:100%;display:flex;align-items:flex-end;justify-content:space-around;gap:10px;}' +
      '.rpt-chart .bargrp{display:flex;align-items:flex-end;gap:3px;height:100%;position:relative;flex:1;justify-content:center;}' +
      /* 막대 상단 좌우 라운드 2px → 6px → 8px(2026-08-24 요청, 3차 — "더 굴려서 동그랗게").
         막대 폭이 16px 이므로 8px = 폭의 절반 = 상단이 완전한 반원 돔. 이보다 더 키우면
         border-radius 가 폭에 맞춰 자동 축소되므로 8px 이 이 폭에서의 최대치다. */
      '.rpt-chart .bar{width:16px;border-radius:8px 8px 0 0;position:relative;}' +
      '.rpt-chart .bar.student{background:var(--pb);}' +
      '.rpt-chart .bar.poly{background:var(--gnb);}' +
      '.rpt-chart .bar .val{position:absolute;top:-15px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:700;color:#333;white-space:nowrap;}' +
      '.rpt-chart .bar-label{position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);font-size:10.5px;color:var(--txt-mut);white-space:nowrap;}' +
      /* ── 그래프 인터랙션(2026-08-24 요청) ─────────────────────────────────────────
         · hover: 해당 막대를 밝게 + 값 라벨을 키우고 진하게, 나머지 과목 그룹은 살짝 디밍
         · 등장: 아래에서 자라나는 애니메이션(과목별로 조금씩 시차)
         · title 속성으로 "Student 82.5% — Speaking" 네이티브 툴팁
         hover 는 filter/opacity 만 쓰고 등장 애니메이션은 transform 만 써서 서로 안 부딪힌다.
         인쇄·모션 최소화 설정에서는 애니메이션과 디밍을 끈다(맨 아래 @media). */
      '.rpt-chart .bar{cursor:default;transition:filter .15s ease;}' +
      '.rpt-chart .bar:hover{filter:brightness(1.12) saturate(1.08);}' +
      '.rpt-chart .bar .val{transition:transform .15s ease,color .15s ease;}' +
      '.rpt-chart .bar:hover .val{transform:translateX(-50%) scale(1.18);color:var(--pb-deeper);}' +
      '.rpt-chart .bargrp{transition:opacity .15s ease;}' +
      '.rpt-chart:hover .bargrp{opacity:.5;}' +
      '.rpt-chart .bargrp:hover{opacity:1;}' +
      '@keyframes rptBarGrow{from{transform:scaleY(0);}to{transform:scaleY(1);}}' +
      '.rpt-chart .bar{transform-origin:bottom center;animation:rptBarGrow .55s cubic-bezier(.22,1,.36,1) both;}' +
      '.rpt-chart .bargrp:nth-of-type(2) .bar{animation-delay:.07s;}' +
      '.rpt-chart .bargrp:nth-of-type(3) .bar{animation-delay:.14s;}' +
      '.rpt-chart .bargrp:nth-of-type(4) .bar{animation-delay:.21s;}' +
      '.rpt-chart .bargrp:nth-of-type(5) .bar{animation-delay:.28s;}' +
      '.rpt-chart .bargrp:nth-of-type(6) .bar{animation-delay:.35s;}' +
      /* 범례를 차트 아래 가운데에서 우측 상단으로 올린다(2026-08-24 요청) — 아래쪽은 이제
         과목명 자리이고, 범례는 그래프를 읽기 전에 먼저 보이는 게 맞다. .rpt-chart 안에
         절대배치하되 위 padding 22px 이 만든 띠에 들어가 막대·값 라벨과 겹치지 않는다.
         (막대가 100% 에 가까우면 값 라벨이 이 띠까지 올라오므로 배경 흰색을 깔아 둔다.) */
      '.rpt-legend{position:absolute;top:0;right:6px;z-index:1;display:flex;gap:12px;font-size:11px;color:var(--txt-mut);margin:0;background:#fff;padding:0 2px;}' +
      '.rpt-legend .dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:4px;}' +
      '.rpt-legend .dot.student{background:var(--pb);}' +
      '.rpt-legend .dot.poly{background:var(--gnb);}' +
      '.rpt-comment{font-size:12px;line-height:1.6;color:var(--txt);background:#f7f9fc;border-radius:6px;padding:12px 14px;}' +
      '.rpt-printhead,.rpt-printfoot{display:none;}' +
      /* G. 인쇄 대응(2026-08-24 요청) — 학부모 배부용 인쇄물이므로:
         · 표/차트/코멘트가 페이지 경계에서 잘리지 않게 break-inside:avoid
         · 막대·헤더 배경색이 인쇄에서 날아가지 않게 print-color-adjust:exact
         · 여러 장 배부 시 섞이지 않도록 지면 머리글(학생명 우측)·바닥글(출력일시) 표출 */
      '@page{margin:12mm;}' +
      '@media print{' +
        ' .rpt-topbar{display:none;}' +
        ' body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}' +
        ' .rpt-body{max-width:none;padding:0;}' +
        ' .rpt-printhead{display:flex;align-items:baseline;gap:10px;padding-bottom:6px;margin-bottom:12px;border-bottom:1px solid #c3ccd9;font-size:10px;color:#5b6776;letter-spacing:.4px;}' +
        ' .rpt-printhead b{margin-left:auto;font-size:12px;color:#1f2937;}' +
        ' .rpt-printfoot{display:flex;align-items:baseline;gap:10px;margin-top:14px;padding-top:6px;border-top:1px solid #c3ccd9;font-size:9.5px;color:#5b6776;}' +
        ' .rpt-printfoot b{margin-left:auto;font-weight:400;}' +
        ' .rpt-infobox,.rpt-verdict,.rpt-comment{break-inside:avoid;}' +
        ' table.rpt-table{break-inside:auto;} table.rpt-table tr{break-inside:avoid;}' +
        ' table.rpt-table thead{display:table-header-group;}' +
        ' .rpt-chart,.rpt-legend{break-inside:avoid;} .rpt-chart{break-before:avoid;}' +
        ' .rpt-chart .bar{animation:none !important;}' +
        ' .rpt-chart .bargrp{opacity:1 !important;}' +
        /* 화면 전용 조작 UI(과목 셀렉터)는 지면에서 뺀다 — 종이엔 전 과목이 이미 다 찍혀
           있어 '\uc120\ud0dd 범위' 표시가 의미 없고, 캐럿만 남아 잉크를 먹는다. */
        ' .rpt-tabs{display:none !important;}' +
      '}' +
      '@media (prefers-reduced-motion:reduce){ .rpt-chart .bar{animation:none !important;} }' +
      '</style></head><body>' +
      '<div class="rpt-topbar"><span class="rpt-date">출력일시 <b>' + printedAt + '</b></span>' +
        '<button type="button" class="rpt-printbtn" onclick="window.print()"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Print</button>' +
      '</div>' +
      '<div class="rpt-body">' +
        /* G. 인쇄 전용 머리글 — 브라우저가 그리는 인쇄 머리글("MAP REPORT CARD - 홍길동")은 위치가
           브라우저 고정이라 페이지 CSS 로 옮길 수 없다. 대신 지면 안에 우리 머리글을 그려 학생명을
           우측 끝에 둔다(2026-08-24 요청). 브라우저 머리글은 인쇄 대화상자의 "머리글 및 바닥글"을
           꺼서 감춘다 — 이건 사용자 설정이라 페이지가 강제할 수 없다. */
        '<div class="rpt-printhead"><span>MAP REPORT CARD</span><b>' + esc(studentName) + '</b></div>' +
        bodyHtml +
        '<div class="rpt-printfoot"><span>' + esc(studentName) + '</span><b>출력일시 ' + printedAt + '</b></div>' +
      '</div>' +
      '<script>' +
        'var RPT_SUBJECTS = ' + JSON.stringify(subjectNames || []) + ';' +
        'function rptSetActiveTab(el){' +
          'var tabs = document.querySelectorAll("#rptTabs .rpt-tab");' +
          'for (var i = 0; i < tabs.length; i++) { tabs[i].classList.remove("active"); }' +
          'if (el) { el.classList.add("active"); if (el.scrollIntoView) el.scrollIntoView({block:"nearest",inline:"nearest"}); }' +
        '}' +
        'function rptFilterSubject(idx){' +
          'var rows = document.querySelectorAll("#rptSubjTbody tr[data-subj]");' +
          'for (var i = 0; i < rows.length; i++) { rows[i].style.display = (idx === null || rows[i].getAttribute("data-subj") === String(idx)) ? "" : "none"; }' +
          'var bars = document.querySelectorAll("#rptChartWrap .bargrp[data-subj]");' +
          'for (var j = 0; j < bars.length; j++) { bars[j].style.display = (idx === null || bars[j].getAttribute("data-subj") === String(idx)) ? "" : "none"; }' +
          'var totalRow = document.querySelector("#rptSubjTbody tr.totalrow");' +
          'var starRow = document.querySelector("#rptSubjTbody tr.starrow");' +
          'if (totalRow) totalRow.style.display = idx === null ? "" : "none";' +
          'if (starRow) starRow.style.display = idx === null ? "" : "none";' +
        '}' +
        'function rptPickOverall(){' +
          'rptSetActiveTab(document.getElementById("rptTabOverall"));' +
          'rptFilterSubject(null);' +
        '}' +
        'function rptPickSubject(idx){' +
          'rptSetActiveTab(document.querySelector("#rptTabs .rpt-tab[data-idx=\\"" + idx + "\\"]"));' +
          'rptFilterSubject(idx);' +
        '}' +
      '<\/script>' +
      '</body></html>';
  }

  // "캠퍼스용"/"학부모용"은 완전히 분리된 별개 팝업이다 — 이 함수 1회 호출은 opts.variant로 지정한
  // 한 종류만 그리는 새 창을 연다(탭 전환 UI 없음). 두 종류를 다 보여줘야 하는 화면은 버튼별로
  // variant만 다르게 지정해 openMapReportCard()를 각각 호출하면 된다.
  // 2026-08-24 요청으로 "개발자 안내 alert"을 제거했다 — 종전엔 Report Card 버튼을 누를 때마다
  // "성적표는 참고용 …" 안내창이 먼저 뜨고, 확인을 눌러야 성적표 창이 열렸다(2026-08-03 추가분).
  // 이제 버튼 클릭 → 성적표 창이 바로 열린다. 아래 팝업차단 alert 은 실제 실패 경로라 남겨둔다.
  function openMapReportCard(opts) {
    opts = opts || {};
    var variant = opts.variant === 'parent' ? 'parent' : 'campus';
    var printedAt = new Date().toLocaleString('ko-KR');
    var bodyHtml = variant === 'parent' ? buildParentBodyHtml(opts) : buildCampusBodyHtml(opts);
    var titleSuffix = variant === 'parent' ? ' (학부모용)' : '';
    var title = 'MAP REPORT CARD' + titleSuffix + ' - ' + (opts.studentName || '');
    var subjectNames = (opts.subjects || []).map(function (s) { return s.name; });
    var win = window.open('', '_blank', 'width=700,height=880,resizable=yes,scrollbars=yes');
    if (!win) { alert('팝업이 차단되었습니다. 브라우저의 팝업 차단을 해제해 주세요.'); return; }
    win.document.write(documentHtml(title, printedAt, bodyHtml, subjectNames, opts.studentName || ''));
    win.document.close();
  }

  global.openMapReportCard = openMapReportCard;
})(window);
