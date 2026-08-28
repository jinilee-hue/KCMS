# -*- coding: utf-8 -*-
"""common.css 중복 정리 — 같은 선택자가 여러 번 나오면 마지막 자리에 한 번으로 합친다.

브라우저가 계산하는 값(뒤에 온 선언이 이긴다)을 그대로 유지하므로 렌더링은 같아야 한다.
합친 뒤에는 반드시 계산값 스냅샷으로 대조한다.
"""
import re
import sys
import collections

p = sys.argv[1] if len(sys.argv) > 1 else 'kcms_probe/kit/styles/common.css'
css = open(p, encoding='utf-8').read()

# 주석은 자리표시자로 빼 둔다(중괄호를 품은 주석이 있다)
comments = []


def stash(m):
    comments.append(m.group(0))
    return '\x01C%d\x01' % (len(comments) - 1)


work = re.sub(r'/\*[\s\S]*?\*/', stash, css)

# @media 등 중첩 블록은 건드리지 않는다
media_spans = []
for m in re.finditer(r'@[\w-]+[^{]*\{', work):
    depth, i = 1, m.end()
    while i < len(work) and depth:
        if work[i] == '{':
            depth += 1
        elif work[i] == '}':
            depth -= 1
        i += 1
    media_spans.append((m.start(), i))


def in_media(pos):
    return any(a <= pos < b for a, b in media_spans)


rules = []           # (start, end, sel, body)
for m in re.finditer(r'([^{}]+)\{([^}]*)\}', work):
    if in_media(m.start()):
        continue
    sel = re.sub(r'\s+', ' ', re.sub(r'\x01C\d+\x01', '', m.group(1))).strip()
    if not sel or sel.startswith('@'):
        continue
    rules.append([m.start(), m.end(), sel, m.group(2)])

pos_by_sel = collections.defaultdict(list)
for idx, r in enumerate(rules):
    pos_by_sel[r[2]].append(idx)

merged, removed = 0, 0
drop = set()
def props_of(body):
    return {d.split(':', 1)[0].strip() for d in body.split(';') if ':' in d}


for sel, idxs in pos_by_sel.items():
    if len(idxs) < 2:
        continue
    # 사이에 같은 속성을 건드리는 다른 규칙이 있으면 합치지 않는다(캐스케이드가 바뀐다)
    mine = set()
    for i in idxs:
        mine |= props_of(rules[i][3])
    blocked = False
    for j in range(idxs[0] + 1, idxs[-1]):
        if j in idxs:
            continue
        if props_of(rules[j][3]) & mine:
            blocked = True
            break
    if blocked:
        continue
    # 속성별로 마지막 값이 이긴다
    props = {}
    order = []
    for i in idxs:
        for decl in rules[i][3].split(';'):
            if ':' not in decl:
                continue
            k, v = decl.split(':', 1)
            k = k.strip()
            if k not in props:
                order.append(k)
            props[k] = v.strip()
    body = ';'.join('%s:%s' % (k, props[k]) for k in order)
    last = idxs[-1]
    rules[last][3] = body
    for i in idxs[:-1]:
        drop.add(i)
    merged += 1
    removed += len(idxs) - 1

out = []
cur = 0
for idx, (a, b, sel, body) in enumerate(rules):
    out.append(work[cur:a])
    if idx in drop:
        pass                      # 앞쪽 중복 선언은 지운다
    else:
        out.append(sel + '{' + body + '}')
    cur = b
out.append(work[cur:])
res = ''.join(out)
res = re.sub(r'\n{3,}', '\n\n', res)
res = re.sub(r'\x01C(\d+)\x01', lambda k: comments[int(k.group(1))], res)

open(p, 'w', encoding='utf-8').write(res)
print('합친 선택자 %d개 · 지운 중복 선언 %d개' % (merged, removed))
print('크기 %d → %d bytes' % (len(css), len(res)))
