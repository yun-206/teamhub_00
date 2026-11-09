/* =========================================================
   업무 툴 목록 — 허브의 카드·사이드바 메뉴가 이 배열에서 만들어져요.
   새 툴을 붙이려면 아래 배열에 객체 한 줄만 추가하면 돼요.

   필드
   - id       : 영문 고유값
   - name     : 카드 제목
   - desc     : 한 줄 설명
   - href     : 열 주소 (이 사이트 안 파일은 상대경로, 다른 사이트는 https://…). 다른 사이트는 새 탭으로 열려요. '준비 중'이면 비워도 됨
   - icon     : chart | calendar | doc | venue | news | check | folder | link
   - status   : '운영 중' | '데모' | '준비 중'  ('준비 중'은 눌리지 않는 카드로 표시)
   - owner    : 담당 (선택)
   - updated  : 마지막 업데이트 YYYY-MM-DD (선택)
   - tags     : 짧은 태그 배열 (선택)
   - featured : true면 허브 메인에 큰 카드로 한 번 더 강조 (하나만 권장)
   ========================================================= */
// K-pop Live Tracker는 별도 저장소(yun-206/kpop-checker)에 배포된 사이트 — 주소가 바뀌면 여기만 고치면 돼요.
const KPOP_LIVE_TRACKER_URL = 'https://kpop-checker.vercel.app/';

window.HUB_TOOLS = [
  { id: 'kpop-live-tracker', name: 'K-pop Live Tracker', desc: '케이팝 해외공연 데이터를 조립하고 순위를 매기고 검증해요', href: KPOP_LIVE_TRACKER_URL, icon: 'chart', status: '운영 중', owner: '데이터 TF', updated: '2026-11-02', tags: ['데이터', '검증', '엑셀'], featured: true },
  { id: 'meeting', name: '회의 일정 잡기', desc: '팀 주간 캘린더에서 회의를 잡고 참석자를 모아요', href: 'meeting.html', icon: 'calendar', status: '데모', owner: '팀 공용', updated: '2026-11-09', tags: ['협업', '일정'] },
];
