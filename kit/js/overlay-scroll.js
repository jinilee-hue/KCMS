/* ==========================================================================
   표 위에 떠 있는 스크롤 막대 (overlay-scroll)
   --------------------------------------------------------------------------
   크롬이 overflow:overlay 를 없애 네이티브 막대는 늘 8px 자리를 차지한다.
   네이티브 막대를 감추고, 표 데이터 영역(td) 위에 떠 있는 막대를 직접 그린다.
   · 세로만 떠 있는 막대로 그린다. 가로는 브라우저 기본 막대를 표 아래에 그대로 둔다
   · 막대는 헤더(th) 아래에서 시작한다 — th 는 sticky 로 고정돼 있으므로 가리지 않는다
   · 스크롤·마우스오버 때 나타나고 잠시 뒤 사라진다
   ========================================================================== */
(function (global) {
  'use strict';
  if (global.__pcmsOverlayScroll) return;
  global.__pcmsOverlayScroll = true;

  var SEL = '.tblwrap,.stu-tblwrap,.reslist-wrap,.notetbl-wrap,.stattbl-wrap,.matwrap,' +
            '.imptbl-wrap,.schtbl-wrap,.shTableWrap,.mcTableWrap,.eduTblWrap,' +
            /* 클래스 없이 인라인 style 로만 스크롤을 주던 모달 표 패널에 붙인 공통 클래스 */
            '.modaltbl-wrap,.ovscroll';

  var css = document.createElement('style');
  css.id = 'pcmsOverlayScrollStyles';
  css.textContent =
    /* 세로 막대만 감춘다 — 가로 막대는 표 아래에 그대로 둔다.
       ::-webkit-scrollbar:vertical / :horizontal 는 크롬이 더 이상 적용하지 않는다(실측).
       방향 없는 ::-webkit-scrollbar 에서 width = 세로 막대 폭, height = 가로 막대 높이다. */
    SEL.split(',').map(function (s) { return s + '::-webkit-scrollbar'; }).join(',') +
      '{width:0 !important;height:8px !important;}' +
    SEL.split(',').map(function (s) { return s + '::-webkit-scrollbar-thumb'; }).join(',') +
      '{background:rgba(44,62,90,.28) !important;border-radius:4px !important;}' +
    SEL.split(',').map(function (s) { return s + '::-webkit-scrollbar-track'; }).join(',') +
      '{background:transparent !important;}' +
    /* scrollbar-width 가 지정돼 있으면 크롬이 ::-webkit-scrollbar 규칙을 무시한다 — 되돌린다 */
    SEL.split(',').map(function (s) { return s; }).join(',') +
      '{position:relative;scrollbar-width:auto !important;scrollbar-color:auto !important;}' +
    '.ovbar{position:absolute;left:0;width:6px;border-radius:3px;background:transparent;' +
      'pointer-events:none;opacity:0;transition:opacity .18s ease;z-index:5;}' +
    '.ovbar.show{opacity:1;}' +
    '.ovbar > i{display:block;width:100%;border-radius:3px;background:rgba(44,62,90,.28);}';
  document.head.appendChild(css);

  function headH(wrap) {
    var th = wrap.querySelector('thead th');
    if (!th) return 0;
    /* 표 위에 "전체 N건" 같은 줄이 함께 들어간 패널이 있다 — th 높이만 쓰면 막대가 헤더 위에서
       시작한다. 래퍼 상단부터 헤더 아래까지를 그대로 재서 항상 헤더 밑에서 시작하게 한다. */
    var r = th.getBoundingClientRect(), w = wrap.getBoundingClientRect();
    return Math.max(0, Math.round(r.bottom - w.top));
  }

  function attach(wrap) {
    if (wrap.__ovbar) return;
    wrap.__ovbar = true;
    var y = document.createElement('div'); y.className = 'ovbar'; y.appendChild(document.createElement('i'));
    wrap.appendChild(y);
    var hideT;

    function paint() {
      var ch = wrap.clientHeight, sh = wrap.scrollHeight;
      var top = headH(wrap);                 /* 헤더 아래에서 시작 */
      /* 스크롤 컨테이너 안의 absolute 는 내용과 함께 움직인다 —
         가로로 밀어도 막대가 오른쪽 끝에 붙어 있도록 scrollLeft 를 더해 준다 */
      /* clientWidth 는 padding 을 포함한다 — 패널에 좌우 여백이 있으면 막대가 표 밖(여백 위)에
         그려진다. 오른쪽 여백만큼 안으로 당겨 데이터(td) 위에 뜨게 한다. */
      var pr = parseFloat(getComputedStyle(wrap).paddingRight) || 0;
      var right = wrap.scrollLeft + wrap.clientWidth - pr - 8;
      var trackH = Math.max(0, ch - top - 4);
      if (sh > ch + 2 && trackH > 20) {
        y.style.display = 'block';
        y.style.top = (wrap.scrollTop + top + 2) + 'px';
        y.style.left = right + 'px';
        y.style.height = trackH + 'px';
        var th2 = Math.max(24, Math.round(trackH * (ch / sh)));
        var ty = Math.round((trackH - th2) * (wrap.scrollTop / (sh - ch)));
        y.firstChild.style.height = th2 + 'px';
        y.firstChild.style.transform = 'translateY(' + ty + 'px)';
      } else { y.style.display = 'none'; }

    }

    function show() {
      paint();
      y.classList.add('show');
      clearTimeout(hideT);
      hideT = setTimeout(function () { y.classList.remove('show'); }, 900);
    }

    wrap.addEventListener('scroll', show, { passive: true });
    wrap.addEventListener('mouseenter', show);
    wrap.addEventListener('mousemove', show);
    if (global.ResizeObserver) new ResizeObserver(paint).observe(wrap);
    paint();
  }


  /* 모달 안에는 클래스 없이 style="overflow:auto" 로만 만든 표 패널이 있다(설명회 내역 등).
     그런 패널은 SEL 에 걸리지 않아 네이티브 막대가 표 밖에 그려졌다 — 표를 감싼
     스크롤 조상을 직접 찾아 같은 오버레이 막대를 붙인다(.modal-body 는 표 전용이 아니라 제외). */
  function autoScan(root) {
    (root || document).querySelectorAll('.modal-ov table').forEach(function (t) {
      var p = t.parentElement;
      while (p && !p.classList.contains('modal-ov')) {
        if (p.classList.contains('modal-body') || p.classList.contains('modal-box')) break;
        var s = getComputedStyle(p);
        if (/(auto|scroll)/.test(s.overflowY)) { p.classList.add('ovscroll'); attach(p); break; }
        p = p.parentElement;
      }
    });
  }

  function scan(root) {
    (root || document).querySelectorAll(SEL).forEach(attach);
    autoScan(root);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan(); });
  else scan();
  /* 모달처럼 나중에 만들어지는 표도 잡는다 */
  new MutationObserver(function () { scan(); }).observe(document.documentElement, { childList: true, subtree: true });

  global.PcmsOverlayScroll = { scan: scan };
})(window);
