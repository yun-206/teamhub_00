/* 쪽지 — 왼쪽 대화 상대 목록, 오른쪽 대화창 (모바일은 목록 ↔ 대화창 전환) */
window.Hub.boot(function () {
  'use strict';
  const H = window.Hub, { $, esc, icon, team, ST } = H;
  H.renderShell('messages');
  document.querySelectorAll('[data-ic]').forEach(el => { el.outerHTML = icon(el.dataset.ic, 18); });

  const params = new URLSearchParams(location.search);
  let current = params.get('to');
  if (current && (!team.get(current) || current === team.meId())) current = null;
  let draft = {};          // 상대별 쓰다 만 글
  let sending = false;
  let renderedFor = null;  // 지금 대화창에 그려진 상대
  const narrow = () => window.matchMedia('(max-width: 760px)').matches;
  const fmtTime = (ts) => { const d = new Date(ts); return `${H.pad(d.getHours())}:${H.pad(d.getMinutes())}`; };
  const dayKey = (ts) => H.ymd(new Date(ts));

  function others() {
    const meId = team.meId();
    return team.list().filter(m => m.id !== meId)
      .map(m => ({ m, last: H.messages.last(m.id), un: H.messages.unreadFrom(m.id) }))
      .sort((a, b) => ((b.last && b.last.at) || 0) - ((a.last && a.last.at) || 0) || a.m.joinedAt - b.m.joinedAt);
  }

  function renderList() {
    const list = others();
    $('#convList').innerHTML = list.length ? list.map(({ m, last, un }) => {
      const st = team.status(m.id);
      return `<li><a class="conv${m.id === current ? ' is-active' : ''}${un ? ' is-unread' : ''}" href="messages.html?to=${encodeURIComponent(m.id)}" data-to="${esc(m.id)}"${m.id === current ? ' aria-current="true"' : ''}>
        <span class="av-wrap">${H.avatar(m.id, 'av--lg')}<i class="st st--${st} st--badge" aria-hidden="true"></i></span>
        <span class="conv__txt"><b>${esc(m.name)}<small>${esc(m.role)}</small></b><span>${last ? (last.from === team.meId() ? '나: ' : '') + esc(last.body) : '<em>아직 주고받은 쪽지가 없어요</em>'}</span></span>
        <span class="conv__end">${last ? `<time>${esc(H.ago(last.at))}</time>` : ''}${un ? `<i class="badge badge--sm">${un}</i>` : ''}</span>
      </a></li>`;
    }).join('')
      : `<li class="empty empty--box">${icon('users', 22)}<b>아직 쪽지를 보낼 팀원이 없어요</b><span>초대한 팀원이 들어오면 여기에 보여요</span><button class="btn btn--ghost btn--sm" type="button" id="dmInvite">${icon('userPlus', 16)}팀원 초대하기</button></li>`;
    const inv = $('#dmInvite'); if (inv) inv.onclick = () => H.openInvite();
  }

  function renderThread(focusInput) {
    const box = $('#thread');
    $('#dm').classList.toggle('show-thread', !!current);
    if (!current) {
      renderedFor = null;
      box.innerHTML = `<div class="dm__empty">${icon('chat', 28)}<b>팀원을 골라 쪽지를 보내 보세요</b><span>보낸 쪽지는 상대방의 알림에 바로 떠요</span></div>`;
      return;
    }
    const m = H.member(current), st = team.status(current), meId = team.meId();
    const msgs = H.messages.thread(current);
    let lastDay = '';
    const body = msgs.map((x, i) => {
      const mine = x.from === meId, d = dayKey(x.at);
      const sep = d !== lastDay ? `<p class="bub-day"><span>${esc(H.dayLabel(d))}</span></p>` : ''; lastDay = d;
      const isLastMine = mine && !msgs.slice(i + 1).some(y => y.from === meId);
      return `${sep}<div class="bub${mine ? ' bub--me' : ''}"><p>${esc(x.body)}</p><span class="bub__meta">${mine && isLastMine ? (x.readAt ? '읽음 · ' : '안 읽음 · ') : ''}${fmtTime(x.at)}</span></div>`;
    }).join('');
    const head = `
        <button class="icon-btn dm__back" type="button" id="dmBack" aria-label="대화 상대 목록으로">${icon('back', 20)}</button>
        <span class="av-wrap">${H.avatar(current, 'av--lg')}<i class="st st--${st} st--badge" aria-hidden="true"></i></span>
        <span class="dm__who"><b>${esc(m.name)}</b><small>${esc(m.role)} · ${ST[st]}</small></span>`;
    const list = body || `<p class="dm__first">${esc(m.name)} 님에게 첫 쪽지를 보내 보세요 👋</p>`;

    // 같은 대화를 다시 그릴 때(새 쪽지·읽음 표시 등 실시간 갱신)는 머리와 말풍선만 바꾸고
    // 입력창·폼은 그대로 둔다 — textarea를 새로 만들면 한글 IME 조합이 끊겨 자모로 깨짐(v7 수정)
    const oldInput = $('#dmInput');
    if (renderedFor === current && oldInput) {
      const msgBox = $('#dmMsgs');
      const atBottom = msgBox.scrollHeight - msgBox.scrollTop - msgBox.clientHeight < 40;
      const grew = msgs.length !== +(msgBox.dataset.count || 0);
      $('.dm__head').innerHTML = head;
      $('#dmBack').onclick = () => open(null);
      if (msgBox.innerHTML !== list) msgBox.innerHTML = list;
      msgBox.dataset.count = msgs.length;
      if (atBottom || grew) msgBox.scrollTop = msgBox.scrollHeight;
      if (focusInput) oldInput.focus(narrow() ? { preventScroll: true } : undefined);
      markRead();
      return;
    }

    renderedFor = current;
    box.innerHTML = `
      <header class="dm__head">${head}
      </header>
      <div class="dm__msgs" id="dmMsgs" tabindex="0" aria-label="${esc(m.name)} 님과의 쪽지" data-count="${msgs.length}">${list}</div>
      <form class="dm__form" id="dmForm">
        <textarea id="dmInput" rows="1" maxlength="500" placeholder="${esc(m.name)} 님에게 쪽지 쓰기" aria-label="쪽지 내용"></textarea>
        <button class="btn btn--accent dm__send" type="submit" id="dmSend" aria-label="보내기">${icon('send', 18)}</button>
      </form>`;
    const input = $('#dmInput');
    input.value = draft[current] || ''; grow(input);
    const msgBox = $('#dmMsgs'); msgBox.scrollTop = msgBox.scrollHeight;
    input.addEventListener('input', () => { draft[current] = input.value; grow(input); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#dmForm').requestSubmit(); } });
    $('#dmForm').addEventListener('submit', send);
    $('#dmBack').onclick = () => open(null);
    if (focusInput && !narrow()) input.focus();
    else if (focusInput) input.focus({ preventScroll: true });
    markRead();
  }
  function grow(t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 140) + 'px'; }

  async function send(e) {
    e.preventDefault();
    const input = $('#dmInput'), text = input.value.trim();
    if (!text || sending) return;
    sending = true; $('#dmSend').disabled = true;
    try {
      await H.messages.send(current, text);
      input.value = ''; draft[current] = ''; grow(input);
      renderList(); renderThread(true);
    } catch (er) { console.warn(er); H.toast('쪽지를 보내지 못했어요 · 연결을 확인해 주세요'); }
    finally { sending = false; const b = $('#dmSend'); if (b) b.disabled = false; }
  }

  // 대화창이 보이는 동안 받은 쪽지는 읽음 처리
  async function markRead() {
    if (!current || document.hidden || !H.messages.unreadFrom(current)) return;
    await H.messages.markRead(current);
    renderList();
    document.dispatchEvent(new CustomEvent('hub:messages'));   // 종 배지·사이드바 숫자 갱신
  }

  function open(id) {
    current = id;
    history.replaceState(null, '', id ? `messages.html?to=${encodeURIComponent(id)}` : 'messages.html');
    renderList(); renderThread(true);
  }
  $('#convList').addEventListener('click', (e) => { const a = e.target.closest('a[data-to]'); if (!a) return; e.preventDefault(); open(a.dataset.to); });

  document.addEventListener('hub:messages', () => { renderList(); renderThread(false); });
  document.addEventListener('hub:team', () => { renderList(); if (current) { const h = $('.dm__who small'); if (h) h.textContent = `${H.member(current).role} · ${ST[team.status(current)]}`; } });
  document.addEventListener('visibilitychange', markRead);
  renderList();
  renderThread(!!current);
});
