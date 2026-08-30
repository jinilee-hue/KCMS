/*
 * PCMS 공용 "SMS 발송내역" 모달 컴포넌트
 *
 * 배경: PCMS-SCR-ET-02-010(설명회 예약자 현황)의 요청으로 실제 KIS "SMS 발송내역" 화면
 * 스크린샷을 근거로 구현. 검색결과 목록의 "SMS내역" 버튼(학생별 발송 건수 표시) 클릭 시
 * 해당 학생에게 발송된 SMS/LMS 이력을 조회하는 용도(다른 화면에서도 재사용 가능하도록 공용 컴포넌트로 분리).
 *
 * 빌드 스텝이 없는 정적 ui.html 목업이므로 ES module이 아닌 평범한 <script src> include로 동작한다.
 *
 * 사용법 — 각 화면의 </body> 직전, 화면 전용 <script> 보다 "먼저" 이 스크립트를 로드한 뒤:
  // 모달 창 이동(드래그)은 공용 컴포넌트 modal-drag.js가 담당한다(2026-08-14 전면 통합).
  // 구 구현(mousedown + position:fixed)은 마우스 전용이고 창이 화면 밖으로 대부분 빠져나갈 수 있어 폐기했다.
  // 상세·함정은 docs/design-system/interaction-patterns.md 패턴 4 참조.
 *   <script src="../../design-system/active/components/sms-history-modal.js"><\/script>
 *   <script>
 *     document.getElementById('tbody').addEventListener('click', function(e){
 *       var trigger = e.target.closest('[data-act="smshistory"]');
 *       if (!trigger) return;
 *       var row = findRow(trigger.dataset.no);
 *       openSmsHistoryModal({
 *         student: { name: row.name, ename: row.ename, studentNo: row.studentNo, phone: row.parentPhone },
 *         records: row.smsHistory   // SMS 발송 이력 배열(레퍼런스로 저장 — 아래 스키마 참조)
 *       });
 *     });
 *   <\/script>
 *
 * records 배열 원소 스키마:
 *   { id: 'sh1',
 *     type: '수동 발송',              // 구분 — TYPE_OPTIONS(수동 발송/출결 발송/자동 발송)
 *     name: '동대문 홍길동',           // 수신자 이름
 *     phone: '010-1234-1234',        // 수신 휴대폰
 *     content: '원장님, 안녕하세요...', // 발송내용(본문)
 *     msgType: 'LMS',                // 메시지구분 — SMS 또는 LMS
 *     sentAt: '2026-07-20 13:26',    // 발송일시(YYYY-MM-DD HH:MM)
 *     sender: '홍길동 (Gildong Hong)',        // 발송자
 *     sentCount: 1,                  // 발송건수
 *     successCount: 1,               // 성공건수
 *     failCount: 0,                  // 실패건수
 *     status: '성공'                 // 발송상태 — STATUS_OPTIONS(대기/성공/실패)
 *   }
 *
 * openSmsHistoryModal가 필요로 하는 CSS(각 화면 <style>에 이미 정의되어 있어야 함 — PCMS 전 화면
 * 공통 셸 스타일이므로 대부분 이미 있음): .modal-ov/.modal-ov.open, .modal-box, .modal-x, .modal-foot,
 * .btn/.btn.g/.btn.sm, .finput/.fselect
 * 이 파일 자체가 <style id="smsHistoryModalStyles">로 자동 주입하는 것(다른 화면과 겹칠 일이 거의
 * 없는 이 모달 전용 클래스만): .shHead, .shHeadTop, .shSection, .shSecHead, .shSecTitle, .shInfoIcon,
 * .shFilterRow, .shFilterRow2, .shSeg, .shIwrap, .shIbtn, .shSep, .shTableWrap, table.shTable, .shBadge,
 * .shEmpty, .shPaging
 * ("월별 발송 건수" 섹션과 그 아코디언 구조(.shAcc/.shAccHead/.shAccBody/.shChev/.shYearRow/.shMonthWrap/
 * table.shMonthTbl)는 2026-08-13 요청으로 완전히 제거됨 — 현업 부서에 불필요하다는 피드백)
 */

