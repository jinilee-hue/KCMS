/*
 * PCMS 공용 "학생 상담 이력 리스트" 모달 컴포넌트
 *
 * 정본 문서(single source of truth): docs/screens/ET_입학관리/공통상담이력모달_spec.md
 * 기능/문구/예외처리를 바꿀 때는 이 파일과 위 spec.md를 함께 갱신한다.
 *
 * 배경(2026-07-18 결정: docs/decisions/DECISION_LOG.md 참조):
 *  기존엔 PCMS-SCR-ET-02-002/ET-02-010/ET-04-001 세 화면의 ui.html에 "개별 상담기록 모달"
 *  (이력 리스트 + 신규 기록 입력창이 한 모달에 합쳐진 형태) 마크업+로직이 거의 동일하게
 *  복사·붙여넣기되어 있었다(sms-modal.js로 전환하기 전의 SMS 발송 모달과 동일한 문제).
 *  실제 KIS "학생상담리스트" 기능설명/화면 자료(3부작 PDF)를 근거로 UX를 다음과 같이
 *  재설계하며 공용 컴포넌트로 전환했다:
 *   1) "상담" 버튼/이름 클릭 → 이 컴포넌트(학생 상담 이력 리스트, CounselingHistoryModal)가 열림
 *      — 검색(기간 퀵필터/직접 지정, 상담상태, 담당교사/등록자 텍스트) + 최신순 정렬 + 역순 넘버링
 *        테이블(상담일/상담시간/상담상태/상담주제/제목/상담내용/상담교사/상담결과/등록자/등록일시)만 표시.
 *      - 기존의 "신규 기록 입력 textarea"는 이 모달에서 제거되었다(§2 참조).
 *   2) 상단 "+ 상담 등록" 버튼 또는 테이블의 특정 행(Row) 클릭 → "상담상세정보" 모달
 *      (CounselingDetailModal)이 그 위에 별도 팝업으로 열려 신규 등록/상세조회를 담당한다.
 *
 * 2026-07-18 1단계: "학생 상담 이력 리스트"(openMemoModal)구현.
 * 2026-07-19 2단계: "상담상세정보"(등록/상세 화면, openMemoDetailModal) 실제 KIS 화면 자료(PDF)를
 *  근거로 추가 구현 완료 — "+ 상담 등록" 버튼 또는 행 클릭 시 이 모달이 리스트 모달 위에 별도
 *  팝업으로 열리며, 신규 등록/기존 조회·수정/삭제를 담당한다. 두 함수 모두 이 한 파일 안에서
 *  구현되어 있으나, 리스트 모달 쪽 호출부(openDetailOrPlaceholder)는 여전히
 *  "window.openMemoDetailModal이 함수인지" 여부로만 분기하도록 남겨 두었다(향후 이 파일을
 *  두 파일로 분리하더라도 리스트 모달 로직을 다시 건드릴 필요가 없도록) — 3개 화면의 ui.html
 *  호출 코드는 이번 2단계 구현으로도 변경할 필요가 없다(§공통상담이력모달_spec.md 참조).
 *
 * 2026-07-28 UI 개선(요청, sms-modal.js "SMS 발송 창"과 동일 패턴): "학생 상담 이력 리스트" 창
 *  헤더(`.mcHead`, 커서 move)를 마우스로 드래그해 창 위치를 이동할 수 있도록 `bindMcModalDrag()`
 *  추가. 헤더의 닫기(✕) 버튼 클릭은 드래그로 처리하지 않도록 예외 처리, 모달을 다시 열 때마다
 *  위치는 초기 중앙 정렬로 리셋(`resetMcModalPosition()`). "상담상세정보"(openMemoDetailModal)
 *  팝업은 이번 요청 범위 밖이라 변경 없음.
 *
 * 2026-08-10 "상담주제"(TOPIC_OPTIONS)에 "진학상담" 추가(7종→8종) — "레벨상담"과 "기타" 사이에 배치.
 *  이 파일 하나만 고치면 이 컴포넌트를 로드하는 모든 화면에 동시 반영된다(단일 소스, 화면별
 *  하드코딩 없음 — gnb-sidebar.js와 동일 원칙).
 *
 * 빌드 스텝이 없는 정적 ui.html 목업이므로 ES module이 아닌 평범한 <script src> include로 동작한다.
 *
 * 사용법 — 각 화면의 </body> 직전, 화면 전용 <script> 보다 "먼저" 이 스크립트를 로드한 뒤:
  // 모달 창 이동(드래그)은 공용 컴포넌트 modal-drag.js가 담당한다(2026-08-14 전면 통합).
  // 구 구현(mousedown + position:fixed)은 마우스 전용이고 창이 화면 밖으로 대부분 빠져나갈 수 있어 폐기했다.
  // 상세·함정은 docs/design-system/interaction-patterns.md 패턴 4 참조.
 *   <script src="../../design-system/active/components/memo-modal.js"><\/script>
 *   <script>
 *     document.getElementById('tbody').addEventListener('click', function(e){
 *       var trigger = e.target.closest('[data-act="memo"]');
 *       if (!trigger) return;
 *       var row = findRow(trigger.dataset.no);
 *       openMemoModal({
 *         studentNo: row.studentNo,          // 학생 식별자(필수 권장 — 상담상세정보 연동 시 필요)
 *         name: row.name,                    // 학생명(필수)
 *         ename: row.ename,                  // 영문명(선택, 있으면 헤더에 "국문 / 영문"으로 표시)
 *         records: row.memos,                // 상담 이력 배열(레퍼런스로 저장 — 아래 스키마 참조)
 *         classNm: row.cls,                  // (선택) 학급명 — 상담상세정보 학생카드 표기용, 없으면 '-'
 *         phone: row.phone,                  // (선택) 학생 전화/휴대폰, 없으면 '-'
 *         motherPhone: row.parentPhone,      // (선택) 어머니휴대폰, 없으면 '-'
 *         studentType: '예비생',              // (선택) 학생구분 — 학생카드 "이름 (학생구분)" 표기용
 *         onChange: function(){              // 이력이 변경되었을 때(등록/수정/삭제) 호출되는 콜백(선택)
 *           renderTable();                   // 화면의 "상담(N)" 버튼 건수 등을 갱신
 *         }
 *       });
 *     });
 *   <\/script>
 *
 * records(=각 화면의 row.memos) 배열 원소 스키마 — 기존 {author,at,body} 3필드 → 1단계 9필드 →
 * 2단계(상담상세정보 자료 반영)에서 target/method 2필드, 이후 result 1필드 추가, 총 12필드:
 *   { id: 'm1',                        // 고유 ID(신규 등록 시 컴포넌트가 자동 채번)
 *     date: '2026-07-21',              // 상담일(YYYY-MM-DD)
 *     time: '15:28',                   // 상담시간(HH:MM)
 *     status: '완료',                  // 상담상태 — STATUS_OPTIONS(완료/예정/상담중)
 *     topic: 'MAP결과상담',            // 상담주제 — TOPIC_OPTIONS(종합상담/상담(MAP)예약/입학상담/설명회예약/MAP결과상담/레벨상담/진학상담/기타)
 *     title: 'MAP 결과 2차 상담 요청',  // 제목
 *     content: 'MAP 결과 프린트와 상담을 원함', // 상담내용
 *     target: '학부모',                // 상담대상(필수) — TARGET_OPTIONS(학부모/학생/원생/기타)
 *     method: '전화',                  // 상담방법 — METHOD_OPTIONS(전화/IB전화/OB전화/방문/알림장/기타)
 *     result: '만족',                  // 상담결과(2026-07-19 추가) — RESULT_OPTIONS(선택/만족/해결/재상담필요/불만족)
 *                                      //   status가 '완료'일 때만 콤보박스가 활성화되고 값이 유효함. 그 외 상태에서는 ''(선택 없음)로 강제 저장
 *     teacher: '홍길동 (Gildong Hong)',  // 상담교사
 *     registrant: '홍길동 (Gildong Hong)',     // 등록자
 *     registeredAt: '2026-07-17 15:28' // 등록일시(YYYY-MM-DD HH:MM)
 *   }
 * (2026-07-19 이전에 등록된 mock 레코드는 target/method/result가 없을 수 있음 — 상세 모달에서 열람 시
 *  target/method는 각각 TARGET_OPTIONS[0]/METHOD_OPTIONS[0]으로 대체 표시, result는 빈 값('선택')으로 표시되며
 *  저장 시 실제 값으로 채워진다.)
 *
 * openMemoModal(opts)는 학생 카드 표기용으로 classNm/phone/motherPhone/studentType도 선택적으로
 * 받는다(모두 opts 프로퍼티, 없으면 '-'로 표시) — 상세는 openMemoModal 정의부 주석 참조.
 *
 * openMemoDetailModal(opts)는 원래 리스트 모달의 "+ 상담 등록"/행 클릭에서만 내부적으로 호출되지만,
 * 특정 탭 맥락에서 이력 리스트 없이 상담상세정보(신규 등록)만 바로 띄우고 싶은 화면은 직접 호출해도 된다
 * (2026-07-20, `PCMS-SCR-ET-02-001_예비생정보`의 "상담(MAP)결과" 탭 "+ 상담등록" 버튼이 첫 사례):
 *   openMemoDetailModal({
 *     student: { name: ..., ename: ..., classNm: '-', phone: '-', motherPhone: ..., studentType: '예비생' },
 *     record: null,              // 항상 null로 호출하면 신규 등록 모드로 열림
 *     records: someArray,        // 저장 시 push될 배열(레퍼런스로 보관됨)
 *     defaultTopic: 'MAP결과상담', // (선택) 신규 등록 시 "상담주제" 기본 선택값 — 미지정 시 TOPIC_OPTIONS[0]('종합상담')
 *     onSaved: function(){ ... } // 저장/삭제 후 호출되는 콜백(선택)
 *   });
 *
 * openMemoModal가 필요로 하는 CSS(각 화면 <style>에 이미 정의되어 있어야 함 — PCMS 전 화면 공통
 * 셸 스타일이므로 대부분 이미 있음): .modal-ov/.modal-ov.open, .modal-box, .modal-x, .modal-foot,
 * .btn/.btn.g/.btn.sm, .finput/.fselect
 * 이 파일 자체가 <style id="memoModalStyles">/<style id="memoDetailModalStyles">로 자동 주입하는 것
 * (다른 화면과 겹칠 일이 거의 없는 이 모달 전용 클래스만):
 *  리스트 모달: .mcHead, .mcHeadTop, .mcFilterRow, .mcSeg, .mcDrange, .mcIwrap, .mcIbtn,
 *   .mcRst, .mcResultRow, .mcTableWrap, .mcTable, .mcBadge, .mcEmpty, .mcEmptyRow, .mcTitleCell, .mcContentCell
 *  상세 모달(2026-07-19 추가): .mddBox, .mddBody, .mddCard, .mddAvatar*, .mddInfoTable,
 *   .mddSectionTitle, .mddFormTable, .mddReq, .mddDateTimeWrap, .mddDateInput, .mddDateSh, .mddTimeInput,
 *   .mddTeacherWrap, .mddTeacherList, .mddPlainText, .mddNameCellKr, .mddContent, .mddFoot, .mddDelBtn, .mddSaveBtn
 *   (헤더는 리스트 모달과 동일한 .mcHead/.mcHeadTop을 재사용한다)
 */

