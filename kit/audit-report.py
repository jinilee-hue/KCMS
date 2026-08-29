# -*- coding: utf-8 -*-
"""수집해 둔 audit_result.json 을 사람이 볼 수 있게 추린다."""
import json, re, collections
d = json.load(open('audit_result.json'))
screen, demo = d['screen'], d['demo']

# 데모 페이지 자체의 뼈대·레이아웃 클래스는 비교 대상이 아니다
SKIP = re.compile(r'^(doc|nav|tile|demo|card|sub|item|section|wrap|note|hd|body|main|app|lower|rail|content|page)')
# 이름이 너무 일반적이라 서로 다른 것을 가리킬 수 있는 클래스
AMBIG = {'on','ic','meta','lbl','sel','row','box','txt','cnt','t','b','v','col','head','hd','ft',
         # 같은 이름이 화면과 데모에서 다른 것을 가리키는 클래스
         'flabel','btn','dateshadow','hint','pcts','panel','sectit'}
# 화면이 id 로 색을 덮는 버튼들 — .btn.sm 자체는 파랑이 맞다
NOTE = {'btn.sm':'화면은 검색 버튼 id 목록으로 남색을 준다 — 클래스 자체는 파랑이 맞음'}
# 내용량에 따라 달라지는 값 — 컨테이너에서는 비교 의미가 없다
SIZE = {'height'}
CONTAINER = re.compile(r'(wrap|tbl|table|grid|body|box|list|panel|filters|infotbl|modal|form)')

def sig(k, v, props):
    return {p: v.get(p) for p in props}

PROPS = ['backgroundColor','color','borderTopWidth','borderTopColor',
         'borderTopLeftRadius','fontSize','fontWeight','height','padding']

outside, diff = [], []
for k, v in sorted(demo.items()):
    base = k.split('.')[0]
    if SKIP.match(k) or base in AMBIG:
        continue
    if k not in screen:
        outside.append(k); continue
    # 높이는 내용량에 따라 달라진다 — 높이가 고정인 컨트롤에서만 비교한다
    FIXED_H = re.compile(r'^(btn|finput|fselect|csel|pgnav|pgnum|tharrow|badge|tobadge|cntbadge|'
                         r'ddaybadge|tabbadge|switch|rowchk|ibtn|bcic|tag2|quickpill|period-tab)')
    props = [p for p in PROPS
             if not (p in SIZE and not FIXED_H.match(k))]
    bad = [(p, screen[k].get(p), v.get(p)) for p in props if screen[k].get(p) != v.get(p)]
    # 1px 이하 높이 차이는 렌더 오차로 본다
    def px(v):
        try: return float(str(v).replace('px',''))
        except ValueError: return None
    bad = [t for t in bad
           if not (t[0]=='height' and px(t[1]) is not None and px(t[2]) is not None
                   and abs(px(t[1])-px(t[2])) <= 1.5)]
    if bad:
        diff.append((k, bad))

print('■ 화면에 없는 클래스를 데모가 씀 — %d개' % len(outside))
for k in outside: print('   ', k)
print()
print('■ 값이 어긋난 클래스 — %d개' % len(diff))
for k, bad in diff:
    print('   %s' % k)
    for p, sv, dv in bad:
        print('      %-20s 화면 %-24s 데모 %s' % (p, sv, dv))