(function (global) {
  var TYPE_OPTIONS = ['수동 발송', '출결 발송', '자동 발송'];
  var STATUS_OPTIONS = ['대기', '성공', '실패'];
  var STATUS_COLOR = {
    '대기': { bg: '#EDF1F6', fg: '#2C3E5A' },
    '성공': { bg: '#EDF1F6', fg: '#2C3E5A' },
    '실패': { bg: '#FDECEC', fg: '#C0392B' }
  };

  var _built = false;
  var _state = {
    student: { name: '', ename: '', studentNo: '', phone: '' },
    records: [],
    page: 1,
    pageSize: 30,
    filter: { preset: 'custom', start: '', end: '', type: '', status: '', name: '', content: '' }
  };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function addDays(base, delta) { var d = new Date(base.getTime()); d.setDate(d.getDate() + delta); return d; }
  function monthStart(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-01'; }
  function dateOf(sentAt) { return (sentAt || '').slice(0, 10); }
  function plainOptionsHtml(list) {
    return '<option value="">전체</option>' + list.map(function (o) { return '<option value="' + escAttr(o) + '">' + esc(o) + '</option>'; }).join('');
  }

  function injectStyles() {
    if (document.getElementById('smsHistoryModalStyles')) return;
    var style = document.createElement('style');
    style.id = 'smsHistoryModalStyles';
    style.textContent =
      // 2026-08-13 요청 — "월별 발송 건수" 섹션을 통째로 삭제하면서, 모달 최초 표출 크기(높이)는 종전과
      // 같게 유지하고 그 대신 남은 "SMS 발송 내용" 표 영역이 비워진 공간을 채우도록 height를 고정값으로
      // 지정(기존엔 max-height만 있어 콘텐츠가 줄면 모달도 함께 줄어들었음)
      '.shModalWide{width:1320px;max-width:98vw;height:700px;}' +
      '.shHead{background:linear-gradient(180deg,#5d6b7c,#3f4c5a);color:#fff;padding:8px 12px 7px;flex:0 0 auto;}' +
      '.shHeadTop{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;}' +
      '.shHeadTop .modal-x{margin-left:auto;background:none;border:none;color:#fff;font-size:14px;cursor:pointer;}' +
      // "월별 발송 건수" 섹션 삭제(2026-08-13 요청, 현업 부서에 불필요) — 그 섹션을 열고 닫던 아코디언
      // 구조(shAcc/shAccHead/shChev)도 함께 걷어냈다. 남은 "SMS 발송 내용" 섹션은 이제 유일한 섹션이라
      // 접고 펼 필요가 없어 닫기/열기 버튼(shChev)도 없앤 평범한 섹션 헤더(.shSecHead)로 교체.
      // 대신 모달 전체 높이(.shModalWide height:700px, 위 참조)는 종전과 동일하게 유지되므로, 비어진
      // 공간을 아래 "SMS 발송 내용" 표 영역(.shTableWrap)이 flex:1로 채우도록 이 섹션 전체를 세로 flex로 구성.
      '.shSection{display:flex;flex-direction:column;flex:1;min-height:0;}' +
      '.shSecHead{display:flex;align-items:center;gap:6px;padding:8px 10px;background:#F4F7FD;border-radius:3px;margin-bottom:10px;flex:0 0 auto;}' +
      '.shSecTitle{font-size:12px;font-weight:700;color:#2C3E5A;display:inline-flex;align-items:center;gap:5px;}' +
      '.shInfoIcon{color:var(--txt-mut);font-size:11px;cursor:help;}' +
      '.shFilterRow{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px;flex:0 0 auto;}' +
      '.shFilterRow2{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:10px;flex:0 0 auto;}' +
      '.shFilterRow .lbl,.shFilterRow2 .lbl{font-size:11px;font-weight:700;color:#2C3E5A;flex:0 0 auto;}' +
      '.shSeg{display:inline-flex;gap:4px;flex:0 0 auto;}' +
      '.shSeg button{height:24px;padding:0 6px;border:1px solid var(--line);border-radius:3px;background:#fff;font-size:12px;color:var(--txt-mut);cursor:pointer;white-space:nowrap;}' +
      '.shSeg button:hover{border-color:var(--pb);color:var(--pb);}' +
      '.shSeg button.on{background:var(--pb);border-color:var(--pb);color:#fff;font-weight:700;}' +
      '.shIwrap{position:relative;width:120px;height:24px;flex:0 0 auto;}' +
      '.shIwrap input{width:100%;height:100%;border:1px solid var(--line);border-radius:3px;padding:0 22px 0 8px;font-size:12px;background:#fff;color:var(--txt);}' +
      '.shIwrap input::-webkit-calendar-picker-indicator{display:none;}' +
      /* 네이티브 date 입력은 브라우저가 "2026. 08. 25." 로 그린다 — 다른 화면의 날짜 표기
         (YYYY-MM-DD)와 어긋나 보이는 텍스트 입력 + 숨은 date 섀도우 구조로 바꿨다(2026-08-25 요청).
         값 형식은 그대로 YYYY-MM-DD 라 이 모달의 필터 로직은 손대지 않았다. */
      '.shIwrap .shDateSh{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0;padding:0;}' +
      '.shIbtn{position:absolute;right:2px;top:50%;transform:translateY(-50%);width:18px;height:18px;border:1px solid var(--line);border-radius:3px;background:#fff;color:var(--pb-deeper);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;}' +
      '.shIbtn:hover{border-color:var(--pb);color:var(--pb);}' +
      '.shSep{color:var(--txt-mut);font-size:11px;flex:0 0 auto;}' +
      '.shTableWrap{flex:1;min-height:0;overflow:auto;border:1px solid var(--line-soft);border-radius:3px;}' +
      'table.shTable{width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;}' +
      'table.shTable thead th{position:sticky;top:0;z-index:2;background:#F4F7FD;color:#2C3E5A;font-weight:700;height:26px;border-bottom:1px solid #C8D5EB;padding:0 6px;text-align:center;box-shadow:0 1px 0 #C8D5EB;}' +
      'table.shTable tbody td{border-bottom:1px solid var(--line-soft);padding:6px 7px;text-align:center;vertical-align:top;white-space:nowrap;}' +
      'table.shTable tbody tr:nth-child(even){background:#f7f9fc;}' +
      'table.shTable tbody tr:hover{background:#f2f6fc;}' +
      'table.shTable tbody td.shContentCell{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left;}' +
      '.shBadge{display:inline-block;border-radius:3px;padding:2px 8px;font-size:10.5px;font-weight:700;white-space:nowrap;}' +
      '.shEmpty{text-align:center;padding:50px 10px;color:var(--txt-mut);font-size:12px;}' +
      '.shPaging{display:flex;align-items:center;gap:8px;padding:8px 2px 0;font-size:12px;color:var(--txt-mut);flex:0 0 auto;}' +
      '.shPaging .pg{display:flex;gap:2px;}' +
      '.shPaging .pg b{min-width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:3px;cursor:pointer;font-weight:400;background:#fff;}' +
      '.shPaging .pg b.on{background:var(--pb);color:#fff;border-color:var(--pb-dark);font-weight:700;}' +
      '.shPaging .pg b.dis{opacity:.4;cursor:not-allowed;}' +
      '.shPaging .shRefresh{width:22px;height:20px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:3px;background:#fff;color:var(--txt-mut);cursor:pointer;padding:0;}' +
      '.shPaging .shRefresh:hover{border-color:var(--pb);color:var(--pb);}' +
      '.shPaging .shSize{display:flex;align-items:center;gap:6px;margin-left:auto;}' +
      '.shPaging .shSize select{height:22px;border:1px solid var(--line);border-radius:3px;padding:0 6px;font-size:12px;background:#fff;color:var(--txt);}' +
      '.shPaging .shTotal{padding-left:10px;border-left:1px solid var(--line-soft);text-align:right;}';
    document.head.appendChild(style);
  }

  function buildDom() {
    if (_built) return;
    injectStyles();
    var html =
      '<div class="modal-ov" id="shModal">' +
        '<div class="modal-box shModalWide" style="max-height:92vh;">' +
          '<div class="shHead">' +
            '<div class="shHeadTop">' +
              '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 20l1.4-4.2A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg>' +
              '<span id="shHeadTitle">SMS 발송내역</span>' +
              '<button class="modal-x" id="shClose">✕</button>' +
            '</div>' +
          '</div>' +
          /* 섹션 타이틀·검색줄은 흰 콘텐츠 박스 위(밖)로 뺀다 — 입학 설명회 내역 팝업과 같은 구조(2026-08-24 요청) */
          /* 섹션 타이틀("SMS 발송 내용")은 모달 헤더와 내용이 겹쳐 제거(2026-08-24 요청) */
          '<div class="shFilterRow">' +
          '<span class="lbl">기간</span>' +
          '<div class="shSeg" id="shPresetSeg">' +
          '<button type="button" data-preset="1d">1일</button>' +
          '<button type="button" data-preset="1w">1주</button>' +
          '<button type="button" data-preset="15d">15일</button>' +
          '<button type="button" data-preset="1m">1달</button>' +
          '</div>' +
          '<span class="shIwrap iwrap"><input type="text" id="shStart" placeholder="연도-월-일" maxlength="10" inputmode="numeric" autocomplete="off"><input type="date" class="shDateSh dateshadow" tabindex="-1" aria-hidden="true"><button type="button" class="shIbtn ibtn" tabindex="-1"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg></button></span>' +
          '<span class="shSep">~</span>' +
          '<span class="shIwrap iwrap"><input type="text" id="shEnd" placeholder="연도-월-일" maxlength="10" inputmode="numeric" autocomplete="off"><input type="date" class="shDateSh dateshadow" tabindex="-1" aria-hidden="true"><button type="button" class="shIbtn ibtn" tabindex="-1"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg></button></span>' +
          '</div>' +
          '<div class="shFilterRow2">' +
          '<span class="lbl">구분</span><select class="fselect" id="shTypeSel" style="width:104px;"></select>' +
          '<span class="lbl">발송 상태</span><select class="fselect" id="shStatusSel" style="width:90px;"></select>' +
          '<span class="lbl">이름</span><input class="finput" id="shNameFilter" style="width:110px;">' +
          '<span class="lbl">발송 내용</span><input class="finput" id="shContentFilter" style="flex:1;min-width:140px;">' +
          '<button class="btn sm" id="shSearchBtn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>검색</button>' +
          '</div>' +
          '<div class="modal-body" style="display:flex;flex-direction:column;overflow:auto;flex:1;min-height:0;">' +

            '<div class="shSection">' +
              /* 건수는 표 바로 위(흰 박스 안)에 — 입학 설명회 내역 팝업과 같은 위치(2026-08-24 요청) */
          '<div class="shCount" id="shTotalCount"></div>' +
          '<div class="shTableWrap">' +
                '<table class="shTable">' +
                  '<thead><tr>' +
                    '<th style="width:36px;">No</th><th style="width:66px;">구분</th><th style="width:96px;">이름</th><th style="width:96px;">휴대폰</th>' +
                    '<th>발송내용</th><th style="width:92px;">메시지구분</th><th style="width:128px;">발송일</th><th style="width:88px;">발송자</th>' +
                    '<th style="width:56px;">발송건수</th><th style="width:56px;">성공건수</th><th style="width:56px;">실패건수</th>' +
                  '</tr></thead>' +
                  '<tbody id="shBody"></tbody>' +
                '</table>' +
              '</div>' +
              '<div class="shPaging" id="shPaging"></div>' +
            '</div>' +

          '</div>' +
          '<div class="modal-foot"><button class="btn g" id="shCloseBtn">닫기</button></div>' +
        '</div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);
    bindEvents();
    _built = true;
  }

  // ===== SMS 발송 내용 목록/필터/페이징 =====
  function syncFilterInputs() {
    document.getElementById('shStart').value = _state.filter.start || '';
    document.getElementById('shEnd').value = _state.filter.end || '';
    document.getElementById('shTypeSel').value = _state.filter.type || '';
    document.getElementById('shStatusSel').value = _state.filter.status || '';
    document.getElementById('shNameFilter').value = _state.filter.name || '';
    document.getElementById('shContentFilter').value = _state.filter.content || '';
    document.querySelectorAll('#shPresetSeg button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.preset === _state.filter.preset);
    });
  }

  function applyPreset(key) {
    var today = new Date();
    var end = fmtDate(today);
    var start = key === '1d' ? end : key === '1w' ? fmtDate(addDays(today, -6)) : key === '15d' ? fmtDate(addDays(today, -14)) : fmtDate(addDays(today, -29));
    _state.filter.preset = key;
    _state.filter.start = start;
    _state.filter.end = end;
    syncFilterInputs();
    _state.page = 1;
    renderList();
  }

  function matchesFilter(rec) {
    var d = dateOf(rec.sentAt);
    if (_state.filter.start && d < _state.filter.start) return false;
    if (_state.filter.end && d > _state.filter.end) return false;
    if (_state.filter.type && rec.type !== _state.filter.type) return false;
    if (_state.filter.status && rec.status !== _state.filter.status) return false;
    var nameQ = (_state.filter.name || '').trim();
    if (nameQ && (rec.name || '').indexOf(nameQ) === -1) return false;
    var contentQ = (_state.filter.content || '').trim();
    if (contentQ && (rec.content || '').indexOf(contentQ) === -1) return false;
    return true;
  }

  function renderList() {
    var filtered = _state.records.filter(matchesFilter);
    filtered.sort(function (a, b) { return (b.sentAt || '') < (a.sentAt || '') ? -1 : (b.sentAt || '') > (a.sentAt || '') ? 1 : 0; });
    var total = filtered.length;
    var body = document.getElementById('shBody');
    if (!total) {
      body.innerHTML = '<tr><td colspan="11"><div class="shEmpty">조회된 SMS 발송내역이 없습니다.</div></td></tr>';
      renderPaging(0, 0, 1);
      return;
    }
    var totalPages = Math.max(1, Math.ceil(total / _state.pageSize));
    if (_state.page > totalPages) _state.page = totalPages;
    if (_state.page < 1) _state.page = 1;
    var startIdx = (_state.page - 1) * _state.pageSize;
    var pageRows = filtered.slice(startIdx, startIdx + _state.pageSize);
    body.innerHTML = pageRows.map(function (r, i) {
      var color = STATUS_COLOR[r.status] || { bg: '#eef1f5', fg: '#5b6776' };
      return '' +
        '<tr>' +
          '<td>' + (startIdx + i + 1) + '</td>' +
          '<td>' + esc(r.type) + '</td>' +
          '<td>' + esc(r.name) + '</td>' +
          '<td>' + esc(r.phone) + '</td>' +
          '<td class="shContentCell" title="' + escAttr(r.content) + '">' + esc(r.content) + '</td>' +
          '<td>' + esc(r.msgType) + '</td>' +
          '<td>' + esc(r.sentAt) + '</td>' +
          '<td>' + esc(r.sender) + '</td>' +
          '<td>' + (r.sentCount || 0) + '</td>' +
          '<td>' + (r.successCount || 0) + '</td>' +
          '<td>' + (r.failCount || 0) + '</td>' +
        '</tr>';
    }).join('');
    renderPaging(startIdx + 1, Math.min(startIdx + _state.pageSize, total), totalPages, total);
  }

  function renderPaging(fromNo, toNo, totalPages, total) {
    var el = document.getElementById('shPaging');
    // id 는 shTotalCount — 입학 설명회 내역 팝업(semHistModal)에 이미 id="shCount" 가 있어
    // getElementById 가 그쪽을 먼저 잡는 충돌이 있었다(2026-08-24).
    var cnt = document.getElementById('shTotalCount');
    if (!fromNo) { el.innerHTML = ''; if (cnt) cnt.innerHTML = '전체 <b>0</b>건'; return; }
    if (cnt) cnt.innerHTML = '전체 <b>' + total + '</b>건';
    var groupSize = 5;
    var groupStart = Math.floor((_state.page - 1) / groupSize) * groupSize + 1;
    var groupEnd = Math.min(groupStart + groupSize - 1, totalPages);
    var html = '<span class="pg">';
    html += '<b class="' + (_state.page <= 1 ? 'dis' : '') + '" data-pg="first">&laquo;</b>';
    html += '<b class="' + (_state.page <= 1 ? 'dis' : '') + '" data-pg="prev">&lsaquo;</b>';
    for (var p = groupStart; p <= groupEnd; p++) html += '<b class="' + (p === _state.page ? 'on' : '') + '" data-pg="' + p + '">' + p + '</b>';
    html += '<b class="' + (_state.page >= totalPages ? 'dis' : '') + '" data-pg="next">&rsaquo;</b>';
    html += '<b class="' + (_state.page >= totalPages ? 'dis' : '') + '" data-pg="last">&raquo;</b>';
    html += '</span>';
    /* 본문 목록 페이징과 같은 구성 — 번호 다음에 페이지 직접입력(2026-08-29 요청) */
    html += '<span class="shJump pgjump">페이지 <input type="number" class="shPageInput" min="1" max="' + totalPages + '" value="' + _state.page + '"> / ' + totalPages + '</span>';
    html += '<button type="button" class="shRefresh" title="새로고침"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg></button>';
    html += '<span class="shSize">페이지당 <select class="shSizeSel">' + [30, 50, 100].map(function (n) { return '<option value="' + n + '"' + (n === _state.pageSize ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></span>';
    html += '<span class="shTotal">' + fromNo + ' - ' + toNo + '</span>';
    el.innerHTML = html;
  }

  function bindEvents() {
    document.getElementById('shClose').addEventListener('click', function () { document.getElementById('shModal').classList.remove('open'); });
    document.getElementById('shCloseBtn').addEventListener('click', function () { document.getElementById('shModal').classList.remove('open'); });

    document.getElementById('shPresetSeg').addEventListener('click', function (e) {
      var btn = e.target.closest('button'); if (!btn) return;
      applyPreset(btn.dataset.preset);
    });
    document.getElementById('shStart').addEventListener('change', function () {
      _state.filter.preset = 'custom'; _state.filter.start = this.value;
      if (_state.filter.start && _state.filter.end && _state.filter.start > _state.filter.end) alert('종료일은 시작일 이후여야 합니다.');
      syncFilterInputs(); _state.page = 1; renderList();
    });
    document.getElementById('shEnd').addEventListener('change', function () {
      _state.filter.preset = 'custom'; _state.filter.end = this.value;
      if (_state.filter.start && _state.filter.end && _state.filter.start > _state.filter.end) alert('종료일은 시작일 이후여야 합니다.');
      syncFilterInputs(); _state.page = 1; renderList();
    });
    Array.prototype.forEach.call(document.querySelectorAll('#shModal .shIwrap'), function (wrap) {
      var input = wrap.querySelector('input[type="text"]');
      var shadow = wrap.querySelector('input[type="date"]');
      var btn = wrap.querySelector('.shIbtn');
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
    document.getElementById('shTypeSel').addEventListener('change', function () { _state.filter.type = this.value; _state.page = 1; renderList(); });
    document.getElementById('shStatusSel').addEventListener('change', function () { _state.filter.status = this.value; _state.page = 1; renderList(); });
    ['shNameFilter', 'shContentFilter'].forEach(function (id) {
      var field = id === 'shNameFilter' ? 'name' : 'content';
      document.getElementById(id).addEventListener('input', function () { _state.filter[field] = this.value; _state.page = 1; renderList(); });
      document.getElementById(id).addEventListener('keydown', function (e) { if (e.key === 'Enter') { _state.page = 1; renderList(); } });
    });
    document.getElementById('shSearchBtn').addEventListener('click', function () { _state.page = 1; renderList(); });

    document.getElementById('shPaging').addEventListener('click', function (e) {
      if (e.target.closest('.shRefresh')) { renderList(); return; }
      var b = e.target.closest('[data-pg]');
      if (!b || b.classList.contains('dis')) return;
      var totalPages = Math.max(1, Math.ceil(_state.records.filter(matchesFilter).length / _state.pageSize));
      var pg = b.dataset.pg;
      if (pg === 'first') _state.page = 1;
      else if (pg === 'prev') _state.page = Math.max(1, _state.page - 1);
      else if (pg === 'next') _state.page = Math.min(totalPages, _state.page + 1);
      else if (pg === 'last') _state.page = totalPages;
      else _state.page = parseInt(pg, 10);
      renderList();
    });
    document.getElementById('shPaging').addEventListener('change', function (e) {
      /* 페이지 직접입력 — 본문 목록 페이징과 같은 동작(2026-08-29) */
      if (e.target.classList.contains('shPageInput')) {
        var max = parseInt(e.target.getAttribute('max'), 10) || 1;
        _state.page = Math.min(max, Math.max(1, parseInt(e.target.value, 10) || 1));
        renderList();
        return;
      }
      if (!e.target.classList.contains('shSizeSel')) return;
      _state.pageSize = parseInt(e.target.value, 10) || 30;
      _state.page = 1;
      renderList();
    });
  }

  function openSmsHistoryModal(opts) {
    opts = opts || {};
    buildDom();

    _state.student = {
      name: opts.student && opts.student.name || '',
      ename: opts.student && opts.student.ename || '',
      studentNo: opts.student && opts.student.studentNo || '',
      phone: opts.student && opts.student.phone || ''
    };
    _state.records = opts.records || [];
    _state.page = 1;

    var titleText = 'SMS 발송내역' + (_state.student.name ? ' — ' + _state.student.name + (_state.student.ename ? ' (' + _state.student.ename + ')' : '') : '');
    document.getElementById('shHeadTitle').textContent = titleText;

    document.getElementById('shTypeSel').innerHTML = plainOptionsHtml(TYPE_OPTIONS);
    document.getElementById('shStatusSel').innerHTML = plainOptionsHtml(STATUS_OPTIONS);

    // 검색기간 기본값: today가 속한 달의 첫날 ~ today (PCMS 내 다른 기간 필터와 동일한 기본값 규칙)
    var today = new Date();
    _state.filter = { preset: 'custom', start: monthStart(today), end: fmtDate(today), type: '', status: '', name: '', content: '' };
    syncFilterInputs();

    renderList();

    document.getElementById('shModal').classList.add('open');
  }


  global.openSmsHistoryModal = openSmsHistoryModal;
})(window);
