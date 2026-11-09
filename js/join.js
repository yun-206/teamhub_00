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
    if (!team.list().length) $('#jIntro').textContent = '아직 아무도 없는 팀 허브예요. 비밀번호를 입력하고 첫 팀원으로 들어오세요.';
    else if (!invited) $('#jIntro').textContent = '비밀번호를 입력하고 다시 들어오세요.';
    $('#jNote').innerHTML = H.isShared()
      ? `<span class="live-dot" aria-hidden="true"></span>실시간 DB(Supabase)에 저장돼요 · 팀원 ${team.list().length}명`
      : '시연용 데모예요. 입력한 정보는 이 브라우저에만 저장돼요.';

    const err = (fid, eid, msg) => { $('#' + eid).textContent = msg; $('#' + fid).closest('.fld').classList.toggle('is-err', !!msg); return !msg; };
    const busy = (btn, on, label) => { btn.disabled = on; if (label) btn.textContent = label; };
    const step = (n) => {
      $('#pwForm').hidden = n !== 1; $('#infoForm').hidden = n !== 2;
      $('#s1Dot').classList.toggle('is-on', n === 1); $('#s1Dot').classList.toggle('is-done', n === 2);
      $('#s2Dot').classList.toggle('is-on', n === 2);
      setTimeout(() => (n === 1 ? $('#fPw') : $('#fName')).focus(), 30);
    };

    let pw = '';
    $('#pwForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = $('#fPw').value, btn = $('#pwForm button[type=submit]');
      if (!err('fPw', 'ePw', v ? '' : '비밀번호를 입력해 주세요')) return;
      busy(btn, true, '확인 중…');
      let ok = false;
      try { ok = await team.checkPassword(v); } catch (er) { err('fPw', 'ePw', '서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요'); busy(btn, false, '다음'); return; }
      busy(btn, false, '다음');
      if (!err('fPw', 'ePw', ok ? '' : '비밀번호가 맞지 않아요')) { $('#fPw').select(); return; }
      pw = v;
      step(2);
    });
    $('#backPw').onclick = () => step(1);

    // 이미 있는 이름이면 '다시 들어오기'로 안내 (같은 사람으로 이어서)
    $('#fName').addEventListener('input', () => {
      const m = team.findByName($('#fName').value.trim().replace(/\s+/g, ' '));
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
        else err('fName', 'eName', '들어가지 못했어요. 연결을 확인하고 다시 시도해 주세요');
        return;
      }
      team.signIn(res.member.id, invited);
      try { sessionStorage.setItem('teamhub-welcome', res.isNew ? 'new' : 'back'); } catch (er) {}
      location.replace('index.html');
    });

    step(1);
  });
})();
