/*
 * PCMS 공용 "담당자찾기" 모달 컴포넌트
 *
 * 정본 문서(single source of truth): docs/screens/ET_입학관리/공통담당자찾기모달_spec.md
 * 기능/문구/예외처리를 바꿀 때는 이 파일과 위 spec.md를 함께 갱신한다.
 *
 * 배경(2026-08-06 결정):
 *  기존엔 PCMS-SCR-ET-02-011_예비생정보의 "상담/MAP 등록" 모달 안에만 "담당자찾기" 서브 모달
 *  (직급/직책/상태/직원명 검색 + 결과 그리드 + 적용)이 그 화면 전용으로 구현돼 있었다. 사용자가
 *  "이 모달은 다른 화면에서도 여기저기 쓸 예정이니 memo-modal.js(공통상담이력모달)처럼 독립 공용
 *  모달로 만들자"고 요청 → 이 컴포넌트로 분리했다. 직원 명부(STAFF_DIRECTORY)도 이 파일로 옮겨
 *  화면마다 다른 mock 인력 목록을 쓰던 것을 하나로 통일했다.
 *
 *  ET-02-011의 기존 구현은 결과 그리드에 컬럼 표시/숨김·정렬·너비조절(COLMENU_CTX/
 *  attachColResizeHandles, 그 화면의 메인 리스트 그리드 전용 페이지-로컬 유틸)까지 갖추고 있었으나,
 *  이는 "목록 조회 그리드"에 맞는 기능이라 "값 하나를 골라 돌려주는 픽커 모달"에는 과한 기능으로
 *  판단해 이번 분리 시 제외했다(고정 6컬럼, 정렬/리사이즈 없음). 필요해지면 별도 요청으로 추가.
 *
 * 빌드 스텝이 없는 정적 ui.html 목업이므로 ES module이 아닌 평범한 <script src> include로 동작한다.
 *
 * 사용법 — 각 화면의 </body> 직전, 화면 전용 <script> 보다 "먼저" 이 스크립트를 로드한 뒤:
 *   <script src="../../design-system/active/components/staff-pick-modal.js"><\/script>
 *   <script>
 *     document.getElementById('someSearchBtn').addEventListener('click', function(){
 *       openStaffPickModal({
 *         onApply: function(staff){                 // 사용자가 [적용] 클릭 시 1회 호출
 *           document.getElementById('someInput').value = staff.name; // "홍길동 (Gildong Hong)" 형태
 *         }
 *       });
 *     });
 *   <\/script>
 *
 * onApply(staff)로 전달되는 staff 객체 스키마(STAFF_DIRECTORY 원소와 동일):
 *   { name: '홍길동 (Gildong Hong)', position: 'POLY MAP교사', rank: '주임', status: '재직',
 *     mobile: '010-1234-1234', hireDate: '2019-03-04' }
 *
 * openStaffPickModal()가 필요로 하는 CSS(각 화면 <style>에 이미 정의되어 있어야 함 — PCMS 전 화면
 * 공통 셸 스타일이므로 대부분 이미 있음): .modal-ov/.modal-ov.open, .modal-box, .modal-box.wide,
 * .modal-hd, .modal-x, .modal-foot, .btn/.btn.sm, .finput, .fselect, CSS 변수(--pb/--line/--txt/--txt-mut 등)
 * 이 파일 자체가 <style id="staffPickModalStyles">로 자동 주입하는 것(다른 화면과 겹칠 일이 거의
 * 없는 이 모달 전용 클래스만): .spmRow, .spmLbl, .spmTbl, .spmRowSel, .spmEmpty, .spmPg
 *
 * 모달 DOM(#staffPickModal)은 최초 openStaffPickModal() 호출 시 1회만 document.body에 생성되고
 * (컴포넌트가 이미 이 화면에서 열린 적 있으면 재사용), 여러 화면/여러 버튼이 같은 인스턴스를
 * 공유해도 무방하다(호출마다 onApply 콜백만 교체됨).
 */

