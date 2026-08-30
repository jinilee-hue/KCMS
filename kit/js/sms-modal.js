/*
 * PCMS 공용 "SMS 발송" 모달 컴포넌트
 *
 * 정본 문서(single source of truth): docs/screens/ET_입학관리/공통SMS발송모달_spec.md
 * 기능/문구/예외처리를 바꿀 때는 이 파일과 위 spec.md를 함께 갱신한다.
 *
 * 배경(2026-07-14 결정: docs/decisions/DECISION_LOG.md 참조):
 *  기존엔 PCMS-SCR-ET-02-001/002/010 세 화면의 ui.html에 "SMS 발송" 모달 마크업+로직이
 *  거의 동일하게 복사·붙여넣기되어 있었다. 그 결과 한 화면에서 발견된 버그를 고치고도
 *  다른 화면엔 반영되지 않아 화면마다 동작이 갈라지는 문제가 실제로 발생했다(ET-02-002는
 *  수정됐지만 ET-02-010은 동일 버그가 남아있던 사례 다수). 이 파일로 로직을 한 곳에 모아
 *  화면들은 <script src>로 불러쓰기만 하도록 리팩터링했다(gnb-sidebar.js와 동일 패턴).
 *
 * 2026-07-16 대개편 1차(결정: docs/decisions/DECISION_LOG.md 참조): 실제 KIS "SMS 발송 모달창"
 *  기능설명서 + 실제 작동 화면 스크린샷(총 19페이지)을 근거로 기능 격차를 전면 재검토하여
 *  아래 기능을 신규 추가/수정했다(상세 변경 사유는 spec.md 변경이력 v0.2 참조):
 *   - 헤더 SMS/LMS 잔여수량 배지, 발송대상 "전화번호"/"학부모 번호" 타입 체크박스
 *   - 대상추가 팝업: 4탭(학생/직원/거래처/셔틀기사, 학생 외 3탭은 준비중)+레벨 필터+페이지네이션
 *   - 장문(LMS) 전용 "제목" 입력란, 본문 "기호"(특수문자)/"항목"(변수태그) 삽입 도구
 *   - 단문 80Byte 초과 시 자동절삭/자동LMS전환 로직 제거(실제 KIS 관찰 결과 반영, 카운터만 표시)
 *   - "동일 번호 중복발송 방지" 안내문 추가, Excel 업로드/샘플다운로드 스플릿 버튼
 *   - 광고수신거부 검사 결과 팝업의 "거부대상 없음/있음" 2종 분기
 *   - "광고성 여부" 표시용 세그를 실제로 본문에 (광고)/무료수신거부 번호를 삽입하는 체크박스로 교체
 *
 * 2026-07-16 대개편 2차(레이아웃, 실제 KIS 스크린샷 근거): 1차 개편에서는 기능만 추가하고
 *  기존 단일 컬럼(세로 스택) 레이아웃을 그대로 썼으나, 실제 KIS 화면은 좌(발송대상 그리드)/
 *  우(발신 메시지 작성+상용구 목록) 2단 컬럼 구조임을 스크린샷으로 확인하여 레이아웃을 전면
 *  재구성했다. 주요 변경: ① 모달 폭 확장(640px→1020px). ② 좌측 컬럼 = 발송대상 툴바+수신자
 *  그리드(세로로 크게 확장, 기존 180px 고정 높이 제거)+안내문+Excel업로드/광고수신거부검사
 *  버튼. ③ 우측 컬럼 = 광고발송여부+전송유형+본문 작성 카드(연한 파란 배경, 기호/항목/바이트
 *  카운트가 카드 하단에 붙음)+보내기 버튼+SMS 상용구 "목록형 표"(기존엔 알약 버튼 나열 방식
 *  이었으나 실제 KIS는 구분/내용 2열 표 형태로 노출됨을 확인해 표로 교체). ④ 별도 "취소" 버튼
 *  제거(실제 화면에 노출되어 있지 않음 — 헤더 ✕로 닫기 기능 대체).
 *
 * 2026-07-20 UI 개선(요청, 상세는 spec.md v0.5~v0.8 참조): ① 대상추가/추가/삭제/Excel 업로드/
 *  광고수신거부 검사/관리·수정 6개 버튼에 아이콘 추가 + 삭제(빨강)·Excel(그린) 마우스오버 강조색
 *  적용. ② 좌(발송대상)/우(메시지 작성) 컬럼 폭을 가운데 드래그 핸들(#smsLayoutResizer)로 조절
 *  가능, 발송대상 목록(#smsRecipTbl)도 이름/학번/전화번호/학부모 전화번호/광고수신거부 5개 컬럼
 *  각각의 우측 경계(.colResizer)를 드래그해 폭 조절 가능(초과 시 `.tblwrap` 가로 스크롤). ③ "SMS
 *  상용구 관리" 팝업 목록에 구분 줄바꿈/내용 말줄임+툴팁/최대 240px 스크롤/행 호버 표출 규칙 정비.
 *
 * 2026-07-28 UI 개선(요청, 상세는 spec.md 참조): 좌/우 컬럼 드래그로 폭을 조절해도 본문 작성
 *  영역이 함께 늘어나거나 줄어들어 실제 학부모/학생 휴대폰에서 어떻게 줄바꿈되는지 가늠할 수
 *  없다는 지적에 따라, 본문 textarea를 폭 고정(200px) "폰 프레임"(.smsPhoneFrame, 어두운 베젤+
 *  노치) 안에 배치해 좌/우 리사이즈와 무관하게 항상 동일한 폭으로 줄바꿈이 표시되도록 개선.
 *  프레임이 우측 컬럼 최소폭보다 넓어지는 극단적인 경우에도 `.smsPhoneWrap`이 자체 가로
 *  스크롤을 갖도록 하여 레이아웃이 깨지지 않게 함(기존 KCMS의 "고정폭 미리보기 상자" 방식을
 *  참고해, 실제 폰 형태 프레임으로 한 단계 더 시각화).
 *
 * 빌드 스텝이 없는 정적 ui.html 목업이므로 ES module이 아닌 평범한 <script src> include로 동작한다.
 *
 * 사용법 — 각 화면의 </body> 직전, 화면 전용 <script> 보다 "먼저" 이 스크립트를 로드한 뒤:
  // 모달 창 이동(드래그)은 공용 컴포넌트 modal-drag.js가 담당한다(2026-08-14 전면 통합).
  // 구 구현(mousedown + position:fixed)은 마우스 전용이고 창이 화면 밖으로 대부분 빠져나갈 수 있어 폐기했다.
  // 상세·함정은 docs/design-system/interaction-patterns.md 패턴 4 참조.
 *   <script src="../../design-system/active/components/sms-modal.js"><\/script>
 *   <script>
 *     document.getElementById('smsBtn').addEventListener('click', function(){
 *       openSmsModal({
 *         senderOptions: [                                   // 발송자 선택 옵션(필수 권장)
 *           {value:'031-000-7800', label:'분당캠퍼스 (031-000-7800)', optOutNumber:'080-863-5433'},
 *           {value:'1588-7800', label:'고객센터 (1588-7800)'}
 *         ],
 *         remainingSms: 299984,                               // 헤더 SMS 잔여건수 배지(생략 시 배지 숨김)
 *         remainingLms: 913250,                               // 헤더 LMS 잔여건수 배지(생략 시 배지 숨김)
 *         adOptOutNumber: '080-000-0000',                     // 발신자별 optOutNumber 미지정 시 폴백값
 *         recipients: selectedRows.map(function(r){           // 모달 오픈 시 초기 수신자 목록
 *           return {no:r.studentNo, name:r.name, studentNo:r.studentNo, phone:'-', parentPhone:r.parentPhone};
 *         }),
 *         getAddCandidates: function(query){                  // "대상추가" 팝업(학생 탭)의 검색 대상 데이터
 *           var list = !query ? ROWS : ROWS.filter(function(r){ return r.name.indexOf(query) > -1; });
 *           return list.map(function(r){
 *             return {studentNo:r.studentNo, name:r.name, course:r.course, grade:r.grade, className:r.className,
 *                     phone:r.phone, parentPhone:r.parentPhone, status:r.regStatus};
 *           });
 *         },
 *         addPickerStatusLabel: '등록여부',                    // "대상추가" 팝업 상태 컬럼 헤더명(화면마다 다름)
 *         initialBodyText: null,                              // 지정 시 상용구 대신 이 문구로 본문 프리필(웰컴SMS 등)
 *         onSent: function(result){                           // 발송 완료 후 콜백(화면 자체 배지 갱신 등)
 *           updateSmsBadge();
 *         }
 *       });
 *     });
 *   <\/script>
 *
 * openSmsModal가 필요로 하는 CSS(각 화면 <style>에 이미 정의되어 있어야 함 — PCMS 전 화면 공통
 * 셸 스타일이므로 대부분 이미 있음. 없다면 함께 추가할 것):
 *   .modal-ov/.modal-ov.open, .modal-box, .modal-hd, .modal-x, .modal-body, .modal-foot,
 *   .frow/.frow .lbl, .finput/.fselect, .ftools, .btn/.btn.g/.btn.sm,
 *   .tblwrap, .recordtbl, .rowchk, .badge, .cntbadge, .warn-inline
 * 이 파일 자체가 <style id="smsModalStyles">로 자동 주입하는 것(다른 화면과 겹칠 일이 거의
 * 없는 SMS 모달 전용 클래스만): .seg, .smsfoot-note, .smsQuota, .smsTypeChk, .smsModalWide,
 * .sms-layout, .sms-left, .sms-right, .sms-resizer, .colResizer, .sms-composebox, .sms-comp-tools, .sms-tplsectit,
 * .sms-overlay, .sms-symbolgrid, .sms-fieldlist, .splitbtn, .splitdd, .smsExcelBtn, .smsDangerBtn,
 * .smsTplListWrap, .smsTplTypeCell, .smsTplTextCell, .tharrow,
 * .smsPhoneWrap, .smsPhoneFrame, .smsPhoneNotch, .smsPhoneScreen,
 * .addtabs, .addfilterrow, .addpageRow, .smsAddWide
 */

