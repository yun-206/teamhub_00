/* 입장 화면 — 1) 비밀번호 2) 이름·직급 → 허브로 (팀은 전부 같은 팀) */
(function () {
  'use strict';
  const H = window.Hub, { $, esc, icon, TEAM, team } = H;
  const invited = /[?&]invite=/.test(location.search);
  $('#jLogo').innerHTML = icon('chart', 18);
  $('#jTeam').textContent = TEAM.name;
  $('#jSub').textContent = TEAM.sub || '';

  H.ready.then(() => {
    if (H.initError) { H.showInitError($('.join__card')); return; }
    // 초대 링크가 아니고 이미 들어와 있으면 바로 허브로
    if (!invited && team.meId()) { location.replace('index.html'); return; }

    $('#fTeam').textContent = TEAM.name;
    $('#fRole').innerHTML = '<option value="">직급을 골라 주세요</option>' + TEAM.roles.map(r => `<option>${esc(r)}</option>`).join('');
    // Supabase 모드는 입장 전 기기가 팀원 목록을 못 읽음(RLS) → 팀원 안내는 비밀번호를 맞힌 뒤에
    const shared = H.isShared();
    if (!shared && !team.list().length) $('#jIntro').textContent = '아직 아무도 없는 팀 허브예요. 비밀번호를 입력하고 첫 팀원으로 들어오세요.';
    else if (!invited) $('#jIntro').textContent = shared ? '전달받은 비밀번호를 입력하고 들어오세요.' : '비밀번호를 입력하고 다시 들어오세요.';
    $('#jNote').innerHTML = shared
      ? `<span class="live-dot" aria-hidden="true"></span>실시간 DB(Supabase)에 저장돼요 · 한 번 들어온 기기는 다음부터 바로 열려요`
      : '시연용 데모예요. 입력한 정보는 이 브라우저에만 저장돼요.';

    const err = (fid, eid, msg) => { $('#' + eid).textContent = msg; $('#' + fid).closest('.fld').classList.toggle('is-err', !!msg); return !msg; };
    const busy = (btn, on, label) => { btn.disabled = on; if (label) btn.textContent = label; };
    const step = (n) => {
      $('#pwForm').hidden = n !== 1; $('#infoForm').hidden = n !== 2;
      $('#s1Dot').classList.toggle('is-on', n === 1); $('#s1Dot').classList.toggle('is-done', n === 2);
      $('#s2Dot').classList.toggle('is-on', n === 2);
      setTimeout(() => (n === 1 ? $('#fPw') : $('#fName')).focus(), 30);
    };

    let pw = '', names = [];   // names: 비밀번호를 맞히면 받는 지금 팀원 [{name, role}]
    $('#pwForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = $('#fPw').value, btn = $('#pwForm button[type=submit]');
      if (!err('fPw', 'ePw', v ? '' : '비밀번호를 입력해 주세요')) return;
      busy(btn, true, '확인 중…');
      try { names = await team.memberNames(v); }
      catch (er) {
        busy(btn, false, '다음');
        err('fPw', 'ePw', er.message === 'wrong_password' ? '비밀번호가 맞지 않아요' : '서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요');
        $('#fPw').select(); return;
      }
      busy(btn, false, '다음');
      err('fPw', 'ePw', '');
      pw = v;
      $('#returnList').innerHTML = names.length
        ? `${icon('users', 15)}<span>지금 팀원 ${names.length}명: ${names.map(n => `<button type="button" class="name-chip" data-name="${esc(n.name)}">${esc(n.name)}</button>`).join('')}<small>내 이름을 누르면 이어서 들어가요 — 다른 기기에서 들어와도 같은 계정이에요</small></span>`
        : `${icon('users', 15)}<span>아직 아무도 없어요. 첫 팀원으로 들어오세요!</span>`;
      $('#returnList').querySelectorAll('[data-name]').forEach(b => b.onclick = () => { $('#fName').value = b.dataset.name; $('#fName').dispatchEvent(new Event('input')); $('#enterBtn').focus(); });
      step(2);
    });
    $('#backPw').onclick = () => step(1);

    // 이미 있는 이름이면 '다시 들어오기'로 안내 (같은 사람으로 이어서)
    $('#fName').addEventListener('input', () => {
      const v = $('#fName').value.trim().replace(/\s+/g, ' ');
      const m = names.find(x => x.name === v);
      const r = $('#returning');
      r.hidden = !m;
      if (m) { r.innerHTML = `${icon('users', 15)}<span>이미 있는 팀원이에요. <b>${esc(m.name)}</b>(${esc(m.role)}) 님으로 다시 들어가요.</span>`; if (!$('#fRole').value) $('#fRole').value = m.role; }
      $('#enterBtn').textContent = m ? '다시 들어가기' : '입장하기';
    });

    $('#infoForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#fName').value.trim().replace(/\s+/g, ' '), role = $('#fRole').value, btn = $('#enterBtn');
      const ok = [err('fName', 'eName', name ? '' : '이름을 적어 주세요'), err('fRole', 'eRole', role ? '' : '직급을 골라 주세요')];
      if (ok.includes(false)) { const f = document.querySelector('#infoForm .fld.is-err input, #infoForm .fld.is-err select'); if (f) f.focus(); return; }
      const label = btn.textContent;
      busy(btn, true, '들어가는 중…');
      let res;
      try { res = await team.join(pw, name, role); }
      catch (er) {
        busy(btn, false, label);
        if (er.message === 'wrong_password') { step(1); err('fPw', 'ePw', '비밀번호가 바뀌었어요. 다시 입력해 주세요'); }
        else if (er.message === 'anon_disabled') err('fName', 'eName', '관리자 설정이 필요해요: Supabase에서 익명 로그인(Allow anonymous sign-ins)을 켜 주세요');
        else err('fName', 'eName', '들어가지 못했어요. 연결을 확인하고 다시 시도해 주세요');
        return;
      }
      team.signIn(res.member.id, invited);
      try { sessionStorage.setItem('teamhub-welcome', res.isNew ? 'new' : 'back'); } catch (er) {}
      location.replace('index.html');
    });

    // 초대 링크로 왔는데 이 기기에 이미 입장한 사람이 있으면 → '○○ 님으로 계속하기' 먼저
    //   (실수로 링크를 다시 눌러도 다시 가입하는 것처럼 보이지 않게. 시연용 '다른 사람처럼 들어오기'는 아래 작은 버튼)
    const prev = invited ? team.me() : null;
    if (prev) {
      $('#contWho').innerHTML = `<span class="av-wrap">${H.avatar(prev.id, 'av--xl')}</span><span><b>${esc(prev.name)}</b><small>${esc(prev.role)} · ${esc(TEAM.name)}</small></span>`;
      $('#contGo').textContent = `${prev.name} 님으로 계속하기`;
      $('#contGo').onclick = () => { team.signIn(prev.id, true); location.replace('index.html'); };
      $('#contOther').onclick = () => { $('#contBox').hidden = true; $('.steps').hidden = false; step(1); };
      $('#contBox').hidden = false; $('.steps').hidden = true; $('#pwForm').hidden = true; $('#infoForm').hidden = true;
      setTimeout(() => $('#contGo').focus(), 30);
      return;
    }
    step(1);
  });
})();