(function (global) {
  // 전부 가상 더미(실제 KCMS 직원정보 아님). 다른 화면 mock에서 이미 담당교사/접수자로 쓰이는
  // 이름(모두 홍길동)은 재직·POLY MAP교사로 포함시켜 이름 일관성 유지
  var STAFF_DIRECTORY = [
    { name: '홍길동 (Gildong Hong)', position: 'POLY MAP교사', rank: '주임', status: '재직', mobile: '010-1234-1234', hireDate: '2019-03-04' },
    { name: '홍길동 (Gildong Hong)', position: 'POLY MAP교사', rank: '주임', status: '재직', mobile: '010-1234-1234', hireDate: '2020-07-13' },
    { name:'홍길동', position: 'POLY MAP교사', rank: '사원', status: '재직', mobile: '010-1234-1234', hireDate: '2022-01-10' },
    { name:'홍길동', position: '기타', rank: '사원', status: '재직', mobile: '010-1234-1234', hireDate: '2007-11-11' },
    { name:'홍길동', position: 'POLY안전요원', rank: '사원', status: '재직', mobile: '010-1234-1234', hireDate: '2012-04-09' },
    { name:'홍길동', position: 'POLY안전요원', rank: '사원', status: '재직', mobile: '010-1234-1234', hireDate: '2014-07-21' },
    { name:'홍길동', position: 'POLY안전요원', rank: '사원', status: '재직', mobile: '010-1234-1234', hireDate: '2016-04-19' },
    { name:'홍길동', position: 'POLY안전요원', rank: '대리', status: '재직', mobile: '010-1234-1234', hireDate: '2016-07-07' },
    { name:'홍길동', position: '유치부교사', rank: '주임', status: '재직', mobile: '010-1234-1234', hireDate: '2022-02-28' },
    { name:'홍길동', position: 'POLY안전요원', rank: '사원', status: '재직', mobile: '010-1234-1234', hireDate: '2018-05-16' },
    { name:'홍길동', position: '사서', rank: '사원', status: '재직', mobile: '010-1234-1234', hireDate: '2018-07-16' },
    { name:'홍길동', position: 'POLY안전요원', rank: '대리', status: '재직', mobile: '010-1234-1234', hireDate: '2018-11-19' },
    { name:'홍길동', position: '초등부교사', rank: '과장', status: '재직', mobile: '010-1234-1234', hireDate: '2015-09-02' },
    { name:'홍길동', position: '중등부교사', rank: '대리', status: '재직', mobile: '010-1234-1234', hireDate: '2019-10-21' },
    { name:'홍길동', position: '행정직', rank: '사원', status: '재직', mobile: '010-1234-1234', hireDate: '2021-03-15' },
    { name:'홍길동', position: '행정직', rank: '주임', status: '재직', mobile: '010-1234-1234', hireDate: '2017-06-01' },
    { name:'홍길동', position: '원장', rank: '원장', status: '재직', mobile: '010-1234-1234', hireDate: '2010-01-05' },
    { name:'홍길동', position: 'POLY MAP교사', rank: '대리', status: '재직', mobile: '010-1234-1234', hireDate: '2020-02-17' },
    { name:'홍길동', position: '초등부교사', rank: '사원', status: '재직', mobile: '010-1234-1234', hireDate: '2023-03-06' },
    { name:'홍길동', position: '유치부교사', rank: '사원', status: '재직', mobile: '010-1234-1234', hireDate: '2023-09-11' },
    { name:'홍길동', position: '중등부교사', rank: '과장', status: '퇴직', mobile: '010-1234-1234', hireDate: '2013-04-08' },
    { name:'홍길동', position: '행정직', rank: '사원', status: '퇴직', mobile: '010-1234-1234', hireDate: '2016-08-30' }
  ];

  var STAFF_PICK_COLS = [
    { key: 'name', label: '직원명' },
    { key: 'position', label: '직책' },
    { key: 'rank', label: '직급' },
    { key: 'status', label: '상태' },
    { key: 'mobile', label: '휴대폰' },
    { key: 'hireDate', label: '입사일' }
  ];

  var _built = false;
  var _state = { onApply: null, list: null, selectedName: null };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }

  function injectStyles() {
    if (document.getElementById('staffPickModalStyles')) return;
    var style = document.createElement('style');
    style.id = 'staffPickModalStyles';
    style.textContent =
      '#staffPickModal .spmRow{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#eef1f5;border-bottom:1px solid #bcc6d1;flex-wrap:wrap;flex:0 0 auto;}' +
      '#staffPickModal .spmLbl{background:none;color:var(--gnb,#2C3E5A);font-size:11.5px;font-weight:700;padding:0;white-space:nowrap;}' +
      '#staffPickModal .spmRow select,#staffPickModal .spmRow input{height:24px;width:130px;}' +
      '#staffPickModal table.spmTbl{border-collapse:collapse;width:100%;font-size:12px;}' +
      '#staffPickModal table.spmTbl th{position:sticky;top:0;background:#7B9BB7;color:#fff;font-weight:700;height:26px;border:1px solid #6a89a5;text-align:center;}' +
      '#staffPickModal table.spmTbl td{border:1px solid #dfe4e9;padding:6px 8px;color:var(--txt,#1f2937);text-align:center;}' +
      '#staffPickModal table.spmTbl tbody tr{cursor:pointer;}' +
      '#staffPickModal table.spmTbl tbody tr:nth-child(even){background:#f6f8fa;}' +
      '#staffPickModal table.spmTbl tbody tr:hover{background:var(--pb-a08,rgba(0,102,255,.08));}' +
      '#staffPickModal table.spmTbl tbody tr.spmRowSel{background:var(--pb-a15,rgba(0,102,255,.15));box-shadow:inset 3px 0 0 var(--pb,#0066FF);font-weight:700;}' +
      '#staffPickModal .spmEmpty{text-align:center;color:var(--txt-mut,#5b6776);padding:20px 0;}' +
      '#staffPickModal #spmPaging{margin:0;padding-left:0;padding-right:0;}' +   /* 좌우 여백은 본문(.modal-body)이 준다 — SMS 발송 모달과 같게 */
      /* 검색줄 바로 아래 붙인다 — SMS 발송 모달도 본문 위 여백이 0 이다 */
      '#staffPickModal .modal-body{margin-top:0;}' +
      /* 셀렉트가 커스텀(.csel)으로 바뀌면 .csel{width:100%} 때문에 폭이 모달 전체로 퍼진다.
         그러면 검색줄이 네 줄로 늘어난다(화면 실측 206px). 원래 폭으로 묶는다. */
      '#staffPickModal .spmRow .fselect,#staffPickModal .spmRow .csel{width:130px;flex:0 0 130px;}' +
      '#staffPickModal .spmRow .csel .csel-box{width:100%;}' +
      '#staffPickModal .spmPg{display:inline-flex;align-items:center;gap:2px;}' +
      '#staffPickModal .spmPg button{height:22px;min-width:22px;padding:0 4px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line,#cfd6e0);border-radius:3px;background:#fff;color:var(--txt-mut,#5b6776);cursor:not-allowed;opacity:.4;font-size:11px;}' +
      '#staffPickModal .spmJump{display:inline-flex;align-items:center;gap:4px;margin-left:6px;font-size:11px;color:var(--txt-mut,#5b6776);}' +
      '#staffPickModal .spmJump input{width:28px;height:22px;border:1px solid var(--line,#cfd6e0);border-radius:3px;text-align:center;font-size:11px;padding:0;}';
    document.head.appendChild(style);
  }

  function buildModal() {
    if (_built) return;
    injectStyles();

    var ranks = ['전체'].concat(STAFF_DIRECTORY.map(function (s) { return s.rank; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    var positions = ['전체'].concat(STAFF_DIRECTORY.map(function (s) { return s.position; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    var rankOpts = ranks.map(function (r) { return '<option value="' + (r === '전체' ? '' : escAttr(r)) + '">' + esc(r) + '</option>'; }).join('');
    var posOpts = positions.map(function (p) { return '<option value="' + (p === '전체' ? '' : escAttr(p)) + '">' + esc(p) + '</option>'; }).join('');
    var headHtml = '<th style="width:44px;">순번</th>' + STAFF_PICK_COLS.map(function (c) { return '<th>' + esc(c.label) + '</th>'; }).join('');

    var html =
      '<div class="modal-ov" id="staffPickModal" role="dialog" aria-modal="true">' +
        '<div class="modal-box wide" style="width:860px;max-width:96vw;height:580px;">' +
          '<div class="modal-hd"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>담당자 찾기<button class="modal-x" id="spmClose">✕</button></div>' +
          '<div class="spmRow">' +
            '<span class="spmLbl">직급</span><select class="fselect" id="spmFRank">' + rankOpts + '</select>' +
            '<span class="spmLbl">직책</span><select class="fselect" id="spmFPosition">' + posOpts + '</select>' +
            '<span class="spmLbl">상태</span><select class="fselect" id="spmFStatus"><option value="재직">재직</option><option value="퇴직">퇴직</option><option value="">전체</option></select>' +
            '<span class="spmLbl">직원명</span><input class="finput" id="spmFName" placeholder="직원명 입력">' +
            '<button type="button" class="btn s" id="spmSearchBtn"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>검색</button>' +
          '</div>' +
          /* 표와 페이징은 한 흰 박스(.modal-body) 안에 둔다 — SMS 발송 모달과 같은 구조 */
          '<div class="modal-body" style="display:flex;flex-direction:column;overflow:hidden;">' +
            '<div class="tblwrap" style="flex:1;min-height:0;overflow:auto;width:auto;">' +
              '<table class="spmTbl recordtbl"><thead><tr>' + headHtml + '</tr></thead><tbody id="spmBody"></tbody></table>' +
            '</div>' +
            '<div class="paging" id="spmPaging"></div>' +
          '</div>' +
          '<div class="modal-foot">' +
            '<button class="btn" id="spmApplyBtn">' + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' + '적용</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstChild);

    document.getElementById('spmSearchBtn').addEventListener('click', renderResults);
    document.getElementById('spmFName').addEventListener('keydown', function (e) { if (e.key === 'Enter') renderResults(); });
    document.getElementById('spmApplyBtn').addEventListener('click', function () {
      if (!_state.selectedName) return;
      var staff = STAFF_DIRECTORY.filter(function (s) { return s.name === _state.selectedName; })[0];
      closeModal();
      if (staff && typeof _state.onApply === 'function') _state.onApply(staff);
    });
    document.getElementById('spmClose').addEventListener('click', closeModal);
    document.getElementById('staffPickModal').addEventListener('click', function (e) { if (e.target === this) closeModal(); });

    _built = true;
  }

  function closeModal() {
    var m = document.getElementById('staffPickModal');
    if (m) m.classList.remove('open');
  }

  var SPM_PAGE_SIZE = 30;

  /* 페이징은 SMS 발송 모달의 대상추가 목록과 같은 구성이다 —
     « ‹ [번호] › » · 페이지 [입력] / N · 새로고침 · 페이지당 */
  function renderSpmPaging(total) {
    var el = document.getElementById('spmPaging');
    if (!el) return;
    var pages = Math.max(1, Math.ceil(total / SPM_PAGE_SIZE));
    var page = Math.min(Math.max(1, _state.page || 1), pages);
    _state.page = page;
    var end = Math.min(pages, Math.max(5, page + 2)), start = Math.max(1, end - 4);
    var nums = '';
    for (var p = start; p <= end; p++) {
      nums += '<button type="button" class="pgnum' + (p === page ? ' on' : '') + '" data-p="' + p + '">' + p + '</button>';
    }
    el.innerHTML =
      '<button type="button" class="pgnav" data-go="first" title="처음"' + (page <= 1 ? ' disabled' : '') + '>&laquo;</button>' +
      '<button type="button" class="pgnav" data-go="prev" title="이전"' + (page <= 1 ? ' disabled' : '') + '>&lsaquo;</button>' +
      nums +
      '<button type="button" class="pgnav" data-go="next" title="다음"' + (page >= pages ? ' disabled' : '') + '>&rsaquo;</button>' +
      '<button type="button" class="pgnav" data-go="last" title="끝"' + (page >= pages ? ' disabled' : '') + '>&raquo;</button>' +
      '<span class="pgjump">페이지 <input type="number" class="pgpage" min="1" max="' + pages + '" value="' + page + '"> / ' + pages + '</span>' +
      '<button type="button" class="pgnav" data-go="refresh" title="새로고침">' +
        '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg></button>' +
      '<span class="pgsize">페이지당 <select class="pgsizesel" aria-label="페이지당 표시 개수">' +
        [30, 50, 100].map(function (n) { return '<option value="' + n + '"' + (n === SPM_PAGE_SIZE ? ' selected' : '') + '>' + n + '</option>'; }).join('') +
      '</select></span>';
    el.querySelectorAll('.pgnum').forEach(function (b) {
      b.addEventListener('click', function () { _state.page = Number(b.dataset.p); renderBody(); });
    });
    el.querySelectorAll('.pgnav').forEach(function (b) {
      b.addEventListener('click', function () {
        var g = b.dataset.go;
        if (g === 'refresh') { renderBody(); return; }
        if (g === 'first') _state.page = 1;
        else if (g === 'prev') _state.page = Math.max(1, page - 1);
        else if (g === 'next') _state.page = Math.min(pages, page + 1);
        else _state.page = pages;
        renderBody();
      });
    });
    var jump = el.querySelector('.pgpage');
    if (jump) jump.addEventListener('change', function () {
      var v = Math.min(pages, Math.max(1, Number(jump.value) || 1));
      _state.page = v; renderBody();
    });
    var sel = el.querySelector('.pgsizesel');
    if (sel) sel.addEventListener('change', function () {
      SPM_PAGE_SIZE = Number(sel.value) || 30; _state.page = 1; renderBody();
    });
  }

  function renderBody() {
    var tbody = document.getElementById('spmBody');
    var all = _state.list;
    var total = all ? all.length : 0;
    renderSpmPaging(total);
    var from = ((_state.page || 1) - 1) * SPM_PAGE_SIZE;
    var list = all ? all.slice(from, from + SPM_PAGE_SIZE) : all;
    if (!list || !list.length) {
      tbody.innerHTML = '<tr><td class="spmEmpty" colspan="' + (1 + STAFF_PICK_COLS.length) + '">표시할 데이터가 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (st, i) {
      var cells = '<td>' + (from + i + 1) + '</td>' + STAFF_PICK_COLS.map(function (c) { return '<td>' + esc(st[c.key]) + '</td>'; }).join('');
      return '<tr class="' + (_state.selectedName === st.name ? 'spmRowSel' : '') + '" data-name="' + escAttr(st.name) + '">' + cells + '</tr>';
    }).join('');
    Array.prototype.forEach.call(tbody.querySelectorAll('tr[data-name]'), function (tr) {
      tr.addEventListener('click', function () {
        _state.selectedName = tr.dataset.name;
        Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (r) { r.classList.toggle('spmRowSel', r === tr); });
      });
    });
  }

  function renderResults() {
    var rank = document.getElementById('spmFRank').value;
    var position = document.getElementById('spmFPosition').value;
    var status = document.getElementById('spmFStatus').value;
    var name = document.getElementById('spmFName').value.trim();
    _state.list = STAFF_DIRECTORY.filter(function (st) {
      if (rank && st.rank !== rank) return false;
      if (position && st.position !== position) return false;
      if (status && st.status !== status) return false;
      if (name && st.name.indexOf(name) === -1) return false;
      return true;
    });
    _state.selectedName = null;
    _state.page = 1;
    renderBody();
  }

  // opts.onApply(staff) — [적용] 클릭 시 선택된 STAFF_DIRECTORY 원소 1건을 전달받는 콜백(필수 권장)
  function openStaffPickModal(opts) {
    opts = opts || {};
    buildModal();
    _state.onApply = typeof opts.onApply === 'function' ? opts.onApply : null;
    _state.list = null;
    _state.selectedName = null;
    /* 화면과 같이 셀렉트를 커스텀으로 바꾼다(Kit 은 initCsel 이 초기 1회만 돌아 모달을 놓친다) */
    /* Kit 은 KCMS.initCsel, 화면은 자체 빌더가 한다 — 있는 쪽을 부른다 */
    var _mo = document.getElementById('staffPickModal');
    if (typeof initCsel === 'function') initCsel(_mo);
    else if (window.KCMS && typeof KCMS.initCsel === 'function') KCMS.initCsel(_mo);
    document.getElementById('spmFRank').value = '';
    document.getElementById('spmFPosition').value = '';
    document.getElementById('spmFStatus').value = '재직';
    document.getElementById('spmFName').value = '';
    renderBody();
    document.getElementById('staffPickModal').classList.add('open');
  }

  global.openStaffPickModal = openStaffPickModal;
})(window);
