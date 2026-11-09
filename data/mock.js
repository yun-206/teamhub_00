/* =========================================================
   시연용 가상(mock) 데이터 — 실제 인물·일정이 아니에요.
   ========================================================= */
window.HUB_MOCK = {
  team: { name: '문화데이터팀', sub: 'Team Hub · 데모' },

  // 'me'가 상단 프로필에 표시되는 사용자
  members: [
    { id: 'me', name: '한지우', role: '연구 인턴', status: 'online' },
    { id: 'm1', name: '김하늘', role: '팀장', status: 'meeting' },
    { id: 'm2', name: '박서연', role: '책임연구원', status: 'online' },
    { id: 'm3', name: '이준호', role: '선임연구원', status: 'away' },
    { id: 'm4', name: '최민지', role: '연구원', status: 'online' },
    { id: 'm5', name: '정다은', role: '연구원', status: 'offline' },
  ],

  // 이번 주 월요일 기준 day(0=월 … 4=금, 7=다음 주 월)
  seedMeetings: [
    { id: 's1', day: 0, start: '10:00', end: '10:30', title: '주간 업무 공유', attendees: ['me', 'm1', 'm2', 'm3', 'm4', 'm5'], place: '3층 소회의실' },
    { id: 's2', day: 1, start: '14:00', end: '15:00', title: '해외공연 데이터 점검', attendees: ['me', 'm2', 'm4'], place: '온라인' },
    { id: 's3', day: 2, start: '11:00', end: '12:00', title: '검증 리포트 리뷰', attendees: ['me', 'm2', 'm3'], place: '3층 소회의실' },
    { id: 's4', day: 2, start: '11:30', end: '12:30', title: '보고서 목차 회의', attendees: ['m1', 'm5'], place: '온라인' },
    { id: 's5', day: 3, start: '15:00', end: '16:30', title: '도구 시연 리허설', attendees: ['me', 'm1', 'm2'], place: '대회의실' },
    { id: 's6', day: 4, start: '09:30', end: '10:00', title: '주간 마감 체크', attendees: ['me', 'm1', 'm4'], place: '온라인' },
    { id: 's7', day: 7, start: '10:00', end: '10:30', title: '주간 업무 공유', attendees: ['me', 'm1', 'm2', 'm3', 'm4', 'm5'], place: '3층 소회의실' },
    { id: 's8', day: 8, start: '13:30', end: '14:30', title: '솔로 시트 범위 논의', attendees: ['me', 'm2', 'm3'], place: '온라인' },
  ],

  notices: [
    { tag: '공지', title: '11월 셋째 주 도구 시연 일정 안내', date: '11/09' },
    { tag: '자료', title: '해외공연 데이터 2차 업데이트 파일 공유', date: '11/06' },
    { tag: '공지', title: '연말 보고서 제출 마감은 12/12(금)', date: '11/03' },
  ],

  activity: [
    { who: 'm2', what: '검증 리포트를 올렸어요', where: 'K-pop Live Tracker', ago: '12분 전' },
    { who: 'm4', what: '회의를 잡았어요', where: '해외공연 데이터 점검', ago: '1시간 전' },
    { who: 'me', what: '결과 엑셀을 만들었어요', where: 'K-pop Live Tracker', ago: '어제' },
    { who: 'm3', what: '공지를 남겼어요', where: '연말 보고서 마감', ago: '2일 전' },
  ],

  // 바로가기 — 데모라 실제 주소 대신 '#'
  links: [
    { name: '팀 공유 드라이브', href: '#', icon: 'folder' },
    { name: '업무 매뉴얼', href: '#', icon: 'doc' },
    { name: '사내 메일', href: '#', icon: 'link' },
    { name: '전자결재', href: '#', icon: 'check' },
  ],
};
