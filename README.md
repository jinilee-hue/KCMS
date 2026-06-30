# POLY KCMS — 학생 등록 화면 리디자인 시안

KCMS(학원관리시스템) **전면 개편에 앞서 레이아웃 방향을 선택**하기 위한 비교·검토용 시안 모음입니다.
대표 화면인 **학생 등록**을 두 가지 디자인 방향(A형/B형)으로 제작했고, 각각 데이터 가독성을 높인 변형본을 함께 둡니다.

- 🔗 **배포 (GitHub Pages)**: https://jinilee-hue.github.io/KCMS/
- 저장소: `jinilee-hue/KCMS`

---

## 화면 구성 (4종 + 인트로)

| 구분 | 경로 | 설명 |
|------|------|------|
| **인트로** | `index.html` | A/B 비교 진입 페이지 (썸네일·상세 비교표·변형본 링크) |
| **A형 (Teal Workbench)** | `A타입/학생 등록.dc.html` | 상단 탭 내비, 민트(#4FD1C5), 높은 정보 밀도 |
| **A형 가독성 변형** | `A타입-가독/학생 등록.dc.html` | A형 + 목록/메뉴 텍스트 **#18243f** 통일, 컴팩트 기본 |
| **B형 (Horizon)** | `B타입/학생 등록 (Horizon LEFT).dc.html` | 좌측 사이드바, 인디고(#4318FF), 카드·여백 대시보드형 |
| **B형 가독성 변형** | `B타입-가독/학생 등록 (Horizon LEFT).dc.html` | B형 + 목록/메뉴 텍스트 **#2b3674** 통일, 목록↔상세 리사이저 |

### 직접 링크
- A형: https://jinilee-hue.github.io/KCMS/A타입/학생%20등록.dc.html
- A형 변형: https://jinilee-hue.github.io/KCMS/A타입-가독/학생%20등록.dc.html
- B형: https://jinilee-hue.github.io/KCMS/B타입/학생%20등록%20(Horizon%20LEFT).dc.html
- B형 변형: https://jinilee-hue.github.io/KCMS/B타입-가독/학생%20등록%20(Horizon%20LEFT).dc.html

---

## 폴더 구조

```
KCMS/
├─ index.html                       # 인트로(비교) 페이지
├─ .nojekyll                        # _ds(언더스코어) 폴더가 Pages에 게시되게 함
├─ README.md                        # 이 문서
├─ poly-kcms-redesign-guideline.md  # 디자인 지침
├─ thumbs/                          # 인트로용 화면 썸네일 (a.png, b.png)
├─ A타입/        → support.js, 학생 등록.dc.html
├─ A타입-가독/   → support.js, 학생 등록.dc.html
├─ B타입/        → support.js, _ds/, 학생 등록 (Horizon LEFT).dc.html
└─ B타입-가독/   → support.js, _ds/, 학생 등록 (Horizon LEFT).dc.html
```

> 각 `.dc.html`은 같은 폴더의 `support.js`(React 런타임 + 자동 부팅)와, B형은 `_ds/`(Horizon 디자인시스템 토큰·번들)를 **상대경로**로 참조합니다. 폴더 구조를 유지해야 정상 동작합니다.

---

## 구현 기능 (공통)

- 검색 필터(상태·학번·레벨·학급), 커스텀 셀렉트·인라인 폼 입력
- 학생 목록 ↔ 상세 패널 연동, 상세 탭(기본·배정·출결·성적·수납·메모)
- 성적 차트(반평균 비교), 출결 캘린더, 상태 배지·페이지네이션
- 커스텀 오버레이 스크롤바, 작업 탭 닫기(✕)
- **신규 등록 모달**: 프로필 이미지 업로드 + 성별·학급·레벨 커스텀 셀렉트
- 태블릿 반응형 (A: 상세 패널 비율/터치 리사이즈, B: 사이드바 자동 축소·필터 그리드)

## 타입별 차이
- **A형**: 상단 가로 탭 + 메가메뉴, 목록+상세 분할(드래그 리사이즈), 민트 포인트, 평평한 Purity 스타일(색/테두리 hover)
- **B형**: 좌측 접이식 사이드바, 카드+슬라이드 상세, 인디고 포인트, hover 시 떠오르는 그림자(Horizon)

---

## 배포 / 재배포

수정 후 아래 한 줄로 재배포되고 1~2분 뒤 같은 URL에 반영됩니다.

```bash
git add -A && git commit -m "수정 내용" && git push
```

- GitHub Pages 설정: Settings → Pages → Deploy from a branch → `main` / `/(root)`
- 인트로 썸네일(`thumbs/`)은 정적 캡처입니다. 화면을 수정하면 헤드리스 Chrome으로 재캡처해야 최신 상태가 반영됩니다.
- 권장 환경: 데스크톱 Chrome