(function (global) {
  var DEFAULT_TEMPLATES = [
    { id: 't1', type: '입학테스트', text: '[POLY] 안녕하세요. 신입생 입학테스트 예약이 완료되었습니다.\n일시: 추후 문자 재안내\n테스트 시작 10분 전까지 등원해 주시기 바랍니다.' },
    { id: 't2', type: '등록안내', text: '[POLY] 안녕하세요. 등록 절차 안내드립니다. 첨부된 안내문을 확인하신 후 기한 내 등록을 완료해 주시기 바랍니다.' },
    { id: 't3', type: '설명회', text: '[POLY] 신입학 설명회 일정 안내드립니다.\n일시: 추후 문자 재안내\n참석을 진심으로 감사드립니다.' },
    { id: 't4', type: '대기순번', text: '[POLY] 안녕하세요. 현재 대기 순번 안내드립니다. 순번 변동 시 별도 안내드리겠습니다.' },
    { id: 't5', type: '웰컴', text: '[POLY] 안녕하세요. 폴리어학원 방문을 진심으로 환영합니다. 문의사항은 언제든 편하게 연락 주세요.' }
  ];

  var SMS_SYMBOLS = ['#', '&amp;', '*', '@', '§', '✥', '★', '○', '●', '◎', '◇', '◆', '□', '■', '△', '▲', '▽', '▼', '→', '←', '↑', '↓', '↔', '=', '◁', '◀', '▷', '▶', '♤', '♠', '♡', '♥', '♧', '♣'];
  var SMS_FIELDS = [
    { tag: '{KorName}', label: '수신자(한글): {KorName}' },
    { tag: '{EngName}', label: '수신자(영문): {EngName}' }
  ];
  var ADD_TABS = [
    { key: 'student', label: '학생' },
    { key: 'staff', label: '직원' },
    { key: 'vendor', label: '거래처' },
    { key: 'shuttle', label: '셔틀기사' }
  ];
  var ADD_PAGE_SIZE = 100;

  var _built = false;
  var _state = {
    recipients: [],        // {no,name,studentNo,phone,parentPhone,optOut,selected,manual}
    templates: [],
    addSelected: {},        // studentNo -> true (대상추가 팝업 내 선택 상태, 페이지 이동해도 유지)
    addList: [],            // 대상추가 팝업의 "현재 페이지" 렌더 목록
    addFiltered: [],         // 대상추가 팝업의 필터링된 전체 목록(페이지네이션 이전)
    addTab: 'student',
    addPage: 1,
    tplEditingId: null,
    sortCol: null,           // 발송대상 목록 정렬 컬럼(name/studentNo/phone/parentPhone/optOut), null=정렬 안함
    sortDir: 1,              // 1=오름차순, -1=내림차순
    getAddCandidates: function () { return []; },
    addPickerStatusLabel: '상태',
    adOptOutNumber: '080-000-0000',
    remainingSms: null,
    remainingLms: null,
    onSent: null
  };

  function injectStyles() {
    if (document.getElementById('smsModalStyles')) return;
    var style = document.createElement('style');
    style.id = 'smsModalStyles';
    style.textContent =
      '.seg{display:inline-flex;border:1px solid var(--line);border-radius:3px;overflow:hidden;width:100%;}' +
      '.seg button{flex:1;height:26px;border:none;background:#fff;font-size:12px;color:var(--txt-mut);cursor:pointer;border-right:1px solid var(--line);}' +
      '.seg button:last-child{border-right:none;}' +
      '.seg button.on{background:var(--pb);color:#fff;font-weight:700;}' +
      '.smsfoot-note{font-size:11px;color:var(--txt-mut);}' +
      '.smsQuota{display:inline-flex;align-items:center;height:19px;padding:0 8px;border-radius:999px;font-size:10px;font-weight:700;margin-left:8px;white-space:nowrap;}' +
      '.smsQuota.sms{background:#ff3b8d;color:#fff;}' +
      '.smsQuota.lms{background:#e6483c;color:#fff;}' +
      '.smsTypeChk{display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--txt);margin-right:10px;cursor:pointer;user-select:none;}' +
      '.smsTypeChk input{width:14px;height:14px;cursor:pointer;}' +
      // 2026-07-28: "크기 확대"를 고정폭 확장(1020→1220px 등)으로만 처리했다가, 사용자가 직접
      // 가로/세로로 드래그해 크기를 조절하고 싶어한다는 피드백에 따라 네이티브 CSS resize를 추가.
      // min/max-width·height가 드래그 가능한 하한/상한이 되며, 우측 하단 모서리를 드래그하면 된다.
      '.smsModalWide{width:1220px;min-width:760px;max-width:97vw;height:90vh;min-height:480px;max-height:97vh;resize:both;overflow:auto;}' +
      '.sms-layout{display:flex;gap:0;flex:1;min-height:0;}' +
      '.sms-left{flex:1;min-width:260px;display:flex;flex-direction:column;min-height:0;}' +
      '.sms-right{flex:0 0 336px;min-width:220px;display:flex;flex-direction:column;min-height:0;}' +
      '.sms-resizer{flex:0 0 13px;position:relative;cursor:col-resize;}' +
      /* 구분선을 모달 본문 위/아래 끝까지 늘린다(2026-08-24 요청) — .sms-layout 이 .modal-body 의
         padding(14px) 안쪽에서 시작·끝나 선 위아래로 14px 흰 여백이 남아 있었다(실측: layout 144~840,
         modal-body 130~854). 그 padding 만큼 음수 offset 으로 빼내 선이 본문 경계에 맞붙게 한다. */
      '.sms-resizer::after{content:"";position:absolute;top:-14px;bottom:-14px;left:50%;width:1px;margin-left:-1px;background:var(--line);}' +
      '.sms-resizer:hover::after,.sms-resizer.dragging::after{width:3px;margin-left:-1.5px;background:var(--pb);}' +
      /* 좌우 분할 그립: 화면(.resizer .grip)과 동일 규격 — 14x46, radius 7, 흰 배경 + 라인 보더 + 블루 아이콘 */
      '.sms-resizer .grip{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:46px;'+
        'display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid var(--line);'+
        'border-radius:7px;color:var(--pb-deeper);box-shadow:0 1px 4px rgba(15,40,90,.16);z-index:1;}' +
      '.sms-resizer:hover .grip,.sms-resizer.dragging .grip{border-color:var(--pb);color:var(--pb);}' +
      '#smsRecipTbl th{position:relative;}' +
      '.colResizer{position:absolute;top:0;right:-3px;width:6px;height:100%;cursor:col-resize;z-index:3;}' +
      '.colResizer:hover,.colResizer.dragging{background:var(--pb-a15);}' +
      '.smsTplListWrap{max-height:240px;overflow-y:auto;overflow-x:hidden;}' +
      '#smsTplListTbl{table-layout:fixed;}' +
      '#smsTplListTbl thead th{position:sticky;top:0;z-index:1;}' +
      '#smsTplListTbl td.smsTplTypeCell{white-space:normal;word-break:break-word;text-align:center;}' +
      '#smsTplListTbl td.smsTplTextCell{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
      '#smsTplListBody tr{transition:background-color .15s ease;}' +
      '#smsTplListBody tr:hover{background:#f8fafc;}' +
      // 2026-07-28: 핸드폰 표출(폰 프레임) 영역이 잘리는 문제를 flex-grow:3으로 고쳤더니, 반대로
      // 모달을 세로로 키우거나 기본 화면에서도 이 영역이 남는 공간을 전부 흡수해 무한정 커지면서
      // 아래 "SMS 상용구" 목록이 보이지 않는 문제가 새로 생김. 폰 프레임은 "잘리지 않을 만큼만"
      // 고정 높이(450px, flex-grow 없음)로 못박고, 모달을 세로로 키울 때 늘어나는 여유 공간은
      // 전부 아래 상용구 목록(.tblwrap, flex-grow:1)이 가져가도록 역할을 분리.
      '.sms-composebox{background:#f4f6fa;border:1px solid var(--line);border-radius:5px;padding:8px;display:flex;flex-direction:column;flex:0 0 auto;height:450px;}' +
      '.sms-comp-tools{display:flex;align-items:center;gap:6px;margin-top:4px;flex:0 0 auto;}' +
      '.sms-comp-tools .smsfoot-note{margin-left:auto;}' +
      /* 셀 위에 떠 있는 스크롤 표시 — 네이티브 스크롤바는 레이아웃 폭을 8px 먹어
         표가 파란 상단선까지 닿지 못하므로 숨기고, 이 썸을 절대배치로 얹는다. */
      /* 공통 오버레이 막대(overlay-scroll.js 의 .ovbar)와 겹쳐 막대가 두 개로 보였다 —
   이 모달 자체 막대는 감추고 공통 막대 하나만 쓴다(2026-08-29). */
      '.ovscroll{display:none !important;position:absolute;top:0;right:1px;width:6px;pointer-events:none;z-index:4;}' +
      '.ovscroll .ovthumb{position:absolute;left:0;width:6px;border-radius:3px;\n         background:rgba(44,62,90,.32);opacity:0;transition:opacity .18s;}' +
      '.ovscroll.on .ovthumb{opacity:1;}' +
      // 2026-07-28: 좌/우 컬럼 드래그로 리사이즈해도 문구 표출 폭이 같이 변해 실제 수신 화면(폰) 대비
      // 줄바꿈을 가늠할 수 없다는 지적에 따라, 아래 "폰 프레임" 영역은 고정 폭(200px)으로 두고
      // .smsPhoneWrap이 넘치는 경우에만 자체 가로 스크롤되도록 분리(§10 참조, spec.md 동기화).
      '.smsPhoneWrap{flex:1;min-height:0;overflow:auto;display:flex;justify-content:center;padding:6px 4px;}' +
      '.smsPhoneFrame{box-sizing:border-box;flex:0 0 auto;width:200px;background:#111826;border-radius:20px;padding:7px 6px;box-shadow:0 4px 14px rgba(0,20,60,.2);display:flex;flex-direction:column;}' +
      '.smsPhoneNotch{flex:0 0 auto;width:40px;height:4px;border-radius:2px;background:#333c4d;margin:0 auto 6px;}' +
      '.smsPhoneScreen{box-sizing:border-box;background:#e8ecf3;border-radius:13px;padding:8px;display:flex;flex:1;min-height:320px;}' +
      '.smsPhoneScreen textarea{box-sizing:border-box;flex:1;width:100%;background:var(--pb-light);border:1px solid var(--pb-a15);border-radius:12px 12px 12px 3px;resize:none;font-family:inherit;font-size:11px;line-height:1.45;color:var(--txt);padding:8px 9px;}' +
      '.smsPhoneScreen textarea:focus{outline:none;border-color:var(--pb);}' +
      '.sms-tplsectit{display:flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#2C3E5A;margin:8px 0 4px;flex:0 0 auto;}' +
      '.sms-tplsectit .car{color:var(--pb);font-size:9px;}' +
      '#smsTplSelectBody tr{cursor:pointer;}' +
      '#smsTplSelectBody tr.on{background:var(--pb-light);}' +
      '#smsTplSelectBody tr:hover{background:#f2f6fc;}' +
      '.sms-overlay{display:none;margin-top:6px;border:1px solid var(--line);border-radius:5px;background:#fff;padding:8px;box-shadow:0 4px 14px rgba(0,40,100,.12);flex:0 0 auto;}' +
      '.sms-overlay.open{display:block;}' +
      '.sms-symbolgrid{display:grid;grid-template-columns:repeat(8,1fr);gap:4px;}' +
      '.sms-symbolgrid button{height:24px;border:1px solid var(--line-soft);border-radius:3px;background:#fff;cursor:pointer;font-size:13px;line-height:1;}' +
      '.sms-symbolgrid button:hover{background:var(--pb-light);}' +
      '.sms-fieldlist button{display:block;width:100%;text-align:left;padding:6px 8px;border:none;background:none;cursor:pointer;font-size:12px;border-radius:3px;}' +
      '.sms-fieldlist button:hover{background:var(--pb-light);}' +
      '.splitbtn{position:relative;display:inline-block;}' +
      '.splitdd{display:none;position:absolute;bottom:100%;left:0;margin-bottom:4px;background:#fff;border:1px solid var(--line);border-radius:3px;box-shadow:0 4px 14px rgba(0,40,100,.16);min-width:120px;overflow:hidden;z-index:5;}' +
      '.splitdd.open{display:block;}' +
      '.splitdd button{display:block;width:100%;text-align:left;padding:7px 10px;border:none;background:#fff;font-size:12px;color:var(--txt);cursor:pointer;}' +
      '.splitdd button:hover{background:var(--pb-light);color:var(--pb-deeper);}' +
      '.smsAddWide{width:820px;max-width:94vw;}' +
      '.addtabs{display:flex;align-items:center;gap:6px;margin-bottom:8px;}' +
      /* 하위탭(.quickpill)과 같은 알약 버튼으로 통일(2026-08-29 요청) */
      '.addtabs button{height:24px;padding:0 12px;border:1px solid var(--line);border-radius:999px;background:#fff;font-size:11px;color:var(--txt-mut);cursor:pointer;white-space:nowrap;}' +
      '.addtabs button:hover{border-color:var(--pb);color:var(--pb);}' +
      '.addtabs button.on{background:var(--pb);border-color:var(--pb);color:#fff;font-weight:700;}' +
      '.addtabs button.on:hover{color:#fff;}' +
      '.addfilterrow{display:flex;gap:6px;align-items:center;flex-wrap:wrap;}' +
      '.addfilterrow select,.addfilterrow input{width:auto;}' +
      '.addpageRow{display:flex;align-items:center;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--txt-mut);}' +
      '.addpageNav{display:flex;align-items:center;gap:4px;}' +
      '.addpageNav button{height:22px;padding:0 8px;border:1px solid var(--line);border-radius:3px;background:#fff;cursor:pointer;font-size:11px;color:var(--txt);}' +
      '.addpageNav button:hover{border-color:var(--pb);color:var(--pb);}' +
      '.addpageNav span{padding:0 4px;font-weight:700;color:var(--txt);}' +
      '.btn.sm svg{flex:0 0 auto;}' +
      '.smsExcelBtn:hover{border-color:#2C3E5A;color:#2C3E5A;}' +
      '.smsDangerBtn:hover{border-color:var(--danger);color:var(--danger);}' +
      '#smsRecipTbl th[data-sort]{cursor:pointer;user-select:none;}' +
      '#smsRecipTbl th[data-sort]:hover{color:var(--pb);}' +
      /* 정렬 화살표는 공통 .tharrow 규칙(16×16, 13px)이 정한다 — 여기선 여백만 */
      '#smsRecipTbl thead th .tharrow{margin-left:2px;}' +
      '';
    document.head.appendChild(style);
  }

  function buildDom() {
    if (_built) return;
    injectStyles();

    var html =
      '<div class="modal-ov" id="smsModal">' +
        '<div class="modal-box smsModalWide">' +
          '<div class="modal-hd">SMS 발송 창' +
            '<span class="smsQuota sms" id="smsQuotaSms" style="display:none;">SMS : 0</span>' +
            '<span class="smsQuota lms" id="smsQuotaLms" style="display:none;">LMS : 0</span>' +
            '<button class="modal-x" id="smsClose">✕</button>' +
          '</div>' +
          /* 발송자 선택줄은 흰 콘텐츠 박스 위(밖)로 — 검색 영역과 같은 방식(2026-08-24 요청) */
          '<div class="smsSenderRow"><span class="lbl">발송자</span><select class="fselect" id="smsSender" style="width:220px;"></select></div>' +
          '<div class="modal-body" style="display:flex;flex-direction:column;">' +
            '<div class="sms-layout">' +
              '<div class="sms-left">' +
                '<div class="ftools" style="justify-content:flex-start;flex-wrap:wrap;margin:0 0 8px;flex:0 0 auto;">' +
                  '<span class="lbl" style="margin:0 6px 0 0;">발송대상<span class="cntbadge" id="smsRecipCount" style="background:var(--pb-light);color:var(--pb-deeper);">0</span></span>' +
                  '<label class="smsTypeChk"><input type="checkbox" id="smsTargetPhone">전화번호</label>' +
                  '<label class="smsTypeChk"><input type="checkbox" id="smsTargetParentPhone" checked>학부모 번호</label>' +
                  '<button class="btn g sm" id="smsAddFromListBtn" style="margin-left:auto;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="7" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>대상추가</button>' +
                  '<button class="btn g sm" id="smsAddManualBtn"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>추가</button>' +
                  '<button class="btn g sm smsDangerBtn" id="smsDelSelBtn"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>삭제</button>' +
                '</div>' +
                '<div class="tblwrap" style="flex:1;min-height:0;">' +
                  '<table class="recordtbl" id="smsRecipTbl" style="table-layout:fixed;width:588px;">' +
                    '<thead><tr>' +
                      '<th style="width:26px;"><input type="checkbox" class="rowchk" id="smsRecipChkAll"></th>' +
                      '<th style="width:26px;">No</th>' +
                      '<th style="width:160px;" data-sort="name">이름<span class="tharrow">▾</span><span class="colResizer"></span></th>' +
                      '<th style="width:70px;" data-sort="studentNo">학번<span class="tharrow">▾</span><span class="colResizer"></span></th>' +
                      '<th style="width:100px;" data-sort="phone">전화번호<span class="tharrow">▾</span><span class="colResizer"></span></th>' +
                      '<th style="width:106px;" data-sort="parentPhone">학부모 전화번호<span class="tharrow">▾</span><span class="colResizer"></span></th>' +
                      '<th style="width:100px;" data-sort="optOut">광고수신거부<span class="tharrow">▾</span><span class="colResizer"></span></th>' +
                    '</tr></thead>' +
                    '<tbody id="smsRecipBody"></tbody>' +
                  '</table>' +
                '</div>' +
                '<div class="smsfoot-note" style="flex:0 0 auto;margin-top:6px;">발송 시 수신거부 등록자는 자동 제외되며, 대상/거부 인원이 결과 팝업으로 안내됩니다.</div>' +
                '<div class="smsfoot-note" style="flex:0 0 auto;">동일한 내용으로 동일한 번호에 발송 시 1회만 발송됩니다.</div>' +
                '<div style="flex:0 0 auto;display:flex;justify-content:space-between;align-items:center;margin-top:8px;">' +
                  '<div class="splitbtn" id="smsExcelSplit">' +
                    '<button class="btn g sm smsExcelBtn" id="smsExcelMainBtn" type="button"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2C3E5A" stroke-width="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v3h16v-3"/></svg>Excel 업로드 ▴</button>' +
                    '<div class="splitdd" id="smsExcelDD">' +
                      '<button type="button" data-act="upload">업로드</button>' +
                      '<button type="button" data-act="sample">샘플다운로드</button>' +
                    '</div>' +
                  '</div>' +
                  '<button class="btn g sm" id="smsOptOutCheckBtn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>광고수신거부 전화번호 검사</button>' +
                '</div>' +
              '</div>' +
              '<div class="sms-resizer" id="smsLayoutResizer" title="너비 조절">' +
                '<div class="grip"><svg width="6" height="20" viewBox="0 0 6 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M2 3v14M4 3v14"/></svg></div>' +
              '</div>' +
              '<div class="sms-right">' +
                /* 단문·장문 탭과 광고 발송 여부를 한 줄에 (2026-08-24 요청) */
                '<div class="smsTypeRow">' +
                  '<div class="seg" id="smsTypeSeg"><button class="on" data-v="SMS">단문</button><button data-v="LMS">장문</button></div>' +
                  '<label class="smsTypeChk"><input type="checkbox" id="smsAdCheckbox">광고 발송 여부</label>' +
                '</div>' +
                '<input class="finput" id="smsTitleInput" placeholder="제목을 입력하세요." style="display:none;margin-bottom:6px;flex:0 0 auto;">' +
                '<div class="sms-composebox">' +
                  '<div class="smsPhoneWrap">' +
                    '<div class="smsPhoneFrame">' +
                      '<div class="smsPhoneNotch"></div>' +
                      '<div class="smsPhoneScreen"><textarea id="smsBody"></textarea></div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="sms-comp-tools">' +
                    '<button class="btn g sm" id="smsSymbolBtn" type="button">기호</button>' +
                    '<button class="btn g sm" id="smsFieldBtn" type="button">항목</button>' +
                    '<span class="smsfoot-note" id="smsByteCount">0 Byte / 80 Byte (단문)</span>' +
                  '</div>' +
                '</div>' +
                '<div class="sms-overlay" id="smsSymbolPanel"><div class="sms-symbolgrid">' +
                  SMS_SYMBOLS.map(function (s) { return '<button type="button">' + s + '</button>'; }).join('') +
                '</div></div>' +
                '<div class="sms-overlay" id="smsFieldPanel"><div class="sms-fieldlist">' +
                  SMS_FIELDS.map(function (f) { return '<button type="button" data-tag="' + f.tag + '">' + f.label + '</button>'; }).join('') +
                '</div></div>' +
                '<button class="btn" id="smsSendBtn" style="width:100%;justify-content:center;margin-top:8px;flex:0 0 auto;">보내기</button>' +
                '<div class="sms-tplsectit"><span class="sms-tpltxt">SMS 상용구</span><button class="btn g sm" id="smsTplManageBtn" style="margin-left:auto;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>관리/수정</button></div>' +
                '<div class="tblwrap" style="flex:1 1 auto;min-height:80px;">' +
                  '<table class="recordtbl" id="smsTplSelectTbl"><thead><tr><th style="width:60px;">구분</th><th>내용</th></tr></thead><tbody id="smsTplSelectBody"></tbody></table>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<input type="file" id="smsExcelFileInput" accept=".xlsx,.xls" style="display:none;">' +
        '</div>' +
      '</div>' +

      '<div class="modal-ov" id="smsAddModal">' +
        '<div class="modal-box smsAddWide">' +
          '<div class="modal-hd">발송 대상 추가<button class="modal-x" id="smsAddClose">✕</button></div>' +
          /* 탭·검색줄은 흰 콘텐츠 박스 위(밖)로 — 다른 팝업과 같은 구조(2026-08-24 요청) */
          /* 탭 + 검색을 한 줄에 (2026-08-24 요청) */
          '<div class="addtoprow">' +
          '<div class="addtabs" id="smsAddTabs">' +
          ADD_TABS.map(function (t, i) { return '<button type="button" data-tab="' + t.key + '"' + (i === 0 ? ' class="on"' : '') + '>' + t.label + '</button>'; }).join('') +
          '</div>' +
          '<div class="addfilterrow" id="smsAddFilterRow">' +
          '<select class="fselect" id="smsAddLevelSel" style="width:130px;"><option value="">전체 레벨</option></select>' +
          '<input class="finput" id="smsAddSearch" placeholder="학생명 검색" style="width:170px;">' +
          '<button class="btn g sm" id="smsAddSearchBtn">검색</button>' +
          '</div>' +
          '</div>' +
          '<div class="modal-body">' +
            /* 건수는 표 바로 위(흰 박스 안) — 다른 팝업과 같은 위치(2026-08-24 요청) */
            '<div class="shCount" id="smsAddTotalCount"></div>' +
            '<div class="tblwrap" style="max-height:260px;margin-top:8px;">' +
              '<table class="recordtbl" id="smsAddTbl">' +
                '<thead><tr id="smsAddHeadRow">' +
                  '<th style="width:26px;"><input type="checkbox" class="rowchk" id="smsAddChkAll"></th>' +
                  '<th style="width:70px;">과정</th><th style="width:70px;">레벨</th><th style="width:100px;">학급</th>' +
                  '<th>학생명</th><th style="width:100px;">전화번호</th><th style="width:112px;">학부모전화</th>' +
                  '<th style="width:100px;" id="smsAddStatusHead">상태</th>' +
                '</tr></thead>' +
                '<tbody id="smsAddBody"></tbody>' +
              '</table>' +
            '</div>' +
            /* 본문 목록(예비생 등록·관리)의 페이징과 같은 구조·클래스 사용(2026-08-24 요청) */
            '<div class="paging" id="smsAddPaging"></div>' +
            '</div>' +
          '</div>' +
          '<div class="modal-foot"><button class="btn g" id="smsAddCancelBtn">취소</button><button class="btn" id="smsAddConfirmBtn">적용</button></div>' +
        '</div>' +
      '</div>' +

      '<div class="modal-ov" id="smsOptOutModal">' +
        '<div class="modal-box">' +
          '<div class="modal-hd">광고수신거부 검사 완료<button class="modal-x" id="smsOptOutClose">✕</button></div>' +
          '<div class="modal-body">' +
            '<div id="smsOptOutSimple" style="text-align:center;padding:34px 10px;font-size:13px;color:var(--txt);">확인결과 수신거부 대상 번호가 없습니다.</div>' +
            '<div id="smsOptOutCard">' +
              '<div style="display:flex;gap:22px;justify-content:center;padding:10px 0;">' +
                '<div style="text-align:center;"><div style="font-size:11px;color:var(--txt-mut);font-weight:700;">총 검사 대상</div><div style="font-size:22px;font-weight:700;color:var(--txt);" id="smsOptOutTotal">0명</div></div>' +
                '<div style="text-align:center;"><div style="font-size:11px;color:var(--danger);font-weight:700;">수신거부 발견</div><div style="font-size:22px;font-weight:700;color:var(--danger);" id="smsOptOutCount">0명</div></div>' +
              '</div>' +
              '<div class="warn-inline">수신 거부로 확인된 대상자는 발송 목록에서 체크가 자동 해제되었으며, 수신거부 열에 표시됩니다.</div>' +
            '</div>' +
          '</div>' +
          '<div class="modal-foot"><button class="btn" id="smsOptOutOkBtn">확인</button></div>' +
        '</div>' +
      '</div>' +

      '<div class="modal-ov" id="smsTplEditModal">' +
        '<div class="modal-box">' +
          '<div class="modal-hd">SMS 상용구 관리<button class="modal-x" id="smsTplEditClose">✕</button></div>' +
          '<div class="modal-body">' +
            '<div class="smsTplListWrap"><table class="recordtbl" id="smsTplListTbl"><thead><tr><th style="width:90px;">구분</th><th>내용</th><th style="width:96px;">관리</th></tr></thead><tbody id="smsTplListBody"></tbody></table></div>' +
            '<div class="frow" style="margin-top:10px;">' +
              '<span class="lbl" id="smsTplFormTitle">신규 상용구 추가</span>' +
              '<input class="finput" id="smsTplTypeInput" placeholder="구분 (예: 입학안내)" style="margin-bottom:6px;">' +
              '<textarea class="ftextarea" id="smsTplTextInput" placeholder="상용구 내용을 입력하세요."></textarea>' +
            '</div>' +
          '</div>' +
          '<div class="modal-foot">' +
            '<button class="btn g" id="smsTplFormCancelBtn" style="display:none;">편집취소</button>' +
            '<button class="btn g" id="smsTplEditCloseBtn">닫기</button>' +
            '<button class="btn" id="smsTplSaveBtn">저장</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);
    bindEvents();
    bindSmsLayoutResizer();
    bindSmsColResizers();
    _built = true;
  }

  function smsByteLength(str) {
    var bytes = 0;
    for (var i = 0; i < str.length; i++) { bytes += str.charCodeAt(i) > 127 ? 2 : 1; }
    return bytes;
  }

  function isLmsMode() {
    return document.querySelector('#smsTypeSeg button[data-v="LMS"]').classList.contains('on');
  }

  function updateSmsByteCount() {
    var isLms = isLmsMode();
    var max = isLms ? 2000 : 80;
    var bodyEl = document.getElementById('smsBody');
    var body = bodyEl.value;
    var bytes = smsByteLength(body);
    // 2026-07-16: 실제 KIS 관찰 결과, 단문(SMS)은 80Byte를 초과해도 입력을 막거나 자동 절삭/자동 장문전환을
    // 하지 않고 카운터만 초과 값을 그대로 표시한다(§9-6 참조, 실제 발송 시 제한 적용 여부는 §17 참조).
    // 장문(LMS)의 2000Byte 상한만 안전장치로 강제 절삭을 유지한다.
    if (isLms && bytes > max) {
      body = body.slice(0, max / 2);
      while (smsByteLength(body) > max) body = body.slice(0, -1);
      bodyEl.value = body;
      bytes = smsByteLength(body);
    }
    var el = document.getElementById('smsByteCount');
    el.textContent = bytes + ' Byte / ' + max + ' Byte (' + (isLms ? '장문' : '단문') + ')';
    el.style.color = bytes > max ? 'var(--danger)' : '';
  }

  function toggleSmsTitleVisibility() {
    document.getElementById('smsTitleInput').style.display = isLmsMode() ? '' : 'none';
  }

  function insertAtCursor(ta, text) {
    var start = ta.selectionStart == null ? ta.value.length : ta.selectionStart;
    var end = ta.selectionEnd == null ? ta.value.length : ta.selectionEnd;
    var val = ta.value;
    ta.value = val.slice(0, start) + text + val.slice(end);
    var pos = start + text.length;
    ta.selectionStart = ta.selectionEnd = pos;
    ta.focus();
    updateSmsByteCount();
  }

  function currentOptOutNumber() {
    var sel = document.getElementById('smsSender');
    var opt = sel.selectedOptions && sel.selectedOptions[0];
    var fromOption = opt && opt.getAttribute('data-optout');
    return fromOption || _state.adOptOutNumber || '080-000-0000';
  }
  var AD_PREFIX = '(광고) ';
  function adSuffixText() { return '\n무료수신거부 ' + currentOptOutNumber(); }
  function applyAdToggle(checked) {
    var ta = document.getElementById('smsBody');
    var body = ta.value;
    var suffix = adSuffixText();
    if (checked) {
      if (body.indexOf(AD_PREFIX) !== 0) body = AD_PREFIX + body;
      // 발신자 변경으로 접미 번호가 달라졌을 수 있으므로, 형태가 같은 기존 접미(번호만 다름)를 먼저 제거
      body = body.replace(/\n무료수신거부 [0-9-]+$/, '');
      body = body + suffix;
    } else {
      if (body.indexOf(AD_PREFIX) === 0) body = body.slice(AD_PREFIX.length);
      body = body.replace(/\n무료수신거부 [0-9-]+$/, '');
    }
    ta.value = body;
    updateSmsByteCount();
  }

  function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function renderSmsTplTable() {
    var body = document.getElementById('smsTplSelectBody');
    if (!_state.templates.length) { body.innerHTML = '<tr><td colspan="2" style="text-align:center;color:var(--txt-mut);">등록된 상용구가 없습니다.</td></tr>'; return; }
    body.innerHTML = _state.templates.map(function (t) {
      return '<tr data-id="' + t.id + '" title="' + escAttr(t.text) + '"><td class="wr">' + esc(t.type) + '</td><td>' + esc(t.text.replace(/\n/g, ' ')) + '</td></tr>';
    }).join('');
  }
  function findSmsTpl(id) { return _state.templates.filter(function (t) { return t.id === id; })[0]; }

  function updateSmsRecipCount() {
    var n = _state.recipients.filter(function (r) { return r.selected; }).length;
    document.getElementById('smsRecipCount').textContent = n;
  }
  function syncSmsRecipChkAll() {
    var chkAll = document.getElementById('smsRecipChkAll');
    chkAll.checked = _state.recipients.length > 0 && _state.recipients.every(function (r) { return !!r.selected; });
  }
  function renderSmsRecipients() {
    var body = document.getElementById('smsRecipBody');
    if (!_state.recipients.length) {
      body.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--txt-mut);">발송 대상이 없습니다. \'대상추가\' 또는 \'추가\' 버튼으로 등록해 주세요.</td></tr>';
      updateSmsRecipCount();
      syncSmsRecipChkAll();
      return;
    }
    body.innerHTML = _state.recipients.map(function (r, idx) {
      return '' +
        '<tr data-idx="' + idx + '">' +
          '<td class="wr"><input type="checkbox" class="rowchk" data-idx="' + idx + '" data-f="selected" ' + (r.selected ? 'checked' : '') + '></td>' +
          '<td class="wr">' + (idx + 1) + '</td>' +
          '<td>' + (r.manual ? '<input class="gridinput" data-idx="' + idx + '" data-f="name" value="' + r.name + '" placeholder="이름 직접 입력">' : r.name) + '</td>' +
          '<td class="wr">' + (r.studentNo || '-') + '</td>' +
          '<td class="wr">' + (r.manual ? '<input class="gridinput" data-idx="' + idx + '" data-f="phone" value="' + r.phone + '" placeholder="연락처">' : (r.phone || '-')) + '</td>' +
          '<td class="wr">' + (r.manual ? '<input class="gridinput" data-idx="' + idx + '" data-f="parentPhone" value="' + r.parentPhone + '" placeholder="학부모 연락처">' : (r.parentPhone || '-')) + '</td>' +
          '<td class="wr">' + (r.optOut === '수신거부' ? '<span class="badge" style="background:var(--danger-bg);color:var(--danger);">수신거부</span>' : '') + '</td>' +
        '</tr>';
    }).join('');
    updateSmsRecipCount();
    syncSmsRecipChkAll();
  }

  function renderSmsSortArrows() {
    document.querySelectorAll('#smsRecipTbl th[data-sort]').forEach(function (th) {
      var arrow = th.querySelector('.tharrow');
      var field = th.dataset.sort;
      var on = (_state.sortCol === field);
      arrow.textContent = '▾';                       // 글리프는 하나 — 방향은 .up 회전으로
      arrow.classList.toggle('on', on);
      arrow.classList.toggle('up', on && _state.sortDir === 1);
    });
  }
  function sortSmsRecipients(field) {
    _state.sortDir = _state.sortCol === field ? -_state.sortDir : 1;
    _state.sortCol = field;
    var dir = _state.sortDir;
    _state.recipients.sort(function (a, b) {
      return String(a[field] || '').localeCompare(String(b[field] || ''), 'ko') * dir;
    });
    renderSmsSortArrows();
    renderSmsRecipients();
  }

  function currentAddQuery() { return document.getElementById('smsAddSearch').value.trim(); }
  // 탭별 표 헤더. 학생만 학사 정보를 쓰고, 직원·거래처·셔틀기사는 같은 컬럼을 공유한다.
  var ADD_COLS = {
    student: [
      { w: 70, label: '과정' }, { w: 70, label: '레벨' }, { w: 100, label: '학급' },
      { w: 0,  label: '학생명' }, { w: 100, label: '전화번호' }, { w: 112, label: '학부모전화' },
      { w: 100, label: '상태', id: 'smsAddStatusHead' }
    ],
    other: [
      { w: 120, label: '소속' }, { w: 90, label: '구분' },
      { w: 0,   label: '이름' }, { w: 120, label: '휴대폰' }, { w: 100, label: '상태' }
    ]
  };
  function addColsFor(tab) { return ADD_COLS[tab === 'student' ? 'student' : 'other']; }
  function renderAddHead(tab) {
    var row = document.getElementById('smsAddHeadRow');
    if (!row) return;
    // 첫 칸(전체선택 체크박스)은 그대로 둔다 — 이벤트가 buildDom 시점에 한 번만 바인딩된다.
    while (row.children.length > 1) row.removeChild(row.lastElementChild);
    row.insertAdjacentHTML('beforeend', addColsFor(tab).map(function (c) {
      return '<th' + (c.w ? ' style="width:' + c.w + 'px;"' : '') + (c.id ? ' id="' + c.id + '"' : '') + '>' + c.label + '</th>';
    }).join(''));
    if (tab === 'student' && _state.addPickerStatusLabel) {
      var sh = document.getElementById('smsAddStatusHead');
      if (sh) sh.textContent = _state.addPickerStatusLabel;
    }
  }

  function addTabLabel(key) { var t = ADD_TABS.filter(function (x) { return x.key === key; })[0]; return t ? t.label : key; }

  function populateAddLevelOptions() {
    var sel = document.getElementById('smsAddLevelSel');
    var full = _state.getAddCandidates('') || [];
    var levels = [];
    full.forEach(function (r) {
      var v = r.grade || r.level;
      if (v && levels.indexOf(v) === -1) levels.push(v);
    });
    sel.innerHTML = '<option value="">전체 레벨</option>' + levels.map(function (v) { return '<option value="' + escAttr(v) + '">' + v + '</option>'; }).join('');
  }

  // 본문 목록 페이징과 동일한 마크업(.pgnav / .pgnum / .pgtotal). 창이 좁으니 번호는 5개까지.
  function renderAddPagination(total, page, totalPages) {
    var el = document.getElementById('smsAddPaging');
    if (!el) return;
    var start = total ? (page - 1) * ADD_PAGE_SIZE + 1 : 0;
    var end = Math.min(total, page * ADD_PAGE_SIZE);
    var winEnd = Math.min(totalPages, Math.max(5, page + 2));
    var winStart = Math.max(1, winEnd - 4);
    var nums = '';
    for (var p = winStart; p <= winEnd; p++) {
      nums += '<button type="button" class="pgnum' + (p === page ? ' on' : '') + '" data-p="' + p + '">' + p + '</button>';
    }
    el.innerHTML =
      '<button type="button" class="pgnav" data-go="first" title="처음"' + (page <= 1 ? ' disabled' : '') + '>&laquo;</button>' +
      '<button type="button" class="pgnav" data-go="prev" title="이전"' + (page <= 1 ? ' disabled' : '') + '>&lsaquo;</button>' +
      nums +
      '<button type="button" class="pgnav" data-go="next" title="다음"' + (page >= totalPages ? ' disabled' : '') + '>&rsaquo;</button>' +
      '<button type="button" class="pgnav" data-go="last" title="끝"' + (page >= totalPages ? ' disabled' : '') + '>&raquo;</button>' +
      /* 본문 목록 페이징과 같은 구성으로 — 페이지 직접입력 · 새로고침 · 페이지당(2026-08-29 요청) */
      '<span class="pgjump">페이지 <input type="number" class="pgpage" min="1" max="' + totalPages + '" value="' + page + '"> / ' + totalPages + '</span>' +
      '<button type="button" class="pgnav" data-go="refresh" title="새로고침">' +
        '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg></button>' +
      '<span class="pgsize">페이지당 <select class="pgsizesel" aria-label="페이지당 표시 개수">' +
        [30, 50, 100].map(function (n) { return '<option value="' + n + '"' + (n === ADD_PAGE_SIZE ? ' selected' : '') + '>' + n + '</option>'; }).join('') +
      '</select></span>';
    var cnt = document.getElementById('smsAddTotalCount');
    if (cnt) cnt.innerHTML = '전체 <b>' + total.toLocaleString() + '</b>건';
    el.querySelectorAll('.pgnum').forEach(function (b) {
      b.addEventListener('click', function () { _state.addPage = Number(b.dataset.p); renderSmsAddList(); });
    });
    el.querySelectorAll('.pgnav').forEach(function (b) {
      b.addEventListener('click', function () {
        var g = b.dataset.go;
        if (g === 'refresh') { renderSmsAddList(); return; }
        if (g === 'first') _state.addPage = 1;
        else if (g === 'prev') _state.addPage = Math.max(1, _state.addPage - 1);
        else if (g === 'next') _state.addPage = Math.min(totalPages, _state.addPage + 1);
        else _state.addPage = totalPages;
        renderSmsAddList();
      });
    });
    var jump = el.querySelector('.pgpage');
    if (jump) {
      var go = function () {
        var p = Math.min(totalPages, Math.max(1, Number(jump.value) || 1));
        _state.addPage = p; renderSmsAddList();
      };
      jump.addEventListener('change', go);
      jump.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    }
    var sizeSel = el.querySelector('.pgsizesel');
    if (sizeSel) sizeSel.addEventListener('change', function () {
      ADD_PAGE_SIZE = Number(sizeSel.value) || 100;
      _state.addPage = 1;
      renderSmsAddList();
    });
  }

  function renderSmsAddList() {
    renderAddHead(_state.addTab);
    var _cols = addColsFor(_state.addTab).length + 1;   // 전체선택 칸 포함
    if (_state.addTab !== 'student') {
      // 직원·거래처·셔틀기사는 같은 컬럼 구성을 공유한다. 검색줄·표·페이징 구조는 학생 탭과 동일하고,
      // 데이터 연동만 없으므로 표 안에 공통 빈 상태 행으로 안내한다(2026-08-24 요청).
      document.getElementById('smsAddFilterRow').style.display = '';
      document.getElementById('smsAddBody').innerHTML = '<tr><td colspan="' + _cols + '" class="reslist-empty">준비 중인 기능입니다. (' + addTabLabel(_state.addTab) + ' 대상 추가는 추후 지원 예정)</td></tr>';
      document.getElementById('smsAddChkAll').checked = false;
      _state.addList = [];
      _state.addFiltered = [];
      renderAddPagination(0, 1, 1);
      return;
    }
    document.getElementById('smsAddFilterRow').style.display = '';
    var q = currentAddQuery();
    var full = _state.getAddCandidates(q) || [];
    var lvl = document.getElementById('smsAddLevelSel').value;
    var filtered = lvl ? full.filter(function (r) { return (r.grade || r.level) === lvl; }) : full;
    _state.addFiltered = filtered;
    var totalPages = Math.max(1, Math.ceil(filtered.length / ADD_PAGE_SIZE));
    if (_state.addPage > totalPages) _state.addPage = totalPages;
    if (_state.addPage < 1) _state.addPage = 1;
    var startIdx = (_state.addPage - 1) * ADD_PAGE_SIZE;
    var pageList = filtered.slice(startIdx, startIdx + ADD_PAGE_SIZE);
    _state.addList = pageList;
    var body = document.getElementById('smsAddBody');
    if (!pageList.length) {
      body.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--txt-mut);">표시할 데이터가 없습니다.</td></tr>';
    } else {
      body.innerHTML = pageList.map(function (r) {
        return '<tr>' +
          '<td class="wr"><input type="checkbox" class="rowchk" data-no="' + r.studentNo + '" ' + (_state.addSelected[r.studentNo] ? 'checked' : '') + '></td>' +
          '<td class="wr">' + (r.course || '-') + '</td>' +
          '<td class="wr">' + (r.grade || r.level || '-') + '</td>' +
          '<td class="wr">' + (r.className || '-') + '</td>' +
          '<td>' + r.name + '</td>' +
          '<td class="wr">' + (r.phone || '-') + '</td>' +
          '<td class="wr">' + (r.parentPhone || '-') + '</td>' +
          '<td class="wr">' + (r.status || '-') + '</td>' +
        '</tr>';
      }).join('');
    }
    document.getElementById('smsAddChkAll').checked = pageList.length > 0 && pageList.every(function (r) { return !!_state.addSelected[r.studentNo]; });
    renderAddPagination(filtered.length, _state.addPage, totalPages);
  }

  function resetSmsTplForm() {
    _state.tplEditingId = null;
    document.getElementById('smsTplTypeInput').value = '';
    document.getElementById('smsTplTextInput').value = '';
    document.getElementById('smsTplFormTitle').textContent = '신규 상용구 추가';
    document.getElementById('smsTplFormCancelBtn').style.display = 'none';
  }
  function renderSmsTplList() {
    var body = document.getElementById('smsTplListBody');
    if (!_state.templates.length) { body.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--txt-mut);">등록된 상용구가 없습니다.</td></tr>'; return; }
    body.innerHTML = _state.templates.map(function (t) {
      var flatText = t.text.replace(/\n/g, ' ');
      return '<tr>' +
        '<td class="smsTplTypeCell">' + esc(t.type) + '</td>' +
        '<td class="smsTplTextCell" title="' + escAttr(flatText) + '">' + esc(flatText) + '</td>' +
        '<td class="wr"><button class="btn g sm" data-act="edit" data-id="' + t.id + '">편집</button> <button class="btn g sm" data-act="del" data-id="' + t.id + '">삭제</button></td>' +
      '</tr>';
    }).join('');
  }

  function downloadSmsSampleFile() {
    // mock 한계: 실제 .xlsx 바이너리가 아니라 플레인 텍스트(CSV형)를 .xlsx 확장자로 내려받는다.
    // 빌드 스텝 없는 정적 목업 특성상 실제 엑셀 라이브러리 없이 재현한 것 — 실제 개발 시 서버에서
    // 진짜 SMSTargetUpload2.xlsx(시트명 "SMS등록폼")를 내려주도록 교체 필요(§17 참조).
    var content = 'NO,*Name,*MEMBER_CODE,*Phone_Number\r\n1,홍길동,123456789,010-1234-1234\r\n\r\n' +
      '※ 표가 표시된 항목은 필수 입력사항입니다. 필수사항 중 빈칸이 있으면 업로드 되지 않습니다.\r\n' +
      '※ 휴대폰 번호는 -로 구분하여 입력해 주십시오.\r\n';
    var blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'SMSTargetUpload2.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // 상용구 표 래퍼에 "떠 있는" 세로 스크롤 표시를 붙인다(네이티브 스크롤바는 숨김 상태).
  function attachOverlayScroll(wrap) {
    if (!wrap || wrap._ovs) return;
    wrap._ovs = true;
    wrap.style.position = 'relative';
    var bar = document.createElement('div');
    bar.className = 'ovscroll';
    bar.innerHTML = '<div class="ovthumb"></div>';
    wrap.appendChild(bar);
    var thumb = bar.firstChild;
    function sync() {
      var ch = wrap.clientHeight, sh = wrap.scrollHeight;
      if (sh <= ch + 1) { bar.classList.remove('on'); return; }
      bar.classList.add('on');
      bar.style.height = ch + 'px';
      bar.style.top = wrap.scrollTop + 'px';           // 스크롤해도 제자리에 떠 있게
      var h = Math.max(24, Math.round(ch * ch / sh));
      thumb.style.height = h + 'px';
      thumb.style.top = Math.round((ch - h) * (wrap.scrollTop / (sh - ch))) + 'px';
    }
    wrap.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    if (window.MutationObserver) new MutationObserver(sync).observe(wrap, { childList: true, subtree: true });
    setTimeout(sync, 0);
  }

  function bindEvents() {
    // 네이티브 스크롤바를 숨긴 대신, SMS 계열 팝업의 모든 표 래퍼에 떠 있는 스크롤 표시를 붙인다
    ['smsModal', 'smsAddModal', 'smsTplEditModal'].forEach(function (id) {
      var mo = document.getElementById(id);
      if (mo) mo.querySelectorAll('.tblwrap').forEach(attachOverlayScroll);
    });
    document.getElementById('smsRecipBody').addEventListener('change', function (e) {
      var el = e.target;
      var idx = el.dataset.idx, f = el.dataset.f;
      if (idx === undefined || !f) return;
      var rec = _state.recipients[idx];
      if (!rec) return;
      rec[f] = f === 'selected' ? el.checked : el.value;
      if (f === 'selected') { updateSmsRecipCount(); syncSmsRecipChkAll(); }
    });
    document.getElementById('smsRecipChkAll').addEventListener('change', function () {
      var on = this.checked;
      _state.recipients.forEach(function (r) { r.selected = on; });
      renderSmsRecipients();
    });
    document.querySelector('#smsRecipTbl thead').addEventListener('click', function (e) {
      if (e.target.closest('.colResizer')) return;
      var th = e.target.closest('th[data-sort]'); if (!th) return;
      sortSmsRecipients(th.dataset.sort);
    });
    document.getElementById('smsAddManualBtn').addEventListener('click', function () {
      _state.recipients.push({ no: 'manual_' + Date.now(), name: '', studentNo: '-', phone: '', parentPhone: '', optOut: '', selected: true, manual: true });
      renderSmsRecipients();
    });
    document.getElementById('smsDelSelBtn').addEventListener('click', function () {
      var before = _state.recipients.length;
      _state.recipients = _state.recipients.filter(function (r) { return !r.selected; });
      if (_state.recipients.length === before) { alert('선택된 발송 대상이 없습니다.'); return; }
      renderSmsRecipients();
    });

    // ---- 대상추가 팝업 ----
    document.getElementById('smsAddFromListBtn').addEventListener('click', function () {
      _state.addSelected = {};
      _state.addTab = 'student';
      _state.addPage = 1;
      document.getElementById('smsAddSearch').value = '';
      document.getElementById('smsAddStatusHead').textContent = _state.addPickerStatusLabel;
      document.getElementById('smsAddChkAll').checked = false;
      document.querySelectorAll('#smsAddTabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === 'student'); });
      populateAddLevelOptions();
      renderSmsAddList();
      document.getElementById('smsAddModal').classList.add('open');
    });
    document.getElementById('smsAddTabs').addEventListener('click', function (e) {
      var btn = e.target.closest('button'); if (!btn) return;
      _state.addTab = btn.dataset.tab;
      _state.addPage = 1;
      document.querySelectorAll('#smsAddTabs button').forEach(function (b) { b.classList.toggle('on', b === btn); });
      if (_state.addTab === 'student') populateAddLevelOptions();
      renderSmsAddList();
    });
    document.getElementById('smsAddSearch').addEventListener('input', function () { _state.addPage = 1; renderSmsAddList(); });
    document.getElementById('smsAddSearchBtn').addEventListener('click', function () { _state.addPage = 1; renderSmsAddList(); });
    document.getElementById('smsAddLevelSel').addEventListener('change', function () { _state.addPage = 1; renderSmsAddList(); });
    document.getElementById('smsAddBody').addEventListener('change', function (e) {
      var chk = e.target.closest('.rowchk'); if (!chk) return;
      if (chk.checked) _state.addSelected[chk.dataset.no] = true; else delete _state.addSelected[chk.dataset.no];
      document.getElementById('smsAddChkAll').checked = _state.addList.length > 0 && _state.addList.every(function (r) { return !!_state.addSelected[r.studentNo]; });
    });
    document.getElementById('smsAddChkAll').addEventListener('change', function () {
      var on = this.checked;
      _state.addList.forEach(function (r) { if (on) _state.addSelected[r.studentNo] = true; else delete _state.addSelected[r.studentNo]; });
      renderSmsAddList();
    });
    document.getElementById('smsAddClose').addEventListener('click', function () { document.getElementById('smsAddModal').classList.remove('open'); });
    document.getElementById('smsAddCancelBtn').addEventListener('click', function () { document.getElementById('smsAddModal').classList.remove('open'); });
    document.getElementById('smsAddConfirmBtn').addEventListener('click', function () {
      var nos = Object.keys(_state.addSelected);
      if (!nos.length) { alert('추가할 대상을 선택해 주세요.'); return; }
      nos.forEach(function (no) {
        var exists = _state.recipients.some(function (r) { return r.no === no; });
        if (exists) return;
        var cand = _state.addFiltered.filter(function (r) { return r.studentNo === no; })[0];
        if (!cand) return;
        _state.recipients.push({ no: no, name: cand.name, studentNo: cand.studentNo, phone: cand.phone || '-', parentPhone: cand.parentPhone || '', optOut: '', selected: true, manual: false });
      });
      document.getElementById('smsAddModal').classList.remove('open');
      renderSmsRecipients();
    });

    // ---- 광고수신거부 검사 ----
    document.getElementById('smsOptOutCheckBtn').addEventListener('click', function () {
      if (!_state.recipients.length) { alert('검사할 발송 대상이 없습니다.'); return; }
      var optOutCount = 0;
      _state.recipients.forEach(function (r) {
        var target = (r.parentPhone || r.phone || '').replace(/-/g, '');
        var last = target.slice(-1);
        if (last === '4' || last === '8' || last === '0') { r.optOut = '수신거부'; r.selected = false; optOutCount++; }
        else { r.optOut = '수신동의'; }
      });
      renderSmsRecipients();
      var simple = document.getElementById('smsOptOutSimple');
      var card = document.getElementById('smsOptOutCard');
      if (optOutCount === 0) {
        simple.style.display = '';
        card.style.display = 'none';
      } else {
        simple.style.display = 'none';
        card.style.display = '';
        document.getElementById('smsOptOutTotal').textContent = _state.recipients.length + '명';
        document.getElementById('smsOptOutCount').textContent = optOutCount + '명';
      }
      document.getElementById('smsOptOutModal').classList.add('open');
    });
    document.getElementById('smsOptOutClose').addEventListener('click', function () { document.getElementById('smsOptOutModal').classList.remove('open'); });
    document.getElementById('smsOptOutOkBtn').addEventListener('click', function () { document.getElementById('smsOptOutModal').classList.remove('open'); });

    // ---- SMS 상용구 선택(본문에 반영) ----
    document.getElementById('smsTplSelectBody').addEventListener('click', function (e) {
      var tr = e.target.closest('tr[data-id]'); if (!tr) return;
      this.querySelectorAll('tr').forEach(function (r) { r.classList.remove('on'); });
      tr.classList.add('on');
      var tpl = findSmsTpl(tr.dataset.id);
      document.getElementById('smsBody').value = tpl ? tpl.text : '';
      if (document.getElementById('smsAdCheckbox').checked) applyAdToggle(true);
      updateSmsByteCount();
    });

    // ---- SMS 상용구 관리(CRUD) ----
    document.getElementById('smsTplManageBtn').addEventListener('click', function () {
      resetSmsTplForm();
      renderSmsTplList();
      document.getElementById('smsTplEditModal').classList.add('open');
    });
    document.getElementById('smsTplEditClose').addEventListener('click', function () { document.getElementById('smsTplEditModal').classList.remove('open'); });
    document.getElementById('smsTplEditCloseBtn').addEventListener('click', function () { document.getElementById('smsTplEditModal').classList.remove('open'); });
    document.getElementById('smsTplListBody').addEventListener('click', function (e) {
      var btn = e.target.closest('button'); if (!btn) return;
      var id = btn.dataset.id, tpl = findSmsTpl(id);
      if (!tpl) return;
      if (btn.dataset.act === 'edit') {
        _state.tplEditingId = id;
        document.getElementById('smsTplTypeInput').value = tpl.type;
        document.getElementById('smsTplTextInput').value = tpl.text;
        document.getElementById('smsTplFormTitle').textContent = '상용구 편집';
        document.getElementById('smsTplFormCancelBtn').style.display = '';
      } else if (btn.dataset.act === 'del') {
        _state.templates = _state.templates.filter(function (t) { return t.id !== id; });
        if (_state.tplEditingId === id) resetSmsTplForm();
        renderSmsTplList();
        renderSmsTplTable();
      }
    });
    document.getElementById('smsTplFormCancelBtn').addEventListener('click', resetSmsTplForm);
    document.getElementById('smsTplSaveBtn').addEventListener('click', function () {
      var type = document.getElementById('smsTplTypeInput').value.trim();
      var text = document.getElementById('smsTplTextInput').value.trim();
      if (!type || !text) { alert('구분과 내용을 모두 입력해 주세요.'); return; }
      if (_state.tplEditingId) {
        var tpl = findSmsTpl(_state.tplEditingId);
        tpl.type = type; tpl.text = text;
      } else {
        _state.templates.push({ id: 't' + Date.now(), type: type, text: text });
      }
      resetSmsTplForm();
      renderSmsTplList();
      renderSmsTplTable();
    });

    // ---- 본문 보조 도구(기호/항목) ----
    document.getElementById('smsSymbolBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      document.getElementById('smsFieldPanel').classList.remove('open');
      document.getElementById('smsSymbolPanel').classList.toggle('open');
    });
    document.getElementById('smsFieldBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      document.getElementById('smsSymbolPanel').classList.remove('open');
      document.getElementById('smsFieldPanel').classList.toggle('open');
    });
    document.getElementById('smsSymbolPanel').addEventListener('click', function (e) {
      e.stopPropagation();
      var btn = e.target.closest('button'); if (!btn) return;
      insertAtCursor(document.getElementById('smsBody'), btn.textContent);
    });
    document.getElementById('smsFieldPanel').addEventListener('click', function (e) {
      e.stopPropagation();
      var btn = e.target.closest('button'); if (!btn) return;
      insertAtCursor(document.getElementById('smsBody'), btn.dataset.tag);
    });

    // ---- Excel 업로드 스플릿 버튼 ----
    document.getElementById('smsExcelMainBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      document.getElementById('smsExcelDD').classList.toggle('open');
    });
    document.getElementById('smsExcelDD').addEventListener('click', function (e) {
      var btn = e.target.closest('button'); if (!btn) return;
      document.getElementById('smsExcelDD').classList.remove('open');
      if (btn.dataset.act === 'upload') document.getElementById('smsExcelFileInput').click();
      else downloadSmsSampleFile();
    });
    document.getElementById('smsExcelFileInput').addEventListener('change', function () {
      var f = this.files && this.files[0];
      this.value = '';
      if (!f) return;
      alert('"' + f.name + '" 업로드가 접수되었습니다.\n(이 목업에서는 실제 Excel 파싱을 수행하지 않습니다 — 실제 개발 시 서버 파싱 연동 필요)');
    });
    document.addEventListener('click', function () {
      document.getElementById('smsExcelDD').classList.remove('open');
      document.getElementById('smsSymbolPanel').classList.remove('open');
      document.getElementById('smsFieldPanel').classList.remove('open');
    });

    // ---- 광고 발송 여부 / 발신자 변경 ----
    document.getElementById('smsAdCheckbox').addEventListener('change', function () { applyAdToggle(this.checked); });
    document.getElementById('smsSender').addEventListener('change', function () {
      if (document.getElementById('smsAdCheckbox').checked) { applyAdToggle(false); applyAdToggle(true); }
    });

    // ---- 발송 ----
    document.getElementById('smsClose').addEventListener('click', function () { document.getElementById('smsModal').classList.remove('open'); });
    document.getElementById('smsSendBtn').addEventListener('click', function () {
      var wantPhone = document.getElementById('smsTargetPhone').checked;
      var wantParent = document.getElementById('smsTargetParentPhone').checked;
      if (!wantPhone && !wantParent) { alert('발송할 전화번호 종류(전화번호/학부모 번호)를 1개 이상 선택해주세요.'); return; }
      if (!document.getElementById('smsBody').value.trim()) { alert('발송할 메시지 내용을 입력해주세요.'); return; }
      if (!_state.recipients.length) { alert('발송 대상으로 지정된 전화번호가 없거나 체크가 해제되어 있습니다.'); return; }
      // 발송 확정 전 광고수신거부 여부를 재검사(이미 검사된 대상은 유지) — 검사 없이 바로 발송해도 수신거부자가 누락되지 않도록 보장
      _state.recipients.forEach(function (r) {
        if (r.optOut === '수신거부' || r.optOut === '수신동의') return;
        var target = (r.parentPhone || r.phone || '').replace(/-/g, '');
        var last = target.slice(-1);
        if (last === '4' || last === '8' || last === '0') { r.optOut = '수신거부'; r.selected = false; }
        else { r.optOut = '수신동의'; }
      });
      renderSmsRecipients();
      var selectedCnt = _state.recipients.filter(function (r) { return r.selected; }).length;
      var optOutCnt = _state.recipients.filter(function (r) { return r.optOut === '수신거부'; }).length;
      if (!selectedCnt) { alert('발송 대상으로 지정된 전화번호가 없거나 체크가 해제되어 있습니다.'); return; }
      var senderSel = document.getElementById('smsSender');
      var senderLabel = senderSel.options[senderSel.selectedIndex] ? senderSel.options[senderSel.selectedIndex].text : '';
      var typeLabel = (wantPhone && wantParent) ? '전화번호+학부모 번호' : (wantPhone ? '전화번호' : '학부모 번호');
      var isLmsFinal = isLmsMode();
      if (isLmsFinal && _state.remainingLms != null) {
        _state.remainingLms = Math.max(0, _state.remainingLms - selectedCnt);
        document.getElementById('smsQuotaLms').textContent = 'LMS : ' + _state.remainingLms.toLocaleString();
      } else if (!isLmsFinal && _state.remainingSms != null) {
        _state.remainingSms = Math.max(0, _state.remainingSms - selectedCnt);
        document.getElementById('smsQuotaSms').textContent = 'SMS : ' + _state.remainingSms.toLocaleString();
      }
      alert('[' + senderLabel + '] 발송 대상 ' + selectedCnt + '명(' + typeLabel + ') / 수신거부 제외 ' + optOutCnt + '명으로 발송이 완료되었습니다.');
      document.getElementById('smsModal').classList.remove('open');
      if (typeof _state.onSent === 'function') {
        _state.onSent({
          selectedCount: selectedCnt, optOutCount: optOutCnt, senderLabel: senderLabel,
          targetTypes: { phone: wantPhone, parentPhone: wantParent },
          isLms: isLmsFinal, title: isLmsFinal ? document.getElementById('smsTitleInput').value : ''
        });
      }
    });
    document.getElementById('smsBody').addEventListener('input', updateSmsByteCount);
    document.querySelectorAll('#smsModal .seg').forEach(function (seg) {
      seg.addEventListener('click', function (e) {
        var btn = e.target.closest('button'); if (!btn) return;
        seg.querySelectorAll('button').forEach(function (b) { b.classList.remove('on'); });
        btn.classList.add('on');
        if (seg.id === 'smsTypeSeg') { updateSmsByteCount(); toggleSmsTitleVisibility(); }
      });
    });
  }

  // ---- 좌(발송대상)/우(메시지 작성) 컬럼 폭 조절 드래그 ----
  function bindSmsLayoutResizer() {
    var resizer = document.getElementById('smsLayoutResizer');
    var left = document.querySelector('#smsModal .sms-left');
    var right = document.querySelector('#smsModal .sms-right');
    var layout = document.querySelector('#smsModal .sms-layout');
    var MIN_LEFT = 320, MIN_RIGHT = 220;
    resizer.addEventListener('mousedown', function (e) {
      e.preventDefault();
      var startX = e.clientX;
      var startLeftW = left.getBoundingClientRect().width;
      function onMove(ev) {
        var layoutW = layout.getBoundingClientRect().width;
        var resizerW = resizer.getBoundingClientRect().width;
        var maxLeft = layoutW - resizerW - MIN_RIGHT;
        var newLeftW = startLeftW + (ev.clientX - startX);
        if (newLeftW < MIN_LEFT) newLeftW = MIN_LEFT;
        if (newLeftW > maxLeft) newLeftW = maxLeft;
        left.style.flex = '0 0 ' + newLeftW + 'px';
        right.style.flex = '1 1 auto';
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        resizer.classList.remove('dragging');
      }
      resizer.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // ---- 발송대상 목록 테이블 컬럼별 폭 조절 드래그(이름/학번/전화번호/학부모 전화번호/광고수신거부) ----
  function syncSmsRecipTblWidth() {
    var table = document.getElementById('smsRecipTbl');
    var ths = table.querySelectorAll('thead th');
    var total = 0;
    Array.prototype.forEach.call(ths, function (th) {
      // 렌더링된 rect(getBoundingClientRect)가 아니라 직접 지정한 CSS width 값을 그대로 더한다.
      // rect는 table-layout:fixed가 "테이블 폭 == 컬럼 폭 합"이 안 맞을 때 폭을 재분배한 "결과값"이라
      // 이걸로 테이블 폭을 역산하면 매 드래그마다 오차가 누적되어 다른 컬럼까지 함께 움직이는 원인이 된다.
      total += parseFloat(th.style.width) || th.getBoundingClientRect().width;
    });
    table.style.width = total + 'px';
  }
  function bindSmsColResizers() {
    var handles = document.querySelectorAll('#smsRecipTbl .colResizer');
    var MIN_W = 40;
    Array.prototype.forEach.call(handles, function (handle) {
      var th = handle.closest('th');
      handle.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var startX = e.clientX;
        var startW = th.getBoundingClientRect().width;
        function onMove(ev) {
          var newW = startW + (ev.clientX - startX);
          if (newW < MIN_W) newW = MIN_W;
          th.style.width = newW + 'px';
          syncSmsRecipTblWidth();
        }
        function onUp() {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          handle.classList.remove('dragging');
        }
        handle.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }


  function openSmsModal(opts) {
    opts = opts || {};
    buildDom();

    _state.recipients = (opts.recipients || []).map(function (r) {
      return { no: r.no || r.studentNo, name: r.name || '', studentNo: r.studentNo || '-', phone: r.phone || '-', parentPhone: r.parentPhone || '', optOut: '', selected: true, manual: false };
    });
    _state.templates = (opts.templates && opts.templates.length ? opts.templates : DEFAULT_TEMPLATES).map(function (t) { return { id: t.id, type: t.type, text: t.text }; });
    _state.getAddCandidates = typeof opts.getAddCandidates === 'function' ? opts.getAddCandidates : function () { return []; };
    _state.addPickerStatusLabel = opts.addPickerStatusLabel || '상태';
    _state.addSelected = {};
    _state.addTab = 'student';
    _state.addPage = 1;
    _state.adOptOutNumber = opts.adOptOutNumber || '080-000-0000';
    _state.onSent = typeof opts.onSent === 'function' ? opts.onSent : null;
    _state.sortCol = null;
    _state.sortDir = 1;
    renderSmsSortArrows();

    var senderSel = document.getElementById('smsSender');
    var senderOptions = (opts.senderOptions && opts.senderOptions.length) ? opts.senderOptions : [{ value: '1588-7800', label: '고객센터 (1588-7800)' }];
    senderSel.innerHTML = senderOptions.map(function (o) { return '<option value="' + o.value + '"' + (o.optOutNumber ? ' data-optout="' + escAttr(o.optOutNumber) + '"' : '') + '>' + o.label + '</option>'; }).join('');

    var smsQ = document.getElementById('smsQuotaSms'), lmsQ = document.getElementById('smsQuotaLms');
    if (opts.remainingSms != null) { _state.remainingSms = Number(opts.remainingSms); smsQ.textContent = 'SMS : ' + _state.remainingSms.toLocaleString(); smsQ.style.display = ''; }
    else { _state.remainingSms = null; smsQ.style.display = 'none'; }
    if (opts.remainingLms != null) { _state.remainingLms = Number(opts.remainingLms); lmsQ.textContent = 'LMS : ' + _state.remainingLms.toLocaleString(); lmsQ.style.display = ''; }
    else { _state.remainingLms = null; lmsQ.style.display = 'none'; }

    renderSmsTplTable();
    renderSmsRecipients();
    document.getElementById('smsTargetPhone').checked = false;
    document.getElementById('smsTargetParentPhone').checked = true;
    document.getElementById('smsAdCheckbox').checked = false;
    document.getElementById('smsSymbolPanel').classList.remove('open');
    document.getElementById('smsFieldPanel').classList.remove('open');
    document.getElementById('smsExcelDD').classList.remove('open');
    document.querySelectorAll('#smsTypeSeg button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === 'SMS'); });
    toggleSmsTitleVisibility();
    document.getElementById('smsTitleInput').value = '';

    if (opts.initialBodyText) {
      document.getElementById('smsBody').value = opts.initialBodyText;
      document.querySelectorAll('#smsTplSelectBody tr').forEach(function (r) { r.classList.remove('on'); });
    } else if (_state.templates.length) {
      document.getElementById('smsBody').value = _state.templates[0].text;
      document.querySelectorAll('#smsTplSelectBody tr').forEach(function (r) { r.classList.toggle('on', r.dataset.id === _state.templates[0].id); });
    } else {
      document.getElementById('smsBody').value = '';
    }
    updateSmsByteCount();

    document.getElementById('smsModal').classList.add('open');
  }

  global.openSmsModal = openSmsModal;
  global.initSmsModal = buildDom; // 명시적으로 미리 DOM만 준비해두고 싶을 때(선택사항, openSmsModal이 자동으로 처리하므로 생략 가능)
})(window);
