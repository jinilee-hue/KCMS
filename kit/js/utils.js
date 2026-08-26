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

/* ---------- 2. 토스트 (success / warning / danger / neutral) ---------- */
var TOAST_MAX=3;
function toast(msg,type,title){
  var wrap=document.querySelector('.kistoast-wrap');
  if(!wrap){ wrap=document.createElement('div'); wrap.className='kistoast-wrap'; document.body.appendChild(wrap); }
  /* 넘치는 토스트는 동기적으로 제거한다 — 비동기 제거는 무한루프가 된다 */
  while(wrap.children.length>=TOAST_MAX) wrap.removeChild(wrap.firstChild);

  var el=document.createElement('div');
  el.className='kistoast'+(type?' is-'+type:'');
  el.setAttribute('role', type==='danger'?'alert':'status');
  var head=title?'<div class="kt-hd">'+esc(title)+'</div>':'';
  el.innerHTML=head+'<div class="kt-msg">'+esc(msg)+'</div>';   /* 문구에 이모지 금지 */
  wrap.appendChild(el);
  setTimeout(function(){ el.classList.add('show'); },16);        /* rAF 는 일부 환경에서 누락된다 */
  setTimeout(function(){
    el.classList.remove('show');
    setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); },240);
  }, type==='danger'?5200:3600);
  return el;
}
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

/* ---------- 3. 모달 ---------- */
function openModal(id){
  var m=typeof id==='string'?document.getElementById(id):id; if(!m) return null;
  m.classList.add('on'); m.__prevFocus=document.activeElement;
  var f=m.querySelector('input,select,textarea,button'); if(f) f.focus();
  return m;
}
function closeModal(id){
  var m=typeof id==='string'?document.getElementById(id):id; if(!m) return;
  m.classList.remove('on');
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
      var open=[].slice.call(document.querySelectorAll('.modal-ov.on')).pop();
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
  toast:toast, openModal:openModal, closeModal:closeModal, bindModals:bindModals,
  cssVar:cssVar, getChartColors:getChartColors, ruleColor:ruleColor, setChartDefaults:setChartDefaults
});
})(window);
