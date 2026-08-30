# -*- coding: utf-8 -*-
"""공통 모달용 id 스코프 규칙을 화면 CSS 에서 뽑아 Kit 으로 옮긴다.

build-css.py 가 id 선택자를 버리도록 만들어져 있어서, 공통 모달(SMS·상담이력·
담당자 찾기 …)에 얹히던 보정 규칙이 Kit 에는 통째로 빠져 있었다.
그 결과 Kit 에서만 표 헤더가 흰 글자로 보이거나 여백이 달라 보였다.
"""
import kit, re

d = kit.load()
h = d['screens']['PCMS-SCR-ET-02-012_예비생 등록·관리_ui.html']
css = h[h.index('<style>') + 7: h.index('</style>')]   # 문서의 진짜 스타일 블록만(뒤쪽 </style> 은 인쇄용 JS 문자열 안)

# 중괄호를 품은 주석이 규칙 분해를 깨뜨리므로 먼저 자리표시자로 바꾼다
comments = []


def stash(m):
    comments.append(m.group(0))
    return '\x01C%d\x01' % (len(comments) - 1)


css2 = re.sub(r'/\*[\s\S]*?\*/', stash, css)


def unstash(t):
    return re.sub(r'\x01C(\d+)\x01', lambda k: comments[int(k.group(1))], t)


IDS = ['#staffPickModal', '#mcModal', '#mddBox', '#smsModal', '#smsAddModal',
       '#smsTplEditModal', '#shModal', '#memoModal', '#memoDetailModal']
CLS = ['spmTbl', 'spmRow', 'spmPager', 'spmFoot', 'mcModalWide', 'mcTableWrap',
       'mddBox', 'mddFormTable', 'mddInfoTable', 'shModalWide', 'shTableWrap',
       'shTable', 'smsModalWide', 'smsAddWide']

out = []
for m in re.finditer(r'([^{}]+)\{([^}]*)\}', css2):
    sel, body = m.group(1).strip(), m.group(2)
    sel_clean = re.sub(r'\x01C\d+\x01', '', sel).strip()
    if not sel_clean:
        continue
    if '<' in sel_clean or len(sel_clean) > 600:
        continue
    if any(k in sel_clean for k in IDS) or any(('.' + c) in sel_clean for c in CLS):
        out.append(unstash(sel_clean) + '{' + unstash(body).strip() + '}')

HEAD = '''/* ==========================================================================
   KCMS Design Kit — 공통 모달 보정 (modal-overrides.css)
   --------------------------------------------------------------------------
   SMS 발송 · 상담이력 · 담당자 찾기 같은 공통 모달은 스크립트가 자기 스타일을
   함께 주입한다. 화면에서는 그 위에 아래 보정 규칙이 얹혀 표 헤더 톤과 여백이
   다른 팝업과 같아지는데, common.css 는 id 선택자를 걸러내며 만들어져서 이
   규칙들이 빠져 있었다(= Kit 에서만 공통 모달이 달라 보이던 원인).
   화면 CSS 에서 그대로 옮겨 온 것이니 손으로 고치지 말 것. common.css 다음에 불러온다.
   ========================================================================== */

'''
p = 'kcms_probe/kit/styles/modal-overrides.css'
open(p, 'w', encoding='utf-8').write(HEAD + '\n'.join(out) + '\n')
print('추출한 규칙', len(out), '·', p)
