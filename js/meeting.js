/* 회의 일정 데모 — 주간 캘린더 + 새 회의 모달 (저장: localStorage, 막히면 메모리) */
window.Hub.boot(function () {
  'use strict';
  const H = window.Hub;
  const { $, esc, icon, team } = H;
  H.renderShell('meeting');
  const fillIcons = () => document.querySelectorAll('[data-ic]').forEach(el => { el.outerHTML = icon(el.dataset.ic, el.closest('.btn') ? 16 : 18); });
  fillIcons();

  const START_H = 8, END_H = 20, HOUR_PX = 56;
  const sc = document.querySelector('.cal__scroll');
  const params = new URLSearchParams(location.search);
  let base = H.weekStart(params.get('date') ? H.parseYmd(params.get('date')) : new Date());
  let flashId = null;

  /* ---------- 캘린더 ---------- */
  // 같은 날 겹치는 회의는 나란히 배치
  function layoutDay(list) {
    const items = list.map(m => ({ m, s: H.toMin(m.start), e: H.toMin(m.end) })).sort((a, b) => a.s - b.s || b.e - a.e);
    let cluster = [], clusterEnd = -1;
    const flush = () => { const cols = Math.max(...cluster.map(x => x.col)) + 1; cluster.forEach(x => x.cols = cols); cluster = []; };
    items.forEach(it => {
      if (cluster.length && it.s >= clusterEnd) flush();
      const used = cluster.filter(x => x.e > it.s).map(x => x.col);
      let c = 0; while (used.includes(c)) c++;
      it.col = c; cluster.push(it); clusterEnd = Math.max(clusterEnd, it.e);
    });
    if (cluster.length) flush();
    return items;
  }

  function render() {
    const days = [...Array(7)].map((_, i) => H.addDays(base, i));
    const today = H.ymd(new Date());
    const all = H.meetings.all();
    const end = days[6];
    $('#range').textContent = `${base.getFullYear()}년 ${base.getMonth() + 1}월 ${base.getDate()}일 – ${end.getMonth() + 1}월 ${end.getDate()}일`;

    // 데스크톱 주간 그리드
    const hours = [...Array(END_H - START_H)].map((_, i) => START_H + i);
    let h = `<div class="week__corner"></div>` + days.map((d, i) => {
      const k = H.ymd(d);
      return `<div class="week__dh${k === today ? ' is-today' : ''}${i >= 5 ? ' is-weekend' : ''}" role="columnheader"><span>${H.DOW[d.getDay()]}</span><b>${d.getDate()}</b></div>`;
    }).join('');
    h += `<div class="week__times">${hours.map(x => `<span style="height:${HOUR_PX}px">${String(x).padStart(2, '0')}:00</span>`).join('')}</div>`;
    h += days.map((d, i) => {
      const k = H.ymd(d);
      const evs = layoutDay(all.filter(m => m.date === k));
      const slots = hours.map(x => `<button type="button" class="slot" style="height:${HOUR_PX}px" data-date="${k}" data-h="${x}" aria-label="${d.getMonth() + 1}월 ${d.getDate()}일 ${x}시에 회의 만들기"></button>`).join('');
      const blocks = evs.map(({ m, s, e, col, cols }) => {
        const top = Math.max(0, (s - START_H * 60) / 60 * HOUR_PX), bottom = Math.min((END_H - START_H) * HOUR_PX, (e - START_H * 60) / 60 * HOUR_PX);
        const mine = (m.attendees || []).includes(team.meId());
        const short = bottom - top < 44;
        return `<button type="button" class="ev${mine ? ' ev--me' : ''}${m.id === flashId ? ' is-new' : ''}${short ? ' ev--short' : ''}" data-id="${esc(m.id)}"
          style="top:${top + 1}px;height:${Math.max(22, bottom - top - 2)}px;left:calc(${(100 / cols) * col}% + 3px);width:calc(${100 / cols}% - 6px)">
          <b>${esc(m.title)}</b><span>${esc(m.start)}–${esc(m.end)}${short || !m.place ? '' : ' · ' + esc(m.place)}</span></button>`;
      }).join('');
      let nowLine = '';
      if (k === today) {
        const n = new Date(), mins = n.getHours() * 60 + n.getMinutes();
        if (mins >= START_H * 60 && mins <= END_H * 60) nowLine = `<i class="now" style="top:${(mins - START_H * 60) / 60 * HOUR_PX}px" aria-hidden="true"></i>`;
      }
      return `<div class="week__col${k === today ? ' is-today' : ''}${i >= 5 ? ' is-weekend' : ''}" role="gridcell" aria-label="${d.getMonth() + 1}월 ${d.getDate()}일 회의 ${evs.length}개">${slots}${blocks}${nowLine}</div>`;
    }).join('');
    $('#week').innerHTML = h;

    // 모바일 목록
    $('#agendaM').innerHTML = days.map(d => {
      const k = H.ymd(d), evs = all.filter(m => m.date === k);
      return `<section class="am__day${k === today ? ' is-today' : ''}">
        <h3><span>${d.getMonth() + 1}/${d.getDate()}</span> ${H.DOW[d.getDay()]}요일${k === today ? ' <em>오늘</em>' : ''}</h3>
        ${evs.length ? evs.map(m => `<button type="button" class="am__ev${(m.attendees || []).includes(team.meId()) ? ' ev--me' : ''}${m.id === flashId ? ' is-new' : ''}" data-id="${esc(m.id)}">
          <span class="am__time">${esc(m.start)}<small>${esc(m.end)}</small></span>
          <span class="am__txt"><b>${esc(m.title)}</b><small>${esc(m.place || '장소 미정')}</small></span>${H.avatars(m.attendees || [], 3)}</button>`).join('')
          : `<button type="button" class="am__empty" data-date="${k}" data-h="10">회의 없음 · 눌러서 만들기</button>`}
      </section>`;
    }).join('');
    flashId = null;
  }

  $('#prevWk').onclick = () => { base = H.addDays(base, -7); render(); };
  $('#nextWk').onclick = () => { base = H.addDays(base, 7); render(); };
  $('#todayBtn').onclick = () => { base = H.weekStart(new Date()); render(); };

  /* ---------- 새 회의 모달 ---------- */
  const dlg = $('#mtgDialog');
  const times = [];
  for (let m = START_H * 60; m <= END_H * 60; m += 30) times.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  $('#fStart').innerHTML = times.slice(0, -1).map(t => `<option>${t}</option>`).join('');
  $('#fEnd').innerHTML = times.slice(1).map(t => `<option>${t}</option>`).join('');
  // 참석자 목록은 모달을 열 때마다 지금 팀원으로 다시 그림 (그 사이 새 팀원이 들어올 수 있음)
  function renderPeople() {
    const meId = team.meId();
    const list = team.list().slice().sort((a, b) => (b.id === meId) - (a.id === meId) || a.joinedAt - b.joinedAt);
    $('#fPeople').innerHTML = list.map(m => `<label class="person"><input type="checkbox" value="${esc(m.id)}">${H.avatar(m.id)}<span><b>${esc(m.name)}${m.id === meId ? ' (나)' : ''}</b><small>${esc(m.role)}</small></span></label>`).join('');
    $('#peopleHint').hidden = list.length > 1;
  }

  let opener = null;
  function openNew(date, hour) {
    opener = document.activeElement;
    $('#mtgForm').reset();
    ['eTitle', 'eDate', 'eTime', 'ePeople'].forEach(id => $('#' + id).textContent = '');
    document.querySelectorAll('.fld.is-err').forEach(el => el.classList.remove('is-err'));
    renderPeople();
    $('#fDate').value = date || H.ymd(new Date());
    const st = String(Math.min(Math.max(hour || nextHour(), START_H), END_H - 1)).padStart(2, '0') + ':00';
    $('#fStart').value = st; syncEnd(true);
    const mine = $('#fPeople').querySelector(`input[value="${team.meId()}"]`); if (mine) mine.checked = true;
    checkConflict();
    dlg.showModal();
    setTimeout(() => $('#fTitle').focus(), 30);
  }
  function nextHour() { const n = new Date(); return n.getMinutes() ? n.getHours() + 1 : n.getHours(); }
  // 시작을 바꾸면 회의 길이를 유지한 채 종료도 같이 이동 (처음은 1시간)
  let lastStart = null;
  function syncEnd(force) {
    const s = H.toMin($('#fStart').value), e = H.toMin($('#fEnd').value);
    const dur = force || lastStart === null || e <= lastStart ? 60 : e - lastStart;
    const want = Math.min(s + dur, END_H * 60);
    $('#fEnd').value = times.find(t => H.toMin(t) === want) || times[times.length - 1];
    lastStart = s;
  }
  function picked() { return [...$('#fPeople').querySelectorAll('input:checked')].map(i => i.value); }
  // 참석자 중 같은 시간에 다른 회의가 있는 사람 안내(저장은 막지 않음)
  function checkConflict() {
    const d = $('#fDate').value, s = H.toMin($('#fStart').value), e = H.toMin($('#fEnd').value), ppl = picked();
    const hits = [];
    if (d && e > s) H.meetings.all().filter(m => m.date === d && H.toMin(m.start) < e && H.toMin(m.end) > s).forEach(m => {
      (m.attendees || []).filter(a => ppl.includes(a)).forEach(a => hits.push(`${H.member(a).name} 님은 ${m.start} '${m.title}'`));
    });
    const c = $('#conflict');
    c.hidden = !hits.length;
    c.innerHTML = hits.length ? `${icon('clock', 16)}<span>시간이 겹쳐요: ${esc(hits.slice(0, 3).join(', '))}${hits.length > 3 ? ` 외 ${hits.length - 3}건` : ''}. 그래도 저장할 수 있어요.</span>` : '';
  }
  $('#fStart').onchange = () => { syncEnd(false); checkConflict(); };
  $('#fEnd').onchange = checkConflict;
  $('#fDate').onchange = checkConflict;
  $('#fPeople').onchange = checkConflict;

  function err(fieldId, msgId, msg) { $('#' + msgId).textContent = msg; const f = $('#' + fieldId).closest('.fld'); if (f) f.classList.toggle('is-err', !!msg); return !msg; }
  let saving = false;
  $('#mtgForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = $('#fTitle').value.trim(), date = $('#fDate').value, start = $('#fStart').value, end = $('#fEnd').value, ppl = picked();
    const ok = [
      err('fTitle', 'eTitle', title ? '' : '제목을 적어 주세요'),
      err('fDate', 'eDate', /^\d{4}-\d{2}-\d{2}$/.test(date) ? '' : '날짜를 골라 주세요'),
      err('fEnd', 'eTime', H.toMin(end) > H.toMin(start) ? '' : '종료 시간이 시작보다 늦어야 해요'),
      err('fPeople', 'ePeople', ppl.length ? '' : '참석자를 한 명 이상 골라 주세요'),
    ];
    if (ok.includes(false)) { const first = document.querySelector('.fld.is-err input, .fld.is-err select'); if (first) first.focus(); return; }
    if (saving) return;
    saving = true; $('#mtgSave').disabled = true;
    let item;
    try { item = await H.meetings.add({ title, date, start, end, attendees: ppl, place: $('#fPlace').value.trim(), by: team.meId() }); }
    catch (er) { console.warn(er); H.toast('회의를 저장하지 못했어요 · 연결을 확인해 주세요'); return; }
    finally { saving = false; $('#mtgSave').disabled = false; }
    H.activity.add('회의를 잡았어요', `${title} · ${H.dayLabel(date)} ${start}`);
    try { sessionStorage.setItem('teamhub-new', item.id); } catch (er) {}
    flashId = item.id;
    base = H.weekStart(H.parseYmd(date));
    dlg.close();
    render();
    // 새 회의가 보이게 스크롤(데스크톱 그리드)
    const evEl = document.querySelector(`.ev[data-id="${item.id}"]`);
    if (evEl && sc && sc.offsetParent) sc.scrollTop = Math.max(0, evEl.offsetTop - 60);
    H.toast(`'${title}' 회의를 만들었어요 · 허브 '다가오는 일정'에도 보여요`);
  });
  const closeNew = () => dlg.close();
  $('#mtgClose').onclick = closeNew; $('#mtgCancel').onclick = closeNew;
  dlg.addEventListener('close', () => { if (opener && opener.focus) opener.focus(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });   // 바깥 클릭으로 닫기
  $('#newBtn').onclick = () => openNew();

  /* ---------- 회의 상세 ---------- */
  const dd = $('#detailDialog');
  function openDetail(id) {
    const m = H.meetings.all().find(x => x.id === id);
    if (!m) return;
    opener = document.activeElement;
    $('#dTitle').textContent = m.title;
    $('#dBody').innerHTML = `
      <p class="drow">${icon('calendar', 16)}<span>${esc(H.dayLabel(m.date))} · ${esc(m.date)}</span></p>
      <p class="drow">${icon('clock', 16)}<span>${esc(m.start)} – ${esc(m.end)}</span></p>
      <p class="drow">${icon('pin', 16)}<span>${esc(m.place || '장소 미정')}</span></p>
      <div class="dppl">${(m.attendees || []).map(a => `<span class="chip">${H.avatar(a)}${esc(H.member(a).name)}</span>`).join('')}</div>
      ${m.by ? `<p class="muted" style="font-size:13px">${esc(H.member(m.by).name)} 님이 만든 회의예요.</p>` : ''}`;
    // 삭제는 만든 사람·참석자만 (DB 규칙과 같음)
    const canDel = H.meetings.canRemove(m);
    $('#dFoot').innerHTML = `${canDel ? `<button class="btn btn--danger" type="button" id="dDel">${icon('trash', 16)}회의 삭제</button>` : '<span class="muted" style="font-size:13px;margin-right:auto">만든 사람·참석자만 지울 수 있어요</span>'}<button class="btn btn--accent" type="button" id="dOk">확인</button>`;
    $('#dOk').onclick = () => dd.close();
    if (canDel) $('#dDel').onclick = async () => {
      try { await H.meetings.remove(m.id); } catch (er) { console.warn(er); H.toast('회의를 지우지 못했어요 · 연결을 확인해 주세요'); return; }
      H.activity.add('회의를 취소했어요', m.title); dd.close(); render(); H.toast(`'${m.title}' 회의를 지웠어요`);
    };
    dd.showModal();
  }
  $('#dClose').onclick = () => dd.close();
  dd.addEventListener('close', () => { if (opener && opener.focus && document.contains(opener)) opener.focus(); });
  dd.addEventListener('click', (e) => { if (e.target === dd) dd.close(); });

  // 캘린더 클릭: 빈 칸 → 새 회의, 회의 → 상세
  document.querySelector('.cal').addEventListener('click', (e) => {
    const ev = e.target.closest('[data-id]');
    if (ev) return openDetail(ev.dataset.id);
    const slot = e.target.closest('[data-date]');
    if (slot) openNew(slot.dataset.date, Number(slot.dataset.h));
  });

  document.addEventListener('hub:meetings', render);   // 다른 탭에서 회의를 만들거나 지우면 바로 반영
  // 팀원 구성이 바뀌었을 때만 다시 그림 (8초마다 오는 상태 신호로는 다시 그리지 않음 → 포커스 유지)
  let teamSig = team.list().map(m => m.id + m.name).join() + team.meId();
  document.addEventListener('hub:team', () => {
    const sig = team.list().map(m => m.id + m.name).join() + team.meId();
    if (sig !== teamSig && !dlg.open && !dd.open) { teamSig = sig; render(); }
  });
  render();
  H.notifs.markSeen('meeting');   // 회의 화면을 열었으면 회의 초대 알림은 본 것으로
  document.dispatchEvent(new CustomEvent('hub:meetings'));
  // 9시 근처로 스크롤(데스크톱 그리드)
  if (sc) sc.scrollTop = Math.max(0, (9 - START_H) * HOUR_PX - 8);
  if (params.get('new')) openNew();
});
