/* KCMS Design Kit — 공용 시간 선택기
   input[type=time] 의 showPicker() 를 가로채 공통 패널을 띄운다.
   날짜 피커(date-picker.js)와 같은 방침 — 바깥선 없이 그림자로 띄우고, 라운드 3px,
   선택된 값만 파란 배경(#0066FF). 브라우저 기본 시간 위젯은 페이지 CSS 로 손댈 수 없어
   모양이 화면과 따로 놀았다(2026-08-29 요청).

   값은 대상 input.value 에 "HH:MM"(24시간)으로 쓰고 input/change 를 발생시키므로
   섀도우 → 보이는 텍스트 입력 동기화 로직이 그대로 동작한다. */
(function () {
  'use strict';
  if (window.__pcmsTP) return;
  window.__pcmsTP = true;

  var CSS = [
    '.pcmstp{position:fixed;z-index:4000;display:none;box-sizing:border-box;width:232px;padding:8px;',
    '  background:#fff;border:0;border-radius:3px;box-shadow:0 10px 28px rgba(0,40,100,.20);',
    '  font-family:inherit;font-size:12px;color:var(--txt,#1f2937);',
    '  -webkit-user-select:none;user-select:none;}',
    '.pcmstp.open{display:block;}',
    '.pcmstp *{box-sizing:border-box;}',
    '.pcmstp-ap{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px;}',
    '.pcmstp-lb{font-size:10.5px;font-weight:700;color:var(--txt-mut,#5b6776);margin:0 0 4px;}',
    '.pcmstp-grid{display:grid;gap:4px;margin-bottom:8px;}',
    '.pcmstp-grid.h{grid-template-columns:repeat(6,1fr);}',
    '.pcmstp-grid.m{grid-template-columns:repeat(6,1fr);}',
    '.pcmstp-opt{height:24px;padding:0;border:1px solid var(--line,#cfd6e0);border-radius:3px;background:#fff;',
    '  font-family:inherit;font-size:11px;color:var(--txt,#1f2937);cursor:pointer;}',
    '.pcmstp-opt:hover{border-color:var(--pb,#0066FF);color:var(--pb,#0066FF);}',
    '.pcmstp-opt.on{background:var(--pb,#0066FF);border-color:var(--pb,#0066FF);color:#fff;font-weight:700;}',
    '.pcmstp-foot{display:flex;justify-content:flex-end;gap:4px;}',
    '.pcmstp-btn{height:24px;min-width:52px;padding:0 10px;border:1px solid var(--line,#cfd6e0);border-radius:3px;',
    '  background:#fff;font-family:inherit;font-size:11px;color:var(--txt-mut,#5b6776);cursor:pointer;}',
    '.pcmstp-btn.pri{background:var(--pb,#0066FF);border-color:var(--pb,#0066FF);color:#fff;font-weight:700;}'
  ].join('');

  var pop = null, target = null, lastTarget = null, lastCloseAt = 0;
  var sel = { ap: 0, h: 9, m: 0 };   /* ap 0=오전 1=오후, h 1~12 */

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function parseHM(v) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(v || '').trim());
    if (!m) return null;
    var H = Number(m[1]), M = Number(m[2]);
    if (H < 0 || H > 23 || M < 0 || M > 59) return null;
    return { H: H, M: M };
  }

  function build() {
    if (pop) return;
    var st = document.createElement('style');
    st.id = 'pcmsTimePickerStyles';
    st.textContent = CSS;
    document.head.appendChild(st);

    pop = document.createElement('div');
    pop.className = 'pcmstp';
    pop.innerHTML =
      '<div class="pcmstp-ap">' +
        '<button type="button" class="pcmstp-opt" data-ap="0">오전</button>' +
        '<button type="button" class="pcmstp-opt" data-ap="1">오후</button>' +
      '</div>' +
      '<p class="pcmstp-lb">시</p><div class="pcmstp-grid h"></div>' +
      '<p class="pcmstp-lb">분</p><div class="pcmstp-grid m"></div>' +
      '<div class="pcmstp-foot">' +
        '<button type="button" class="pcmstp-btn" data-act="cancel">취소</button>' +
        '<button type="button" class="pcmstp-btn pri" data-act="ok">적용</button>' +
      '</div>';
    document.body.appendChild(pop);

    var hg = pop.querySelector('.pcmstp-grid.h');
    for (var h = 1; h <= 12; h++) {
      hg.insertAdjacentHTML('beforeend',
        '<button type="button" class="pcmstp-opt" data-h="' + h + '">' + pad2(h) + '</button>');
    }
    var mg = pop.querySelector('.pcmstp-grid.m');
    [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].forEach(function (m) {
      mg.insertAdjacentHTML('beforeend',
        '<button type="button" class="pcmstp-opt" data-m="' + m + '">' + pad2(m) + '</button>');
    });

    pop.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
      if (b.dataset.ap !== undefined) { sel.ap = Number(b.dataset.ap); render(); return; }
      if (b.dataset.h !== undefined) { sel.h = Number(b.dataset.h); render(); return; }
      if (b.dataset.m !== undefined) { sel.m = Number(b.dataset.m); render(); return; }
      if (b.dataset.act === 'cancel') { close(); return; }
      if (b.dataset.act === 'ok') {
        var H = (sel.h % 12) + (sel.ap ? 12 : 0);
        commit(pad2(H) + ':' + pad2(sel.m));
      }
    });
  }

  function render() {
    pop.querySelectorAll('[data-ap]').forEach(function (b) {
      b.classList.toggle('on', Number(b.dataset.ap) === sel.ap);
    });
    pop.querySelectorAll('[data-h]').forEach(function (b) {
      b.classList.toggle('on', Number(b.dataset.h) === sel.h);
    });
    pop.querySelectorAll('[data-m]').forEach(function (b) {
      b.classList.toggle('on', Number(b.dataset.m) === sel.m);
    });
  }

  function place() {
    if (!target || !pop) return;
    var anchor = (target.closest && target.closest('.iwrap,.dwrap,.mcIwrap,.shIwrap,.timewrap')) || target;
    var r = anchor.getBoundingClientRect();
    if (!r.width && !r.height) r = target.getBoundingClientRect();
    var w = pop.offsetWidth, h = pop.offsetHeight;
    var vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    var top = r.bottom + 4;
    if (top + h > vh - 4) {
      var up = r.top - 4 - h;
      top = (up >= 4) ? up : Math.max(4, vh - h - 4);
    }
    var left = r.left;
    if (left + w > vw - 4) left = vw - w - 4;
    if (left < 4) left = 4;
    pop.style.top = Math.round(top) + 'px';
    pop.style.left = Math.round(left) + 'px';
  }

  function open(input) {
    build();
    target = input;
    var p = parseHM(input.value);
    if (!p) p = { H: 9, M: 0 };
    sel.ap = p.H >= 12 ? 1 : 0;
    sel.h = (p.H % 12) || 12;
    sel.m = Math.round(p.M / 5) * 5;
    if (sel.m > 55) sel.m = 55;
    render();
    pop.classList.add('open');
    place();
  }

  function close() {
    if (pop) pop.classList.remove('open');
    lastTarget = target;
    lastCloseAt = Date.now();
    target = null;
  }

  function commit(v) {
    var t = target;
    close();
    if (!t) return;
    t.value = v;
    try { t.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
    try { t.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
  }

  document.addEventListener('mousedown', function (ev) {
    if (!target || !pop) return;
    if (pop.contains(ev.target)) return;
    close();
  }, true);

  window.addEventListener('keydown', function (ev) {
    if (!target) return;
    if (ev.key === 'Escape' || ev.keyCode === 27) {
      close(); ev.stopPropagation(); ev.preventDefault();
    }
  }, true);

  window.addEventListener('scroll', function () { if (target) place(); }, true);
  window.addEventListener('resize', function () { if (target) place(); });



  var nativeShowPicker = window.HTMLInputElement ? HTMLInputElement.prototype.showPicker : null;
  try {
    HTMLInputElement.prototype.showPicker = function () {
      if (this.type === 'time') {
        if (lastTarget === this && (Date.now() - lastCloseAt) < 350) { lastTarget = null; return; }
        open(this);
        return;
      }
      if (nativeShowPicker) return nativeShowPicker.apply(this, arguments);
    };
  } catch (e) {}
})();
