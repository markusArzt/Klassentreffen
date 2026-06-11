/**
 * admin.js
 * Admin panel logic: authentication, day management, password change.
 */

const Admin = (() => {
  let isUnlocked = false;

  // ── MONTHS FOR QUICK SETUP ──────────────────────────────────────────────
  function getWeekendDays(year, month) {
    // month: 1-12
    const days = [];
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      const dow = date.getDay();
      if (dow === 0 || dow === 6) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        days.push(`${y}-${m}-${d}`);
      }
      date.setDate(date.getDate() + 1);
    }
    return days;
  }

  function renderMonthChips() {
    const container = document.getElementById('month-chips');
    container.innerHTML = '';
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = d.toLocaleDateString('de-AT', { month: 'long', year: 'numeric' });
      const chip = document.createElement('div');
      chip.className = 'month-chip';
      chip.textContent = label;
      chip.addEventListener('click', () => addMonth(d.getFullYear(), d.getMonth() + 1));
      container.appendChild(chip);
    }
  }

  async function addMonth(year, month) {
    const newDays = getWeekendDays(year, month);
    const merged = [...new Set([...State.days, ...newDays])].sort();
    await applyDays(merged);
  }

  // ── DAY LIST ─────────────────────────────────────────────────────────────
  function renderDayList() {
    const list = document.getElementById('day-list');
    list.innerHTML = '';
    if (State.days.length === 0) {
      list.innerHTML = '<span class="hint">Noch keine Tage hinzugefügt.</span>';
      return;
    }
    State.days.forEach(day => {
      const tag = document.createElement('div');
      tag.className = 'day-tag';
      const label = typeof formatDay === 'function' ? formatDay(day) : day;
      tag.innerHTML = `${label} <span class="rm">×</span>`;
      tag.querySelector('.rm').addEventListener('click', () => removeDay(day));
      list.appendChild(tag);
    });
  }

  async function removeDay(day) {
    const updated = State.days.filter(d => d !== day);
    await applyDays(updated);
  }

  async function applyDays(days) {
    try {
      await API.setDays(days);
      State.days = days;
      renderDayList();
      renderVotingTab();
      showToast('Tage aktualisiert', 'success');
    } catch (e) {
      showToast('Fehler beim Speichern der Tage', 'error');
      console.error(e);
    }
  }

  // ── AUTH ─────────────────────────────────────────────────────────────────
  async function unlock() {
    const pw = document.getElementById('admin-pw').value;
    if (!pw) return;
    const btn = document.getElementById('admin-unlock-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      await API.verifyAdmin(pw);
      isUnlocked = true;
      document.getElementById('admin-lock').style.display = 'none';
      document.getElementById('admin-content').style.display = 'block';
      renderMonthChips();
      renderDayList();
    } catch (e) {
      showToast('Falsches Passwort', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Entsperren';
    }
  }

  // ── PASSWORD CHANGE ──────────────────────────────────────────────────────
  async function changePassword() {
    const oldPw = document.getElementById('old-pw').value;
    const newPw = document.getElementById('new-pw').value;
    if (!oldPw || !newPw) { showToast('Bitte beide Felder ausfüllen', 'error'); return; }
    if (newPw.length < 4) { showToast('Passwort zu kurz (min. 4 Zeichen)', 'error'); return; }

    try {
      await API.changePassword(oldPw, newPw);
      document.getElementById('old-pw').value = '';
      document.getElementById('new-pw').value = '';
      showToast('Passwort geändert', 'success');
    } catch (e) {
      showToast('Altes Passwort falsch', 'error');
    }
  }

  // ── INIT ─────────────────────────────────────────────────────────────────
  function init() {
    document.getElementById('admin-unlock-btn').addEventListener('click', unlock);
    document.getElementById('admin-pw').addEventListener('keydown', e => {
      if (e.key === 'Enter') unlock();
    });
    document.getElementById('change-pw-btn').addEventListener('click', changePassword);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => Admin.init());
