/* ============================================================
   KCMS 입학관리 Kit — 레이아웃 엔진
   initLayout() 한 줄로 GNB · 좌측 레일 · 히스토리 네비 · 하단 작업 탭을 만든다.
   의존성: common.css, utils.js
   ============================================================ */
(function(global){
'use strict';

var SVG={
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  prev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  next:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>'
};

/* ---------- GNB ---------- */
function renderTabs(el, menu, current, badges){
  el.innerHTML='';
  Object.keys(menu).forEach(function(name){
    var tab=document.createElement('div');
    tab.className='tab'+(name===current?' on':'');
    var label=document.createElement('span'); label.textContent=name; tab.appendChild(label);
    if(badges&&badges[name]){
      var b=document.createElement('span'); b.className='tabbadge'; b.textContent=badges[name]; tab.appendChild(b);
    }
    var dd=document.createElement('div'); dd.className='dd';
    var row=document.createElement('div'); row.className='ddrow';
    menu[name].forEach(function(cat){
      var col=document.createElement('div'); col.className='ddcol';
      var h=document.createElement('div'); h.className='ddcat'; h.textContent=cat.cat; col.appendChild(h);
      (cat.items||[]).forEach(function(it){
        var isObj=typeof it==='object';
        var a=document.createElement(isObj&&it.href?'a':'div');
        a.className='dditem'; a.textContent=isObj?it.label:it;
        if(isObj&&it.href) a.setAttribute('href',it.href);
        col.appendChild(a);
      });
      row.appendChild(col);
    });
    dd.appendChild(row); tab.appendChild(dd); el.appendChild(tab);
  });
  snapGrid(el);
  /* 드롭다운은 fixed 로 띄우고 탭의 실좌표(소수 그대로)를 쓴다 — 반올림하면 1px 씩 어긋난다 */
  el.querySelectorAll('.tab').forEach(function(tab){
    var dd=tab.querySelector('.dd'); if(!dd) return;
    tab.addEventListener('mouseenter',function(){
      var r=tab.getBoundingClientRect(), vw=document.documentElement.clientWidth;
      dd.style.top=r.bottom+'px';
      var w=dd.offsetWidth||220, left=r.left;
      if(left+w>vw-8) left=Math.max(8,vw-8-w);
      dd.style.left=left+'px';
    });
  });
  addNav(el,'tabnav',140);
}
/* 탭 폭을 정수로 못박아 드롭다운이 픽셀 격자에서 미끄러지지 않게 한다 */
function snapGrid(el){
  var tabs=el.querySelectorAll('.tab'); if(!tabs.length) return;
  [].forEach.call(tabs,function(t){ t.style.width=''; });
  var w=[].map.call(tabs,function(t){ return Math.round(t.getBoundingClientRect().width); });
  [].forEach.call(tabs,function(t,i){ t.style.width=w[i]+'px'; t.style.boxSizing='border-box'; });
  /* 웹폰트가 늦게 오면 글자 폭이 바뀌어 격자가 다시 틀어진다 — 로드 후 한 번만 재계산한다.
     (조건 없이 다시 부르면 fonts.ready 가 이미 resolve 된 상태라 무한 재귀가 된다) */
  if(!el.__snapped && document.fonts && document.fonts.ready){
    el.__snapped = true;
    document.fonts.ready.then(function(){ snapGrid(el); });
  }
}

/* ---------- 좌측 레일 ---------- */
function renderRail(el, items, current){
  el.innerHTML='';
  (items||[]).forEach(function(it){
    var d=document.createElement('div');
    d.className='ic'+(it.label===current?' on':'');
    d.innerHTML=(it.svg||'')+it.label;
    el.appendChild(d);
  });
}

/* ---------- 하단 작업 탭 ---------- */
function renderWorkTabs(el, tabs, onOpen, onClose){
  el.innerHTML='';
  var scroll=document.createElement('div'); scroll.className='wtscroll';
  var prev=navBtn('wtnav prev','이전 탭',SVG.prev), next=navBtn('wtnav next','다음 탭',SVG.next);
  el.appendChild(prev); el.appendChild(scroll); el.appendChild(next);

  (tabs||[]).forEach(function(t){
    var d=document.createElement('div');
    d.className='wtab'+(t.cur?' on':'');
    d.appendChild(document.createTextNode(t.label));
    if(t.closable!==false){
      var x=document.createElement('span'); x.className='x'; x.title='닫기'; x.textContent='✕';
      x.addEventListener('click',function(ev){ ev.stopPropagation(); if(onClose) onClose(t.key,t); });
      d.appendChild(x);
    }
    d.addEventListener('click',function(){ if(onOpen) onOpen(t.key,t); });
    scroll.appendChild(d);
  });
  bindNav(scroll,prev,next,140);
  var on=scroll.querySelector('.wtab.on'); if(on) on.scrollIntoView({block:'nearest',inline:'nearest'});
}
function navBtn(cls,label,svg){
  var b=document.createElement('button'); b.type='button'; b.className=cls;
  b.setAttribute('aria-label',label); b.innerHTML=svg; return b;
}
function addNav(scroll,cls,step){
  var wrap=scroll.parentNode; if(!wrap||wrap.querySelector('.'+cls.split(' ')[0])) return;
  var prev=navBtn(cls+' prev','이전',SVG.prev), next=navBtn(cls+' next','다음',SVG.next);
  wrap.insertBefore(prev,scroll); wrap.insertBefore(next,scroll.nextSibling);
  bindNav(scroll,prev,next,step);
}
function bindNav(scroll,prev,next,step){
  function update(){
    var over=scroll.scrollWidth>scroll.clientWidth+1;
    prev.classList.toggle('show',over); next.classList.toggle('show',over);
    prev.disabled=!over||scroll.scrollLeft<=0;
    next.disabled=!over||scroll.scrollLeft>=scroll.scrollWidth-scroll.clientWidth-1;
  }
  prev.addEventListener('click',function(){ scroll.scrollBy({left:-step,behavior:'smooth'}); });
  next.addEventListener('click',function(){ scroll.scrollBy({left: step,behavior:'smooth'}); });
  scroll.addEventListener('scroll',update);
  window.addEventListener('resize',update);
  setTimeout(update,0);
}

/* ---------- 커스텀 셀렉트 ---------- */
/* select 요소를 그대로 두되 폭만 옵션 최대 길이에 맞춘다(리스트가 잘리지 않게) */
function syncSelectWidths(root){
  (root||document).querySelectorAll('select.fselect[data-autowidth]').forEach(function(sel){
    if(sel.offsetParent===null) return;              /* 숨겨진 요소는 측정 불가 */
    var probe=document.createElement('span');
    probe.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;font:'+getComputedStyle(sel).font;
    document.body.appendChild(probe);
    var max=0;
    [].forEach.call(sel.options,function(o){ probe.textContent=o.textContent; max=Math.max(max,probe.offsetWidth); });
    document.body.removeChild(probe);
    sel.style.width=Math.ceil(max+34)+'px';
  });
}

/* ---------- 모달 드래그 ---------- */
function makeDraggable(box,handle){
  handle=handle||box.querySelector('.modal-hd'); if(!handle) return;
  var sx,sy,ox,oy,on=false;
  handle.addEventListener('mousedown',function(e){
    if(e.target.closest('.modal-x')) return;
    on=true; sx=e.clientX; sy=e.clientY;
    var r=box.getBoundingClientRect(); ox=r.left; oy=r.top;
    box.style.position='fixed'; box.style.margin='0';
    box.style.left=ox+'px'; box.style.top=oy+'px';
    e.preventDefault();
  });
  window.addEventListener('mousemove',function(e){
    if(!on) return;
    box.style.left=(ox+e.clientX-sx)+'px';
    box.style.top =(oy+e.clientY-sy)+'px';
  });
  window.addEventListener('mouseup',function(){ on=false; });
}


/* ---------- 커스텀 셀렉트 (.csel) ----------
   네이티브 <select> 의 드롭다운은 브라우저가 그려서 라운드·정렬을 맞출 수 없다.
   원본 select 는 DOM 에 남겨 두고(값 읽기·change 핸들러가 그대로 동작) 표시용 위젯을 덧씌운다.
   메뉴는 position:fixed 로 띄운다 — 조상(.content)이 overflow 로 자르기 때문. */
/* 셀렉트의 기본은 커스텀 셀렉트다 — 화면 안의 <select> 를 모두 바꾼다.
   브라우저 기본 목록을 그대로 써야 하면 select 에 data-nocsel 을 준다.
   (다중 선택 select[multiple] 은 대상이 아니다 — 계층 다중 선택은 .ctree 를 쓴다) */
function initCsel(root){
  (root||document).querySelectorAll('select:not([data-nocsel]):not([multiple])').forEach(function(sel){
    if(sel.__csel) return; sel.__csel=true;
    /* 표 안 인라인 편집은 22px, 그 밖은 24px — 화면과 같은 규칙 */
    var wrap=document.createElement('span');
    wrap.className='csel ' + (sel.closest('table.grid') ? 'h22' : 'h24');
    var box=document.createElement('div'); box.className='csel-box'; box.tabIndex=0;
    var menu=document.createElement('div'); menu.className='csel-menu';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(box); wrap.appendChild(menu); wrap.appendChild(sel);
    sel.style.display='none';
    function paint(){
      box.textContent=sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].textContent:'';
      menu.innerHTML='';
      [].forEach.call(sel.options,function(o,i){
        var it=document.createElement('div');
        it.className='prtitem'+(i===sel.selectedIndex?' sel':'');
        it.textContent=o.textContent;
        it.addEventListener('click',function(){
          sel.selectedIndex=i; paint(); close();
          sel.dispatchEvent(new Event('change',{bubbles:true}));
        });
        menu.appendChild(it);
      });
    }
    function place(){
      var r=box.getBoundingClientRect();
      menu.style.left=r.left+'px'; menu.style.top=(r.bottom+1)+'px';
      menu.style.minWidth=r.width+'px';
    }
    function open(){ wrap.classList.add('open'); place(); }
    function close(){ wrap.classList.remove('open'); }
    /* 비활성 셀렉트 — 화면과 같이 wrap 에 표시를 남기고 열리지 않게 한다 */
    wrap.classList.toggle('csel-disabled', !!sel.disabled);
    box.addEventListener('click',function(){
      if(sel.disabled) return;
      wrap.classList.contains('open')?close():open(); });
    box.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(); }
      if(e.key==='Escape') close();
    });
    document.addEventListener('mousedown',function(e){ if(!wrap.contains(e.target)) close(); },true);
    window.addEventListener('scroll',function(){ if(wrap.classList.contains('open')) place(); },true);
    window.addEventListener('resize',function(){ if(wrap.classList.contains('open')) place(); });
    paint();
  });
}


