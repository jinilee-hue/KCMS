/* KCMS 입학관리 Kit — 모달 드래그 이동 (실제 화면 구현 그대로) */
/*!
 * modal-drag.js — PCMS 공용 "모달 창 이동(드래그)" 컴포넌트
 * ---------------------------------------------------------------------------
 * 목적: 화면의 모든 모달을 제목 줄(헤더)로 끌어 상하좌우 이동할 수 있게 한다.
 *       모달은 뒤쪽 목록·배치판·달력을 대조하며 쓰는 경우가 많아, 창이 가린 부분을
 *       확인하려면 창 자체를 옮길 수 있어야 한다.
 *
 * 사용법: 화면 하단(다른 공용 스크립트와 같은 위치)에 한 줄 추가하면 끝이다.
 *       <script src="../../design-system/active/components/modal-drag.js"><\/script>
 *       화면별 배선 코드는 필요 없다 — 로드 시 페이지의 모달을 전부 찾아 자동 배선하고,
 *       sms-modal.js / memo-modal.js / gnb-sidebar.js 처럼 **런타임에 주입되는 모달**도
 *       body 관찰(MutationObserver)로 나중에 자동 배선한다.
 *
 * 배선 대상: `.modal-ov`(범용 모달 셸) 안에서 헤더(HANDLE_SELECTOR)를 가진 모달.
 *       헤더가 없는 오버레이는 손잡이가 없으므로 건드리지 않는다.
 *       특정 모달을 제외하려면 오버레이에 `data-no-drag` 를 붙인다.
 *
 * ⚠ 스타일 스코프 함정(2026-08-14 ET-05-001에서 실제로 겪은 것):
 *       `.modal-ov` / `.modal-box` / `.modal-hd` 는 여러 화면과 공용 컴포넌트가 **공유하는
 *       범용 셸 클래스**다. 여기에 `cursor:move` 같은 스타일을 직접 걸면 이동 불가한 모달의
 *       헤더에도 move 커서가 붙어 조작 가능한 것처럼 오인된다. 그래서 이 컴포넌트는
 *       **실제로 배선한 요소에만** 전용 클래스(`.pcms-drag-*`)를 붙이고 스타일도 그 클래스에만 준다.
 *
 * 구현 방식: 모달 셸(`.modal-ov`)이 flex 중앙정렬이라 `left/top`을 직접 주면 정렬이 깨진다.
 *       그래서 중앙 위치를 원점으로 두고 `transform:translate`만 얹는다(레이아웃 영향 없음).
 *       마우스와 PAD 터치를 함께 지원하려고 pointer 이벤트 + setPointerCapture 를 쓴다.
 *
 * ⚠ 구현 함정: 클램프 기준 좌표를 드래그 중 매 프레임 getBoundingClientRect()로 재실측하면
 *       아직 DOM에 반영되지 않은 새 이동량까지 빼게 되어 값이 어긋난다.
 *       반드시 **드래그 시작 시점과 창 리사이즈 시점에만** 실측한다(measure()).
 *
 * 관련 문서: docs/design-system/interaction-patterns.md 패턴 4
 * 최초 작성: 2026-08-14 (ET-05-001의 makeModalDraggable을 공용화하면서 전 화면 적용)
 */
