# -*- coding: utf-8 -*-
"""화면 CSS 에서 id 로 한정된 규칙만 빼고 전부 Kit 으로 옮긴다.
   (id 규칙 = 그 화면의 특정 요소 전용이라 재사용 불가)"""
import kit,re
d=kit.load(); v=d['screens']['PCMS-SCR-ET-02-012_예비생 등록·관리_ui.html']
css='\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', v, re.S))
# 주석 안에 중괄호가 들어 있으면(예: `.seg button{height:22px}` 를 설명하는 주석)
# 규칙 분해가 어긋나 주석 조각이 선택자로 튀어나온다. 파싱 전에 자리표시자로 치환한다.
COMMENTS=[]
def _stash(m):
    COMMENTS.append(m.group(0))
    return '\u0001C%d\u0001' % (len(COMMENTS)-1)
css=re.sub(r'/\*.*?\*/', _stash, css, flags=re.S)
rules=[]; i=0; n=len(css)
while i<n:
    at=css.find('@', i); br=css.find('{', i)
    if br<0: break
    if at>=0 and at<br:
        depth=0; j=css.find('{', at); k=j
        while k<n:
            if css[k]=='{': depth+=1
            elif css[k]=='}':
                depth-=1
                if depth==0: break
            k+=1
        rules.append(('AT','',css[at:k+1])); i=k+1; continue
    raw=css[i:br]
    ids=re.findall(r'\u0001C(\d+)\u0001', raw)
    com='\n'.join(COMMENTS[int(x)] for x in ids)
    sel=re.sub(r'\u0001C\d+\u0001','',raw).strip()
    end=css.find('}', br)
    if end<0: break
    body=re.sub(r'\u0001C(\d+)\u0001', lambda m: COMMENTS[int(m.group(1))], css[br+1:end]).strip()
    rules.append((sel,com,body)); i=end+1

def group(s):
    if s.startswith(':root'): return None
    if s in ('*','html','body') or s.startswith('*,'): return '기본'
    P=[('GNB · 상단바', r'topnav|\.brand|\.tabs|\.tab\b|tabbadge|\.dd\b|\.ddrow|\.ddcol|\.ddcat|\.dditem|\.ddbadge|\.ddnote|tabnav|contact|\.cn\b|\.cinfo|\.cdot|\.cstat|\.cnum|\.csep'),
       ('레이아웃 골격', r'\.app|\.lower|\.rail|\.ic\b|\.main|\.content|\.l2|\.rpane|\.lpane|\.resizer|\.grip'),
       ('히스토리 네비', r'bcbar|bcic|bctools|quotabar'),
       ('하단 작업 탭', r'worktabs|wtab|wtscroll|wtnav'),
       ('섹션 · 패널', r'sectit|\.panel|\.card|\.actions|\.toolbar|listhd|\.hdi|\.subbox|\.dpanel'),
       ('버튼', r'\.btn|\.ibtn|dclear|qbtn|helpbtn|\.xlsbtn'),
       ('배지', r'badge|statuspill|\.pill'),
       ('페이지네이션', r'paging|pgnav|pgnum|pgjump|pgsize|pgtotal|pgrefresh'),
       ('표', r'table|\.grid|tblwrap|board-wrap|\.req\b|sortable|sarrow|colmenu|cmicon|colresiz|rowchk|thterm|\.hascell|\.flabel|\.fbox|\.notetbl|\.stattbl|\.cntbl'),
       ('폼', r'finput|fselect|ftextarea|filters|iwrap|\.seg\b|csel|ftools|advrow|input\[|select|textarea|dateshadow|\.cell|\.frow|\.lbl'),
       ('모달', r'modal|mtab|\.helppop|\.helpwrap'),
       ('탭', r'ptab|stab|subtabs|quickpill|quickadmrow|view-tab|dtab|rssubtab'),
       ('토스트 · 피드백', r'kistoast|\.tip\b|emptynote|emptymsg|msgbanner'),
       ('날짜 선택', r'pcmsdp|\.cal\b|\.rcal'),
       ('스크롤바', r'scrollx|xbar|::-webkit-scrollbar|scrollbar')]
    for name,pat in P:
        if re.search(pat, s): return name
    return '화면 패턴'

