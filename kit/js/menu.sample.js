/* KCMS Design Kit — GNB 메뉴 · 좌측 레일 샘플 데이터
   실제 화면(PCMS)에서 쓰는 구조 그대로입니다. 프로젝트에 맞게 항목만 바꿔 쓰세요.
   href 가 있는 항목은 링크(<a>), 없으면 <div> 로 렌더링됩니다. */
var PCMS_GNB_MENU = {
  /* 2026-08-25 메뉴 정리: '입학관리' D1 삭제(사용자 지시).
     그 아래 있던 4개 화면(예비생정보 / MAP종합정보 / 예약표 / 응시료 납부 현황)은
     메뉴에서 제외하고 화면 자체는 그대로 둔다. */
  '입학관리':[
    {cat:'예비생 대시보드', items:[
      {label:'예비생 대시보드', href:'PCMS-SCR-ET-01-001_예비생대시보드_ui.html'}
    ]},
    {cat:'예비생 관리', items:[
      {label:'예비생 등록·관리', href:'PCMS-SCR-ET-02-012_예비생 등록·관리_ui.html'},
      {label:'설명회 예약자 현황', href:'PCMS-SCR-ET-02-010_설명회 예약자 현황_ui.html'}
    ]},
    {cat:'진학생 관리', items:[
      {label:'진학생 관리', href:'PCMS-SCR-ET-04-001_진학생관리_ui.html'}
    ]},
    {cat:'신학기 학급편성', items:[
      {label:'반편성 배치관리', href:'PCMS-SCR-ET-05-001_신학기 학급 편성_ui.html'}
    ]}
  ],
  '학생관리':[
    {cat:'학생정보', items:['학생등록','학생정보','학생이름변경']},
    {cat:'대기/휴학/탈퇴', items:['대기생','휴/탈퇴생']},
    {cat:'전학관리', items:['전입생','전출생']},
    {cat:'교재레벨', items:['교재레벨일괄변경']},
    {cat:'내신관리', items:['내신점수 입력','학생별 점수정보','시험별 점수분석','교과서 사용현황']}
  ],
  '학급관리':[
    {cat:'학급정보', items:['학급등록']},
    {cat:'학급배정', items:['학급배정','전체배정정보']},
    {cat:'개설반 현황', items:['반편성 현황관리']},
    {cat:'담임반 관리', items:['담임반 관리']},
    {cat:'시간표', items:['시간표 조회','시간표 등록','교시 설정','종합시간표']},
    {cat:'강의실', items:['강의실 등록']}
  ],
  '수업관리':[
    {cat:'출결', items:['출석']},
    {cat:'숙제', items:['숙제조회','숙제종합 조회']},
    {cat:'성적', items:['성적조회']}
  ],
  '도서관리':[
    {cat:'대시보드', items:['대시보드']},
    {cat:'대여/반납/미납', items:['대여','반납','미납']},
    {cat:'도서등록', items:['학원도서등록','본사도서등록요청']},
    {cat:'도서운영조회', items:['도서운영정보조회','학생별도서운영정보조회']},
    {cat:'독서지도', items:['최다대여도서','최다대여학생']}
  ],
  '수납회계':[
    {cat:'수납', items:['개인수납']},
    {cat:'청구', items:['일괄청구']},
    {cat:'수납종합조회', items:['납부내역조회','창구미납조회']},
    {cat:'수입/지출', items:['수입','지출','지출결재','수입지출','현금흐름표','손익제외금액 입력']},
    {cat:'결산(일일마감)', items:['결산(일일마감)','결산 마감 처리']},
    {cat:'수납현황', items:['e-POLY 등록현황']}
  ],
  '업무관리':[
    {cat:'마이페이지', items:['마이페이지']},
    {cat:'일정', items:['금일의 학원 업무']},
    {cat:'메모', items:['메모','메모 등록']},
    {cat:'담당학급', items:['담당학급']},
    {cat:'일일보고서', items:['일일보고서']}
  ],
  '행정관리':[
    {cat:'일정관리', items:['일정관리']},
    {cat:'SMS', items:['자동발송','발송예약','발송내역','수신거부 정보조회']},
    {cat:'셔틀 차량관리', items:['셔틀운행정보','노선 관리','운행 현황','학생 탑승 설정']},
    {cat:'게시판', items:['본사공지사항','직원게시판','자료실','본사업무지원']}
  ],
  '직원관리':[
    {cat:'운영현황 대시보드', items:['대시보드']},
    {cat:'통합 연차관리', items:['잔여 관리','연차 신청 관리','연차 직접입력','연차 캘린더']},
    {cat:'직원', items:['직원']},
    {cat:'급여', items:['급여정보','급여등록조회','개인급여명세서']},
    {cat:'사택', items:['사택계약등록/해약','사택임대관리','사택교체','월임대료관리']},
    {cat:'셔틀기사', items:['셔틀정보']},
    {cat:'H/R', items:['H/R']}
  ],
  '학원운영':[
    {cat:'학원운영보고', items:['학원업무일지','본사업무일지']},
    {cat:'Complaint', items:['Complaint']},
    {cat:'업무별조회', items:['MAP','상담','출결','숙제']},
    {cat:'분석자료', items:['학생상태분석','매출분석','학급현황','학생현황','학생현황(기준일자)']},
    {cat:'상담계획', items:['상담계획','상담건별조회','상담횟수조회']},
    {cat:'설명회', items:['설명회']}
  ],
  '홈페이지':[
    {cat:'메뉴관리', items:['차량 운행 정보']},
    {cat:'설문관리', items:['POLY 직원건강체크']}
  ]
};

var PCMS_GNB_TAB_BADGES = { '입학관리':'NEW' };

var PCMS_LEFT_RAIL_ITEMS = [
  {label:'HOME', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>'},
  {label:'즐겨찾기', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.3l5.9-.9z"/></svg>'},
  {label:'메모등록', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v12H8l-4 4z"/></svg>'},
  {label:'예약표', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>'},
  {label:'청구미납', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/></svg>'},
  {label:'셔틀', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="11" rx="2"/><path d="M3 11h18"/><circle cx="7.5" cy="16.5" r="1"/><circle cx="16.5" cy="16.5" r="1"/></svg>'},
  {label:'SYSTEM', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'},
  {label:'개인설정', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>'},
  {label:'LINK', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>'},
  {label:'쪽지함', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'},
  {label:'SR', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 13a8 8 0 0116 0"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/></svg>'},
  {label:'폴리봇', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01"/></svg>'},
  {label:'LOGOUT', svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>'}
];