/* ---------- 트리 셀렉트 (.tsel) ----------
   중첩 <ul><li data-v="값">라벨</li></ul> 을 읽어 트리 목록을 만든다.
   잎(leaf) 노드만 값으로 선택되고, 상위 노드는 펼침/접힘만 한다.
   숨은 <input type="hidden"> 에 값을 넣고 change 를 쏘므로 폼 전송·검증에 그대로 쓰인다. */
function initTreeSelect(root){
  (root||document).querySelectorAll('.tsel[data-tree]').forEach(function(wrap){
    if(wrap.__tsel) return; wrap.__tsel=true;
    var srcList=wrap.querySelector('ul'); if(!srcList) return;
    var box=document.createElement('div'); box.className='tsel-box'; box.tabIndex=0;
    var menu=document.createElement('div'); menu.className='tsel-menu';
    var hidden=wrap.querySelector('input[type=hidden]');
    if(!hidden){ hidden=document.createElement('input'); hidden.type='hidden'; wrap.appendChild(hidden); }
    srcList.style.display='none';
    wrap.insertBefore(box, wrap.firstChild); wrap.insertBefore(menu, srcList);

    var CHEV='<svg class="tchev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '+
             'stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
    function build(list, depth, parent){
      [].forEach.call(list.children, function(li){
        var kids=li.querySelector('ul');
        var node=document.createElement('div');
        node.className='tnode'+(kids?'':' leaf');
        node.setAttribute('data-depth', depth);
        if(li.dataset.v) node.setAttribute('data-v', li.dataset.v);
        var label=(li.childNodes[0] && li.childNodes[0].nodeValue || '').trim() || li.dataset.label || '';
        node.innerHTML=CHEV+'<span class="tlabel"></span>'+
          (li.dataset.count?'<span class="tcount">'+li.dataset.count+'</span>':'');
        node.querySelector('.tlabel').textContent=label;
        parent.appendChild(node);
        if(kids){
          var g=document.createElement('div'); g.className='tgroup'; parent.appendChild(g);
          node.addEventListener('click', function(e){
            e.stopPropagation();
            node.classList.toggle('open'); g.classList.toggle('open');
          });
          build(kids, depth+1, g);
        } else {
          node.addEventListener('click', function(e){
            e.stopPropagation();
            menu.querySelectorAll('.tnode.on').forEach(function(o){ o.classList.remove('on'); });
            node.classList.add('on');
            box.textContent=label;
            hidden.value=node.getAttribute('data-v')||label;
            close();
            hidden.dispatchEvent(new Event('change',{bubbles:true}));
          });
        }
      });
    }
    build(srcList, 0, menu);
    box.textContent=wrap.dataset.placeholder||'선택하세요';

    function place(){ var r=box.getBoundingClientRect();
      menu.style.left=r.left+'px'; menu.style.top=(r.bottom+1)+'px'; menu.style.minWidth=r.width+'px'; }
    function open(){ wrap.classList.add('open'); place(); }
    function close(){ wrap.classList.remove('open'); }
    box.addEventListener('click', function(){ wrap.classList.contains('open')?close():open(); });
    box.addEventListener('keydown', function(e){
      if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(); }
      if(e.key==='Escape') close();
    });
    document.addEventListener('mousedown', function(e){ if(!wrap.contains(e.target)) close(); }, true);
    window.addEventListener('scroll', function(){ if(wrap.classList.contains('open')) place(); }, true);
    window.addEventListener('resize', function(){ if(wrap.classList.contains('open')) place(); });
  });
}

