/* =========================================================
   팀 허브 공통: 아이콘, 테마, 데이터(팀원·접속 상태·회의·활동), 상단바·사이드바, 초대, 토스트
   (허브·데모 페이지 전용 — 기존 K-pop Live Tracker 코드와 분리)

   데이터 저장 방식은 두 가지이고, data/team.js의 supabase 값으로 자동 선택돼요.
   - Supabase 모드 : url·key가 있으면 → 실제 DB(Supabase)에 저장, 다른 기기끼리도 실시간 공유
                    접속 상태는 Realtime Presence, 표 변경은 Realtime(postgres_changes)로 받아요.
   - 로컬 모드     : 비어 있거나 연결에 실패하면 → 이 브라우저 localStorage (같은 브라우저 탭끼리만 공유)
   화면 코드는 두 모드 모두 같은 Hub.team / Hub.meetings / Hub.activity를 써요.
   ========================================================= */
(function () {
  'use strict';
  const TOOLS = window.HUB_TOOLS || [];
  const TEAM = Object.assign({ name: 'Team', sub: '', password: '', roles: [], links: [], supabase: {} }, window.HUB_TEAM || {});
  const SB = TEAM.supabase || {};
  const SB_LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.js';
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const emit = (name) => document.dispatchEvent(new CustomEvent(name));

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
    userPlus: '<circle cx="10" cy="8.5" r="3.5"/><path d="M3.5 20c.6-3.4 3.2-5.5 6.5-5.5 1.6 0 3 .5 4.1 1.3M18.5 14v6M15.5 17h6"/>',
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
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>',
    logout: '<path d="M14 4.5h4a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-4M10 16l4-4-4-4M14 12H4.5"/>',
    reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.5 1.6A3.8 3.8 0 0 1 17.5 18.5z"/>',
    device: '<rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M10.5 17.5h3"/>',
  };
  const icon = (name, size) => `<svg class="ic" viewBox="0 0 24 24" width="${size || 20}" height="${size || 20}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.link}</svg>`;

  /* ---------- 브라우저 저장소 (막혀 있으면 메모리) ---------- */
  function makeStore(kind) {
    const mem = {};
    const s = () => { try { return window[kind]; } catch (e) { return null; } };
    return {
      get(k, d) { try { const v = s().getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : d; } },
      set(k, v) { try { s().setItem(k, JSON.stringify(v)); } catch (e) { mem[k] = v; } },
      del(k) { try { s().removeItem(k); } catch (e) {} delete mem[k]; },
      keys() { try { const o = s(), r = []; for (let i = 0; i < o.length; i++) r.push(o.key(i)); return r; } catch (e) { return Object.keys(mem); } },
    };
  }
  const store = makeStore('localStorage');
  const sess = makeStore('sessionStorage');
  const K = { v: 'teamhub-v', members: 'teamhub-members', me: 'teamhub-me', meetings: 'teamhub-meetings', activity: 'teamhub-activity', pres: 'teamhub-p:', myStatus: 'teamhub-mystatus' };
  if (store.get(K.v) !== 2) { store.del(K.meetings); store.set(K.v, 2); }   // v1 가상 회의 정리

  /* ---------- 날짜 ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const weekStart = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const w = (x.getDay() + 6) % 7; return addDays(x, -w); };
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const nowKey = () => { const n = new Date(); return ymd(n) + ' ' + pad(n.getHours()) + ':' + pad(n.getMinutes()); };
  function dayLabel(dateStr) {
    const today = ymd(new Date()), tmr = ymd(addDays(new Date(), 1));
    const d = parseYmd(dateStr);
    if (dateStr === today) return '오늘';
    if (dateStr === tmr) return '내일';
    return `${d.getMonth() + 1}/${d.getDate()} (${DOW[d.getDay()]})`;
  }
  function ago(ts) {
    const s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 60) return '방금 전';
    if (s < 3600) return `${Math.floor(s / 60)}분 전`;
    const d = new Date(ts), t = new Date();
    if (ymd(d) === ymd(t)) return `${Math.floor(s / 3600)}시간 전`;
    if (ymd(d) === ymd(addDays(t, -1))) return '어제';
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  /* =========================================================
     데이터 캐시 — 화면은 항상 여기서 읽고(동기), 쓰기는 백엔드로(비동기)
     ========================================================= */
  const state = { members: [], meetings: [], activity: [], online: {}, lastSeen: {} };
  const byDate = (a, b) => (a.date + a.start).localeCompare(b.date + b.start);
  const OFFLINE_AFTER = 25000;   // 로컬: 마지막 신호 후 25초
  const GRACE = 5000;            // Supabase: 화면에서 사라진 뒤 5초(페이지 이동 깜빡임 방지)
  const ST = { online: '온라인', meeting: '회의 중', away: '자리 비움', offline: '오프라인' };
  let backend = null;            // localBackend | supabaseBackend

  /* ---------- 로컬 백엔드 (localStorage) ---------- */
  const localBackend = {
    mode: 'local',
    async load() {
      const arr = (k) => { const v = store.get(k, []); return Array.isArray(v) ? v : []; };
      state.members = arr(K.members);
      state.meetings = arr(K.meetings).slice().sort(byDate);
      state.activity = arr(K.activity);
    },
    async checkPassword(pw) { return pw === TEAM.password; },
    async join(pw, name, role) {
      if (pw !== TEAM.password) throw new Error('wrong_password');
      await this.load();
      let m = state.members.find(x => x.name === name);
      if (m) { m.role = role; store.set(K.members, state.members); return { member: m, isNew: false }; }
      m = { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name, role, joinedAt: Date.now() };
      state.members.push(m); store.set(K.members, state.members);
      state.activity = [{ who: m.id, what: '팀에 들어왔어요', where: TEAM.name, at: Date.now() }].concat(state.activity).slice(0, 30);
      store.set(K.activity, state.activity);
      return { member: m, isNew: true };
    },
    async addMeeting(m) {
      const item = Object.assign({ id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) }, m);
      state.meetings = state.meetings.concat(item).sort(byDate); store.set(K.meetings, state.meetings); return item;
    },
    async removeMeeting(id) { state.meetings = state.meetings.filter(m => m.id !== id); store.set(K.meetings, state.meetings); },
    async addActivity(a) { state.activity = [a].concat(state.activity).slice(0, 30); store.set(K.activity, state.activity); },
    async resetAll() { store.keys().filter(k => k.startsWith('teamhub-')).forEach(k => store.del(k)); sess.keys().filter(k => k.startsWith('teamhub-')).forEach(k => sess.del(k)); store.set(K.v, 2); },
    // 접속 상태: 탭마다 8초 신호 → 같은 브라우저의 다른 탭이 storage 이벤트로 받음
    pres(id) { return store.get(K.pres + id, null) || { status: 'online', beat: 0 }; },
    isOnline(id) { const p = this.pres(id); return !!p.beat && Date.now() - p.beat <= OFFLINE_AFTER; },
    manual(id) { return this.pres(id).status || 'online'; },
    async setStatus(s) { const id = team.meId(); if (id) store.set(K.pres + id, Object.assign(this.pres(id), { status: s, beat: Date.now() })); },
    async leave() { const id = team.meId(); if (id) store.set(K.pres + id, Object.assign(this.pres(id), { beat: 0 })); },
    startLive() {
      const beat = () => { const id = team.meId(); if (id) store.set(K.pres + id, Object.assign(this.pres(id), { beat: Date.now() })); };
      beat();
      setInterval(() => { beat(); emit('hub:team'); }, 8000);
      // 창을 닫거나 페이지를 옮기면 신호를 '4초 뒤 만료'로 당겨 둠 → 돌아오지 않으면 오프라인
      window.addEventListener('pagehide', () => { const id = team.meId(); if (id) store.set(K.pres + id, Object.assign(this.pres(id), { beat: Date.now() - OFFLINE_AFTER + 4000 })); });
      window.addEventListener('pageshow', (e) => { if (e.persisted) { beat(); this.load().then(() => { emit('hub:team'); emit('hub:meetings'); }); } });
      window.addEventListener('storage', async (e) => {
        if (e.key && !e.key.startsWith('teamhub-')) return;
        await this.load();
        if (!team.meId()) { location.replace('join.html'); return; }
        if (e.key === null || e.key === K.members || (e.key || '').startsWith(K.pres)) emit('hub:team');
        if (e.key === null || e.key === K.meetings) { emit('hub:meetings'); emit('hub:team'); }
        if (e.key === null || e.key === K.activity) emit('hub:activity');
      });
    },
  };

  /* ---------- Supabase 백엔드 ---------- */
  let sb = null, channel = null;
  const fromMember = (r) => ({ id: r.id, name: r.name, role: r.role, joinedAt: Date.parse(r.joined_at) || 0 });
  const fromMeeting = (r) => ({ id: r.id, title: r.title, date: r.date, start: r.start_time, end: r.end_time, place: r.place || '', attendees: r.attendees || [], by: r.created_by });
  const fromActivity = (r) => ({ who: r.who, what: r.what, where: r.place || '', at: Date.parse(r.at) || 0 });
  function check(res) { if (res.error) throw res.error; return res.data; }
  const supabaseBackend = {
    mode: 'supabase',
    async loadMembers() { state.members = check(await sb.from('members').select('*').order('joined_at')).map(fromMember); },
    async loadMeetings() { state.meetings = check(await sb.from('meetings').select('*').order('date').order('start_time')).map(fromMeeting).sort(byDate); },
    async loadActivity() { state.activity = check(await sb.from('activity').select('*').order('at', { ascending: false }).limit(30)).map(fromActivity); },
    async load() { await Promise.all([this.loadMembers(), this.loadMeetings(), this.loadActivity()]); },
    async checkPassword(pw) { return !!check(await sb.rpc('check_password', { p_password: pw })); },
    async join(pw, name, role) {
      const res = await sb.rpc('join_team', { p_password: pw, p_name: name, p_role: role });
      if (res.error) throw new Error(/wrong_password/.test(res.error.message || '') ? 'wrong_password' : (res.error.message || 'join_failed'));
      const m = fromMember(res.data.member);
      await this.load();
      return { member: m, isNew: !!res.data.is_new };
    },
    async addMeeting(m) {
      const row = check(await sb.from('meetings').insert({ title: m.title, date: m.date, start_time: m.start, end_time: m.end, place: m.place || '', attendees: m.attendees, created_by: m.by }).select().single());
      const item = fromMeeting(row);
      if (!state.meetings.some(x => x.id === item.id)) state.meetings = state.meetings.concat(item).sort(byDate);
      return item;
    },
    async removeMeeting(id) { check(await sb.from('meetings').delete().eq('id', id)); state.meetings = state.meetings.filter(m => m.id !== id); },
    async addActivity(a) { check(await sb.from('activity').insert({ who: a.who, what: a.what, place: a.where || '' })); state.activity = [a].concat(state.activity).slice(0, 30); },
    async resetAll(pw) {
      const res = await sb.rpc('reset_demo', { p_password: pw });
      if (res.error) throw new Error(/wrong_password/.test(res.error.message || '') ? 'wrong_password' : res.error.message);
      sess.keys().filter(k => k.startsWith('teamhub-')).forEach(k => sess.del(k)); store.del(K.me);
    },
    // 접속 상태: Realtime Presence (창을 닫으면 서버가 알아서 빼 줌)
    isOnline(id) { return id === team.meId() || !!state.online[id] || (state.lastSeen[id] && Date.now() - state.lastSeen[id] < GRACE); },   // 지금 이 화면을 보는 나는 항상 접속 중
    manual(id) { const o = state.online[id]; return (o && o.status) || (id === team.meId() ? store.get(K.myStatus + ':' + id, 'online') : 'online'); },
    async setStatus(s) { const id = team.meId(); if (!id) return; store.set(K.myStatus + ':' + id, s); state.online[id] = { status: s }; if (channel) await channel.track({ status: s, at: Date.now() }); },
    async leave() { if (channel) { try { await channel.untrack(); } catch (e) {} } },
    startLive() {
      const id = team.meId();
      let t = {};
      const reload = (what) => { clearTimeout(t[what]); t[what] = setTimeout(async () => {
        try {
          if (what === 'members') { await this.loadMembers(); if (!team.meId()) { location.replace('join.html'); return; } emit('hub:team'); }
          if (what === 'meetings') { await this.loadMeetings(); emit('hub:meetings'); emit('hub:team'); }
          if (what === 'activity') { await this.loadActivity(); emit('hub:activity'); }
        } catch (e) { netError(e); }
      }, 150); };
      channel = sb.channel('teamhub', { config: { presence: { key: id } } });
      ['members', 'meetings', 'activity'].forEach(tb => channel.on('postgres_changes', { event: '*', schema: 'public', table: tb }, () => reload(tb)));
      channel.on('presence', { event: 'sync' }, () => {
        const ps = channel.presenceState(), now = Date.now(), next = {};
        Object.keys(ps).forEach(k => { const metas = ps[k] || []; const last = metas.slice().sort((a, b) => (b.at || 0) - (a.at || 0))[0]; if (last) next[k] = { status: last.status || 'online' }; });
        Object.keys(state.online).forEach(k => { if (!next[k]) state.lastSeen[k] = now; });
        Object.keys(next).forEach(k => delete state.lastSeen[k]);
        state.online = next;
        emit('hub:team');
      });
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ status: store.get(K.myStatus + ':' + id, 'online'), at: Date.now() });
          // 연결 전에 바뀐 게 있을 수 있으니 한 번 새로 읽음
          try { await this.load(); emit('hub:team'); emit('hub:meetings'); emit('hub:activity'); } catch (e) { netError(e); }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          toast('실시간 연결이 잠깐 끊겼어요 · 다시 연결하는 중');
        }
      });
      window.addEventListener('pageshow', (e) => { if (e.persisted) this.load().then(() => { emit('hub:team'); emit('hub:meetings'); emit('hub:activity'); }).catch(netError); });
    },
  };

  function netError(e) {
    console.warn('[teamhub]', e);
    toast('서버에 연결하지 못했어요 · 잠시 뒤 다시 시도해 주세요');
  }

  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('script_load_failed')); document.head.appendChild(s); });
  }

  // 시작: Supabase 설정이 있으면 연결, 실패하면 로컬로
  let initError = null;
  const ready = (async () => {
    if (SB.url && SB.key) {
      try {
        if (!window.supabase) await loadScript(SB_LIB);
        sb = window.supabase.createClient(SB.url, SB.key, { auth: { persistSession: false, autoRefreshToken: false } });
        backend = supabaseBackend;
        await backend.load();
        return;
      } catch (e) {
        console.warn('[teamhub] Supabase 연결 실패', e);
        initError = e;
        backend = supabaseBackend;   // 설정이 있는데 실패하면 로컬로 몰래 바꾸지 않음(데이터가 갈라지지 않게)
        return;
      }
    }
    backend = localBackend;
    await backend.load();
  })();

  /* ---------- 공개 API ---------- */
  const meetings = {
    all() { return state.meetings.slice(); },
    async add(m) { return backend.addMeeting(m); },
    async remove(id) { return backend.removeMeeting(id); },
    upcoming(n) { const k = nowKey(); return state.meetings.filter(m => (m.date + ' ' + m.end) > k).slice(0, n || 5); },
    nowFor(id) { const k = nowKey(), d = k.slice(0, 10), t = k.slice(11); return state.meetings.find(m => m.date === d && m.start <= t && m.end > t && (m.attendees || []).includes(id)); },
  };
  const activity = {
    all() { return state.activity.slice(); },
    async add(what, where) { const me = team.meId(); if (!me) return; try { await backend.addActivity({ who: me, what, where: where || '', at: Date.now() }); } catch (e) { console.warn(e); } },
  };
  const team = {
    list() { return state.members.slice(); },
    get(id) { return state.members.find(m => m.id === id) || null; },
    findByName(name) { return state.members.find(m => m.name === name) || null; },
    // 이 탭의 '나': 탭 전용(sessionStorage) → 없으면 이 기기 기본(localStorage)
    meId() { const id = sess.get(K.me, null) || store.get(K.me, null); return id && this.get(id) ? id : null; },
    me() { return this.get(this.meId()); },
    signIn(id, asTabOnly) { sess.set(K.me, id); const dev = store.get(K.me, null); if (!asTabOnly || !dev || !this.get(dev)) store.set(K.me, id); },
    async signOut() { await backend.leave(); const id = this.meId(); sess.del(K.me); if (store.get(K.me, null) === id) store.del(K.me); },
    checkPassword(pw) { return backend.checkPassword(pw); },
    join(pw, name, role) { return backend.join(pw, name, role); },
    resetAll(pw) { return backend.resetAll(pw); },
    setStatus(s) { return backend.setStatus(s); },
    manualStatus(id) { return backend.manual(id); },
    // 화면 상태: 접속 안 함 → 오프라인 / 직접 고른 '자리 비움'·'회의 중' / 지금 회의 시간이면 자동 '회의 중' / 그 외 온라인
    status(id) {
      if (!backend.isOnline(id)) return 'offline';
      const s = backend.manual(id);
      if (s === 'away') return 'away';
      if (s === 'meeting' || meetings.nowFor(id)) return 'meeting';
      return 'online';
    },
  };

  const member = (id) => team.get(id) || { id, name: '알 수 없음', role: '' };
  const shortName = (name) => /^[가-힣]{3}$/.test(name || '') ? name.slice(1) : name;
  const initial = (name) => { name = String(name || '?').trim(); return /^[가-힣]+$/.test(name) ? name.slice(-2) : name.slice(0, 2).toUpperCase(); };
  const tone = (id) => { const i = state.members.findIndex(m => m.id === id); return (i < 0 ? 4 : i) % 5; };
  const avatar = (id, cls) => { const m = member(id); return `<span class="av ${cls || ''}" title="${esc(m.name)}" data-tone="${tone(id)}">${esc(initial(m.name))}</span>`; };
  const avatars = (ids, max) => { max = max || 4; const extra = ids.length - max; return `<span class="avs">${ids.slice(0, max).map(i => avatar(i)).join('')}${extra > 0 ? `<span class="av av--more">+${extra}</span>` : ''}</span>`; };
  const inviteUrl = () => new URL('join.html?invite=1', location.href).href;
  const isShared = () => backend && backend.mode === 'supabase';

  /* ---------- 테마 ---------- */
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
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2600);
  }

  async function copyText(text, input) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    try { if (input) { input.select(); return document.execCommand('copy'); } } catch (e) {}
    return false;
  }

  /* ---------- 초대 모달 ---------- */
  function openInvite() {
    let d = $('#inviteDialog');
    if (!d) {
      d = document.createElement('dialog');
      d.className = 'modal modal--sm'; d.id = 'inviteDialog'; d.setAttribute('aria-labelledby', 'invTitle');
      document.body.appendChild(d);
      d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
      d.addEventListener('close', () => { if (d._opener && d._opener.focus && document.contains(d._opener)) d._opener.focus(); });
    }
    d.innerHTML = `
      <div class="modal__head"><h2 id="invTitle">팀원 초대하기</h2><button class="icon-btn" type="button" data-close aria-label="닫기">${icon('close', 20)}</button></div>
      <div class="modal__body">
        <p class="muted" style="font-size:14px">아래 링크로 들어오면 비밀번호를 입력하고 이름·직급만 적으면 ${esc(TEAM.name)}에 합류해요.</p>
        <div class="copy-row"><input type="text" id="invLink" readonly aria-label="초대 링크"><button class="btn btn--accent btn--sm" type="button" id="invCopy">${icon('copy', 16)}복사</button></div>
        <p class="hint">${icon('lock', 15)}<span>비밀번호는 링크와 따로 알려 주세요.</span></p>
        ${isShared()
          ? `<p class="hint">${icon('device', 15)}<span>팀원이 <b>자기 휴대폰·노트북</b>에서 링크를 열면 바로 이 화면 팀원 목록에 나타나요.</span></p>`
          : `<p class="hint">${icon('users', 15)}<span>지금은 <b>이 브라우저 안</b>에만 저장돼요. 시연할 땐 '새 창에서 열기'로 다른 사람처럼 들어와 보세요.</span></p>`}
      </div>
      <div class="modal__foot"><button class="btn btn--ghost" type="button" id="invOpen">${icon('external', 16)}새 창에서 열기</button><button class="btn btn--accent" type="button" data-close>확인</button></div>`;
    d.querySelectorAll('[data-close]').forEach(b => b.onclick = () => d.close());
    $('#invCopy', d).onclick = async () => { const ok = await copyText(inviteUrl(), $('#invLink', d)); toast(ok ? '초대 링크를 복사했어요' : '링크를 길게 눌러 복사해 주세요'); };
    $('#invOpen', d).onclick = () => { window.open(inviteUrl(), '_blank', 'noopener'); };
    d._opener = document.activeElement;
    $('#invLink', d).value = inviteUrl();
    d.showModal();
  }

  /* ---------- 연결 실패 화면 ---------- */
  function showInitError(where) {
    const box = document.createElement('div');
    box.className = 'netfail';
    box.innerHTML = `<div class="card netfail__card" role="alert">${icon('cloud', 28)}<h1>서버에 연결하지 못했어요</h1>
      <p>인터넷 연결을 확인하거나 잠시 뒤 다시 열어 주세요.<br>Supabase 무료 프로젝트는 오래 안 쓰면 잠들어요 — 대시보드에서 <b>Restore</b>를 눌러 깨워 주세요.</p>
      <button class="btn btn--accent" type="button" onclick="location.reload()">다시 시도</button></div>`;
    (where || document.body).replaceChildren(box);
  }

  /* ---------- 입장 확인: '나'가 없으면 입장 화면으로 ---------- */
  function requireMe() {
    if (initError) { showInitError(); return false; }
    if (team.meId()) return true;
    location.replace('join.html' + (/[?&]invite=/.test(location.search) ? '?invite=1' : ''));
    return false;
  }

  /* ---------- 상단바·사이드바 ---------- */
  function toolHref(t) { return t.status === '준비 중' || !t.href ? '' : t.href; }
  function renderShell(page) {
    const side = $('#side');
    const navItem = (href, ic, label, active, extra) => href
      ? `<a class="nav__item${active ? ' is-active' : ''}" href="${esc(href)}"${active ? ' aria-current="page"' : ''}${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ''}>${icon(ic, 18)}<span>${esc(label)}</span>${extra || ''}</a>`
      : `<span class="nav__item is-disabled" aria-disabled="true">${icon(ic, 18)}<span>${esc(label)}</span>${extra || ''}</span>`;
    side.innerHTML = `
      <div class="side__head">
        <a class="brand" href="index.html" aria-label="${esc(TEAM.name)} 허브 홈">
          <span class="brand__logo" aria-hidden="true">${icon('chart', 18)}</span>
          <span class="brand__txt"><b>${esc(TEAM.name)}</b><small>${esc(TEAM.sub || '')}</small></span>
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
        ${TEAM.links.length ? `<div class="nav__group">
          <p class="nav__label">바로가기</p>
          ${TEAM.links.map(l => navItem(l.href, l.icon, l.name, false, '<span class="nav__ext">' + icon('external', 14) + '</span>')).join('')}
        </div>` : ''}
      </nav>
      <div class="side__foot">
        <div class="theme" role="group" aria-label="화면 테마">
          <button type="button" data-theme-btn="dark" aria-pressed="${!isLight()}" aria-label="다크">${icon('moon', 16)}</button>
          <button type="button" data-theme-btn="light" aria-pressed="${isLight()}" aria-label="라이트">${icon('sun', 16)}</button>
        </div>
        <p class="side__note">${isShared() ? '<span class="live-dot" aria-hidden="true"></span>실시간 DB 연결<br>Supabase' : '시연용 데모<br>이 브라우저에만 저장돼요'}</p>
      </div>`;

    const top = $('#top');
    top.innerHTML = `
      <button class="icon-btn top__menu" type="button" id="sideOpen" aria-label="메뉴 열기" aria-controls="side" aria-expanded="false">${icon('menu', 22)}</button>
      <form class="search" role="search" id="searchForm">
        ${icon('search', 18)}
        <input id="searchInput" type="search" placeholder="툴 검색" aria-label="업무 툴 검색" autocomplete="off">
        <kbd>/</kbd>
      </form>
      <div class="top__end">
        <button class="icon-btn" type="button" id="bellBtn" aria-label="알림">${icon('bell', 20)}</button>
        <div class="profile">
          <button class="profile__btn" type="button" id="profileBtn" aria-haspopup="menu" aria-expanded="false" aria-controls="profileMenu"></button>
          <div class="menu" id="profileMenu" role="menu" hidden></div>
        </div>
      </div>`;

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
    side.querySelectorAll('[data-theme-btn]').forEach(b => b.onclick = () => setTheme(b.dataset.themeBtn === 'light'));

    // 프로필 버튼·메뉴
    const pb = $('#profileBtn'), pm = $('#profileMenu');
    function paintProfile() {
      const me = team.me(); if (!me) return;
      const st = team.status(me.id);
      pb.innerHTML = `<span class="av-wrap">${avatar(me.id, 'av--lg')}<i class="st st--${st} st--badge" aria-hidden="true"></i></span><span class="profile__name">${esc(me.name)}</span>`;
      pb.setAttribute('aria-label', `내 프로필: ${me.name}, ${ST[st]}`);
      if (!pm.hidden) return;
      const manual = team.manualStatus(me.id);
      pm.innerHTML = `
        <div class="menu__head">${avatar(me.id, 'av--lg')}<div><b>${esc(me.name)}</b><small>${esc(me.role)} · ${esc(TEAM.name)}</small></div></div>
        <p class="menu__label">내 상태</p>
        <div class="status-pick" role="group" aria-label="내 상태">
          ${[['online', '온라인'], ['meeting', '회의 중'], ['away', '자리 비움']].map(([k, l]) => `<button type="button" role="menuitemradio" aria-checked="${manual === k}" data-status="${k}"><i class="st st--${k}" aria-hidden="true"></i>${l}</button>`).join('')}
        </div>
        <button type="button" role="menuitem" id="menuInvite">${icon('userPlus', 16)}<span>팀원 초대하기</span></button>
        <button type="button" role="menuitem" id="menuTheme">${icon('sun', 16)}<span>테마 바꾸기</span></button>
        <button type="button" role="menuitem" id="menuOut">${icon('logout', 16)}<span>이 창에서 나가기</span></button>
        <button type="button" role="menuitem" id="menuReset" class="is-danger">${icon('reset', 16)}<span>데모 전체 초기화</span></button>`;
      pm.querySelectorAll('[data-status]').forEach(b => b.onclick = async () => { menu(false); await team.setStatus(b.dataset.status); paintProfile(); emit('hub:team'); toast(`내 상태를 '${ST[b.dataset.status]}'(으)로 바꿨어요`); });
      $('#menuInvite').onclick = () => { menu(false); openInvite(); };
      $('#menuTheme').onclick = () => { setTheme(!isLight()); menu(false); };
      $('#menuOut').onclick = async () => { await team.signOut(); location.replace('join.html'); };
      $('#menuReset').onclick = async () => {
        menu(false);
        let pw = '';
        if (isShared()) {
          pw = prompt('모든 팀원의 화면에서 팀원·회의·활동이 전부 지워져요.\n계속하려면 입장 비밀번호를 입력하세요.');
          if (pw === null) return;
        } else if (!confirm('이 브라우저에 저장된 팀원·회의·활동을 모두 지우고 처음 상태로 돌아갈까요?')) return;
        try { await team.resetAll(pw); location.replace('join.html'); }
        catch (e) { toast(e.message === 'wrong_password' ? '비밀번호가 맞지 않아요' : '초기화하지 못했어요'); }
      };
    }
    const menu = (on) => { if (on) { pm.hidden = true; paintProfile(); } pm.hidden = !on; pb.setAttribute('aria-expanded', String(on)); if (on) pm.querySelector('button').focus(); };
    pb.onclick = (e) => { e.stopPropagation(); menu(pm.hidden); };
    document.addEventListener('click', (e) => { if (!pm.hidden && !e.target.closest('.profile')) menu(false); });
    pm.addEventListener('keydown', (e) => { if (e.key === 'Escape') { menu(false); pb.focus(); } });
    paintProfile();
    document.addEventListener('hub:team', paintProfile);
    document.addEventListener('hub:tick', paintProfile);

    $('#bellBtn').onclick = () => toast('새 알림이 없어요');

    const si = $('#searchInput');
    si.addEventListener('input', () => document.dispatchEvent(new CustomEvent('hub:search', { detail: si.value.trim() })));
    $('#searchForm').onsubmit = (e) => { e.preventDefault(); document.dispatchEvent(new CustomEvent('hub:search', { detail: si.value.trim() })); };

    backend.startLive();
    setInterval(() => emit('hub:tick'), 4000);   // 오프라인 전환·'회의 중' 자동 변화 반영
  }

  // 페이지 시작: 데이터 준비 → 입장 확인 → 페이지 코드
  function boot(fn) { ready.then(() => { if (requireMe()) fn(); }); }

  window.Hub = { TOOLS, TEAM, $, esc, icon, store, sess, meetings, activity, team, ST, member, shortName, avatar, avatars, ymd, parseYmd, addDays, weekStart, toMin, dayLabel, ago, DOW, pad, toast, renderShell, toolHref, setTheme, isLight, requireMe, openInvite, inviteUrl, copyText, ready, boot, isShared, showInitError, get initError() { return initError; }, get mode() { return backend ? backend.mode : null; } };
})();
