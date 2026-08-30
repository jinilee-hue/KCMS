/* KCMS Design Kit — 공용 날짜 선택기
   input[type=date] 의 showPicker() 를 가로채 공통 달력을 띄운다.
   오늘 = 파란 원 채움 + 흰 글자 / 선택일 = 파란 테두리 링 (파랑은 #0066FF 한 가지)
   실제 화면(PCMS)에서 쓰는 구현 그대로. */
/*
 * PCMS 공용 날짜 피커(PCMS DatePicker)
 *
 * 배경(2026-08-24):
 *  날짜 입력(`.dateinput` + 숨은 `.dateshadow`)의 달력 아이콘은 여태 브라우저 기본
 *  달력(`input[type=date].showPicker()`)을 그대로 띄웠다. 크롬 기본 달력은 검은색에
 *  가까운 1px 바깥선 + 브라우저가 정한 라운드를 쓰는데, 이건 페이지 CSS 로는 전혀
 *  손댈 수 없다(브라우저 UI 라 `::-webkit-*` 선택자도 닿지 않는다). "§28 떠 있는 패널"
 *  에서 `.schedpop`/`.mapcal-ympanel` 의 바깥선을 걷어냈는데도 달력만 그대로였던 이유다.
 *
 *  그래서 기본 달력을 쓰지 않고, PCMS 토큰으로 그린 팝오버로 대체한다.
 *   - 바깥선 없음(border:0) + 그림자로 띄움  → §28 "떠 있는 패널" 규칙과 동일
 *   - 라운드 3px                              → 입력(.finput)과 동일한 D타입 기준값
 *
 * 적용 방식:
 *  `HTMLInputElement.prototype.showPicker` 를 감싸서 `type="date"` 인 입력에 대해서만
 *  이 피커를 연다. 화면·모달(memo-modal.js / sms-history-modal.js 포함)의 기존 코드는
 *  전부 `shadow.showPicker()` 를 호출하므로 호출부를 하나도 고치지 않고 교체된다.
 *  값은 대상 input.value 에 "YYYY-MM-DD" 로 쓰고 input/change 이벤트를 기본 달력과
 *  똑같이 발생시키므로, 섀도우 → 보이는 텍스트 입력 동기화 로직도 그대로 동작한다.
 */