(function () {
  'use strict';
  if (window.PcmsModalDrag) return; // 중복 로드 방지

  var OVERLAY_SELECTOR = '.modal-ov';
  // 헤더(손잡이) 후보 — 프로젝트에서 실제로 쓰이는 모달 헤더 클래스 전부 + 임의 지정용 data 속성.
  //  · .modal-hd    : 범용 셸(대부분의 화면 모달, sms-modal.js, staff-pick-modal.js, gnb-sidebar.js)
  //  · .impmodal-hd : ET-05-001 "현재 학급 반 편성 불러오기"
  //  · .clsmodal-hd : ET-01-001 / ET-05-001 "배정 학생 보기"
  //  · .mcHead      : memo-modal.js(#mcModal 상담 이력 / #mdModal 상담상세정보)
  //  · .shHead      : sms-history-modal.js(#shModal SMS 발송내역)
  // 새 셸을 만들 때는 이 목록에 추가하거나 헤더에 data-drag-handle 을 붙이면 된다.
  var HANDLE_SELECTOR = '.modal-hd, .impmodal-hd, .clsmodal-hd, .mcHead, .shHead, [data-drag-handle]';
  // 이미 그립 힌트를 가진 헤더에는 중복으로 넣지 않는다
  var GRIP_PRESENT = '[data-drag-grip], .modal-drag-hint, .clsmodal-drag-hint';
  // 헤더 안에서 드래그를 시작하지 않아야 하는 조작 요소(닫기 ✕, 탭, 입력 등)
  var CONTROL_SELECTOR = 'button, input, select, textarea, a, label, [role="button"]';
  // 헤더에 붙는 안내 툴팁. 빈 문자열이면 툴팁을 아예 붙이지 않는다(2026-08-24 요청 — 마우스를
  // 올릴 때마다 표 위로 떠서 내용을 가림). 다시 켜려면 여기에 문구를 넣으면 된다.
  var TITLE_HINT = '';

  var CSS =
    '.pcms-drag-handle{cursor:move;user-select:none;-webkit-user-select:none;touch-action:none;}' +
    '.pcms-drag-handle.pcms-dragging{cursor:grabbing;}' +
    /* 이동 중에는 그림자를 키워 "떠 있는 상태"임을 시각적으로 알림 */
    '.pcms-draggable.pcms-dragging{box-shadow:0 22px 60px rgba(0,0,0,.45);}' +
    /* 그립 점 아이콘 — 헤더의 글자색을 그대로 따라가므로 어두운 헤더/밝은 헤더 모두에서 읽힌다.
       오른쪽 여백 7px: 헤더에 `gap`이 없는 모달(`.impmodal-hd` 등)에서는 이 margin이 제목과의 유일한 간격이라,
       2px이던 시절에는 아이콘과 제목이 붙어 보였다(2026-08-18 요청으로 조정). */
    '.pcms-drag-grip{display:inline-flex;align-items:center;flex:0 0 auto;color:currentColor;opacity:.45;margin:0 7px 0 0;}';

  var GRIP_SVG =
    '<svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">' +
    '<circle cx="2.5" cy="2" r="1.4"/><circle cx="7.5" cy="2" r="1.4"/>' +
    '<circle cx="2.5" cy="7" r="1.4"/><circle cx="7.5" cy="7" r="1.4"/>' +
    '<circle cx="2.5" cy="12" r="1.4"/><circle cx="7.5" cy="12" r="1.4"/></svg>';

  var instances = []; // {overlay, box, reset}

  function injectCss() {
    if (document.getElementById('pcms-modal-drag-css')) return;
    var st = document.createElement('style');
    st.id = 'pcms-modal-drag-css';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  // 오버레이가 지금 보이는 상태인가 — `.open` 클래스 토글과 `style.display` 토글 두 관례를 모두 지원
  function isVisible(el) {
    if (el.classList.contains('open')) return true;
    if (!el.isConnected) return false;
    return getComputedStyle(el).display !== 'none';
  }

  // 손잡이에서 위로 올라가며 "오버레이의 직계 자식"인 박스를 찾는다(셸 구조가 화면마다 조금씩 달라도 동작)
  function boxOf(overlay, handle) {
    var el = handle;
    while (el && el.parentElement !== overlay) el = el.parentElement;
    return el;
  }

  function addGrip(handle) {
    if (handle.querySelector(GRIP_PRESENT)) return;
    var grip = document.createElement('span');
    grip.className = 'pcms-drag-grip';
    grip.setAttribute('data-drag-grip', '');
    grip.innerHTML = GRIP_SVG;
    // `.hdi`(레거시 셸의 창 아이콘)가 있으면 그 뒤에, 없으면 맨 앞에 넣는다
    var hdi = handle.querySelector(':scope > .hdi');
    if (hdi && hdi.nextSibling) handle.insertBefore(grip, hdi.nextSibling);
    else if (hdi) handle.appendChild(grip);
    else handle.insertBefore(grip, handle.firstChild);
  }

  function wire(overlay) {
    if (!overlay || overlay.dataset.pcmsDrag === '1') return null;
    if (overlay.hasAttribute('data-no-drag')) return null;
    var handle = overlay.querySelector(HANDLE_SELECTOR);
    if (!handle) return null; // 손잡이가 없는 모달은 이동 대상이 아니다
    var box = boxOf(overlay, handle);
    if (!box) return null;

    overlay.dataset.pcmsDrag = '1';
    injectCss();
    box.classList.add('pcms-draggable');
    handle.classList.add('pcms-drag-handle');
    if (TITLE_HINT && !handle.getAttribute('title')) handle.setAttribute('title', TITLE_HINT);
    addGrip(handle);

    var dx = 0, dy = 0, sx = 0, sy = 0, dragging = false;
    var base = null; // 이동 전(중앙정렬) 기준 좌표·크기

    function apply() { box.style.transform = (dx || dy) ? 'translate(' + dx + 'px,' + dy + 'px)' : ''; }
    function measure() {
      var r = box.getBoundingClientRect();
      base = { left: r.left - dx, top: r.top - dy, w: r.width, h: r.height };
    }
    // 창이 화면 밖으로 빠져나가 되돌릴 수 없게 되는 것을 막는다 — 항상 뷰포트 안에 전체가 머무름
    function clamp() {
      if (!base) return;
      var minX = -base.left, maxX = window.innerWidth - base.w - base.left;
      var minY = -base.top, maxY = window.innerHeight - base.h - base.top;
      // 창이 뷰포트보다 큰 예외 상황(min>max)에서는 좌·상단을 우선 노출
      dx = Math.max(minX, Math.min(dx, Math.max(minX, maxX)));
      dy = Math.max(minY, Math.min(dy, Math.max(minY, maxY)));
    }
    function reset() {
      dx = 0; dy = 0; base = null;
      box.style.transform = '';
      // 구(舊) 드래그 구현(position:fixed + left/top 방식)이 남긴 값이 있으면 함께 정리한다
      if (box.style.position === 'fixed') {
        box.style.position = ''; box.style.left = ''; box.style.top = ''; box.style.margin = '';
      }
    }

    handle.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      if (e.target.closest(CONTROL_SELECTOR)) return; // 닫기(✕) 등 조작 요소는 제외
      dragging = true;
      measure();
      sx = e.clientX - dx; sy = e.clientY - dy;
      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* 캡처 미지원 환경은 무시 */ }
      handle.classList.add('pcms-dragging'); box.classList.add('pcms-dragging');
      e.preventDefault();
    });
    handle.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      dx = e.clientX - sx; dy = e.clientY - sy;
      clamp(); apply();
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      handle.classList.remove('pcms-dragging'); box.classList.remove('pcms-dragging');
    }
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);

    // 모달을 다시 열 때는 항상 화면 중앙에서 시작(직전에 옮겨 둔 위치를 끌고 오지 않음).
    // 화면마다 여는 방식이 달라(`.open` 클래스 / `style.display`) 오버레이의 두 속성을 관찰한다.
    var wasVisible = isVisible(overlay);
    new MutationObserver(function () {
      var now = isVisible(overlay);
      if (now && !wasVisible) reset();
      wasVisible = now;
    }).observe(overlay, { attributes: true, attributeFilter: ['class', 'style'] });

    var inst = { overlay: overlay, box: box, handle: handle, reset: reset,
                 recalc: function () { if (dx || dy) { measure(); clamp(); apply(); } } };
    instances.push(inst);
    return inst;
  }

  function wireAll(root) {
    var scope = root || document;
    var list = scope.querySelectorAll ? scope.querySelectorAll(OVERLAY_SELECTOR) : [];
    for (var i = 0; i < list.length; i++) wire(list[i]);
    // root 자체가 오버레이인 경우(주입 직후의 단일 노드)
    if (scope.matches && scope.matches(OVERLAY_SELECTOR)) wire(scope);
  }

  // 창 크기가 바뀌면 이동해 둔 위치가 화면 밖으로 밀릴 수 있어 다시 실측·보정한다(리스너 1개로 전체 처리)
  window.addEventListener('resize', function () {
    for (var i = 0; i < instances.length; i++) instances[i].recalc();
  });

  // 런타임에 주입되는 모달(sms-modal.js / memo-modal.js / gnb-sidebar.js 등)을 나중에 배선
  function observeBody() {
    if (!document.body) return;
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (added[j].nodeType === 1) wireAll(added[j]);
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  function init() { wireAll(document); observeBody(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.PcmsModalDrag = { wire: wire, wireAll: wireAll, instances: instances };
})();
