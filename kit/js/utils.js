/* ============================================================
   KCMS 입학관리 Kit — 유틸리티
   포맷 · 토스트 · 모달 · Chart.js 프리셋
   의존성: tokens.css (CSS 변수를 읽어 차트 색을 만든다)
   ============================================================ */
(function(global){
'use strict';

/* ---------- 1. 포맷 ---------- */
function num(v){ return (v==null||v==='')?'':String(v).replace(/\B(?=(\d{3})+(?!\d))/g,','); }
function pct(v,digits){ return (v==null)?'':Number(v).toFixed(digits==null?1:digits)+'%'; }
/** 퍼센트를 "숫자 + 작은 % 기호" HTML 로 — 표·카드 공통 규칙 */
function pctHtml(v,digits){ return Number(v).toFixed(digits==null?1:digits)+'<span class="pcts">%</span>'; }
function date(v,sep){ /* 2026-08-26 → 2026.08.26 */
  if(!v) return ''; var s=String(v).replace(/[^0-9]/g,'');
  if(s.length<8) return String(v);
  return s.slice(0,4)+(sep||'.')+s.slice(4,6)+(sep||'.')+s.slice(6,8);
}
function phone(v){
  var s=String(v||'').replace(/[^0-9]/g,'');
  if(s.length===11) return s.replace(/(\d{3})(\d{4})(\d{4})/,'$1-$2-$3');
  if(s.length===10) return s.replace(/(\d{2,3})(\d{3,4})(\d{4})/,'$1-$2-$3');
  return v||'';
}
/** 개인정보 마스킹 — 공유용 화면에 실데이터를 넣지 않을 때 */
function mask(v,keep){ var s=String(v||''); keep=keep==null?1:keep;
  return s.length<=keep?s:s.slice(0,keep)+'*'.repeat(s.length-keep); }

/* ---------- 2. 토스트 (실제 화면 구현을 그대로 옮김) ----------
   배경은 의미색을 92% 불투명으로 깔고(color-mix) 글자·아이콘은 흰색.
   왼쪽 액센트 바 없음 · 문구에 이모지 금지 · 최대 4개까지 쌓임.
   success = 초록 / warning = 황색 / danger = 적색 / neutral = Poly Blue */
var KT_MAX=4;
var KT_ICONS={
  success:'<path d="M20 6L9 17l-5-5"/>',
  warning:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  danger:'<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
  neutral:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>'
};
/** 타입을 생략하면 기본은 neutral.
    문구에 뚜렷한 단서가 있을 때만 success/warning/danger 로 올린다
    (기존 호출부를 타입 인자 없이 그대로 두기 위한 규칙). */
function guessType(msg){
  if(/수 없|없습니다|없는|않습니다|않은|불가|실패|오류|잘못/.test(msg)) return 'danger';
  if(/주세요|하세요|필수|입력해|선택해|필요합니다|확인해/.test(msg))     return 'warning';
  if(/되었습니다|완료되|성공|저장했/.test(msg))                          return 'success';
  return 'neutral';
}
function toast(msg,type){
  var wrap=document.querySelector('.kistoast-wrap');
  if(!wrap){ wrap=document.createElement('div'); wrap.className='kistoast-wrap'; document.body.appendChild(wrap); }
  var t=type||guessType(String(msg==null?'':msg));
  if(!KT_ICONS[t]) t='neutral';
  var el=document.createElement('div');
  el.className='kistoast is-'+t;
  el.setAttribute('role', (t==='danger'||t==='warning')?'alert':'status');
  el.innerHTML='<div class="kt-body">'+
    '<svg class="kt-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '+
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+KT_ICONS[t]+'</svg>'+
    '<span class="kt-msg"></span></div>';
  el.querySelector('.kt-msg').textContent=msg;
  wrap.appendChild(el);
  /* 넘친 것은 애니메이션 없이 즉시 제거한다 —
     hide() 는 260ms 뒤에 노드를 지우므로 여기서 쓰면 while 이 무한 루프에 빠진다 */
  while(wrap.children.length>KT_MAX){
    var oldest=wrap.firstElementChild;
    clearTimeout(oldest._ktTimer); oldest._ktHiding=true; wrap.removeChild(oldest);
  }
  /* 붙자마자 .show 를 주면 시작값이 없어 트랜지션이 안 걸린다 — 한 틱 뒤에.
     rAF 는 프레임이 안 그려지는 환경에서 호출되지 않을 수 있어 setTimeout 을 쓴다 */
  setTimeout(function(){ el.classList.add('show'); },16);
  el._ktTimer=setTimeout(function(){ hideToast(el); },3500);
  return el;
}
function hideToast(el){
  if(!el||el._ktHiding) return;
  el._ktHiding=true; clearTimeout(el._ktTimer);
  el.classList.remove('show');
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); },260);
}
function esc(s){ return String(s==null?'':s).replace(/[&<>"\']/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

/* ---------- 3. 모달 ---------- */
function openModal(id){
  var m=typeof id==='string'?document.getElementById(id):id; if(!m) return null;
  m.classList.add('open'); m.__prevFocus=document.activeElement;   /* 화면과 동일하게 .open */
  var f=m.querySelector('input,select,textarea,button'); if(f) f.focus();
  return m;
}
function closeModal(id){
  var m=typeof id==='string'?document.getElementById(id):id; if(!m) return;
  m.classList.remove('open');
  if(m.__prevFocus&&m.__prevFocus.focus) m.__prevFocus.focus();
}
/** 오버레이 클릭·Esc·✕ 로 닫히도록 일괄 연결 */
function bindModals(root){
  (root||document).querySelectorAll('.modal-ov').forEach(function(m){
    if(m.__bound) return; m.__bound=true;
    m.addEventListener('mousedown',function(ev){ if(ev.target===m) closeModal(m); });
    var x=m.querySelector('.modal-x'); if(x) x.addEventListener('click',function(){ closeModal(m); });
  });
  if(!document.__escBound){
    document.__escBound=true;
    document.addEventListener('keydown',function(ev){
      if(ev.key!=='Escape') return;
      var open=[].slice.call(document.querySelectorAll('.modal-ov.open')).pop();
      if(open){ closeModal(open); ev.stopPropagation(); }
    },true);
  }
}

/* ---------- 4. Chart.js 프리셋 ---------- */
/** tokens.css 의 변수를 실제 색으로 읽는다 */
function cssVar(name,fallback){
  var v=getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v||fallback;
}
/** 브랜드 파랑 한 색을 투명도로만 나눈 팔레트 — 차트에 시맨틱 색(빨강·주황) 금지 */
function getChartColors(){
  var pb=cssVar('--pb','#0066FF');
  return [pb,
          mix(pb,.80), mix(pb,.62), mix(pb,.46), mix(pb,.32), mix(pb,.20)];
  function mix(hex,a){ var n=parseInt(hex.slice(1),16);
    return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'; }
}
/** 기준선이 있는 지표 전용 — 기준 이상/미만 두 색 */
function ruleColor(pct,threshold){
  return pct>=threshold?cssVar('--chart-ok','#5E93EE'):cssVar('--chart-low','#E58388');
}
function setChartDefaults(){
  if(!global.Chart) return false;
  var C=global.Chart;
  C.defaults.font.family=cssVar('--font','sans-serif');
  C.defaults.font.size=11;
  C.defaults.color=cssVar('--txt-mut','#5B6776');
  C.defaults.plugins.legend.labels.boxWidth=10;
  C.defaults.plugins.legend.labels.boxHeight=10;
  C.defaults.plugins.tooltip.padding=8;
  C.defaults.datasets.bar.barPercentage=0.45;
  C.defaults.datasets.bar.maxBarThickness=32;
  C.defaults.datasets.bar.borderRadius=3;
  C.defaults.elements.line.borderWidth=2;
  C.defaults.elements.point.radius=4;
  C.defaults.elements.point.hoverRadius=6;
  return true;
}

global.KCMS=Object.assign(global.KCMS||{},{
  num:num, pct:pct, pctHtml:pctHtml, date:date, phone:phone, mask:mask, esc:esc,
  toast:toast, hideToast:hideToast, guessType:guessType, openModal:openModal, closeModal:closeModal, bindModals:bindModals,
  cssVar:cssVar, getChartColors:getChartColors, ruleColor:ruleColor, setChartDefaults:setChartDefaults
});
})(window);
