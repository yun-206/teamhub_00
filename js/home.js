/* 허브 메인 — 벤토 카드 렌더링 */
(function () {
  'use strict';
  const H = window.Hub, { $, esc, icon, MOCK, TOOLS } = H;
  H.renderShell('home');

  document.querySelectorAll('[data-ic]').forEach(el => { el.outerHTML = icon(el.dataset.ic, 18); });
  $('#upIcon').outerHTML = icon('calendar', 18);
  $('#upArrow').outerHTML = icon('arrow', 14);
  $('#plusIc').outerHTML = icon('plus', 16);

  /* 인사 + 요약 */
  const now = new Date(), me = H.member('me');
  const hi = now.getHours() < 12 ? '좋은 아침이에요' : now.getHours() < 18 ? '좋은 오후예요' : '오늘도 수고했어요';
  $('#today').textContent = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${H.DOW[now.getDay()]}요일`;
  $('#hello').textContent = `${hi}, ${me.name.slice(1)} 님`;
  function renderStats() {
    const ws = H.ymd(H.weekStart(now)), we = H.ymd(H.addDays(H.weekStart(now), 6));
    const week = H.meetings.all().filter(m => m.date >= ws && m.date <= we).length;
    const live = TOOLS.filter(t => t.status !== '준비 중').length;
    $('#stats').innerHTML = [
      [week, '이번 주 회의'],
      [live, '바로 쓸 수 있는 툴'],
      [TOOLS.length - live, '준비 중인 툴'],
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
      </a></li>`).join('') : '<li class="empty">다가오는 회의가 없어요</li>';
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
      ? `<div class="card tool c-4 is-soon" data-q="${esc((t.name + ' ' + t.desc + ' ' + (t.tags || []).join(' ')).toLowerCase())}" aria-label="${esc(t.name)}, 준비 중">${inner}</div>`
      : `<a class="card tool c-4" href="${esc(href)}"${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ''} data-q="${esc((t.name + ' ' + t.desc + ' ' + (t.tags || []).join(' ')).toLowerCase())}">${inner}</a>`;
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

  /* 공지·활동·팀원 */
  $('#noticeList').innerHTML = MOCK.notices.map(n => `<li><span class="tag${n.tag === '공지' ? '' : ' tag--gray'}">${esc(n.tag)}</span><span class="grow">${esc(n.title)}</span><time>${esc(n.date)}</time></li>`).join('');
  $('#activityList').innerHTML = MOCK.activity.map(a => `<li class="act">${H.avatar(a.who)}<span class="grow"><b>${esc(H.member(a.who).name)}</b> 님이 ${esc(a.what)}<small>${esc(a.where)}</small></span><span class="when">${esc(a.ago)}</span></li>`).join('');
  const ST = { online: '온라인', meeting: '회의 중', away: '자리 비움', offline: '오프라인' };
  $('#teamList').innerHTML = MOCK.members.map(m => `<li>${H.avatar(m.id)}<span class="grow who"><b>${esc(m.name)}${m.id === 'me' ? ' <span class="muted" style="font-weight:500">(나)</span>' : ''}</b><small>${esc(m.role)}</small></span><span class="st st--${m.status}" aria-hidden="true"></span><span class="when">${ST[m.status]}</span></li>`).join('');
  $('#onlineCount').textContent = `온라인 ${MOCK.members.filter(m => m.status === 'online').length}명`;

  function refresh() { renderStats(); renderUpcoming(); }
  renderTools('');
  refresh();
  document.addEventListener('hub:meetings', refresh);
  window.addEventListener('storage', (e) => { if (e.key === 'teamhub-meetings') refresh(); });
  window.addEventListener('pageshow', (e) => { if (e.persisted) refresh(); });   // 뒤로 가기로 돌아와도 최신 일정
})();
