/* KCMS 입학관리 Kit — 표 도구 (table-tools.js)

   목록 화면이 거의 항상 쓰는 두 가지를 한 곳에 모은 것입니다.
     · 정렬        th.sortable 을 눌러 그 열로 정렬 (▾ 화살표 · 다시 누르면 방향 반전)
     · 열 너비 조절  th 오른쪽 끝을 잡아 끌어 폭 변경

   원래는 화면(02-010 · 02-012 · 04-001)마다 같은 코드가 복사돼 있었습니다.
   동작·값은 그 구현 그대로입니다 — 최소 폭 32px, pointer 이벤트, 드래그 중 .dragging.

   의존: 없음. (KCMS 전역에 붙지만 utils.js/layout.js 없이도 동작합니다)
*/
(function(global){
  'use strict';

  var MINW = 32;                       /* 화면들의 COLRESIZE_MINW 와 같은 값 */
  var ARROW = '▾';                /* ▾ 하나만 씁니다. 오름차순은 .up 회전으로 표현 */

  function el(x){ return typeof x === 'string' ? document.querySelector(x) : x; }

  /* th 에 대응하는 <col>. colspan 을 감안해 앞선 th 들의 폭을 더해 위치를 찾는다. */
  function colFor(table, th){
    var cols = table.querySelectorAll('colgroup > col');
    if(!cols.length) return null;
    var row = th.parentNode, i = 0;
    for(var n = 0; n < row.cells.length; n++){
      if(row.cells[n] === th) break;
      i += row.cells[n].colSpan || 1;
    }
    return cols[i] || null;
  }

  /* ── 열 너비 조절 ───────────────────────────────────────────────
     table       표(선택자 또는 요소)
     opt.min     최소 폭. 기본 32
     opt.auto    true 면 th[data-k] 에 손잡이(.colresize)를 없으면 만들어 붙인다
     opt.onResize(key, width)  놓는 순간 1회 호출 — 폭을 저장하고 싶을 때

     손잡이는 th 안의 `<span class="colresize" data-k="키">` 입니다.
     th 가 position 을 가져야 합니다(kit 의 table.grid thead th 는 sticky 라 이미 만족). */
  function initColResize(table, opt){
    table = el(table); if(!table) return;
    opt = opt || {};
    var min = opt.min || MINW;

    if(opt.auto){
      table.querySelectorAll('thead th[data-k]').forEach(function(th){
        if(th.querySelector('.colresize')) return;
        var h = document.createElement('span');
        h.className = 'colresize';
        h.dataset.k = th.dataset.k;
        h.title = '드래그로 컬럼 너비 조절';
        th.appendChild(h);
      });
    }

    table.querySelectorAll('thead .colresize').forEach(function(handle){
      if(handle.__rzDone) return;
      handle.__rzDone = true;
      handle.addEventListener('pointerdown', function(e){
        var th = handle.closest('th'); if(!th) return;
        var startX = e.clientX, startWidth = th.getBoundingClientRect().width, w = startWidth;
        handle.classList.add('dragging');
        try{ handle.setPointerCapture(e.pointerId); }catch(_){}
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
        e.stopPropagation();

        /* colgroup 이 있으면 <col> 폭이 th 폭을 이깁니다. 둘 다 맞춰 줘야
           colgroup 을 쓰는 표(template.html)와 안 쓰는 표(화면들) 모두 동작합니다. */
        var col = colFor(table, th);
        function onMove(ev){
          w = Math.max(min, Math.round(startWidth + (ev.clientX - startX)));
          th.style.width = w + 'px';
          if(col) col.style.width = w + 'px';
        }
        function onUp(){
          handle.classList.remove('dragging');
          try{ handle.releasePointerCapture(e.pointerId); }catch(_){}
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          handle.removeEventListener('pointermove', onMove);
          handle.removeEventListener('pointerup', onUp);
          if(opt.onResize) opt.onResize(handle.dataset.k, w);
        }
        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
      });
    });
  }

  /* ── 정렬 ──────────────────────────────────────────────────────
     table            표(선택자 또는 요소)
     opt.onSort(key, dir)   dir 은 'asc' | 'desc'. 정렬은 호출한 쪽이 합니다.
     opt.key(th)      열 키를 뽑는 함수. 기본은 th.dataset.k → th.id 순
     opt.initial      {key:'name', dir:'asc'} 처음 켜둘 상태

     마크업은 `<th class="sortable" data-k="키">이름</th>` 하나면 됩니다.
     라벨을 .thwrap/.thlabel 로 감싸고 ▾ 버튼(.tharrow)을 붙이는 것은 이 함수가 합니다
     (화면 04-001 의 buildColHeaders 와 같은 구조).

     반환값: { get:function(){return {key,dir}}, set:function(key,dir){…} } */
  function initSort(table, opt){
    table = el(table); if(!table) return null;
    opt = opt || {};
    var state = { key: (opt.initial && opt.initial.key) || null,
                  dir: (opt.initial && opt.initial.dir) || 'asc' };

    function keyOf(th){
      if(opt.key) return opt.key(th);
      return th.dataset.k || th.id || '';
    }

    table.querySelectorAll('thead th.sortable').forEach(function(th){
      if(th.__sortDone) return;
      th.__sortDone = true;
      var key = keyOf(th);

      /* 라벨을 감싸고 화살표를 붙인다. 이미 .thwrap 이 있으면 그대로 둔다. */
      var arrow = th.querySelector('.tharrow');
      if(!th.querySelector('.thwrap')){
        var keep = [];
        [].forEach.call(th.childNodes, function(n){
          if(n.nodeType === 1 && (n.classList.contains('tharrow') ||
                                  n.classList.contains('colresize') ||
                                  n.classList.contains('thterm'))) keep.push(n);
        });
        var label = (th.textContent || '').replace(/\s+/g, ' ').trim();
        th.textContent = '';
        var wrap = document.createElement('span'); wrap.className = 'thwrap';
        var lab  = document.createElement('span'); lab.className = 'thlabel';
        lab.textContent = label;
        arrow = document.createElement('button');
        arrow.type = 'button';
        arrow.className = 'tharrow';
        arrow.dataset.k = key;
        arrow.title = '정렬';
        arrow.textContent = ARROW;
        wrap.appendChild(lab); wrap.appendChild(arrow);
        th.appendChild(wrap);
        keep.forEach(function(n){ if(n.classList.contains('tharrow')) return; th.appendChild(n); });
      }

      th.addEventListener('click', function(e){
        if(e.target.closest && e.target.closest('.colresize')) return;   /* 손잡이 클릭은 무시 */
        if(state.key === key) state.dir = (state.dir === 'asc' ? 'desc' : 'asc');
        else { state.key = key; state.dir = 'asc'; }
        paint();
        if(opt.onSort) opt.onSort(state.key, state.dir);
      });
    });

    /* ▾ 는 정렬 가능한 열이면 늘 보입니다(rules.md). 활성 열만 파랑 + 오름차순이면 뒤집습니다. */
    function paint(){
      table.querySelectorAll('thead th.sortable .tharrow').forEach(function(a){
        var on = (a.dataset.k === state.key);
        a.classList.toggle('on', on);
        a.classList.toggle('up', on && state.dir === 'asc');
      });
    }
    paint();

    return {
      get: function(){ return { key: state.key, dir: state.dir }; },
      set: function(key, dir){ state.key = key; state.dir = dir || 'asc'; paint(); }
    };
  }

  /* 둘 다 한 번에 */
  function initTableTools(table, opt){
    opt = opt || {};
    if(opt.resize !== false) initColResize(table, opt.resize || {});
    return opt.sort === false ? null : initSort(table, opt.sort || {});
  }

  global.KCMS = Object.assign(global.KCMS || {}, {
    initColResize: initColResize,
    initSort: initSort,
    initTableTools: initTableTools
  });
})(window);
