/* 허브 메인 — 벤토 카드 렌더링 */
window.Hub.boot(function () {
  'use strict';
  const H = window.Hub;
  const { $, esc, icon, TEAM, TOOLS, team, ST } = H;
  H.renderShell('home');

  document.querySelectorAll('[data-ic]').forEach(el => { el.outerHTML = icon(el.dataset.ic, el.closest('.btn') ? 16 : 18); });
  $('#upIcon').outerHTML = icon('calendar', 18);
  $('#upArrow').outerHTML = icon('arrow', 14);
  $('#plusIc').outerHTML = icon('plus', 16);

  /* 인사 + 요약 */
  const now = new Date();
  const hi = now.getHours() < 12 ? '좋은 아침이에요' : now.getHours() < 18 ? '좋은 오후예요' : '오늘도 수고했어요';
  $('#today').textContent = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${H.DOW[now.getDay()]}요일`;
  function renderHello() {
    const me = team.me(); if (!me) return;
    let w = null;
    try { w = sessionStorage.getItem('teamhub-welcome'); sessionStorage.removeItem('teamhub-welcome'); } catch (e) {}
    $('#hello').textContent = w === 'new' ? `${TEAM.name}에 오신 걸 환영해요, ${H.shortName(me.name)} 님` : `${hi}, ${H.shortName(me.name)} 님`;
  }
  function renderStats() {
    const ws = H.ymd(H.weekStart(now)), we = H.ymd(H.addDays(H.weekStart(now), 6));
    const week = H.meetings.all().filter(m => m.date >= ws && m.date <= we).length;
    const live = TOOLS.filter(t => t.status !== '준비 중').length;
    const on = team.list().filter(m => team.status(m.id) !== 'offline').length;
    $('#stats').innerHTML = [
      [week, '이번 주 회의'],
      [live, '바로 쓸 수 있는 툴'],
      [on, '지금 접속한 팀원'],
    ].map(([n, l]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join('');
  }

  /* 다가오는 일정 */
  function renderUpcoming() {
    const list = H.meetings.upcoming(5);
    let fresh = null;
    try { fresh = sessionStorage.getItem('teamhub-new'); sessionStorage.removeItem('teamhub-new'); } catch (e) {}
    $('#upcoming').innerHTML = list.length ? list.map(m => `
      <li><a class="ag${m.id === fresh ? ' is-new' : ''}" href="meeting.html?date=${m.date}">
        <span class="ag__when"><span class="ag__day">${esc(H.dayLabel(m.date))}</span><span class="ag__time">${esc(m.start)}</span></span>
        <span style="min-width:0">
          <span class="ag__title" style="display:block">${esc(m.title)}</span>
          <span class="ag__meta"><span>${icon('pin', 13)}${esc(m.place || '장소 미정')}</span>${H.avatars(m.attendees || [], 3)}</span>
        </span>
      </a></li>`).join('') : `<li class="empty empty--box">${icon('calendar', 22)}<b>아직 잡힌 회의가 없어요</b><span>아래 버튼으로 첫 회의를 만들어 보세요</span></li>`;
  }

  /* 대표 툴 */
  const ft = TOOLS.find(t => t.featured);
  const fe = $('#feature');
  if (ft) {
    const href = H.toolHref(ft);
    const words = ft.name.split(' ');
    const name = words.length > 1 ? `${esc(words[0])} <em>${esc(words.slice(1).join(' '))}</em>` : esc(ft.name);
    fe.href = href || '#';
    if (/^https?:/.test(href)) { fe.target = '_blank'; fe.rel = 'noopener'; }
    fe.setAttribute('aria-label', `${ft.name} 열기${/^https?:/.test(href) ? ' (새 탭)' : ''}`);
    fe.innerHTML = `
      <span class="bars" aria-hidden="true"><i style="height:38%"></i><i style="height:62%"></i><i style="height:48%"></i><i style="height:84%"></i><i style="height:70%"></i><i style="height:100%"></i></span>
      <span class="feature__top"><span class="pill pill--live">${esc(ft.status)}</span><span class="pill">대표 업무 툴</span></span>
      <span>
        <span class="feature__name" style="display:block">${name}</span>
        <span class="feature__desc" style="display:block;margin-top:10px">${esc(ft.desc)}. 원본 데이터와 업데이트 파일로 결과 엑셀을 만들고 21개 규칙으로 검사해요.</span>
      </span>
      <span class="feature__foot">
        <span class="feature__meta"><span>담당 ${esc(ft.owner || '-')}</span><span>업데이트 ${esc(ft.updated || '-')}</span>${(ft.tags || []).map(t => `<span>#${esc(t)}</span>`).join('')}</span>
        <span class="feature__go">툴 열기 ${icon(/^https?:/.test(href) ? 'external' : 'arrow', 16)}</span>
      </span>`;
  } else fe.remove();

  /* 업무 툴 카드 (data/tools.js) */
  function toolCard(t) {
    const href = H.toolHref(t), soon = !href;
    const pill = t.status === '준비 중' ? '<span class="pill pill--soon">준비 중</span>' : t.status === '데모' ? '<span class="pill">데모</span>' : `<span class="pill pill--live">${esc(t.status)}</span>`;
    const inner = `
      <span class="card__head"><span class="tool__icon">${icon(t.icon, 22)}</span>${pill}</span>
      <span><span class="tool__name" style="display:block">${esc(t.name)}</span><span class="tool__desc" style="display:block;margin-top:4px">${esc(t.desc)}</span></span>
      <span class="tool__foot"><span class="tool__tags">${(t.tags || []).map(x => `<span>${esc(x)}</span>`).join('')}</span>${soon ? `<span>${esc(t.owner || '')}</span>` : `<span class="tool__arrow">${icon('arrow', 18)}</span>`}</span>`;
    return soon
      ? `<div class="card tool c-4 is-soon" aria-label="${esc(t.name)}, 준비 중">${inner}</div>`
      : `<a class="card tool c-4" href="${esc(href)}"${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`;
  }
  function renderTools(q) {
    q = (q || '').toLowerCase();
    const list = TOOLS.filter(t => !t.featured || q);   // 평소엔 대표 툴은 큰 카드로만, 검색 중엔 전부
    const hits = list.filter(t => !q || (t.name + ' ' + t.desc + ' ' + (t.tags || []).join(' ')).toLowerCase().includes(q));
    $('#tools').innerHTML = hits.map(toolCard).join('') +
      (q ? (hits.length ? '' : `<p class="empty no-match">'${esc(q)}'에 맞는 툴이 없어요</p>`)
        : `<div class="card tool tool--add c-4" role="note"><span>${icon('plus', 22)}</span><b>새 업무 툴 연결</b><span>툴 목록 데이터에 한 줄을 넣으면<br>여기에 카드가 생겨요 <code>data/tools.js</code></span></div>`);
    $('#toolCount').textContent = q ? `검색 결과 ${hits.length}개` : `전체 ${TOOLS.length}개 · 바로 쓸 수 있는 툴 ${TOOLS.filter(t => t.status !== '준비 중').length}개`;
  }
  document.addEventListener('hub:search', (e) => renderTools(e.detail));

  /* 공지 (아직 쓰기 기능 없음 → 빈 상태) */
  $('#noticeList').innerHTML = `<li class="empty empty--box">${icon('megaphone', 22)}<b>아직 올라온 공지가 없어요</b></li>`;

  /* 최근 활동 — 실제로 한 일(입장·회의 만들기/삭제)만 */
  function renderActivity() {
    const list = H.activity.all().slice(0, 6);
    $('#activityList').innerHTML = list.length ? list.map(a => `<li class="act">${H.avatar(a.who)}<span class="grow"><b>${esc(H.member(a.who).name)}</b> 님이 ${esc(a.what)}<small>${esc(a.where)}</small></span><span class="when">${esc(H.ago(a.at))}</span></li>`).join('')
      : `<li class="empty empty--box">${icon('pulse', 22)}<b>아직 활동이 없어요</b></li>`;
  }

  /* 팀원 + 접속 상태 */
  const ORDER = { online: 0, meeting: 1, away: 2, offline: 3 };
  function renderTeam() {
    const meId = team.meId();
    const list = team.list().map(m => ({ m, st: team.status(m.id) }))
      .sort((a, b) => (b.m.id === meId) - (a.m.id === meId) || ORDER[a.st] - ORDER[b.st] || a.m.joinedAt - b.m.joinedAt);
    $('#teamList').innerHTML = list.map(({ m, st }) => `<li>${H.avatar(m.id)}<span class="grow who"><b>${esc(m.name)}${m.id === meId ? ' <span class="muted" style="font-weight:500">(나)</span>' : ''}</b><small>${esc(m.role)} · ${esc(TEAM.name)}</small></span><span class="st st--${st}" aria-hidden="true"></span><span class="when">${ST[st]}</span></li>`).join('')
      + (list.length < 2 ? `<li class="empty empty--hint">초대 링크로 팀원을 불러 보세요</li>` : '');
    const on = list.filter(x => x.st !== 'offline').length;
    $('#onlineCount').textContent = `${list.length}명 · 접속 ${on}명`;
  }
  $('#inviteBtn').onclick = () => H.openInvite();

  function refresh() { renderStats(); renderUpcoming(); renderTeam(); }
  renderHello();
  renderTools('');
  refresh();
  renderActivity();
  document.addEventListener('hub:meetings', () => { renderStats(); renderUpcoming(); renderActivity(); });
  document.addEventListener('hub:team', () => { renderTeam(); renderStats(); renderActivity(); });
  document.addEventListener('hub:tick', () => { renderTeam(); renderStats(); });
  document.addEventListener('hub:activity', renderActivity);
});
