/* =========================================================
   팀 설정 — 팀 이름, 입장 비밀번호, 직급 목록, 바로가기
   (팀원·회의·활동은 여기 없어요. 시연하면서 직접 들어오고 만든 값만 쓰여요.)
   ========================================================= */
window.HUB_TEAM = {
  name: 'Team KW',
  sub: 'Team Hub',

  // ── Supabase 연결 (실제 DB · 다른 기기끼리 실시간 공유) ──────────────
  // url·key를 채우면 Supabase 모드, 비워 두면 로컬 모드(이 브라우저에만 저장).
  // key는 Publishable key(sb_publishable_…) 또는 anon public 키 — 웹페이지에 공개되는 용도라 올려도 괜찮아요.
  // ⚠️ secret / service_role 키는 절대 넣지 마세요.
  // Supabase 모드의 입장 비밀번호는 아래 password가 아니라 supabase/setup.sql 안의 값이에요(브라우저에서 안 보임).
  supabase: {
    url: 'https://eguytrrmfqzquidwtipl.supabase.co',
    key: 'sb_publishable_v-AGhbDz0XJCfN1mcyuvsw_HwXe1qjc',
  },

  // 로컬 모드(supabase 값을 비웠을 때)에서만 쓰는 입장 비밀번호 — 페이지 코드에 그대로 보여요.
  // 지금은 Supabase 모드라 쓰이지 않아서 비워 둠 (비밀번호는 supabase/setup.sql 안에 있음)
  password: '',

  // 입장할 때 고르는 직급
  roles: ['팀장', '책임연구원', '선임연구원', '연구원', '연구 인턴'],

  // 사이드바 바로가기 — 실제 주소가 생기면 href만 바꾸면 돼요 ('#'이면 눌러도 이동 안 함)
  links: [
    { name: '팀 공유 드라이브', href: '#', icon: 'folder' },
    { name: '업무 매뉴얼', href: '#', icon: 'doc' },
  ],
};
