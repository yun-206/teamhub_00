/* =========================================================
   팀 허브 공통: 아이콘, 테마, 상단바·사이드바, 회의 저장소, 토스트
   (허브·데모 페이지 전용 — 기존 K-pop Live Tracker 코드와 분리)
   ========================================================= */
(function () {
  'use strict';
  const TOOLS = window.HUB_TOOLS || [];
  const MOCK = window.HUB_MOCK || { members: [], seedMeetings: [], links: [], team: {} };
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /* ---------- 아이콘 (24px stroke) ---------- */
  const P = {
    chart: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    doc: '<path d="M7 3.5h7l4.5 4.5v12.5H7z"/><path d="M14 3.5V8h4.5M10 13h5M10 16.5h5"/>',
    venue: '<path d="M3.5 19.5h17M5.5 19.5v-9l6.5-5 6.5 5v9"/><path d="M10 19.5v-4.5h4v4.5"/>',
    news: '<rect x="3.5" y="5" width="13" height="14.5" rx="2"/><path d="M16.5 9h3v8a2.5 2.5 0 0 1-5 0M7 9h6M7 12.5h6M7 16h4"/>',
    check: '<path d="M4.5 12.5l4.5 4.5 10.5-10.5"/>',
    folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
    home: '<path d="M4 11l8-6.5 8 6.5V20h-5.5v-5.5h-5V20H4z"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5M16 5.5a3.5 3.5 0 0 1 0 6.5M18 14.8c1.6.8 2.7 2.6 3 5.2"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    megaphone: '<path d="M4 10v4h3l7 4.5v-13L7 10z"/><path d="M17.5 9a4 4 0 0 1 0 6"/>',
    pulse: '<path d="M3 12h4l2.5-6 4 12 2.5-6h5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
    pin: '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    external: '<path d="M14 4.5h5.5V10M19.5 4.5L11 13M17 14v5.5H4.5V7H10"/>',
    trash: '<path d="M5 7h14M9.5 7V4.5h5V7M7 7l.8 12.5h8.4L17 7"/>',
  };
  const icon = (name, size) => `<svg class="ic" viewBox="0 0 24 24" width="${size || 20}" height="${size || 20}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.link}</svg>`;

  /* ---------- 저장소 (localStorage, 막혀 있으면 메모리) ---------- */
  const mem = {};
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { mem[k] = v; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } },
  };

  /* ---------- 날짜 ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const weekStart = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const w = (x.getDay() + 6) % 7; return addDays(x, -w); };
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  function dayLabel(dateStr) {
    const today = ymd(new Date()), tmr = ymd(addDays(new Date(), 1));
    const d = parseYmd(dateStr);
    if (dateStr === today) return '오늘';
    if (dateStr === tmr) return '내일';
    return `${d.getMonth() + 1}/${d.getDate()} (${DOW[d.getDay()]})`;
  }

  /* ---------- 회의 저장소 ---------- */
  const MKEY = 'teamhub-meetings';
  const meetings = {
    // 시드 회의는 이번 주 월요일 기준으로 매번 계산 → 언제 시연해도 '이번 주'에 일정이 있음
    seeds() {
      const base = weekStart(new Date());
      return MOCK.seedMeetings.map(s => ({ id: s.id, date: ymd(addDays(base, s.day)), start: s.start, end: s.end, title: s.title, attendees: s.attendees, place: s.place, seed: true }));
    },
    saved() { const v = store.get(MKEY, []); return Array.isArray(v) ? v : []; },
    all() { return this.seeds().concat(this.saved()).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)); },
    add(m) { const list = this.saved(); const item = Object.assign({ id: 'u' + Date.now().toString(36) }, m); list.push(item); store.set(MKEY, list); return item; },
    remove(id) { store.set(MKEY, this.saved().filter(m => m.id !== id)); },
    reset() { store.del(MKEY); },
    upcoming(n) {
      const now = new Date(), nowKey = ymd(now) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
      return this.all().filter(m => (m.date + ' ' + m.end) > nowKey).slice(0, n || 5);
    },
  };

  const member = (id) => MOCK.members.find(m => m.id === id) || { id, name: '?', role: '' };
  const initial = (name) => String(name || '?').slice(-2);   // 한글 이름 뒤 두 글자
  const avatar = (id, cls) => { const m = member(id); return `<span class="av ${cls || ''}" title="${esc(m.name)}" data-tone="${MOCK.members.indexOf(m) % 5}">${esc(initial(m.name))}</span>`; };
  const avatars = (ids, max) => { max = max || 4; const extra = ids.length - max; return `<span class="avs">${ids.slice(0, max).map(i => avatar(i)).join('')}${extra > 0 ? `<span class="av av--more">+${extra}</span>` : ''}</span>`; };

  /* ---------- 테마 (K-pop Live Tracker와 같은 저장 키 → 두 화면 테마가 이어짐) ---------- */
  const TKEY = 'tourdata-theme';
  const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';
  function setTheme(light) {
    if (light) document.documentElement.setAttribute('data-theme', 'light'); else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem(TKEY, light ? 'light' : 'dark'); } catch (e) {}
    document.querySelectorAll('[data-theme-btn]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.themeBtn === 'light') === light)));
  }

  /* ---------- 토스트 ---------- */
  let toastT;
  function toast(msg) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2400);
  }

  /* ---------- 상단바·사이드바 ---------- */
  function toolHref(t) { return t.status === '준비 중' || !t.href ? '' : t.href; }
  function renderShell(page) {
    const me = member('me');
    const side = $('#side');
    const navItem = (href, ic, label, active, extra) => href
      ? `<a class="nav__item${active ? ' is-active' : ''}" href="${esc(href)}"${active ? ' aria-current="page"' : ''}${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ''}>${icon(ic, 18)}<span>${esc(label)}</span>${extra || ''}</a>`
      : `<span class="nav__item is-disabled" aria-disabled="true">${icon(ic, 18)}<span>${esc(label)}</span>${extra || ''}</span>`;
    side.innerHTML = `
      <div class="side__head">
        <a class="brand" href="index.html" aria-label="${esc(MOCK.team.name)} 허브 홈">
          <span class="brand__logo" aria-hidden="true">${icon('chart', 18)}</span>
          <span class="brand__txt"><b>${esc(MOCK.team.name)}</b><small>${esc(MOCK.team.sub || '')}</small></span>
        </a>
        <button class="icon-btn side__close" type="button" id="sideClose" aria-label="메뉴 닫기">${icon('close', 20)}</button>
      </div>
      <nav class="nav" aria-label="허브 메뉴">
        <div class="nav__group">
          ${navItem('index.html', 'home', '홈', page === 'home')}
        </div>
        <div class="nav__group">
          <p class="nav__label">업무 툴</p>
          ${TOOLS.map(t => navItem(toolHref(t), t.icon, t.name, page === t.id, t.status === '준비 중' ? '<em class="pill pill--soon">준비 중</em>' : t.status === '데모' ? '<em class="pill">데모</em>' : '')).join('')}
        </div>
        <div class="nav__group">
          <p class="nav__label">협업</p>
          ${navItem('meeting.html', 'calendar', '회의 일정', page === 'meeting')}
          ${navItem('index.html#notices', 'megaphone', '공지사항', false)}
          ${navItem('index.html#team', 'users', '팀원', false)}
        </div>
        <div class="nav__group">
          <p class="nav__label">바로가기</p>
          ${MOCK.links.map(l => navItem(l.href, l.icon, l.name, false, '<span class="nav__ext">' + icon('external', 14) + '</span>')).join('')}
        </div>
      </nav>
      <div class="side__foot">
        <div class="theme" role="group" aria-label="화면 테마">
          <button type="button" data-theme-btn="dark" aria-pressed="${!isLight()}" aria-label="다크">${icon('moon', 16)}</button>
          <button type="button" data-theme-btn="light" aria-pressed="${isLight()}" aria-label="라이트">${icon('sun', 16)}</button>
        </div>
        <p class="side__note">시연용 데모 · 가상 데이터</p>
      </div>`;

    const top = $('#top');
    top.innerHTML = `
      <button class="icon-btn top__menu" type="button" id="sideOpen" aria-label="메뉴 열기" aria-controls="side" aria-expanded="false">${icon('menu', 22)}</button>
      <form class="search" role="search" id="searchForm">
        ${icon('search', 18)}
        <input id="searchInput" type="search" placeholder="툴·회의·공지 검색" aria-label="허브 검색" autocomplete="off">
        <kbd>/</kbd>
      </form>
      <div class="top__end">
        <button class="icon-btn" type="button" id="bellBtn" aria-label="알림 2개">${icon('bell', 20)}<i class="dot" aria-hidden="true"></i></button>
        <div class="profile">
          <button class="profile__btn" type="button" id="profileBtn" aria-haspopup="menu" aria-expanded="false" aria-controls="profileMenu">
            ${avatar('me', 'av--lg')}<span class="profile__name">${esc(me.name)}</span>
          </button>
          <div class="menu" id="profileMenu" role="menu" hidden>
            <div class="menu__head">${avatar('me', 'av--lg')}<div><b>${esc(me.name)}</b><small>${esc(me.role)} · ${esc(MOCK.team.name)}</small></div></div>
            <button type="button" role="menuitem" id="menuTheme">${icon('sun', 16)}<span>테마 바꾸기</span></button>
            <button type="button" role="menuitem" id="menuReset">${icon('trash', 16)}<span>데모 일정 초기화</span></button>
          </div>
        </div>
      </div>`;

    // 사이드바 열고 닫기(모바일)
    const shell = $('.shell');
    const scrim = $('#scrim');
    const open = (on) => { shell.classList.toggle('side-open', on); $('#sideOpen').setAttribute('aria-expanded', String(on)); if (on) $('#sideClose').focus(); };
    $('#sideOpen').onclick = () => open(true);
    $('#sideClose').onclick = () => { open(false); $('#sideOpen').focus(); };
    if (scrim) scrim.onclick = () => open(false);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && shell.classList.contains('side-open')) { open(false); $('#sideOpen').focus(); }
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { e.preventDefault(); $('#searchInput').focus(); }
    });
    side.addEventListener('click', (e) => { if (e.target.closest('a.nav__item') && window.matchMedia('(max-width: 960px)').matches) open(false); });

    // 테마
    side.querySelectorAll('[data-theme-btn]').forEach(b => b.onclick = () => setTheme(b.dataset.themeBtn === 'light'));

    // 프로필 메뉴
    const pb = $('#profileBtn'), pm = $('#profileMenu');
    const menu = (on) => { pm.hidden = !on; pb.setAttribute('aria-expanded', String(on)); if (on) pm.querySelector('button').focus(); };
    pb.onclick = (e) => { e.stopPropagation(); menu(pm.hidden); };
    document.addEventListener('click', (e) => { if (!pm.hidden && !e.target.closest('.profile')) menu(false); });
    pm.addEventListener('keydown', (e) => { if (e.key === 'Escape') { menu(false); pb.focus(); } });
    $('#menuTheme').onclick = () => { setTheme(!isLight()); menu(false); };
    $('#menuReset').onclick = () => { meetings.reset(); menu(false); toast('직접 만든 데모 회의를 지웠어요'); document.dispatchEvent(new CustomEvent('hub:meetings')); };
    $('#bellBtn').onclick = () => toast('알림은 데모라 실제로 오지 않아요');

    // 검색(UI만): 페이지가 hub:search 이벤트로 받아서 처리
    const si = $('#searchInput');
    si.addEventListener('input', () => document.dispatchEvent(new CustomEvent('hub:search', { detail: si.value.trim() })));
    $('#searchForm').onsubmit = (e) => { e.preventDefault(); document.dispatchEvent(new CustomEvent('hub:search', { detail: si.value.trim(), bubbles: false })); if (!si.value.trim()) return; toast('검색은 데모예요 — 툴 카드만 걸러서 보여줘요'); };
  }

  window.Hub = { TOOLS, MOCK, $, esc, icon, store, meetings, member, avatar, avatars, ymd, parseYmd, addDays, weekStart, toMin, dayLabel, DOW, pad, toast, renderShell, toolHref, setTheme, isLight };
})();
