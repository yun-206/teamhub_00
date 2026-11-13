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
    chat: '<path d="M5 18.5V7a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 7v7a2.5 2.5 0 0 1-2.5 2.5H9z"/><path d="M8.5 9h7M8.5 12.5h4.5"/>',
    send: '<path d="M4.5 12L20 4.5l-4 15.5-4.2-6.3z"/><path d="M11.8 13.7L20 4.5"/>',
    edit: '<path d="M4.5 19.5l1-4L15.5 5.5a2.1 2.1 0 0 1 3 3L8.5 18.5z"/><path d="M13.5 7.5l3 3"/>',
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
  const K = { v: 'teamhub-v', members: 'teamhub-members', me: 'teamhub-me', meetings: 'teamhub-meetings', activity: 'teamhub-activity', pres: 'teamhub-p:', myStatus: 'teamhub-mystatus', notices: 'teamhub-notices', messages: 'teamhub-messages', seen: 'teamhub-seen:' };
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
  const state = { members: [], meetings: [], activity: [], notices: [], messages: [], online: {}, lastSeen: {}, meId: null };   // meId: Supabase 모드에서 whoami()가 알려 준 이 기기의 팀원
  const byAtDesc = (a, b) => b.at - a.at;
  const newId = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
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
      state.notices = arr(K.notices).slice().sort(byAtDesc);
      state.messages = arr(K.messages).slice().sort((a, b) => a.at - b.at);
    },
    async checkPassword(pw) { return pw === TEAM.password; },
    async memberNames(pw) { if (pw !== TEAM.password) throw new Error('wrong_password'); await this.load(); return state.members.map(m => ({ name: m.name, role: m.role })); },
    // 이 탭의 '나': 탭 전용(sessionStorage) → 없으면 이 기기 기본(localStorage)
    meId() { const id = sess.get(K.me, null) || store.get(K.me, null); return id && state.members.some(m => m.id === id) ? id : null; },
    signIn(id, asTabOnly) { sess.set(K.me, id); const dev = store.get(K.me, null); if (!asTabOnly || !dev || !state.members.some(m => m.id === dev)) store.set(K.me, id); },
    async signOut() { const id = this.meId(); await this.leave(); sess.del(K.me); if (store.get(K.me, null) === id) store.del(K.me); },
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
      const item = Object.assign({ id: newId('u'), createdAt: Date.now() }, m);
      state.meetings = state.meetings.concat(item).sort(byDate); store.set(K.meetings, state.meetings); return item;
    },
    async removeMeeting(id) { state.meetings = state.meetings.filter(m => m.id !== id); store.set(K.meetings, state.meetings); },
    async addActivity(a) { state.activity = [a].concat(state.activity).slice(0, 30); store.set(K.activity, state.activity); },
    async addNotice(n) { const item = Object.assign({ id: newId('n'), at: Date.now() }, n); state.notices = [item].concat(state.notices); store.set(K.notices, state.notices); return item; },
    async removeNotice(id) { state.notices = state.notices.filter(n => n.id !== id); store.set(K.notices, state.notices); },
    async sendMessage(m) { const item = Object.assign({ id: newId('d'), at: Date.now(), readAt: null }, m); state.messages = state.messages.concat(item); store.set(K.messages, state.messages); return item; },
    async markRead(me, other) {
      let changed = false;
      state.messages.forEach(m => { if (m.to === me && m.from === other && !m.readAt) { m.readAt = Date.now(); changed = true; } });
      if (changed) store.set(K.messages, state.messages);
    },
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
      window.addEventListener('pageshow', (e) => { if (e.persisted) { beat(); this.load().then(emitAll); } });
      window.addEventListener('storage', async (e) => {
        if (e.key && !e.key.startsWith('teamhub-')) return;
        await this.load();
        if (!team.meId()) { location.replace('join.html'); return; }
        if (e.key === null || e.key === K.members || (e.key || '').startsWith(K.pres)) emit('hub:team');
        if (e.key === null || e.key === K.meetings) { emit('hub:meetings'); emit('hub:team'); }
        if (e.key === null || e.key === K.activity) emit('hub:activity');
        if (e.key === null || e.key === K.notices) emit('hub:notices');
        if (e.key === null || e.key === K.messages) emit('hub:messages');
      });
    },
  };

  /* ---------- Supabase 백엔드 ---------- */
  let sb = null, channel = null;
  const fromMember = (r) => ({ id: r.id, name: r.name, role: r.role, joinedAt: Date.parse(r.joined_at) || 0 });
  const fromMeeting = (r) => ({ id: r.id, title: r.title, date: r.date, start: r.start_time, end: r.end_time, place: r.place || '', attendees: r.attendees || [], by: r.created_by, createdAt: Date.parse(r.created_at) || 0 });
  const fromNotice = (r) => ({ id: r.id, tag: r.tag, title: r.title, body: r.body || '', author: r.author, at: Date.parse(r.created_at) || 0 });
  const fromMessage = (r) => ({ id: r.id, from: r.sender, to: r.recipient, body: r.body, at: Date.parse(r.created_at) || 0, readAt: r.read_at ? Date.parse(r.read_at) : null });
  const fromActivity = (r) => ({ who: r.who, what: r.what, where: r.place || '', at: Date.parse(r.at) || 0 });
  function check(res) { if (res.error) throw res.error; return res.data; }
  const errMsg = (e) => String((e && (e.message || e.msg)) || e || '');
  /* v9 보안: 기기마다 익명 로그인 → 입장(join_team)하면 그 기기가 팀원에 연결(member_devices)
     → 다음부터 whoami()로 바로 들어옴. 모든 표는 RLS로 '입장한 기기'만, 쪽지는 보낸·받은 사람만 */
  const supabaseBackend = {
    mode: 'supabase',
    async session() { const r = await sb.auth.getSession(); return r && r.data ? r.data.session : null; },
    async ensureSession() {
      if (await this.session()) return;
      const r = await sb.auth.signInAnonymously();
      if (r.error) throw new Error(/anonymous/i.test(errMsg(r.error)) ? 'anon_disabled' : errMsg(r.error));
    },
    meId() { return state.meId && state.members.some(m => m.id === state.meId) ? state.meId : null; },
    signIn() {},              // 입장한 기기는 서버(member_devices)가 기억 → 브라우저에 따로 저장할 것 없음
    async signOut() { await this.leave(); },
    async loadMembers() { state.members = check(await sb.from('members').select('*').order('joined_at')).map(fromMember); },
    async loadMeetings() { state.meetings = check(await sb.from('meetings').select('*').order('date').order('start_time')).map(fromMeeting).sort(byDate); },
    async loadActivity() { state.activity = check(await sb.from('activity').select('*').order('at', { ascending: false }).limit(30)).map(fromActivity); },
    async loadNotices() { state.notices = check(await sb.from('notices').select('*').order('created_at', { ascending: false }).limit(50)).map(fromNotice); },
    // 쪽지: 내가 보냈거나 받은 것만 가져옴
    async loadMessages() {
      const me = team.meId();
      state.messages = me ? check(await sb.from('messages').select('*').or(`sender.eq.${me},recipient.eq.${me}`).order('created_at').limit(500)).map(fromMessage) : [];
    },
    async load() {
      // 로그인(익명) 전이거나 입장 안 한 기기면 아무것도 못 읽음 → 입장 화면으로
      // meId는 끝까지 확인한 뒤에 바꿈 (중간에 비우면 그 사이 화면 갱신이 알림을 다시 띄울 수 있음)
      const clear = () => { state.meId = null; state.members = []; state.meetings = []; state.activity = []; state.notices = []; state.messages = []; };
      if (!(await this.session())) { clear(); return; }
      const me = check(await sb.rpc('whoami'));
      if (!me) { clear(); return; }
      state.meId = me.id;
      await this.loadMembers(); await Promise.all([this.loadMeetings(), this.loadActivity(), this.loadNotices(), this.loadMessages()]);
    },
    async checkPassword(pw) { return !!check(await sb.rpc('check_password', { p_password: pw })); },
    async memberNames(pw) {
      const r = await sb.rpc('member_names', { p_password: pw });
      if (r.error) throw new Error(/wrong_password/.test(errMsg(r.error)) ? 'wrong_password' : errMsg(r.error));
      return Array.isArray(r.data) ? r.data : [];
    },
    async join(pw, name, role) {
      await this.ensureSession();
      const res = await sb.rpc('join_team', { p_password: pw, p_name: name, p_role: role });
      if (res.error) throw new Error(/wrong_password/.test(errMsg(res.error)) ? 'wrong_password' : (errMsg(res.error) || 'join_failed'));
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
    async addNotice(n) {
      const item = fromNotice(check(await sb.from('notices').insert({ tag: n.tag, title: n.title, body: n.body || '', author: n.author }).select().single()));
      if (!state.notices.some(x => x.id === item.id)) state.notices = [item].concat(state.notices);
      return item;
    },
    async removeNotice(id) { check(await sb.from('notices').delete().eq('id', id)); state.notices = state.notices.filter(n => n.id !== id); },
    async sendMessage(m) {
      const item = fromMessage(check(await sb.from('messages').insert({ sender: m.from, recipient: m.to, body: m.body }).select().single()));
      if (!state.messages.some(x => x.id === item.id)) state.messages = state.messages.concat(item);
      return item;
    },
    async markRead(me, other) {
      if (!state.messages.some(m => m.to === me && m.from === other && !m.readAt)) return;
      check(await sb.from('messages').update({ read_at: new Date().toISOString() }).eq('recipient', me).eq('sender', other).is('read_at', null));
      state.messages.forEach(m => { if (m.to === me && m.from === other && !m.readAt) m.readAt = Date.now(); });
    },
    async resetAll(pw) {
      const res = await sb.rpc('reset_demo', { p_password: pw });
      if (res.error) throw new Error(/wrong_password/.test(errMsg(res.error)) ? 'wrong_password' : errMsg(res.error));
      if (channel) { try { await channel.untrack(); } catch (e) {} }
      try { await sb.auth.signOut(); } catch (e) {}
      state.meId = null;
      sess.keys().filter(k => k.startsWith('teamhub-')).forEach(k => sess.del(k)); store.del(K.me);
    },
    // 접속 상태: Realtime Presence (창을 닫으면 서버가 알아서 빼 줌)
    isOnline(id) { return id === team.meId() || !!state.online[id] || (state.lastSeen[id] && Date.now() - state.lastSeen[id] < GRACE); },   // 지금 이 화면을 보는 나는 항상 접속 중
    manual(id) { const o = state.online[id]; return (o && o.status) || (id === team.meId() ? store.get(K.myStatus + ':' + id, 'online') : 'online'); },
    async setStatus(s) { const id = team.meId(); if (!id) return; store.set(K.myStatus + ':' + id, s); state.online[id] = { status: s }; if (channel) await channel.track({ status: s, at: Date.now() }); },
    // '이 기기에서 나가기': 이 기기 연결만 끊음(팀원 기록은 그대로) → 다음엔 비밀번호 + 이름으로 다시
    async leave() {
      if (channel) { try { await channel.untrack(); } catch (e) {} }
      try { check(await sb.rpc('leave_device')); } catch (e) { console.warn(e); }
      try { await sb.auth.signOut(); } catch (e) {}
      state.meId = null;
    },
    startLive() {
      const id = team.meId();
      let t = {};
      const reload = (what) => { clearTimeout(t[what]); t[what] = setTimeout(async () => {
        try {
          if (what === 'members') {
            const me = check(await sb.rpc('whoami'));
            if (!me) { location.replace('join.html'); return; }   // 초기화됐거나 이 기기 연결이 끊김
            await this.loadMembers(); emit('hub:team');
          }
          if (what === 'meetings') { await this.loadMeetings(); emit('hub:meetings'); emit('hub:team'); }
          if (what === 'activity') { await this.loadActivity(); emit('hub:activity'); }
          if (what === 'notices') { await this.loadNotices(); emit('hub:notices'); }
          if (what === 'messages') { await this.loadMessages(); emit('hub:messages'); }
        } catch (e) { netError(e); }
      }, 150); };
      channel = sb.channel('teamhub', { config: { presence: { key: id } } });
      ['members', 'meetings', 'activity', 'notices', 'messages'].forEach(tb => channel.on('postgres_changes', { event: '*', schema: 'public', table: tb }, () => reload(tb)));
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
          try { await this.load(); if (!team.meId()) { location.replace('join.html'); return; } emitAll(); } catch (e) { netError(e); }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          toast('실시간 연결이 잠깐 끊겼어요 · 다시 연결하는 중');
        }
      });
      window.addEventListener('pageshow', (e) => { if (e.persisted) this.load().then(emitAll).catch(netError); });
    },
  };

  function emitAll() { ['hub:team', 'hub:meetings', 'hub:activity', 'hub:notices', 'hub:messages'].forEach(emit); }
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
        // 익명 로그인 세션을 이 브라우저에 유지 → 한 번 입장한 기기는 다음부터 바로 들어옴
        sb = window.supabase.createClient(SB.url, SB.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'teamhub-auth' } });
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
    async add(m) { return backend.addMeeting(Object.assign({ createdAt: Date.now() }, m)); },
    async remove(id) { return backend.removeMeeting(id); },
    canRemove(m) { const me = team.meId(); return !!me && (m.by === me || (m.attendees || []).includes(me)); },   // 만든 사람·참석자만 (DB 규칙과 같음)
    upcoming(n) { const k = nowKey(); return state.meetings.filter(m => (m.date + ' ' + m.end) > k).slice(0, n || 5); },
    nowFor(id) { const k = nowKey(), d = k.slice(0, 10), t = k.slice(11); return state.meetings.find(m => m.date === d && m.start <= t && m.end > t && (m.attendees || []).includes(id)); },
  };
  const activity = {
    all() { return state.activity.slice(); },
    async add(what, where) { const me = team.meId(); if (!me) return; try { await backend.addActivity({ who: me, what, where: where || '', at: Date.now() }); } catch (e) { console.warn(e); } },
  };
  const notices = {
    all() { return state.notices.slice().sort(byAtDesc); },
    get(id) { return state.notices.find(n => n.id === id) || null; },
    async add(n) {
      const item = await backend.addNotice({ tag: n.tag || '공지', title: n.title, body: n.body || '', author: team.meId() });
      activity.add('공지를 올렸어요', n.title);
      return item;
    },
    async remove(id) { return backend.removeNotice(id); },
  };
  // 쪽지: 화면에는 나와 관련된 것만 (DB 쪽 조회도 나와 관련된 것만 가져옴)
  const messages = {
    mine() { const me = team.meId(); return state.messages.filter(m => m.from === me || m.to === me); },
    thread(other) { const me = team.meId(); return state.messages.filter(m => (m.from === me && m.to === other) || (m.from === other && m.to === me)).sort((a, b) => a.at - b.at); },
    last(other) { const t = this.thread(other); return t[t.length - 1] || null; },
    unreadFrom(other) { const me = team.meId(); return state.messages.filter(m => m.to === me && m.from === other && !m.readAt).length; },
    unreadTotal() { const me = team.meId(); return state.messages.filter(m => m.to === me && !m.readAt).length; },
    async send(to, body) { return backend.sendMessage({ from: team.meId(), to, body }); },
    async markRead(other) { try { await backend.markRead(team.meId(), other); } catch (e) { console.warn(e); } },
  };
  // 알림: 다른 사람이 올린 공지 / 나한테 온 쪽지 / 다른 사람이 나를 넣어 잡은 회의
  // 알림: 다른 사람이 올린 공지 / 나한테 온 쪽지 / 다른 사람이 나를 넣어 잡은 회의
  //  안 읽음 기준 — 공지·회의: 종 패널(또는 그 화면)을 마지막으로 본 시각 이후 / 쪽지: 실제로 안 읽은 쪽지
  const KINDS = ['notice', 'message', 'meeting'];
  const notifs = {
    seenAt(kind) { const me = team.me(); if (!me) return Date.now(); const all = store.get(K.seen + me.id, null) || {}; return kind ? (all[kind] || me.joinedAt || 0) : Math.min(...KINDS.map(k => all[k] || me.joinedAt || 0)); },
    list() {
      const me = team.meId(); if (!me) return [];
      const nm = (id) => member(id).name;
      const out = [];
      state.notices.filter(n => n.author !== me).forEach(n => out.push({ id: 'n:' + n.id, kind: 'notice', who: n.author, at: n.at, text: `${nm(n.author)} 님이 공지를 올렸어요`, sub: n.title, href: 'notices.html#n-' + n.id }));
      state.messages.filter(m => m.to === me).forEach(m => out.push({ id: 'd:' + m.id, kind: 'message', who: m.from, at: m.at, read: !!m.readAt, text: `${nm(m.from)} 님의 쪽지`, sub: m.body, href: 'messages.html?to=' + encodeURIComponent(m.from) }));
      state.meetings.filter(m => m.by && m.by !== me && (m.attendees || []).includes(me) && m.createdAt).forEach(m => out.push({ id: 'm:' + m.id, kind: 'meeting', who: m.by, at: m.createdAt, text: `${nm(m.by)} 님이 회의에 초대했어요`, sub: `${m.title} · ${dayLabel(m.date)} ${m.start}`, href: 'meeting.html?date=' + m.date }));
      return out.sort(byAtDesc).slice(0, 30);
    },
    isUnread(x) { return x.kind === 'message' ? !x.read : x.at > this.seenAt(x.kind); },
    unread() { return this.list().filter(x => this.isUnread(x)); },
    markSeen(kind) { const me = team.meId(); if (!me) return; const all = store.get(K.seen + me, null) || {}; (kind ? [kind] : KINDS).forEach(k => { all[k] = Date.now(); }); store.set(K.seen + me, all); },
  };
  const team = {
    list() { return state.members.slice(); },
    get(id) { return state.members.find(m => m.id === id) || null; },
    findByName(name) { return state.members.find(m => m.name === name) || null; },
    // '나': 로컬 = 탭 전용(sessionStorage) → 없으면 이 기기 기본(localStorage) / Supabase = 이 기기에 연결된 팀원(whoami)
    meId() { return backend ? backend.meId() : null; },
    me() { return this.get(this.meId()); },
    signIn(id, asTabOnly) { return backend.signIn(id, asTabOnly); },
    signOut() { return backend.signOut(); },
    checkPassword(pw) { return backend.checkPassword(pw); },
    memberNames(pw) { return backend.memberNames(pw); },   // 비밀번호가 맞으면 [{name, role}] (입장 화면 안내용)
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

  /* ---------- 공지 쓰기 모달 (허브·공지 페이지 공용) ---------- */
  const TAGS = ['공지', '자료', '일정'];
  function openNoticeEditor() {
    let d = $('#noticeDialog');
    if (!d) {
      d = document.createElement('dialog');
      d.className = 'modal'; d.id = 'noticeDialog'; d.setAttribute('aria-labelledby', 'ntdTitle');
      d.innerHTML = `<form method="dialog" id="ntForm" novalidate>
        <div class="modal__head"><h2 id="ntdTitle">공지 쓰기</h2><button class="icon-btn" type="button" data-close aria-label="닫기">${icon('close', 20)}</button></div>
        <div class="modal__body">
          <fieldset class="fld"><legend>분류</legend><div class="seg" role="radiogroup">${TAGS.map((t, i) => `<label><input type="radio" name="ntTag" value="${t}"${i ? '' : ' checked'}><span>${t}</span></label>`).join('')}</div></fieldset>
          <label class="fld"><span>제목 <em>*</em></span><input type="text" id="ntfTitle" maxlength="60" placeholder="예: 11월 셋째 주 시연 일정 안내" autocomplete="off"><small class="fld__err" id="ntfErr"></small></label>
          <label class="fld"><span>내용</span><textarea id="ntfBody" maxlength="1000" rows="6" placeholder="팀원들에게 알릴 내용을 적어 주세요"></textarea><small class="fld__count" id="ntfCount">0 / 1000</small></label>
          <p class="hint">${icon('bell', 15)}<span>올리면 팀원들의 <b>알림</b>과 <b>공지사항</b>에 바로 떠요.</span></p>
        </div>
        <div class="modal__foot"><button class="btn btn--ghost" type="button" data-close>취소</button><button class="btn btn--accent" type="submit" id="ntfSave">올리기</button></div>
      </form>`;
      document.body.appendChild(d);
      d.querySelectorAll('[data-close]').forEach(b => b.onclick = () => d.close());
      d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
      d.addEventListener('close', () => { if (d._opener && d._opener.focus && document.contains(d._opener)) d._opener.focus(); });
      $('#ntfBody', d).addEventListener('input', () => { $('#ntfCount', d).textContent = `${$('#ntfBody', d).value.length} / 1000`; });
      $('#ntForm', d).addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = $('#ntfTitle', d).value.trim(), body = $('#ntfBody', d).value.trim(), tag = d.querySelector('input[name=ntTag]:checked').value;
        $('#ntfErr', d).textContent = title ? '' : '제목을 적어 주세요';
        $('#ntfTitle', d).closest('.fld').classList.toggle('is-err', !title);
        if (!title) { $('#ntfTitle', d).focus(); return; }
        const btn = $('#ntfSave', d); btn.disabled = true;
        try { const item = await notices.add({ tag, title, body }); d.close(); toast('공지를 올렸어요 · 팀원들에게 알림이 가요'); emit('hub:notices'); emit('hub:activity'); document.dispatchEvent(new CustomEvent('hub:notice-added', { detail: item.id })); }
        catch (er) { console.warn(er); toast('공지를 올리지 못했어요 · 연결을 확인해 주세요'); }
        finally { btn.disabled = false; }
      });
    }
    d._opener = document.activeElement;
    $('#ntForm', d).reset(); $('#ntfErr', d).textContent = ''; $('#ntfTitle', d).closest('.fld').classList.remove('is-err'); $('#ntfCount', d).textContent = '0 / 1000';
    d.showModal();
    setTimeout(() => $('#ntfTitle', d).focus(), 30);
  }

  /* ---------- 연결 실패 화면 ---------- */
  function showInitError(where) {
    const box = document.createElement('div');
    box.className = 'netfail';
    // whoami 같은 함수가 없다고 하면 → DB 설정(setup.sql)이 예전 버전
    const oldSql = /whoami|PGRST202|Could not find the function|does not exist/i.test(errMsg(initError) + ' ' + ((initError && initError.code) || ''));
    box.innerHTML = `<div class="card netfail__card" role="alert">${icon('cloud', 28)}<h1>서버에 연결하지 못했어요</h1>
      <p>${oldSql ? '서버 설정이 예전 버전이에요.<br>관리자: Supabase SQL Editor에서 최신 <b>supabase/setup.sql</b>을 다시 Run해 주세요.' : '인터넷 연결을 확인하거나 잠시 뒤 다시 열어 주세요.<br>Supabase 무료 프로젝트는 오래 안 쓰면 잠들어요 — 대시보드에서 <b>Restore</b>를 눌러 깨워 주세요.'}</p>
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
          ${navItem('notices.html', 'megaphone', '공지사항', page === 'notices')}
          ${navItem('messages.html', 'chat', '쪽지', page === 'messages', '<em class="pill pill--count" id="navMsgCount" hidden></em>')}
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
        <div class="notif">
          <button class="icon-btn" type="button" id="bellBtn" aria-label="알림" aria-haspopup="dialog" aria-expanded="false" aria-controls="notifPanel">${icon('bell', 20)}<i class="badge" id="bellBadge" hidden></i></button>
          <div class="notif__panel" id="notifPanel" role="dialog" aria-label="알림" hidden></div>
        </div>
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
        <button type="button" role="menuitem" id="menuOut">${icon('logout', 16)}<span>${isShared() ? '이 기기에서 나가기' : '이 창에서 나가기'}</span></button>
        <button type="button" role="menuitem" id="menuReset" class="is-danger">${icon('reset', 16)}<span>데모 전체 초기화</span></button>`;
      pm.querySelectorAll('[data-status]').forEach(b => b.onclick = async () => { menu(false); await team.setStatus(b.dataset.status); paintProfile(); emit('hub:team'); toast(`내 상태를 '${ST[b.dataset.status]}'(으)로 바꿨어요`); });
      $('#menuInvite').onclick = () => { menu(false); openInvite(); };
      $('#menuTheme').onclick = () => { setTheme(!isLight()); menu(false); };
      $('#menuOut').onclick = async () => { await team.signOut(); location.replace('join.html'); };
      $('#menuReset').onclick = async () => {
        menu(false);
        let pw = '';
        if (isShared()) {
          pw = prompt('모든 팀원의 화면에서 팀원·회의·공지·쪽지·활동이 전부 지워져요.\n계속하려면 입장 비밀번호를 입력하세요.');
          if (pw === null) return;
        } else if (!confirm('이 브라우저에 저장된 팀원·회의·공지·쪽지·활동을 모두 지우고 처음 상태로 돌아갈까요?')) return;
        try { await team.resetAll(pw); location.replace('join.html'); }
        catch (e) { toast(e.message === 'wrong_password' ? '비밀번호가 맞지 않아요' : '초기화하지 못했어요'); }
      };
    }
    const menu = (on) => { if (on) { pm.hidden = true; paintProfile(); } pm.hidden = !on; pb.setAttribute('aria-expanded', String(on)); if (on) pm.querySelector('button').focus(); };
    pb.onclick = (e) => { e.stopPropagation(); if (!$('#notifPanel').hidden) $('#bellBtn').click(); menu(pm.hidden); };
    document.addEventListener('click', (e) => { if (!pm.hidden && !e.target.closest('.profile')) menu(false); });
    pm.addEventListener('keydown', (e) => { if (e.key === 'Escape') { menu(false); pb.focus(); } });
    paintProfile();
    document.addEventListener('hub:team', paintProfile);
    document.addEventListener('hub:tick', paintProfile);

    // ---- 알림 패널 ----
    const bb = $('#bellBtn'), np = $('#notifPanel');
    const KIND_IC = { notice: 'megaphone', message: 'chat', meeting: 'calendar' };
    function paintBell() {
      const n = notifs.unread().length, badge = $('#bellBadge');
      badge.hidden = !n; badge.textContent = n > 9 ? '9+' : String(n);
      bb.setAttribute('aria-label', n ? `알림 ${n}개 읽지 않음` : '알림');
      const mc = messages.unreadTotal(), nb = $('#navMsgCount');
      if (nb) { nb.hidden = !mc; nb.textContent = String(mc); }
      if (!np.hidden) paintPanel();
    }
    function paintPanel() {
      const list = notifs.list();
      np.innerHTML = `<div class="notif__head"><b>알림</b>${list.some(x => x.kind !== 'message' && notifs.isUnread(x)) ? '<button type="button" class="link-btn" id="notifAll">모두 읽음</button>' : ''}</div>
        ${list.length ? `<ul class="notif__list">${list.map(x => `<li><a class="nt${notifs.isUnread(x) ? ' is-unread' : ''}" href="${esc(x.href)}">
            <span class="nt__av">${avatar(x.who, 'av--lg')}<i class="nt__kind nt__kind--${x.kind}">${icon(KIND_IC[x.kind], 10)}</i></span>
            <span class="nt__txt"><b>${esc(x.text)}</b><small>${esc(x.sub)}</small></span>
            <span class="nt__when">${esc(ago(x.at))}</span></a></li>`).join('')}</ul>`
          : `<p class="empty empty--box">${icon('bell', 22)}<b>새 알림이 없어요</b><span>공지·쪽지·회의 초대가 오면 여기에 보여요</span></p>`}`;
      const all = $('#notifAll', np); if (all) all.onclick = () => { notifs.markSeen('notice'); notifs.markSeen('meeting'); paintBell(); };
    }
    const panel = (on) => { np.hidden = !on; bb.setAttribute('aria-expanded', String(on)); if (on) { paintPanel(); const f = np.querySelector('a, button'); if (f) f.focus(); } else { notifs.markSeen('notice'); notifs.markSeen('meeting'); paintBell(); } };
    bb.onclick = (e) => { e.stopPropagation(); menu(false); panel(np.hidden); };
    document.addEventListener('click', (e) => { if (!np.hidden && !e.target.closest('.notif')) panel(false); });
    np.addEventListener('keydown', (e) => { if (e.key === 'Escape') { panel(false); bb.focus(); } });
    np.addEventListener('click', (e) => { if (e.target.closest('a.nt')) { notifs.markSeen('notice'); notifs.markSeen('meeting'); } });
    // 새 알림이 실시간으로 도착하면 토스트 + 종 흔들기
    let known = new Set(notifs.list().map(x => x.id));
    function onData() {
      const list = notifs.list(), fresh = list.filter(x => !known.has(x.id) && x.at > Date.now() - 60000);
      known = new Set(list.map(x => x.id));
      if (fresh.length && !(page === 'messages' && fresh.every(x => x.kind === 'message' && new URLSearchParams(location.search).get('to') === x.who && !document.hidden))) {
        toast(`🔔 ${fresh[0].text}${fresh.length > 1 ? ` 외 ${fresh.length - 1}개` : ''}`);
        bb.classList.remove('is-ring'); void bb.offsetWidth; bb.classList.add('is-ring');
      }
      paintBell();
    }
    ['hub:notices', 'hub:messages', 'hub:meetings', 'hub:team'].forEach(ev => document.addEventListener(ev, onData));
    paintBell();

    const si = $('#searchInput');
    si.addEventListener('input', () => document.dispatchEvent(new CustomEvent('hub:search', { detail: si.value.trim() })));
    $('#searchForm').onsubmit = (e) => { e.preventDefault(); document.dispatchEvent(new CustomEvent('hub:search', { detail: si.value.trim() })); };

    backend.startLive();
    setInterval(() => emit('hub:tick'), 4000);   // 오프라인 전환·'회의 중' 자동 변화 반영
  }

  // 페이지 시작: 데이터 준비 → 입장 확인 → 페이지 코드
  function boot(fn) { ready.then(() => { if (requireMe()) fn(); }); }

  window.Hub = { TOOLS, TEAM, $, esc, icon, store, sess, meetings, activity, team, notices, messages, notifs, openNoticeEditor, TAGS, ST, member, shortName, avatar, avatars, ymd, parseYmd, addDays, weekStart, toMin, dayLabel, ago, DOW, pad, toast, renderShell, toolHref, setTheme, isLight, requireMe, openInvite, inviteUrl, copyText, ready, boot, isShared, showInitError, get initError() { return initError; }, get mode() { return backend ? backend.mode : null; } };
})();