/* ---------- 페이지네이션 ----------
   실제 화면(02-012)의 renderPaging 과 같은 구성·순서다.
     « ‹ [번호…] › »  ·  페이지 [입력] / N  ·  새로고침  ·  페이지당 [30/50/100]
   총 건수(.pgtotal)는 화면에서 쓰지 않는다 — 필요하면 {total:true} 로 켠다. */
function renderPaging(el, opt){
  el=typeof el==='string'?document.querySelector(el):el; if(!el) return;
  opt=opt||{};
  var size=opt.size||30, total=opt.total||0, cur=opt.page||1;
  var pages=Math.max(1, Math.ceil(total/size));
  cur=Math.min(Math.max(1,cur),pages);
  var end=Math.min(pages, Math.max(5, cur+2)), start=Math.max(1, end-4);
  var nums='';
  for(var p=start;p<=end;p++) nums+='<button type="button" class="pgnum'+(p===cur?' on':'')+'" data-p="'+p+'">'+p+'</button>';
  el.className='paging';
  el.innerHTML=
    '<button type="button" class="pgnav" title="처음"'+(cur<=1?' disabled':'')+'>«</button>'+
    '<button type="button" class="pgnav" title="이전"'+(cur<=1?' disabled':'')+'>‹</button>'+nums+
    '<button type="button" class="pgnav" title="다음"'+(cur>=pages?' disabled':'')+'>›</button>'+
    '<button type="button" class="pgnav" title="끝"'+(cur>=pages?' disabled':'')+'>»</button>'+
    '<span class="pgjump">페이지 <input type="number" min="1" max="'+pages+'" value="'+cur+'"> / '+pages+'</span>'+
    '<button type="button" class="pgnav" title="새로고침"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" '+
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+
      '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg></button>'+
    '<span class="pgsize">페이지당 <select class="pgsizesel" aria-label="페이지당 표시 개수">'+
      [30,50,100].map(function(n){ return '<option value="'+n+'"'+(n===size?' selected':'')+'>'+n+'</option>'; }).join('')+
    '</select></span>'+
    (opt.showTotal ? '<span class="pgtotal">총 '+KCMSnum(total)+'건</span>' : '');
  el.querySelectorAll('.pgnum').forEach(function(b){
    b.addEventListener('click',function(){ if(opt.onPage) opt.onPage(Number(b.dataset.p)); });
  });
  /* 페이지당 개수는 화면과 같이 커스텀 셀렉트로 바꾼다 — 페이징은 나중에 그려지므로
     초기 initCsel() 한 번으로는 잡히지 않는다. */
  initCsel(el);
}
function KCMSnum(v){ return String(v).replace(/\B(?=(\d{3})+(?!\d))/g,','); }


