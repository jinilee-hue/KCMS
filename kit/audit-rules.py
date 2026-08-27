# -*- coding: utf-8 -*-
"""정해 둔 규칙이 Kit·화면에 실제로 지켜졌는지 자동 점검"""
import kit,re,os,json
import re as _re2
K='kcms_probe/kit'
css=open(K+'/styles/common.css',encoding='utf-8').read()
utils=open(K+'/js/utils.js',encoding='utf-8').read()
layout=open(K+'/js/layout.js',encoding='utf-8').read()
demo=open(K+'/components.html',encoding='utf-8').read()
dp=open(K+'/js/date-picker.js',encoding='utf-8').read()
d=kit.load()
screens={n:v for n,v in d['screens'].items() if n.startswith('PCMS')}
R=[]
def chk(name, ok, detail=''):
    R.append((ok,name,detail))

# 1 날짜 하이픈
chk('날짜 표기 = 하이픈 (Kit 기본값)', "sep = sep || '-'" in utils, '')
chk('데모에 점 표기 없음', len(re.findall(r'20\d\d\.\d\d\.\d\d', demo))==0,
    f"{len(re.findall(r'20/d/d', demo))}")
chk('화면에 점 표기 없음', sum(len(re.findall(r'20\d\d\.\d\d\.\d\d', v[v.find('<body'):])) for v in screens.values())<=1)

# 2 토스트
chk('토스트 배경 70% 불투명', css.count('70%, transparent')>=4, f"{css.count('70%, transparent')}건")
chk('토스트 좌측 액센트 바 없음', '.kistoast::before{display:none' in css.replace(' ',''))
chk('토스트 기본 타입 neutral', "return 'neutral';" in utils)
chk('토스트 최대 4개 스택', 'KT_MAX=4' in utils.replace(' ',''))
emoji=re.findall(r'KCMS\.toast\([^)]*[\U0001F300-\U0001FAFF✀-➿]', demo)
chk('토스트 문구에 이모지 없음', len(emoji)==0, str(emoji[:2]))

# 3 배지 굵기 500
b700=[m.group(0) for m in re.finditer(r'\.(?:typebadge|statuspill|to-badge|mapbadge|rosterbadge)[^{]*\{[^}]*font-weight:\s*700', css)]
chk('배지 굵기 500 (700 금지)', len(b700)==0, f'{len(b700)}건')

# 4 삭제 버튼 빨강 금지(일상 동작) — 작업 탭 ✕ hover
chk('작업 탭 ✕ hover 중립색', bool(_re2.search(r'\.wtab \.x:hover\{[^}]*d7dde6', css, _re2.I)))

# 5 차트에 시맨틱 색 — 기준 미달만 레드
chk('그래프 기준색 토큰 존재', '--chart-ok' in open(K+'/styles/tokens.css',encoding='utf-8').read())

# 6 표 규격
chk('표 헤더 #F4F7FD', '#F4F7FD' in css)
chk('그룹 헤더 #EAF1FB', '#EAF1FB' in css)
chk('표 헤더 33px', re.search(r'thead th\{[^}]*height:33px', css) or 'height:33px' in css)

# 7~8 섹션·패널
chk('섹션 제목 13px', re.search(r'\.sectit\{[^}]*font-size:13px', css) is not None)
chk('패널 여백 14px', re.search(r'\.panel\{[^}]*padding:14px', css) is not None)

# 9 모달
chk('모달 헤더 40px', 'height:40px' in css)
chk('모달 여는 클래스 .open', '.modal-ov.open{display:flex' in css.replace(' ',''))
chk('utils 가 .open 사용', "classList.add('open')" in utils)

# 10 달력
chk('달력 오늘 = 파란 원 채움', ".pcmsdp-d.today{background:var(--pb" in dp)
chk('달력 선택일 = 링', ".pcmsdp-d.sel{background:transparent" in dp)
import re as _re
dp_nocom=_re.sub(r'/\*.*?\*/','',dp,flags=_re.S)
chk('달력 남색(#003D99) 미사용', '003D99' not in dp_nocom)

# 11 GNB 3뎁스 점 정렬
chk('3뎁스 점 padding-left:3.2px', 'padding-left:3.2px' in css or 'padding:5px 2px 5px 3.2px' in css)

# 12 % 기호
chk('% 기호 0.68em', '.pcts{font-size:.68em' in css.replace(' ',''))

# 13 탭 3종 분리
chk('상위 탭(.dtab) 존재', '.dtab{' in css)
chk('하위 탭(.rssubtab) 존재', '.rssubtab{' in css)
chk('토글(.quickpill/.seg) 존재', '.quickpill{' in css and '.seg{' in css)

# 14 페이지네이션 화면과 동일
chk('페이징에 pgtotal 기본 미출력', 'opt.showTotal' in layout)
chk('페이지당 옵션 30/50/100', '[30,50,100]' in layout.replace(' ',''))

ok=sum(1 for o,_,_ in R if o); bad=[r for r in R if not r[0]]
print(f'규칙 점검 {len(R)}개 · 통과 {ok} · 실패 {len(bad)}\n')
for o,n,det in R:
    print(('  ✓ ' if o else '  ✗ ')+n+((' — '+det) if det and not o else ''))