(function (global) {
  var STATUS_OPTIONS = ['완료', '예정', '상담중'];
  var STATUS_COLOR = {
    '완료': { bg: '#EDF1F6', fg: '#2C3E5A' },
    '예정': { bg: '#E0F2FE', fg: '#075985' },
    '상담중': { bg: '#EDF1F6', fg: '#2C3E5A' }
  };
  var DEFAULT_STATUS_COLOR = { bg: '#eef1f5', fg: '#5b6776' };
  var TARGET_OPTIONS = ['학부모', '학생', '원생', '기타'];
  var METHOD_OPTIONS = ['전화', 'IB전화', 'OB전화', '방문', '알림장', '기타'];
  var TOPIC_OPTIONS = ['종합상담', '상담(MAP)예약', '입학상담', '설명회예약', 'MAP결과상담', '레벨상담', '진학상담', '기타']; // 2026-08-10 "진학상담" 추가(7종→8종, §공통상담이력모달_spec.md 참조)
  var RESULT_OPTIONS = ['선택', '만족', '해결', '재상담필요', '불만족']; // 상담결과 — '선택'은 미선택 placeholder(값 ''), 상담상태가 '완료'일 때만 콤보박스 활성화(2026-07-19)
  var TEACHER_POOL = ['홍길동'];
  var CURRENT_USER = '홍길동 (Gildong Hong)'; // mock 고정값 — 실제 로그인 사용자 연동 전까지 placeholder(§공통상담이력모달_spec.md 참조)

  var _built = false;
  var _state = {
    student: { no: '', name: '', ename: '', classNm: '-', phone: '-', motherPhone: '-', studentType: '' },
    records: [],
    onChange: null,
    filter: { preset: 'all', start: '', end: '', status: '', keyword: '' }
  };

  var _detailBuilt = false;
  var _detailState = { student: {}, record: null, records: [], onSaved: null, defaultTopic: null };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function addDays(base, delta) { var d = new Date(base.getTime()); d.setDate(d.getDate() + delta); return d; }
  function nowParts() {
    var d = new Date();
    var time = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    return { date: fmtDate(d), time: time, display: fmtDate(d) + ' ' + time };
  }
  function plainOptionsHtml(list) {
    return list.map(function (o) { return '<option value="' + escAttr(o) + '">' + esc(o) + '</option>'; }).join('');
  }

  function resultOptionsHtml() {
    return '<option value="">' + esc(RESULT_OPTIONS[0]) + '</option>' +
      RESULT_OPTIONS.slice(1).map(function (o) { return '<option value="' + escAttr(o) + '">' + esc(o) + '</option>'; }).join('');
  }

  // ===================== 학생 상담 이력 리스트(CounselingHistoryModal, 1단계) =====================

  function injectStyles() {
    if (document.getElementById('memoModalStyles')) return;
    var style = document.createElement('style');
    style.id = 'memoModalStyles';
    style.textContent =
      '.mcModalWide{width:1080px;max-width:97vw;}' +
      '.mcHead{background:linear-gradient(180deg,#5d6b7c,#3f4c5a);color:#fff;padding:8px 12px 7px;flex:0 0 auto;}' +
      '.mcHeadTop{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700;}' +
      '.mcHeadTop svg{flex:0 0 auto;}' +
      '.mcHeadTop .modal-x{margin-left:auto;background:none;border:none;color:#fff;font-size:14px;cursor:pointer;}' +
      '.mcFilterRow{display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex:0 0 auto;}' +
      '.mcFilterRow .lbl{font-size:11px;font-weight:700;color:#2C3E5A;flex:0 0 auto;}' +
      '.mcSeg{display:inline-flex;gap:4px;flex:0 0 auto;}' +
      '.mcSeg button{height:24px;padding:0 6px;border:1px solid var(--line);border-radius:3px;background:#fff;font-size:12px;color:var(--txt-mut);cursor:pointer;white-space:nowrap;}' +
      '.mcSeg button:hover{border-color:var(--pb);color:var(--pb);}' +
      '.mcSeg button.on{background:var(--pb);border-color:var(--pb);color:#fff;font-weight:700;}' +
      '.mcDrange{display:flex;align-items:center;gap:5px;flex:0 0 auto;}' +
      '.mcIwrap{position:relative;width:118px;height:24px;}' +
      '.mcIwrap input{width:100%;height:100%;border:1px solid var(--line);border-radius:3px;padding:0 22px 0 8px;font-size:12px;background:#fff;color:var(--txt);}' +
      '.mcIwrap input::-webkit-calendar-picker-indicator{display:none;}' +
      /* 네이티브 date 입력은 브라우저가 "2026. 08. 25." 로 그린다 — 다른 화면의 날짜 표기
         (YYYY-MM-DD)와 어긋나 보이는 텍스트 입력 + 숨은 date 섀도우 구조로 바꿨다(2026-08-25 요청).
         값 형식은 그대로 YYYY-MM-DD 라 이 모달의 필터 로직은 손대지 않았다. */
      '.mcIwrap .mcDateSh{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0;padding:0;}' +
      '.mcIbtn{position:absolute;right:2px;top:50%;transform:translateY(-50%);width:18px;height:18px;border:1px solid var(--line);border-radius:3px;background:#fff;color:var(--pb-deeper);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;}' +
      '.mcIbtn:hover{border-color:var(--pb);color:var(--pb);}' +
      '.mcSep{color:var(--txt-mut);font-size:11px;flex:0 0 auto;}' +
      '.mcRst{width:20px;height:20px;flex:0 0 auto;border:1px solid var(--line);border-radius:3px;background:#fff;color:var(--txt-mut);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;}' +
      '.mcRst:hover{border-color:var(--pb);color:var(--pb);}' +
      '.mcKeyword{flex:1 1 150px;min-width:150px;}' +
      '.mcResultRow{display:flex;align-items:center;justify-content:space-between;margin-top:10px;flex:0 0 auto;}' +
      '.mcResultRow .cnt{font-size:12px;color:var(--txt);}' +
      '.mcResultRow .cnt b{color:var(--pb-deeper);}' +
      '.mcTableWrap{height:280px;overflow:auto;border:1px solid var(--tbl-bd-soft);border-radius:3px;margin-top:8px;flex:0 0 auto;}' +
      'table.mcTable{width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;}' +
      'table.mcTable thead th{position:sticky;top:0;z-index:2;background:#F4F7FD;color:#2C3E5A;font-weight:700;height:26px;border-bottom:1px solid #C8D5EB;padding:0 6px;text-align:center;box-shadow:0 1px 0 #C8D5EB;}' +
      'table.mcTable tbody td{border-bottom:1px solid var(--tbl-bd-soft);padding:6px 7px;text-align:left;vertical-align:top;}' +
      'table.mcTable tbody tr{cursor:pointer;height:42px;}' +
      'table.mcTable tbody tr:hover{background:#f2f6fc;}' +
      'table.mcTable td.wr{white-space:nowrap;text-align:center;}' +
      '.mcTitleCell{max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
      /* 상담내용 셀 — td 에 직접 display:-webkit-box 를 주면 셀의 display 가 table-cell 이 아니게 되어
   행에서 빠져나와 옆 칸 위에 겹쳐 그려졌다(실측: 해당 td 만 display flow-root · h22 · top +1px).
   줄임(2줄 클램프)은 셀 안쪽 span 이 맡고 td 는 table-cell 을 유지한다(2026-08-25 수정). */
      'td.mcContentCell{max-width:300px;overflow:hidden;}' +
      'td.mcContentCell > .mcClamp{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-all;line-height:1.45;}' +
      '.mcBadge{display:inline-block;border-radius:3px;padding:2px 7px;font-size:10.5px;font-weight:700;white-space:nowrap;}' +
      '.mcTopic{color:var(--pb-deeper);font-weight:700;}' +
      '.mcEmpty{text-align:center;padding:60px 10px;color:var(--txt-mut);font-size:12px;line-height:1.8;}' +
      'table.mcTable tbody tr.mcEmptyRow{height:auto;}' +
      'table.mcTable tbody tr.mcEmptyRow td{border-bottom:none;}' +
      '';
    document.head.appendChild(style);
  }

  function buildDom() {
    if (_built) return;
    injectStyles();
    var html =
      '<div class="modal-ov" id="mcModal">' +
        '<div class="modal-box mcModalWide" style="max-height:90vh;">' +
          '<div class="mcHead">' +
            '<div class="mcHeadTop">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' +
              '<span id="mcHeadTitle">학생 상담 이력 리스트</span>' +
              '<button class="modal-x" id="mcClose">✕</button>' +
            '</div>' +
          '</div>' +
          /* 검색줄은 흰 콘텐츠 박스 위(밖)로 뺀다 — 입학 설명회 내역 팝업과 같은 구조(2026-08-24 요청) */
          '<div class="mcFilterRow">' +
            '<span class="lbl">검색기간</span>' +
            '<div class="mcSeg" id="mcPresetSeg">' +
              '<button type="button" data-preset="1d">1일</button>' +
              '<button type="button" data-preset="1w">1주</button>' +
              '<button type="button" data-preset="15d">15일</button>' +
              '<button type="button" data-preset="1m">1달</button>' +
              '<button type="button" data-preset="all" class="on">전체</button>' +
            '</div>' +
            '<div class="mcDrange">' +
              '<span class="mcIwrap iwrap"><input type="text" id="mcStart" placeholder="연도-월-일" maxlength="10" inputmode="numeric" autocomplete="off"><input type="date" class="mcDateSh dateshadow" tabindex="-1" aria-hidden="true"><button type="button" class="mcIbtn ibtn" tabindex="-1"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg></button></span>' +
              '<span class="mcSep">~</span>' +
              '<span class="mcIwrap iwrap"><input type="text" id="mcEnd" placeholder="연도-월-일" maxlength="10" inputmode="numeric" autocomplete="off"><input type="date" class="mcDateSh dateshadow" tabindex="-1" aria-hidden="true"><button type="button" class="mcIbtn ibtn" tabindex="-1"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg></button></span>' +
              '<button type="button" class="mcRst" id="mcRangeReset" title="기간 초기화">✕</button>' +
            '</div>' +
            '<span class="lbl">상담상태</span>' +
            '<select class="fselect" id="mcStatusSel" style="width:90px;"></select>' +
            '<input class="finput mcKeyword" id="mcKeyword" placeholder="담당교사명 또는 등록자">' +
            '<button class="btn sm" id="mcSearchBtn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>검색</button>' +
          '</div>' +
          '<div class="modal-body" style="display:flex;flex-direction:column;">' +
            '<div class="mcResultRow">' +
              '<span class="cnt">조회 결과 : 총 <b id="mcResultCount">0</b>건 (최신 상담 이력 순 정렬)</span>' +
              '<button class="btn" id="mcRegisterBtn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>상담 등록</button>' +
            '</div>' +
            '<div class="mcTableWrap">' +
              '<table class="mcTable">' +
                '<thead><tr>' +
                  '<th style="width:36px;">순번</th><th style="width:78px;">상담일</th><th style="width:56px;">상담시간</th>' +
                  '<th style="width:56px;">상담상태</th><th style="width:88px;">상담주제</th><th style="width:150px;">제목</th>' +
                  '<th>상담내용</th><th style="width:100px;">상담교사</th><th style="width:80px;">상담결과</th><th style="width:80px;">등록자</th><th style="width:96px;">등록일시</th>' +
                '</tr></thead>' +
                '<tbody id="mcBody"></tbody>' +
              '</table>' +
            '</div>' +
          '</div>' +
          '<div class="modal-foot"><button class="btn g" id="mcCloseBtn">닫기</button></div>' +
        '</div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);
    bindEvents();
    _built = true;
  }


  function statusOptionsHtml() {
    return '<option value="">전체</option>' + STATUS_OPTIONS.map(function (s) { return '<option value="' + escAttr(s) + '">' + s + '</option>'; }).join('');
  }

  function computeAllRange() {
    if (!_state.records.length) { var t = fmtDate(new Date()); return { start: t, end: t }; }
    var dates = _state.records.map(function (r) { return r.date; }).filter(Boolean).sort();
    return dates.length ? { start: dates[0], end: dates[dates.length - 1] } : { start: '', end: '' };
  }

  function syncFilterInputs() {
    document.getElementById('mcStart').value = _state.filter.start || '';
    document.getElementById('mcEnd').value = _state.filter.end || '';
    document.getElementById('mcStatusSel').value = _state.filter.status || '';
    document.getElementById('mcKeyword').value = _state.filter.keyword || '';
    document.querySelectorAll('#mcPresetSeg button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.preset === _state.filter.preset);
    });
  }

  function applyPreset(key) {
    var today = new Date();
    var end = fmtDate(today);
    var start;
    if (key === '1d') start = end;
    else if (key === '1w') start = fmtDate(addDays(today, -6));
    else if (key === '15d') start = fmtDate(addDays(today, -14));
    else if (key === '1m') start = fmtDate(addDays(today, -29));
    else { var all = computeAllRange(); start = all.start; end = all.end; }
    _state.filter.preset = key;
    _state.filter.start = start;
    _state.filter.end = end;
    syncFilterInputs();
    renderList();
  }

  function matchesFilter(rec) {
    if (_state.filter.preset !== 'all') {
      if (_state.filter.start && rec.date < _state.filter.start) return false;
      if (_state.filter.end && rec.date > _state.filter.end) return false;
    }
    if (_state.filter.status && rec.status !== _state.filter.status) return false;
    var kw = (_state.filter.keyword || '').trim();
    if (kw) {
      var hay = (rec.teacher || '') + ' ' + (rec.registrant || '');
      if (hay.indexOf(kw) === -1) return false;
    }
    return true;
  }

  function renderList() {
    var filtered = _state.records.filter(matchesFilter);
    filtered.sort(function (a, b) { return (b.registeredAt || '') < (a.registeredAt || '') ? -1 : (b.registeredAt || '') > (a.registeredAt || '') ? 1 : 0; });
    var total = filtered.length;
    document.getElementById('mcResultCount').textContent = total;
    var body = document.getElementById('mcBody');
    if (!total) {
      body.innerHTML = '<tr class="mcEmptyRow"><td colspan="11"><div class="mcEmpty">기록된 상담/MAP 이력이 없습니다.<br>상단의 \'상담 등록\' 버튼을 눌러 상담 일지를 작성해 주세요.</div></td></tr>';
      return;
    }
    body.innerHTML = filtered.map(function (r, i) {
      var no = total - i;
      var color = STATUS_COLOR[r.status] || DEFAULT_STATUS_COLOR;
      return '' +
        '<tr data-id="' + escAttr(r.id) + '">' +
          '<td class="wr">' + no + '</td>' +
          '<td class="wr">' + esc(r.date) + '</td>' +
          '<td class="wr">' + esc(r.time) + '</td>' +
          '<td class="wr"><span class="mcBadge" style="background:' + color.bg + ';color:' + color.fg + ';">' + esc(r.status) + '</span></td>' +
          '<td class="wr mcTopic">' + esc(r.topic) + '</td>' +
          '<td class="mcTitleCell" title="' + escAttr(r.title) + '">' + esc(r.title) + '</td>' +
          '<td class="mcContentCell" title="' + escAttr(r.content) + '"><span class="mcClamp">' + esc(r.content) + '</span></td>' +
          '<td class="wr">' + esc(r.teacher) + '</td>' +
          '<td class="wr">' + (r.status === '완료' ? esc(r.result || '') : '') + '</td>' +
          '<td class="wr">' + esc(r.registrant) + '</td>' +
          '<td class="wr">' + esc(r.registeredAt) + '</td>' +
        '</tr>';
    }).join('');
  }

  function openDetailOrPlaceholder(record) {
    if (typeof global.openMemoDetailModal === 'function') {
      global.openMemoDetailModal({
        student: _state.student,
        record: record || null,
        records: _state.records,
        onSaved: function () {
          renderList();
          if (typeof _state.onChange === 'function') _state.onChange(_state.records);
        }
      });
    } else {
      alert('"상담상세정보" 화면은 아직 연동되지 않았습니다.\n(다음 단계에서 구현될 예정입니다.)');
    }
  }

  function bindEvents() {
    document.getElementById('mcClose').addEventListener('click', function () { document.getElementById('mcModal').classList.remove('open'); });
    document.getElementById('mcCloseBtn').addEventListener('click', function () { document.getElementById('mcModal').classList.remove('open'); });

    document.getElementById('mcPresetSeg').addEventListener('click', function (e) {
      var btn = e.target.closest('button'); if (!btn) return;
      applyPreset(btn.dataset.preset);
    });
    document.getElementById('mcRangeReset').addEventListener('click', function () {
      _state.filter.preset = ''; _state.filter.start = ''; _state.filter.end = '';
      syncFilterInputs(); renderList();
    });
    document.getElementById('mcStart').addEventListener('change', function () {
      _state.filter.preset = 'custom'; _state.filter.start = this.value;
      if (_state.filter.start && _state.filter.end && _state.filter.start > _state.filter.end) { alert('종료일은 시작일 이후여야 합니다.'); }
      syncFilterInputs(); renderList();
    });
    document.getElementById('mcEnd').addEventListener('change', function () {
      _state.filter.preset = 'custom'; _state.filter.end = this.value;
      if (_state.filter.start && _state.filter.end && _state.filter.start > _state.filter.end) { alert('종료일은 시작일 이후여야 합니다.'); }
      syncFilterInputs(); renderList();
    });
    Array.prototype.forEach.call(document.querySelectorAll('#mcModal .mcIwrap'), function (wrap) {
      var input = wrap.querySelector('input[type="text"]');
      var shadow = wrap.querySelector('input[type="date"]');
      var btn = wrap.querySelector('.mcIbtn');
      if (shadow && btn) btn.addEventListener('click', function () {
        if (typeof shadow.showPicker === 'function') shadow.showPicker(); else shadow.focus();
      });
      // 섀도우에서 고른 값을 보이는 입력으로 옮기고, 기존 change 리스너가 그대로 받도록 다시 쏜다
      if (shadow && input) shadow.addEventListener('change', function () {
        input.value = shadow.value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      // 직접 타이핑 — 숫자만 남겨 YYYY-MM-DD 로 자동 하이픈
      if (input) input.addEventListener('input', function () {
        var v = input.value.replace(/[^0-9]/g, '').slice(0, 8);
        input.value = v.length > 6 ? v.slice(0,4)+'-'+v.slice(4,6)+'-'+v.slice(6)
                    : v.length > 4 ? v.slice(0,4)+'-'+v.slice(4)
                    : v;
        if (shadow) shadow.value = /^\d{4}-\d{2}-\d{2}$/.test(input.value) ? input.value : '';
      });
    });
    document.getElementById('mcStatusSel').addEventListener('change', function () { _state.filter.status = this.value; renderList(); });
    document.getElementById('mcKeyword').addEventListener('input', function () { _state.filter.keyword = this.value; renderList(); });
    document.getElementById('mcKeyword').addEventListener('keydown', function (e) { if (e.key === 'Enter') renderList(); });
    document.getElementById('mcSearchBtn').addEventListener('click', renderList);

    document.getElementById('mcRegisterBtn').addEventListener('click', function () { openDetailOrPlaceholder(null); });
    document.getElementById('mcBody').addEventListener('click', function (e) {
      var tr = e.target.closest('tr[data-id]'); if (!tr) return;
      var rec = _state.records.filter(function (r) { return r.id === tr.dataset.id; })[0];
      if (rec) openDetailOrPlaceholder(rec);
    });
  }

  function openMemoModal(opts) {
    opts = opts || {};
    buildDom();

    _state.student = {
      no: opts.studentNo || opts.no || '',
      name: opts.name || opts.studentName || '',
      ename: opts.ename || opts.studentEname || '',
      classNm: opts.classNm || opts.className || '-',
      phone: opts.phone || '-',
      motherPhone: opts.motherPhone || opts.parentPhone || '-',
      studentType: opts.studentType || ''
    };
    _state.records = opts.records || opts.memos || [];
    _state.onChange = typeof opts.onChange === 'function' ? opts.onChange : null;

    var titleText = _state.student.name + (_state.student.ename ? ' / ' + _state.student.ename : '') + ' 학생 상담 이력 리스트';
    document.getElementById('mcHeadTitle').textContent = titleText;
    document.getElementById('mcStatusSel').innerHTML = statusOptionsHtml();

    var allRange = computeAllRange();
    _state.filter = { preset: 'all', start: allRange.start, end: allRange.end, status: '', keyword: '' };
    syncFilterInputs();
    renderList();

    document.getElementById('mcModal').classList.add('open');
  }

  // ===================== 상담상세정보(CounselingDetailModal, 2단계) =====================

  function injectDetailStyles() {
    if (document.getElementById('memoDetailModalStyles')) return;
    var style = document.createElement('style');
    style.id = 'memoDetailModalStyles';
    style.textContent =
      '.mddBox{width:900px;max-width:94vw;max-height:90vh;}' +
      '.mddBody{padding:14px 14px 4px;overflow:auto;flex:1;min-height:0;}' +
      '.mddCard{display:flex;gap:14px;border:1px solid var(--tbl-bd-soft);border-radius:6px;padding:12px;margin-bottom:14px;background:#fff;}' +
      '.mddAvatar{flex:0 0 96px;display:flex;flex-direction:column;align-items:center;gap:5px;padding-top:4px;}' +
      '.mddAvatarCircle{width:56px;height:56px;border-radius:50%;background:linear-gradient(180deg,#eaf1ff,#cfe0ff);color:var(--pb-deeper);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;}' +
      '.mddInfoTable{flex:1;border-collapse:collapse;font-size:12px;align-self:center;}' +
      '.mddInfoTable th{width:130px;white-space:nowrap;background:#F4F7FD;color:#2C3E5A;font-weight:700;text-align:left;padding:6px 8px;border:1px solid var(--tbl-bd-soft);}' +
      '.mddInfoTable td{padding:6px 8px;border:1px solid var(--tbl-bd-soft);color:var(--txt);white-space:nowrap;}' +
      '.mddInfoTable td:nth-child(2){min-width:280px;}' +
      '.mddInfoTable td:nth-child(4){min-width:120px;}' +
      '.mddSectionTitle{font-size:12px;font-weight:700;color:var(--pb-deeper);margin:2px 0 6px;}' +
      '.mddFormTable{width:100%;border-collapse:collapse;font-size:12px;border:1px solid var(--tbl-bd-soft);border-radius:6px;overflow:hidden;margin-bottom:12px;}' +
      '.mddFormTable th{width:88px;background:#F8FAFC;color:#2C3E5A;font-weight:700;text-align:left;padding:7px 9px;border:1px solid var(--tbl-bd-soft);vertical-align:middle;white-space:nowrap;}' +
      '.mddFormTable td{padding:6px 9px;border:1px solid var(--tbl-bd-soft);background:#fff;}' +
      '.mddReq{color:var(--danger);margin-right:2px;}' +
      '.mddFormTable select,.mddFormTable > tr > td > input{width:100%;}' +
      '.mddDateTimeWrap{display:flex;gap:6px;}' +
      '.mddIw{position:relative;display:inline-block;}' +
      '.mddIw .finput{width:100%;padding-right:22px;}' +
      '.mddIw input::-webkit-calendar-picker-indicator{display:none;}' +
      '.mddIwDate{flex:0 0 120px;width:120px;}' +
      '.mddIwTime{flex:0 0 110px;width:110px;}' +
      /* 서체는 Pretendard 하나 — 이 두 칸만 Consolas 였다. 네이티브 date/time 입력의
         모양을 흉내내려던 잔재인데, 날짜는 이제 text 칸이라 다른 입력과 같아야 한다. */
      '.mddDateInput{width:100%;}' +
      '.mddTimeInput{width:100%;}' +
      '.mddTeacherWrap{display:flex;gap:5px;position:relative;}' +
      '.mddTeacherWrap input{flex:1;width:auto;}' +
      '.mddTeacherList{position:absolute;top:28px;left:0;right:0;background:#fff;border:1px solid var(--line);border-radius:3px;box-shadow:0 6px 16px rgba(15,40,90,.14);z-index:5;max-height:140px;overflow:auto;display:none;}' +
      '.mddTeacherList.open{display:block;}' +
      '.mddTeacherList div{padding:6px 9px;cursor:pointer;font-size:11px;}' +
      '.mddTeacherList div:hover{background:var(--pb-light);}' +
      '.mddPlainText{display:inline-block;padding:1px 0;color:var(--txt);}' +
      '.mddNameCellKr{font-weight:700;}' +
      '.mddContent{width:100%;min-height:70px;resize:vertical;font-family:inherit;font-size:12px;line-height:1.6;padding:6px 8px;border:1px solid var(--line);border-radius:3px;color:var(--txt);}' +
      '#mddResult:disabled{background:#F4F7FC;color:var(--txt-mut);cursor:not-allowed;}' +
      '.mddFoot{display:flex;align-items:center;gap:6px;}' +
      '.mddDelBtn{border-color:var(--danger);color:var(--danger);background:#fff;}' +
      '.mddDelBtn:hover{background:var(--danger-bg);}' +
      '.mddSaveBtn{background:var(--pb);border-color:var(--pb-dark);color:#fff;}' +
      '.mddSaveBtn:hover{background:var(--pb-dark);}';
    document.head.appendChild(style);
  }

  function teacherListHtml() {
    return TEACHER_POOL.map(function (t) { return '<div data-name="' + escAttr(t) + '">' + esc(t) + '</div>'; }).join('');
  }

  function buildDetailDom() {
    if (_detailBuilt) return;
    // 상담상세정보 헤더는 리스트 모달과 동일한 .mcHead/.mcHeadTop 클래스를 재사용하지만, 그 스타일은
    // injectStyles()(리스트 모달 전용, buildDom() 안에서만 호출됨)에서만 주입된다. host 화면이 리스트
    // 모달 없이 openMemoDetailModal을 바로 호출하면(ET-02-001 "+ 상담등록"이 대표 사례) 리스트 모달이
    // 한 번도 만들어진 적이 없어 .mcHead/.mcHeadTop이 정의되지 않은 채로 남아, 헤더가 진회색 그라디언트
    // 바 없이 흰 배경 민무늬로 깨져 보이던 버그(2026-08-11 확인·수정) — 여기서도 injectStyles()를 함께
    // 호출해 어느 진입 경로로 열리든 헤더 스타일이 항상 준비되도록 함(injectStyles()는 이미 주입됐으면
    // 즉시 반환하는 가드가 있어 중복 호출해도 안전)
    injectStyles();
    injectDetailStyles();
    var html =
      '<div class="modal-ov" id="mdModal" style="z-index:220;">' +
        '<div class="modal-box mddBox">' +
          '<div class="mcHead">' +
            '<div class="mcHeadTop">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' +
              '<span id="mddHeadTitle">상담상세정보</span>' +
              '<button class="modal-x" id="mddClose">✕</button>' +
            '</div>' +
          '</div>' +
          '<div class="modal-body mddBody">' +
            '<div class="mddCard">' +
              '<div class="mddAvatar">' +
                '<div class="mddAvatarCircle" id="mddAvatarInit">-</div>' +
              '</div>' +
              '<table class="mddInfoTable">' +
                '<tr><th>이름 (학생구분)</th><td id="mddNameCell">-</td><th>학급명</th><td id="mddClassCell">-</td></tr>' +
                '<tr><th>전화/휴대폰</th><td id="mddPhoneCell">-</td><th>어머니휴대폰</th><td id="mddMotherPhoneCell">-</td></tr>' +
              '</table>' +
            '</div>' +
            '<div class="mddSectionTitle">상담정보</div>' +
            '<table class="mddFormTable">' +
              '<tr>' +
                '<th><span class="mddReq">*</span>상담대상</th>' +
                '<td><select class="fselect" id="mddTarget"></select></td>' +
                '<th>상담교사</th>' +
                '<td><div class="mddTeacherWrap"><input class="finput" id="mddTeacher" placeholder="상담교사명" autocomplete="off">' +
                  '<button type="button" class="btn g sm" id="mddTeacherSearchBtn"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>검색</button>' +
                  '<div class="mddTeacherList" id="mddTeacherList"></div></div></td>' +
              '</tr>' +
              '<tr>' +
                '<th>상담일시</th>' +
                '<td><div class="mddDateTimeWrap">' +
                  /* 브라우저 기본 달력·시계 아이콘 대신 다른 화면과 같은 .iwrap + .ibtn 조합 사용 */
                  /* 보이는 칸은 text — input[type=date] 를 그대로 노출하면 브라우저가
                     한국 로캘로 "2026. 07. 21." 처럼 점으로 그린다. 날짜는 하이픈이 규칙이라
                     상담이력 기간 필터(#mcStart)와 같은 "text + 숨은 date 섀도우" 구조로 둔다. */
                  '<span class="iwrap mddIw mddIwDate"><input type="text" class="finput mddDateInput" id="mddDate" placeholder="연도-월-일" maxlength="10" inputmode="numeric" autocomplete="off"><input type="date" class="mddDateSh dateshadow" id="mddDateSh" tabindex="-1" aria-hidden="true"><button type="button" class="ibtn" data-for="mddDateSh" title="날짜"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg></button></span>' +
                  '<span class="iwrap mddIw mddIwTime"><input type="time" class="finput mddTimeInput" id="mddTime"><button type="button" class="ibtn" data-for="mddTime" title="시간"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></button></span>' +
                '</div></td>' +
                '<th>상담방법</th>' +
                '<td><select class="fselect" id="mddMethod"></select></td>' +
              '</tr>' +
              '<tr>' +
                '<th>상담주제</th>' +
                '<td><select class="fselect" id="mddTopic"></select></td>' +
                '<th>상담상태</th>' +
                '<td><select class="fselect" id="mddStatus"></select></td>' +
              '</tr>' +
              '<tr>' +
                '<th>등록자</th>' +
                '<td><span class="mddPlainText" id="mddRegistrant"></span></td>' +
                '<th>등록일</th>' +
                '<td><span class="mddPlainText" id="mddRegisteredAt"></span></td>' +
              '</tr>' +
              '<tr>' +
                '<th>제목</th>' +
                '<td colspan="3"><input class="finput" id="mddTitle" placeholder="상담 일지 요약 제목을 입력해 주세요. (예: 원장님 1:1 SR Clinic 예약)"></td>' +
              '</tr>' +
              '<tr>' +
                '<th style="vertical-align:top;">내용</th>' +
                '<td colspan="3"><textarea class="mddContent" id="mddContent" placeholder="상담 상세 내용 및 건의사항을 작성해 주세요. (예: 어머님이 단어시험과 Writing에 대한 아쉬움 표현함...)"></textarea></td>' +
              '</tr>' +
              '<tr>' +
                '<th>상담결과</th>' +
                '<td colspan="3"><select class="fselect" id="mddResult"></select></td>' +
              '</tr>' +
            '</table>' +
          '</div>' +
          '<div class="modal-foot mddFoot">' +
            '<button class="btn g" id="mddPrintBtn"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>상담출력</button>' +
            '<button class="btn mddDelBtn" id="mddDeleteBtn" style="display:none;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>삭제</button>' +
            '<span style="flex:1;"></span>' +
            '<button class="btn mddSaveBtn" id="mddSaveBtn"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>저장</button>' +
            '<button class="btn g" id="mddCloseBtn">닫기</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);
    bindDetailEvents();
    _detailBuilt = true;
  }

  function syncResultEnabled() {
    var statusSel = document.getElementById('mddStatus');
    var resultSel = document.getElementById('mddResult');
    var enabled = statusSel.value === '완료';
    resultSel.disabled = !enabled;
    if (!enabled) resultSel.value = '';
    else if (!resultSel.value) resultSel.value = '만족'; // 완료 전환 시 기본값(선택 아님)을 '만족'으로 세팅 — 저장 시 '선택' 상태로는 저장 불가(§saveDetail 검증)
  }

  function closeDetailModal() {
    document.getElementById('mdModal').classList.remove('open');
    document.getElementById('mddTeacherList').classList.remove('open');
  }

  function populateDetailForm() {
    var s = _detailState.student || {};
    var rec = _detailState.record;
    var now = nowParts();

    // 학생 이름이 없을 때(신규 등록 중 이름 미입력 등, host 화면이 '-'로 채워 넘기는 경우 포함)
    // 헤더가 "[ - ] 상담상세정보"처럼 깨진 것 같은 모습으로 보이던 문제 수정(2026-08-11) — 이름이
    // 실제로 있을 때만 "[ 이름 / 영문명 ] 상담상세정보" 형태로 감싸고, 없으면 괄호 없이 "상담상세정보"만 표시
    var hasName = !!(s.name && s.name !== '-');
    document.getElementById('mddHeadTitle').textContent = hasName
      ? ('[ ' + s.name + (s.ename ? ' / ' + s.ename : '') + ' ] 상담상세정보')
      : '상담상세정보';
    document.getElementById('mddAvatarInit').textContent = s.name ? s.name.charAt(0) : '-';
    document.getElementById('mddNameCell').innerHTML = '<span class="mddNameCellKr">' + esc(s.name || '') + '</span>' + (s.ename ? ' / ' + esc(s.ename) : '') + (s.studentType ? ' (' + esc(s.studentType) + ')' : '');
    document.getElementById('mddClassCell').textContent = s.classNm || '-';
    document.getElementById('mddPhoneCell').textContent = s.phone || '-';
    document.getElementById('mddMotherPhoneCell').textContent = s.motherPhone || '-';

    document.getElementById('mddTarget').innerHTML = plainOptionsHtml(TARGET_OPTIONS);
    document.getElementById('mddMethod').innerHTML = plainOptionsHtml(METHOD_OPTIONS);
    document.getElementById('mddTopic').innerHTML = plainOptionsHtml(TOPIC_OPTIONS);
    document.getElementById('mddStatus').innerHTML = plainOptionsHtml(STATUS_OPTIONS);
    document.getElementById('mddResult').innerHTML = resultOptionsHtml();

    if (rec) {
      document.getElementById('mddTarget').value = rec.target || TARGET_OPTIONS[0];
      document.getElementById('mddTeacher').value = rec.teacher || '';
      document.getElementById('mddDate').value = rec.date || now.date;
      document.getElementById('mddDateSh').value = rec.date || now.date;
      document.getElementById('mddTime').value = rec.time || now.time;
      document.getElementById('mddMethod').value = rec.method || METHOD_OPTIONS[0];
      document.getElementById('mddTopic').value = rec.topic || TOPIC_OPTIONS[0];
      document.getElementById('mddStatus').value = rec.status || STATUS_OPTIONS[0];
      document.getElementById('mddRegistrant').textContent = rec.registrant || '';
      document.getElementById('mddRegisteredAt').textContent = (rec.registeredAt || '');
      document.getElementById('mddTitle').value = rec.title || '';
      document.getElementById('mddContent').value = rec.content || '';
      document.getElementById('mddResult').value = rec.result || '';
      document.getElementById('mddDeleteBtn').style.display = '';
    } else {
      document.getElementById('mddTarget').value = TARGET_OPTIONS[0];
      document.getElementById('mddTeacher').value = CURRENT_USER;
      document.getElementById('mddDate').value = now.date;
      document.getElementById('mddDateSh').value = now.date;
      document.getElementById('mddTime').value = now.time;
      document.getElementById('mddMethod').value = METHOD_OPTIONS[0];
      document.getElementById('mddTopic').value = _detailState.defaultTopic || TOPIC_OPTIONS[0];
      // 신규 등록 기본 상담상태는 STATUS_OPTIONS[0]('완료')이 아니라 '예정'이어야 한다(2026-08-11 확인·수정) —
      // OPTIONS[0]을 그대로 썼더니 아직 아무 내용도 입력하지 않은 신규 상담이 열자마자 "완료"로 표시되고,
      // syncResultEnabled()가 연쇄적으로 상담결과까지 "만족"으로 미리 채워버리는 오류가 있었다.
      document.getElementById('mddStatus').value = '예정';
      document.getElementById('mddRegistrant').textContent = CURRENT_USER;
      document.getElementById('mddRegisteredAt').textContent = now.display;
      document.getElementById('mddTitle').value = '';
      document.getElementById('mddContent').value = '';
      document.getElementById('mddResult').value = '';
      document.getElementById('mddDeleteBtn').style.display = 'none';
    }
    syncResultEnabled();
  }

  function findRecordIndex(records, id) {
    for (var i = 0; i < records.length; i++) { if (records[i].id === id) return i; }
    return -1;
  }

  function saveDetail() {
    var target = document.getElementById('mddTarget').value;
    var title = document.getElementById('mddTitle').value;
    var content = document.getElementById('mddContent').value;
    var status = document.getElementById('mddStatus').value;
    var resultSel = document.getElementById('mddResult');
    if (!target) { alert('상담대상을 선택해 주세요.'); document.getElementById('mddTarget').focus(); return; }
    if (!title.trim()) { alert('상담 제목을 입력해 주세요.'); document.getElementById('mddTitle').focus(); return; }
    if (!content.trim()) { alert('상담 상세 내용을 입력해 주세요.'); document.getElementById('mddContent').focus(); return; }
    if (status === '완료' && !resultSel.value) { alert('상담결과를 선택해 주세요.'); resultSel.focus(); return; }

    var rec = _detailState.record;
    var isNew = !rec;
    var now = nowParts();
    var data = {
      id: isNew ? ('m' + Date.now().toString(36)) : rec.id,
      date: document.getElementById('mddDate').value || now.date,
      time: document.getElementById('mddTime').value || now.time,
      status: status,
      topic: document.getElementById('mddTopic').value,
      title: title.trim(),
      content: content.trim(),
      target: target,
      method: document.getElementById('mddMethod').value,
      teacher: document.getElementById('mddTeacher').value.trim(),
      result: status === '완료' ? resultSel.value : '',
      registrant: isNew ? CURRENT_USER : rec.registrant,
      registeredAt: isNew ? now.display : rec.registeredAt
    };

    var records = _detailState.records;
    if (isNew) {
      records.push(data);
    } else {
      var idx = findRecordIndex(records, rec.id);
      if (idx > -1) records[idx] = data;
    }
    closeDetailModal();
    if (typeof _detailState.onSaved === 'function') _detailState.onSaved();
  }

  function deleteDetail() {
    var rec = _detailState.record;
    if (!rec) return;
    if (!confirm('이 상담 이력을 삭제하시겠습니까?')) return;
    var records = _detailState.records;
    var idx = findRecordIndex(records, rec.id);
    if (idx > -1) records.splice(idx, 1);
    closeDetailModal();
    if (typeof _detailState.onSaved === 'function') _detailState.onSaved();
  }

  function bindDetailEvents() {
    // 달력/시계 아이콘 버튼 — 다른 화면의 .ibtn 과 같은 동작(showPicker)
    document.querySelectorAll('#mdModal .mddIw .ibtn').forEach(function (b) {
      b.addEventListener('click', function () {
        var el = document.getElementById(b.getAttribute('data-for'));
        if (!el) return;
        if (typeof el.showPicker === 'function') el.showPicker(); else el.focus();
      });
    });
    /* 상담일시 날짜 — 섀도우에서 고른 값을 보이는 칸으로, 직접 타이핑은 YYYY-MM-DD 로 */
    (function () {
      var input = document.getElementById('mddDate');
      var shadow = document.getElementById('mddDateSh');
      if (!input || !shadow) return;
      shadow.addEventListener('change', function () {
        input.value = shadow.value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      input.addEventListener('input', function () {
        var v = input.value.replace(/[^0-9]/g, '').slice(0, 8);
        input.value = v.length > 6 ? v.slice(0,4)+'-'+v.slice(4,6)+'-'+v.slice(6)
                    : v.length > 4 ? v.slice(0,4)+'-'+v.slice(4)
                    : v;
        shadow.value = /^\d{4}-\d{2}-\d{2}$/.test(input.value) ? input.value : '';
      });
    })();
    document.getElementById('mddClose').addEventListener('click', closeDetailModal);
    document.getElementById('mddCloseBtn').addEventListener('click', closeDetailModal);
    document.getElementById('mddTeacherSearchBtn').addEventListener('click', function () {
      var list = document.getElementById('mddTeacherList');
      if (!list.innerHTML) list.innerHTML = teacherListHtml();
      list.classList.toggle('open');
    });
    document.getElementById('mddTeacherList').addEventListener('click', function (e) {
      var item = e.target.closest('[data-name]'); if (!item) return;
      document.getElementById('mddTeacher').value = item.dataset.name;
      this.classList.remove('open');
    });
    document.getElementById('mddStatus').addEventListener('change', syncResultEnabled);
    document.getElementById('mddSaveBtn').addEventListener('click', saveDetail);
    document.getElementById('mddDeleteBtn').addEventListener('click', deleteDetail);
    document.getElementById('mddPrintBtn').addEventListener('click', function () { window.print(); });
  }

  function openMemoDetailModal(opts) {
    opts = opts || {};
    buildDetailDom();
    _detailState.student = opts.student || { no: '', name: '', ename: '' };
    _detailState.record = opts.record || null;
    _detailState.records = opts.records || [];
    _detailState.onSaved = typeof opts.onSaved === 'function' ? opts.onSaved : null;
    _detailState.defaultTopic = opts.defaultTopic || null; // (선택) 신규 등록 시 "상담주제" 기본 선택값 — 미지정 시 TOPIC_OPTIONS[0]

    populateDetailForm();
    document.getElementById('mddTeacherList').innerHTML = '';
    document.getElementById('mddTeacherList').classList.remove('open');
    document.getElementById('mdModal').classList.add('open');
  }

  global.openMemoModal = openMemoModal;
  global.initMemoModal = buildDom; // 명시적으로 미리 DOM만 준비해두고 싶을 때(선택사항, openMemoModal이 자동으로 처리하므로 생략 가능)
  global.openMemoDetailModal = openMemoDetailModal;
})(window);