/* ---------- 체크박스 트리 셀렉트 (다중 선택) ----------
   <span class="ctree" data-ctree data-placeholder="전체">
     <ul>
       <li data-label="ECP"><ul><li>ECP5</li><li>ECP6</li></ul></li>
     </ul>
   </span>
   값은 숨은 input(쉼표 구분)에 들어가고 바뀔 때 change 가 발생한다.
   아무것도 고르지 않았거나 전부 고른 상태는 모두 "전체"(제한 없음)로 읽는다. */
var CT_OPEN=null;
function ctCloseAll(){ if(CT_OPEN){ CT_OPEN.classList.remove('open'); CT_OPEN=null; } }
document.addEventListener('click', ctCloseAll);
document.addEventListener('scroll', ctCloseAll, true);
window.addEventListener('resize', ctCloseAll);

function initCTree(root){
  (root||document).querySelectorAll('.ctree[data-ctree]').forEach(function(wrap){
    if(wrap.__ctree) return;
    var src=wrap.querySelector('ul'); if(!src) return;
    var groups=[].map.call(src.children, function(li){
      var kids=li.querySelector('ul');
      var name=(li.childNodes[0]&&li.childNodes[0].nodeValue||'').trim()||li.dataset.label||'';
      return {name:name, items:kids?[].map.call(kids.children,function(c){
        var label=(c.childNodes[0]&&c.childNodes[0].nodeValue||'').trim()||(c.textContent||'').trim();
        return c.dataset.count?{value:label, count:c.dataset.count}:label; }):[]};
    }).filter(function(g){ return g.items.length; });
    src.remove();
    wrap.__ctree=buildCTree(wrap, groups, {placeholder:wrap.dataset.placeholder});
    if(wrap.hasAttribute('data-all')) wrap.__ctree.setAll();
  });
}