(function(){
  'use strict';
  if (window.__pcmsDP) return;
  window.__pcmsDP = true;

  var WD = ['일','월','화','수','목','금','토'];

  var CSS = [
    '.pcmsdp{position:fixed;z-index:4000;display:none;box-sizing:border-box;width:236px;padding:8px;',
    '  background:#fff;border:0;border-radius:3px;box-shadow:0 10px 28px rgba(0,40,100,.20);',
    '  font-family:inherit;font-size:12px;color:var(--txt,#1f2937);',
    '  -webkit-user-select:none;user-select:none;}',
    '.pcmsdp.open{display:block;}',
    '.pcmsdp *{box-sizing:border-box;}',
    '.pcmsdp-hd{display:flex;align-items:center;justify-content:space-between;height:24px;margin-bottom:4px;}',
    '.pcmsdp-nav{width:20px;height:20px;padding:0;border:1px solid var(--line,#cfd6e0);border-radius:3px;',
    '  background:#fff;color:var(--txt-mut,#5b6776);font-family:inherit;font-size:11px;line-height:1;cursor:pointer;}',
    '.pcmsdp-nav:hover{border-color:var(--pb,#0066FF);color:var(--pb,#0066FF);}',
    '.pcmsdp-ym{display:flex;align-items:center;gap:2px;}',
    '.pcmsdp-ymbtn{display:inline-flex;align-items:center;height:20px;padding:0 5px;border:0;',
    '  border-radius:3px;background:none;font-family:inherit;font-size:12px;font-weight:700;',
    '  color:var(--txt,#1f2937);cursor:pointer;}',
    '.pcmsdp-ymbtn:hover,.pcmsdp-ymbtn.on{background:var(--pb-a08,rgba(0,102,255,.08));color:var(--pb,#0066FF);}',
    /* 연/월 선택 패널 — 헤더는 남기고 요일+날짜 영역(18 + 6*26 + 5*1 = 179px)만 덮는다 */
    '.pcmsdp-panel{display:none;position:absolute;left:8px;right:8px;top:36px;height:179px;',
    '  background:#fff;overflow-y:auto;overflow-x:hidden;}',
    '.pcmsdp-panel.open{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;align-content:start;}',
    '.pcmsdp-opt{height:26px;padding:0;border:1px solid var(--line,#cfd6e0);border-radius:3px;background:#fff;',
    '  font-family:inherit;font-size:11px;color:var(--txt,#1f2937);cursor:pointer;}',
    '.pcmsdp-opt:hover{border-color:var(--pb,#0066FF);color:var(--pb,#0066FF);}',
    '.pcmsdp-opt.on{background:var(--pb,#0066FF);border-color:var(--pb,#0066FF);color:#fff;font-weight:700;}',
    '.pcmsdp-wd,.pcmsdp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;}',
    '.pcmsdp-wd span{height:18px;line-height:18px;text-align:center;font-size:10.5px;font-weight:700;',
    '  color:var(--txt-mut,#5b6776);}',
    /* 날짜 칸 표시는 원(2026-08-25 요청) — 26x26 정사각을 칸 가운데 두고 radius 50%.
       칸 폭(1fr≈30px)에 그대로 radius 를 주면 타원이 되므로 폭을 높이에 맞춰 고정한다. */
    '.pcmsdp-d{width:26px;height:26px;margin:0 auto;padding:0;border:1px solid transparent;border-radius:50%;background:none;',
    '  font-family:inherit;font-size:12px;color:var(--txt,#1f2937);cursor:pointer;}',
    '.pcmsdp-d:hover{background:var(--pb-a08,rgba(0,102,255,.08));}',
    '.pcmsdp-d.out{color:#c3c9d2;}',
    '.pcmsdp-d.off{color:#c3c9d2;cursor:not-allowed;}',
    '.pcmsdp-d.off:hover{background:none;}',
    /* 오늘 = 파란 면(테두리 없음), 선택 = 같은 계열의 더 진한 면 — 둘 다 톤온톤 Poly Blue */
    /* 2026-08-26 A안: 파란색은 한 가지(--pb)만 쓰되, 원래 인상대로
       '오늘' 이 채워진 파란 원 + 흰 글자를 갖는다. '선택한 날짜' 는 파란 테두리 링으로 구분한다.
       (이전에는 오늘 #0066FF 채움 / 선택 #003D99 채움이라 파랑이 두 가지로 보였다) */
    '.pcmsdp-d.today{background:var(--pb,#0066FF);color:#fff;font-weight:700;}',
    '.pcmsdp-d.today:hover{background:var(--pb-dark,#0052CC);}',
    '.pcmsdp-d.sel{background:transparent;color:var(--pb,#0066FF);font-weight:700;box-shadow:inset 0 0 0 1px var(--pb,#0066FF);}',
    '.pcmsdp-d.sel:hover{background:var(--pb-a08,rgba(0,102,255,.08));}',
    '.pcmsdp-d.sel.today{background:var(--pb,#0066FF);color:#fff;box-shadow:none;}',
    '.pcmsdp-ft{display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding-top:8px;',
    '  border-top:1px solid var(--tbl-bd-soft,#e3e8ef);}',
    /* [삭제]/[오늘] 을 텍스트 링크 → 화면 기본 버튼(.btn.g.sm)과 같은 모양으로(2026-08-25 요청).
       이 컴포넌트는 어느 화면에나 주입되므로 .btn 클래스에 기대지 않고 같은 값을 직접 쓴다:
       높이 24 / 좌우 8 / 1px var(--line) / radius 3 / 12px / weight 500. */
    '.pcmsdp-lnk{display:inline-flex;align-items:center;height:24px;padding:0 8px;',
    '  border:1px solid var(--line,#cfd6e0);border-radius:3px;background:#fff;',
    '  font-family:inherit;font-size:12px;font-weight:500;color:var(--txt,#1f2937);cursor:pointer;}',
    '.pcmsdp-lnk:hover{border-color:var(--pb,#0066FF);color:var(--pb,#0066FF);}'
  ].join('');

  var pop = null, elY = null, elM = null, elGrid = null, elPanel = null;
  var panelMode = '';                       // '' | 'y' | 'm'
  var target = null, vy = 0, vm = 0;
  var lastTarget = null, lastCloseAt = 0;   // 아이콘 재클릭 = 닫기(토글) 판정용

  function pad2(n){ return (n < 10 ? '0' : '') + n; }
  function ymd(y, m, d){ return y + '-' + pad2(m + 1) + '-' + pad2(d); }
  function parseYMD(v){
    var t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v == null ? '' : v).trim());
    if (!t) return null;
    var y = +t[1], m = +t[2] - 1, d = +t[3];
    if (m < 0 || m > 11 || d < 1 || d > 31) return null;
    return { y:y, m:m, d:d };
  }
  function limit(attr){
    return (target && /^\d{4}-\d{2}-\d{2}$/.test(target.getAttribute(attr) || '')) ? target.getAttribute(attr) : '';
  }

  function build(){
    if (pop) return;
    var st = document.createElement('style');
    st.id = 'pcmsdp-css';
    st.textContent = CSS;
    document.head.appendChild(st);

    pop = document.createElement('div');
    pop.className = 'pcmsdp';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', '날짜 선택');
    pop.innerHTML =
      '<div class="pcmsdp-hd">' +
        '<button type="button" class="pcmsdp-nav" data-mv="-1" title="이전 달">&#8249;</button>' +
        '<div class="pcmsdp-ym">' +
          '<button type="button" class="pcmsdp-ymbtn pcmsdp-ytxt" data-panel="y"></button>' +
          '<button type="button" class="pcmsdp-ymbtn pcmsdp-mtxt" data-panel="m"></button>' +
        '</div>' +
        '<button type="button" class="pcmsdp-nav" data-mv="1" title="다음 달">&#8250;</button>' +
      '</div>' +
      '<div class="pcmsdp-wd">' + WD.map(function(w){ return '<span>' + w + '</span>'; }).join('') + '</div>' +
      '<div class="pcmsdp-grid"></div>' +
      '<div class="pcmsdp-panel"></div>' +
      '<div class="pcmsdp-ft">' +
        '<button type="button" class="pcmsdp-lnk" data-act="clear">삭제</button>' +
        '<button type="button" class="pcmsdp-lnk" data-act="today">오늘</button>' +
      '</div>';
    document.body.appendChild(pop);
    elY = pop.querySelector('.pcmsdp-ytxt');
    elM = pop.querySelector('.pcmsdp-mtxt');
    elGrid = pop.querySelector('.pcmsdp-grid');
    elPanel = pop.querySelector('.pcmsdp-panel');

    // 팝오버 안 클릭으로 입력 포커스가 빠지지 않게 한다(blur 검증이 걸린 필드가 있다)
    pop.addEventListener('mousedown', function(ev){ ev.preventDefault(); });
    pop.addEventListener('click', function(ev){
      var b = ev.target && ev.target.closest ? ev.target.closest('button') : null;
      if (!b || !pop.contains(b)) return;
      // 화면마다 걸려 있는 document 레벨 "바깥 클릭 → 드롭다운 닫기" 핸들러까지 가지 않게 막는다
      ev.stopPropagation();
      var mv = b.getAttribute('data-mv');
      if (mv){ closePanel(); shift(+mv); return; }
      var pn = b.getAttribute('data-panel');
      if (pn){ openPanel(panelMode === pn ? '' : pn); return; }
      var oy = b.getAttribute('data-y');
      if (oy){ vy = +oy; closePanel(); render(); return; }
      var om = b.getAttribute('data-m');
      if (om){ vm = +om; closePanel(); render(); return; }
      var act = b.getAttribute('data-act');
      if (act === 'clear'){ commit(''); return; }
      if (act === 'today'){ var t = new Date(); commit(ymd(t.getFullYear(), t.getMonth(), t.getDate())); return; }
      var v = b.getAttribute('data-v');
      if (v && !b.classList.contains('off')) commit(v);
    });
  }

  // 연도 목록 범위 — 오늘 기준 -80 ~ +10 년. 입력에 들어 있는 값이나 min/max 가
  // 그 밖이면 그 해까지 넓힌다(과거 생년월일 같은 값이 목록에서 빠지지 않게).
  function yearRange(){
    var now = new Date().getFullYear();
    var lo = now - 80, hi = now + 10;
    [vy, (parseYMD(target && target.value) || {}).y,
     (parseYMD(limit('min')) || {}).y, (parseYMD(limit('max')) || {}).y].forEach(function(y){
      if (!y) return;
      if (y < lo) lo = y;
      if (y > hi) hi = y;
    });
    return { lo:lo, hi:hi };
  }

  function openPanel(mode){
    panelMode = mode || '';
    pop.querySelectorAll('.pcmsdp-ymbtn').forEach(function(b){
      b.classList.toggle('on', !!panelMode && b.getAttribute('data-panel') === panelMode);
    });
    if (!panelMode){ elPanel.classList.remove('open'); elPanel.innerHTML = ''; return; }

    var items = [], i;
    if (panelMode === 'y'){
      var r = yearRange();
      for (i = r.lo; i <= r.hi; i++){
        items.push('<button type="button" class="pcmsdp-opt' + (i === vy ? ' on' : '') +
                   '" data-y="' + i + '">' + i + '</button>');
      }
    } else {
      for (i = 0; i < 12; i++){
        items.push('<button type="button" class="pcmsdp-opt' + (i === vm ? ' on' : '') +
                   '" data-m="' + i + '">' + (i + 1) + '월</button>');
      }
    }
    elPanel.innerHTML = items.join('');
    elPanel.classList.add('open');
    // 현재 값이 가운데 오도록 — scrollIntoView 는 바깥 스크롤까지 건드려서 직접 계산한다
    var on = elPanel.querySelector('.pcmsdp-opt.on');
    elPanel.scrollTop = on ? Math.max(0, on.offsetTop - (elPanel.clientHeight - on.offsetHeight) / 2) : 0;
  }

  function closePanel(){ openPanel(''); }

  function shift(n){
    var d = new Date(vy, vm + n, 1);
    vy = d.getFullYear(); vm = d.getMonth();
    render();
  }

  function render(){
    var min = limit('min'), max = limit('max');
    var sel = (target && parseYMD(target.value)) ? target.value : '';
    var now = new Date();
    var todayS = ymd(now.getFullYear(), now.getMonth(), now.getDate());
    var start = new Date(vy, vm, 1).getDay();
    var days = new Date(vy, vm + 1, 0).getDate();

    elY.textContent = vy + '년';
    elM.textContent = (vm + 1) + '월';

    var cells = [];
    for (var i = 0; i < 42; i++){            // 6줄 고정 — 달마다 팝오버 높이가 튀지 않게
      var offset = i - start + 1;
      var dt = new Date(vy, vm, offset);
      var v = ymd(dt.getFullYear(), dt.getMonth(), dt.getDate());
      var cls = 'pcmsdp-d';
      if (offset < 1 || offset > days) cls += ' out';
      if (v === todayS) cls += ' today';
      if (v === sel) cls += ' sel';
      if ((min && v < min) || (max && v > max)) cls += ' off';
      cells.push('<button type="button" class="' + cls + '" data-v="' + v + '">' + dt.getDate() + '</button>');
    }
    elGrid.innerHTML = cells.join('');
  }

  function place(){
    if (!target || !pop) return;
    var anchor = (target.closest && target.closest('.iwrap,.dwrap,.mcIwrap,.shIwrap,.drange')) || target;
    var r = anchor.getBoundingClientRect();
    if (!r.width && !r.height) r = target.getBoundingClientRect();
    var w = pop.offsetWidth, h = pop.offsetHeight;
    var vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    var top = r.bottom + 4;
    if (top + h > vh - 4){
      var up = r.top - 4 - h;
      top = (up >= 4) ? up : Math.max(4, vh - h - 4);
    }
    var left = r.left;
    if (left + w > vw - 4) left = vw - w - 4;
    if (left < 4) left = 4;
    pop.style.top = Math.round(top) + 'px';
    pop.style.left = Math.round(left) + 'px';
  }

  function open(input){
    build();
    target = input;
    var p = parseYMD(input.value);
    if (!p){ var t = new Date(); p = { y:t.getFullYear(), m:t.getMonth() }; }
    vy = p.y; vm = p.m;
    render();
    closePanel();
    pop.classList.add('open');
    place();
  }

  function close(){
    if (pop){ pop.classList.remove('open'); closePanel(); }
    lastTarget = target;
    lastCloseAt = Date.now();
    target = null;
  }

  // 값 확정 — 기본 달력과 동일하게 input → change 순으로 발생시킨다.
  // 기존 화면 코드가 섀도우 입력의 change 를 듣고 보이는 텍스트 입력을 갱신한다.
  function commit(v){
    var t = target;
    close();
    if (!t) return;
    t.value = v;
    try { t.dispatchEvent(new Event('input',  { bubbles:true })); } catch(e){}
    try { t.dispatchEvent(new Event('change', { bubbles:true })); } catch(e){}
  }

  document.addEventListener('mousedown', function(ev){
    if (!target || !pop) return;
    if (pop.contains(ev.target)) return;
    close();
  }, true);

  // Esc 로 닫을 때는 체험판 셸(부모 프레임)까지 전파시키지 않는다 — 뒤의 모달이 같이 닫히면 안 된다
  window.addEventListener('keydown', function(ev){
    if (!target) return;
    if (ev.key === 'Escape' || ev.keyCode === 27){
      close();
      ev.stopPropagation();
      ev.preventDefault();
    }
  }, true);

  window.addEventListener('scroll', function(){ if (target) place(); }, true);
  window.addEventListener('resize', function(){ if (target) place(); });

  var nativeShowPicker = window.HTMLInputElement ? HTMLInputElement.prototype.showPicker : null;
  try {
    HTMLInputElement.prototype.showPicker = function(){
      if (this.type === 'date'){
        // 열려 있는 상태에서 같은 아이콘을 다시 누르면 닫기(바깥 mousedown 으로 이미 닫힌 직후다)
        if (lastTarget === this && (Date.now() - lastCloseAt) < 350){ lastTarget = null; return; }
        open(this);
        return;
      }
      if (nativeShowPicker) return nativeShowPicker.apply(this, arguments);
    };
  } catch(e){}
})();
