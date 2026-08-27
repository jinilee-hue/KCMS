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
function initCsel(root){
  (root||document).querySelectorAll('select[data-csel]').forEach(function(sel){
    if(sel.__csel) return; sel.__csel=true;
    var wrap=document.createElement('span'); wrap.className='csel';
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
    box.addEventListener('click',function(){ wrap.classList.contains('open')?close():open(); });
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

/* ---------- 페이지네이션 ----------
   실제 화면(02-012)의 renderPaging 과 같은 마크업을 만든다.
   « ‹ [번호…] › »  ·  페이지 [입력]/N  ·  새로고침  ·  페이지당 [30/50/100]  ·  총 N건 */
function renderPaging(el, opt){
  el=typeof el==='string'?document.querySelector(el):el; if(!el) return;
  opt=opt||{};
  var size=opt.size||30, total=opt.total||0, cur=opt.page||1;
  var pages=Math.max(1, Math.ceil(total/size));
  cur=Math.min(Math.max(1,cur),pages);
  var end=Math.min(pages, Math.max(5, cur+2)), start=Math.max(1, end-4);
  var nums='';
  for(var p=start;p<=end;p++) nums+='<button type="button" class="pgnum'+(p===cur?' on':'')+'" data-p="'+p+'">'+p+'</button>';
  var from=total?((cur-1)*size+1):0, to=total?Math.min(cur*size,total):0;
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
    '<span class="pgtotal">'+(total?from+'–'+to+' / 총 '+KCMSnum(total)+'건':'총 0건')+'</span>';
  el.querySelectorAll('.pgnum').forEach(function(b){
    b.addEventListener('click',function(){ if(opt.onPage) opt.onPage(Number(b.dataset.p)); });
  });
}
function KCMSnum(v){ return String(v).replace(/\B(?=(\d{3})+(?!\d))/g,','); }

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
  document.querySelectorAll('.modal-box').forEach(function(b){ makeDraggable(b); });
  if(global.KCMS&&global.KCMS.bindModals) global.KCMS.bindModals();
  return {renderTabs:renderTabs,renderRail:renderRail,renderWorkTabs:renderWorkTabs};
}

global.KCMS=Object.assign(global.KCMS||{},{
  initLayout:initLayout, renderTabs:renderTabs, renderRail:renderRail,
  renderWorkTabs:renderWorkTabs, syncSelectWidths:syncSelectWidths,
  initCsel:initCsel, renderPaging:renderPaging, makeDraggable:makeDraggable, SVG:SVG
});
global.initLayout=initLayout;
})(window);