var CT_CHEV='<svg class="ctchev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
var CT_FOLD='<svg class="ctfold" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';

function buildCTree(host, groups, opt){
  opt=opt||{};
  var placeholder=opt.placeholder||'전체';
  var total=groups.reduce(function(n,g){ return n+g.items.length; },0);
  host.classList.add('ctree');
  var box=document.createElement('div'); box.className='ctree-box'; box.tabIndex=0;
  box.setAttribute('role','button'); box.setAttribute('aria-expanded','false');
  var menu=document.createElement('div'); menu.className='ctree-menu';
  var hidden=host.querySelector('input[type=hidden]');
  if(!hidden){ hidden=document.createElement('input'); hidden.type='hidden'; }
  var hd=document.createElement('div'); hd.className='ctree-hd';
  hd.innerHTML='<input type="text" class="ctree-q" placeholder="검색" aria-label="검색">'+
               '<button type="button" class="ctree-exp">전체펼치기</button>'+
               '<button type="button" class="ctree-clr">전체해제</button>';
  var list=document.createElement('div'); list.className='ctree-list';
  var ft=document.createElement('div'); ft.className='ctree-ft';
  var leaves=[], parents=[];

  groups.forEach(function(g){
    /* 잎에 [배정/정원] 같은 참고 수치가 있으면 묶음은 그 합을 보여 준다 */
    var sum=g.items.reduce(function(a,v){
      var c=(v&&typeof v==='object'&&v.count)?String(v.count).split('/'):null;
      if(c){ a.n+=Number(c[0])||0; a.m+=Number(c[1])||0; a.any=true; } return a;
    },{n:0,m:0,any:false});
    var prow=document.createElement('div');
    prow.className='ctnode'; prow.setAttribute('data-depth','0');   /* 처음엔 접힘 — 항목이 많으면 목록이 길다 */
    prow.innerHTML=CT_CHEV+CT_FOLD+'<input type="checkbox"><span></span><span class="ctcount">'+
      (sum.any?'['+sum.n+'/'+sum.m+']':g.items.length)+'</span>';
    prow.querySelector('span').textContent=g.name;
    list.appendChild(prow);
    var P={cb:prow.querySelector('input'), row:prow, kids:[], rows:[]};
    parents.push(P);
    g.items.forEach(function(v){
      var val=(v&&typeof v==='object')?v.value:v, cnt=(v&&typeof v==='object'&&v.count)?v.count:'';
      var row=document.createElement('div');
      row.className='ctnode hide2'; row.setAttribute('data-depth','1');
      row.innerHTML=CT_CHEV+'<input type="checkbox"><span></span>'+
        (cnt?'<span class="ctcount">['+cnt+']</span>':'');
      row.querySelector('span').textContent=val;
      list.appendChild(row);
      var L={value:val, cb:row.querySelector('input'), row:row, parent:P};
      leaves.push(L); P.kids.push(L); P.rows.push(row);
    });
    prow.addEventListener('click', function(e){
      if(e.target.tagName==='INPUT') return;
      prow.classList.toggle('open');
      var on=prow.classList.contains('open');
      P.rows.forEach(function(r){ r.classList.toggle('hide2', !on); });
    });
    P.cb.addEventListener('change', function(){
      P.kids.forEach(function(k){ k.cb.checked=P.cb.checked; }); sync();
    });
  });
  leaves.forEach(function(L){
    L.row.addEventListener('click', function(e){
      if(e.target.tagName!=='INPUT'){ L.cb.checked=!L.cb.checked; sync(); }
    });
    L.cb.addEventListener('change', sync);
  });

  function selected(){ return leaves.filter(function(L){ return L.cb.checked; }); }
  function values(){ var s=selected(); return (s.length===0||s.length===total)?null:s.map(function(L){ return L.value; }); }
  function sync(){
    parents.forEach(function(P){
      var on=P.kids.filter(function(k){ return k.cb.checked; }).length;
      P.cb.checked = on===P.kids.length && on>0;
      P.cb.indeterminate = on>0 && on<P.kids.length;
    });
    var s=selected(), all=s.length===0||s.length===total;
    box.textContent = all ? placeholder : (s.length===1 ? s[0].value : s[0].value+' 외 '+(s.length-1));
    box.classList.toggle('has', !all);
    ft.innerHTML='<span>선택 <b>'+(all?total:s.length)+'</b> / '+total+'</span><span>'+(all?'전체':'일부')+'</span>';
    hidden.value=(values()||[]).join(',');
    hidden.dispatchEvent(new Event('change',{bubbles:true}));
    if(opt.onChange) opt.onChange(values());
  }

  hd.querySelector('.ctree-q').addEventListener('input', function(){
    var q=this.value.trim().toLowerCase();
    parents.forEach(function(P){
      var hit=0;
      P.kids.forEach(function(k){
        var on=!q||k.value.toLowerCase().indexOf(q)!==-1;
        k.row.classList.toggle('hide', !on); if(on) hit++;
      });
      var gHit=!q||P.row.querySelector('span').textContent.toLowerCase().indexOf(q)!==-1;
      if(gHit&&q){ P.kids.forEach(function(k){ k.row.classList.remove('hide'); }); hit=P.kids.length; }
      P.row.classList.toggle('hide', !(hit||gHit));
      if(q){ P.row.classList.add('open'); P.rows.forEach(function(r){ r.classList.remove('hide2'); }); }
    });
  });
  hd.querySelector('.ctree-exp').addEventListener('click', function(e){
    e.stopPropagation();
    var anyClosed=parents.some(function(P){ return !P.row.classList.contains('open'); });
    parents.forEach(function(P){
      P.row.classList.toggle('open', anyClosed);
      P.rows.forEach(function(r){ r.classList.toggle('hide2', !anyClosed); });
    });
    this.textContent = anyClosed ? '전체접기' : '전체펼치기';
  });
  hd.querySelector('.ctree-clr').addEventListener('click', function(e){
    e.stopPropagation();
    var none=selected().length===0;
    leaves.forEach(function(L){ L.cb.checked=none; }); sync();
    this.textContent = none ? '전체해제' : '전체선택';
  });

  menu.appendChild(hd); menu.appendChild(list); menu.appendChild(ft);
  menu.addEventListener('click', function(e){ e.stopPropagation(); });
  host.appendChild(box); host.appendChild(menu); host.appendChild(hidden);

  /* 조상이 overflow 로 자르므로 fixed + JS 위치 계산 (커스텀 셀렉트와 같은 방식) */
  function place(){
    var r=box.getBoundingClientRect();
    /* 목록은 박스보다 좁아 보이지 않게 하고(최소 박스 너비),
       오른쪽에 여유가 없으면 박스 오른쪽 끝에 맞춰 편다 — 그리드가 어긋나 보이지 않도록. */
    menu.style.width=Math.round(Math.max(240, r.width))+'px';
    var mw=menu.offsetWidth, left=r.left;
    if(left+mw > window.innerWidth-8) left=r.right-mw;
    menu.style.left=Math.round(Math.max(8,left))+'px';
    menu.style.top=Math.round(r.bottom+2)+'px';
    var below=window.innerHeight-r.bottom-8;
    list.style.maxHeight='';
    var over=menu.offsetHeight-below;
    if(over>0) list.style.maxHeight=Math.max(120, list.offsetHeight-over)+'px';
  }
  box.addEventListener('click', function(e){
    e.stopPropagation();
    var was=host.classList.contains('open');
    ctCloseAll();
    if(!was){ host.classList.add('open'); CT_OPEN=host; place(); hd.querySelector('.ctree-q').focus(); }
    box.setAttribute('aria-expanded', String(!was));
  });
  box.addEventListener('keydown', function(e){
    if(e.key==='Enter'||e.key===' '){ e.preventDefault(); box.click(); }
    if(e.key==='Escape') ctCloseAll();
  });

  sync();
  return {
    values:values,
    reset:function(){ leaves.forEach(function(L){ L.cb.checked=false; }); sync(); },
    setAll:function(){ leaves.forEach(function(L){ L.cb.checked=true; }); sync(); }
  };
}


