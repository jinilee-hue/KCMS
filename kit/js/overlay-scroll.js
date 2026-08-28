/* ==========================================================================
   표 위에 떠 있는 스크롤 막대 (overlay-scroll)
   --------------------------------------------------------------------------
   크롬이 overflow:overlay 를 없애 네이티브 막대는 늘 8px 자리를 차지한다.
   네이티브 막대를 감추고, 표 데이터 영역(td) 위에 떠 있는 막대를 직접 그린다.
   · 막대는 헤더(th) 아래에서 시작한다 — th 는 sticky 로 고정돼 있으므로 가리지 않는다
   · 스크롤·마우스오버 때 나타나고 잠시 뒤 사라진다
   ========================================================================== */
(function (global) {
  'use strict';
  if (global.__pcmsOverlayScroll) return;
  global.__pcmsOverlayScroll = true;

  var SEL = '.tblwrap,.stu-tblwrap,.reslist-wrap,.notetbl-wrap,.stattbl-wrap,.matwrap,' +
            '.imptbl-wrap,.schtbl-wrap,.shTableWrap,.mcTableWrap,.eduTblWrap';

  var css = document.createElement('style');
  css.id = 'pcmsOverlayScrollStyles';
  css.textContent =
    SEL.split(',').map(function (s) { return s + '::-webkit-scrollbar'; }).join(',') +
      '{width:0 !important;height:0 !important;}' +
    SEL.split(',').map(function (s) { return s; }).join(',') +
      '{scrollbar-width:none !important;position:relative;}' +
    '.ovbar{position:absolute;right:2px;width:6px;border-radius:3px;background:transparent;' +
      'pointer-events:none;opacity:0;transition:opacity .18s ease;z-index:5;}' +
    '.ovbar.show{opacity:1;}' +
    '.ovbar > i{display:block;width:100%;border-radius:3px;background:rgba(44,62,90,.28);}' +
    '.ovbar.x{right:auto;left:0;height:6px;width:auto;}' +
    '.ovbar.x > i{height:100%;width:0;}';
  document.head.appendChild(css);

  function headH(wrap) {
    var th = wrap.querySelector('thead th');
    if (!th) return 0;
    var r = th.getBoundingClientRect();
    return Math.round(r.height);
  }

  function attach(wrap) {
    if (wrap.__ovbar) return;
    wrap.__ovbar = true;
    var y = document.createElement('div'); y.className = 'ovbar'; y.appendChild(document.createElement('i'));
    var x = document.createElement('div'); x.className = 'ovbar x'; x.appendChild(document.createElement('i'));
    wrap.appendChild(y); wrap.appendChild(x);
    var hideT;

    function paint() {
      var ch = wrap.clientHeight, sh = wrap.scrollHeight;
      var cw = wrap.clientWidth, sw = wrap.scrollWidth;
      var top = headH(wrap);                 /* 헤더 아래에서 시작 */
      var trackH = Math.max(0, ch - top - 4);
      if (sh > ch + 2 && trackH > 20) {
        y.style.display = 'block';
        y.style.top = (wrap.scrollTop + top + 2) + 'px';
        y.style.height = trackH + 'px';
        var th2 = Math.max(24, Math.round(trackH * (ch / sh)));
        var ty = Math.round((trackH - th2) * (wrap.scrollTop / (sh - ch)));
        y.firstChild.style.height = th2 + 'px';
        y.firstChild.style.transform = 'translateY(' + ty + 'px)';
      } else { y.style.display = 'none'; }

      if (sw > cw + 2) {
        x.style.display = 'block';
        x.style.left = wrap.scrollLeft + 'px';
        x.style.width = cw + 'px';
        x.style.top = (wrap.scrollTop + ch - 8) + 'px';
        var tw = Math.max(24, Math.round(cw * (cw / sw)));
        var tx = Math.round((cw - tw) * (wrap.scrollLeft / (sw - cw)));
        x.firstChild.style.width = tw + 'px';
        x.firstChild.style.transform = 'translateX(' + tx + 'px)';
      } else { x.style.display = 'none'; }
    }

    function show() {
      paint();
      y.classList.add('show'); x.classList.add('show');
      clearTimeout(hideT);
      hideT = setTimeout(function () { y.classList.remove('show'); x.classList.remove('show'); }, 900);
    }

    wrap.addEventListener('scroll', show, { passive: true });
    wrap.addEventListener('mouseenter', show);
    wrap.addEventListener('mousemove', show);
    if (global.ResizeObserver) new ResizeObserver(paint).observe(wrap);
    paint();
  }

  function scan(root) {
    (root || document).querySelectorAll(SEL).forEach(attach);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan(); });
  else scan();
  /* 모달처럼 나중에 만들어지는 표도 잡는다 */
  new MutationObserver(function () { scan(); }).observe(document.documentElement, { childList: true, subtree: true });

  global.PcmsOverlayScroll = { scan: scan };
})(window);