out=["""/* ============================================================
   KCMS Design Kit — 컴포넌트 스타일 (common.css)

   손으로 다시 쓴 파일이 아닙니다. 기준 화면
   PCMS-SCR-ET-02-012 «예비생 등록·관리» 의 CSS 에서
   **id 로 한정된 규칙(그 화면 전용)만 빼고 전부** 원본 순서 그대로 옮겼습니다.

   · 같은 선택자가 여러 번 나오는 것은 뒤쪽 패치가 앞쪽을 덮는 구조입니다.
     순서를 바꾸면 결과가 달라지므로 재정렬하지 마세요.
   · 원본의 결정 근거 주석도 함께 옮겼습니다.

   tokens.css 를 먼저 로드하세요.
   ============================================================ */
"""]
prev=None; cnt=0
for r in rules:
    if r[0]=='AT':
        head=r[2].split('{')[0]
        g=group(head) or '기타'
        if g!=prev: out.append('\n/* ═══════ '+g+' ═══════ */'); prev=g
        out.append(r[2]); cnt+=1; continue
    sel,com,body=r
    if not sel: continue
    # 선택자 목록에서 id 로 한정된 조각만 버리고 나머지는 살린다
    parts=[x.strip() for x in sel.split(',') if x.strip() and '#' not in x]
    if not parts: continue
    sel=', '.join(parts)
    g=group(sel)
    if g is None: continue          # :root 는 tokens.css
    if g!=prev: out.append('\n/* ═══════ '+g+' ═══════ */'); prev=g
    if com: out.append(com)
    out.append(' '.join(sel.split())+'{'+body.strip()+'}'); cnt+=1
css_out='\n'.join(out)
css_out=re.sub(r'(\.kistoast[^\n{]*\{background:color-mix\(in srgb, [^ ]+ )92%(, transparent\);\})', r'\g<1>70%\2', css_out)
css_out=css_out.replace('backdrop-filter:blur(6px)','backdrop-filter:blur(10px)')
open('kcms_probe/kit/styles/common.css','w',encoding='utf-8').write(css_out)
print('common.css', len(css_out)//1024,'KB ·',cnt,'규칙')
from collections import Counter
c=Counter()
for r in rules:
    s=r[0] if r[0]!='AT' else r[2].split('{')[0]
    if '#' in s: continue
    g=group(s)
    if g: c[g]+=1
for k,vv in sorted(c.items()): print(f'  {k:16s}{vv}')

# ── 대시보드(01-001)에서 지표 계열 컴포넌트를 추가로 가져온다 ────────────────
def pull(screen, pats, title):
    v=kit.load()['screens'][screen]
    css='\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', v, re.S))
    rs=[]; i=0; n=len(css)
    while i<n:
        br=css.find('{', i)
        if br<0: break
        raw=css[i:br]
        com=re.findall(r'/\*.*?\*/', raw, re.S)
        sel=re.sub(r'/\*.*?\*/','',raw,flags=re.S).strip()
        end=css.find('}', br)
        if end<0: break
        body=css[br+1:end].strip()
        if sel and '@' not in sel:
            parts=[x.strip() for x in sel.split(',') if x.strip() and '#' not in x]
            if parts:
                sel2=', '.join(parts)
                skip=re.search(r'^\s*(\.content|\.panel\b|\.sectit|body|html|\*)', sel2)
                if not skip and any(re.search(pp, sel2) for pp in pats):
                    rs.append((sel2,'\n'.join(c.strip() for c in com),body))
        i=end+1
    out=['\n/* ═══════ '+title+' ═══════ */']
    for sel,com,body in rs:
        if com: out.append(com)
        out.append(' '.join(sel.split())+'{'+body+'}')
    return '\n'.join(out), len(rs)

add1,n1 = pull('PCMS-SCR-ET-01-001_예비생대시보드_ui.html',
  [r'\.kpi', r'\.stat-card', r'\.stat-row', r'\.bar\b', r'\.donut', r'\.chart-panel', r'\.chart-row',
   r'\.matrix', r'\.legend', r'\.sw\b', r'\.switch', r'\.toggle', r'\.vbar', r'\.hbar', r'\.pcts', r'\.citem'],
  '지표 · 차트 (예비생 대시보드 01-001 에서 추출)')
add2,n2 = pull('PCMS-SCR-ET-05-001_신학기 학급 편성_ui.html',
  [r'\.csel'], '커스텀 셀렉트 (반편성 05-001 에서 추출)')
with open('kcms_probe/kit/styles/common.css','a',encoding='utf-8') as f:
    f.write('\n'+add1+'\n'+add2+'\n')
print('추가: 지표·차트', n1, '규칙 · 커스텀 셀렉트', n2, '규칙')

# ── Kit 보강 컴포넌트 (별도 소스 파일) ────────────────────────────────
extra=open('kit_src/extras.css',encoding='utf-8').read()
with open('kcms_probe/kit/styles/common.css','a',encoding='utf-8') as f:
    f.write('\n'+extra)
print('보강 컴포넌트 추가:', extra.count('{'), '규칙')