/* ---------- 날짜 필드의 달력 버튼 ----------
   .iwrap 안의 달력 버튼을 누르면 숨은 input[type=date] 의 showPicker() 를 부른다.
   date-picker.js 가 showPicker 를 가로채 화면 공통 달력 패널을 띄운다. */
document.addEventListener('click', function(e){
  var btn = e.target.closest && e.target.closest('.iwrap .ibtn, .drange .ibtn, .dwrap .ibtn');
  if(!btn) return;
  var shadow = btn.parentElement.querySelector('input[type=date], input[type=time]');
  if(shadow && typeof shadow.showPicker === 'function'){ e.preventDefault(); shadow.showPicker(); }
});

/* ---------- 초기화 ---------- */
/**
 * initLayout({
 *   tabs:'#tabs', menu:{...}, current:'입학관리', badges:{'입학관리':'NEW'},
 *   rail:'#rail', railItems:[...], railCurrent:'HOME',
 *   workTabs:'#worktabs', openTabs:[{key,label,cur}], onTabOpen, onTabClose
 * })
 */
function initLayout(opt){
  opt=opt||{};
  var $=function(s){ return typeof s==='string'?document.querySelector(s):s; };
  if(opt.menu&&$(opt.tabs||'#tabs'))       renderTabs($(opt.tabs||'#tabs'),opt.menu,opt.current,opt.badges);
  if(opt.railItems&&$(opt.rail||'#rail'))  renderRail($(opt.rail||'#rail'),opt.railItems,opt.railCurrent);
  if(opt.openTabs&&$(opt.workTabs||'#worktabs'))
    renderWorkTabs($(opt.workTabs||'#worktabs'),opt.openTabs,opt.onTabOpen,opt.onTabClose);
  syncSelectWidths();
  initCsel();
  initTreeSelect();
  initCTree();
  document.querySelectorAll('.modal-box').forEach(function(b){ makeDraggable(b); });
  if(global.KCMS&&global.KCMS.bindModals) global.KCMS.bindModals();
  return {renderTabs:renderTabs,renderRail:renderRail,renderWorkTabs:renderWorkTabs};
}

global.KCMS=Object.assign(global.KCMS||{},{
  initLayout:initLayout, renderTabs:renderTabs, renderRail:renderRail,
  renderWorkTabs:renderWorkTabs, syncSelectWidths:syncSelectWidths,
  initCsel:initCsel, initTreeSelect:initTreeSelect, initCTree:initCTree, buildCTree:buildCTree, renderPaging:renderPaging, makeDraggable:makeDraggable, SVG:SVG
});
global.initLayout=initLayout;
})(window);
