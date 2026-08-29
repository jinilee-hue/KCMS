# -*- coding: utf-8 -*-
"""Kit 데모 ↔ 입학관리 5페이지 자동 대조

같은 클래스를 양쪽에서 렌더해 실효 스타일을 비교한다.
· 화면에 없는 클래스를 데모가 쓰고 있으면  →  [범위밖]
· 양쪽에 있으나 값이 다르면              →  [불일치]
· 화면에만 있고 데모에 없으면            →  [누락]  (자주 쓰는 것만)
"""
import kit, re, os, json, subprocess, collections

CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
IN = ['01-001', '02-012', '02-010', '04-001', '05-001']

# 비교할 속성 — 눈에 보이는 것만
PROPS = ['backgroundColor', 'color', 'borderTopWidth', 'borderTopColor',
         'borderTopLeftRadius', 'fontSize', 'fontWeight', 'height', 'padding']

PROBE = '''<script>
(function(){
  var OUT={};
  function snap(){
    document.querySelectorAll('*').forEach(function(el){
      var cn = typeof el.className==='string' ? el.className.trim() : '';
      if(!cn) return;
      var r=el.getBoundingClientRect();
      if(r.width<2||r.height<2) return;
      var cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden') return;
      var key=cn.split(/\\s+/).slice(0,3).join('.');
      if(OUT[key]) return;                      /* 클래스별 첫 인스턴스만 */
      OUT[key]={__PROPS__};
    });
  }
  function op(f){ try{ f(); }catch(e){} }
  setTimeout(function(){
    snap();
    var R=[{no:'1',name:'홍길동',studentNo:'06100000',phone:'010-1234-1234',parentPhone:'010-1234-1234'}];
    if(window.openSmsModal) op(function(){ openSmsModal({recipients:R}); });
    setTimeout(function(){ snap();
      document.querySelectorAll('.modal-ov').forEach(function(m){m.classList.remove('open');});
      if(window.openMemoModal) op(function(){ openMemoModal({studentNo:'1',name:'홍길동',records:[]}); });
      setTimeout(function(){ snap();
        if(window.openMemoDetailModal) op(function(){ openMemoDetailModal({}); });
        setTimeout(function(){ snap();
          document.querySelectorAll('.modal-ov').forEach(function(m){m.classList.remove('open');});
          if(window.openSmsHistoryModal) op(function(){ openSmsHistoryModal({student:{name:'홍길동'},records:[]}); });
          setTimeout(function(){ snap();
            document.querySelectorAll('.modal-ov').forEach(function(m){m.classList.remove('open');});
            if(window.openStaffPickModal) op(function(){ openStaffPickModal({onApply:function(){}}); });
            setTimeout(function(){ snap();
              var p=document.createElement('pre'); p.id='PROBE_RESULT';
              p.textContent=JSON.stringify(OUT); document.body.appendChild(p);
            },350);
          },350);
        },350);
      },400);
    },450);
  },900);
})();
</script>'''.replace('__PROPS__', ','.join("%s:cs.%s" % (p, p) for p in PROPS))


def run(path, budget=11000):
    dom = subprocess.run([CH, '--headless=new', '--disable-gpu', '--window-size=1500,1000',
                          '--virtual-time-budget=%d' % budget, '--dump-dom',
                          'file://' + os.path.abspath(path)],
                         capture_output=True, text=True).stdout
    m = re.search(r'<pre id="PROBE_RESULT">(.*?)</pre>', dom, re.S)
    return json.loads(m.group(1)) if m else {}


# ── 화면 쪽 수집 ────────────────────────────────────────────────────
d = kit.load()
screen = {}
for name in sorted(d['screens']):
    if not any(x in name for x in IN):
        continue
    out = 'audit/%s.html' % re.sub(r'[^A-Za-z0-9-]', '_', name)[:36]
    kit.standalone(name, out, PROBE)
    for k, v in run(out).items():
        screen.setdefault(k, v)

# ── 데모 쪽 수집 ────────────────────────────────────────────────────
s = open('kcms_probe/kit/components.html', encoding='utf-8').read()
i = s.rindex('</body>')
open('kcms_probe/kit/_audit.html', 'w', encoding='utf-8').write(s[:i] + PROBE + s[i:])
demo = run('kcms_probe/kit/_audit.html')
os.remove('kcms_probe/kit/_audit.html')

json.dump({'screen': screen, 'demo': demo}, open('audit_result.json', 'w'), ensure_ascii=False)

# ── 대조 ────────────────────────────────────────────────────────────
SKIP = re.compile(r'^(doc|nav|tile|demo|card|sub|item|section|wrap$|note)')
outside, diff = [], []
for k, v in sorted(demo.items()):
    if SKIP.match(k):
        continue
    if k not in screen:
        outside.append(k)
        continue
    bad = [(p, screen[k][p], v[p]) for p in PROPS if screen[k].get(p) != v.get(p)]
    if bad:
        diff.append((k, bad))

print('데모 클래스 %d종 · 화면 클래스 %d종' % (len(demo), len(screen)))
print()
print('■ 화면에 없는 클래스를 데모가 씀 (%d)' % len(outside))
for k in outside[:40]:
    print('   ', k)
print()
print('■ 값이 다른 클래스 (%d)' % len(diff))
for k, bad in diff[:30]:
    print('   %s' % k)
    for p, sv, dv in bad[:4]:
        print('      %-20s 화면 %-22s 데모 %s' % (p, sv, dv))
