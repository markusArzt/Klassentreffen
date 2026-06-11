/**
 * app.js
 * Main application logic for the voting tab and results tab.
 */

// ── STATE ────────────────────────────────────────────────────────────────────
const State = {
  currentUser: null,       // name of the logged-in participant
  days: [],                // array of day strings e.g. ["2025-07-05", ...]
  votes: {},               // { participantName: { "2025-07-05_Linz": true, ... } }
  orte: ['Linz', 'Salzburg', 'Wien'],
  defaultOrte: [],         // indices into orte[], loaded from sessionStorage
};

// ── SESSION STORAGE ──────────────────────────────────────────────────────────
function loadSession() {
  State.currentUser = sessionStorage.getItem('klass_user') || null;
  try {
    State.defaultOrte = JSON.parse(sessionStorage.getItem('klass_defaults') || '[]');
  } catch {
    State.defaultOrte = [];
  }
}

function saveSession() {
  if (State.currentUser) sessionStorage.setItem('klass_user', State.currentUser);
  sessionStorage.setItem('klass_defaults', JSON.stringify(State.defaultOrte));
}

// ── TOAST ────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 2800);
}

// ── TAB SWITCHING ────────────────────────────────────────────────────────────
function showTab(name) {
  ['abstimmen', 'ergebnisse', 'admin'].forEach(t => {
    document.getElementById('tab-' + t).style.display = t === name ? 'block' : 'none';
  });
  document.querySelectorAll('.tab').forEach((el, i) => {
    el.classList.toggle('active', ['abstimmen', 'ergebnisse', 'admin'][i] === name);
  });
  if (name === 'ergebnisse') renderResults();
}

// ── FORMAT DAY ───────────────────────────────────────────────────────────────
function formatDay(dateStr) {
  // Parse manually to avoid browser timezone/Invalid Date issues
  // Expected format: "YYYY-MM-DD"
  if (!dateStr || typeof dateStr !== 'string') return '?';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${dayNames[d.getDay()]}, ${d.getDate()}. ${monthNames[d.getMonth()]}`;
}

// ── LOAD DATA FROM API ───────────────────────────────────────────────────────
async function loadData() {
  try {
    const data = await API.getData();
    State.days = data.days || [];
    State.votes = data.votes || {};
    renderVotingTab();
    renderParticipants();
  } catch (e) {
    showToast('Fehler beim Laden der Daten', 'error');
    console.error(e);
  }
}

// ── DEFAULT ORTE CHIPS ───────────────────────────────────────────────────────
function renderDefaultChips() {
  const container = document.getElementById('ort-chips');
  container.innerHTML = '';
  State.orte.forEach((ort, i) => {
    const chip = document.createElement('div');
    chip.className = 'ort-chip' + (State.defaultOrte.includes(i) ? ' active' : '');
    chip.textContent = ort;
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      State.defaultOrte = [...container.querySelectorAll('.ort-chip')]
        .map((c, idx) => c.classList.contains('active') ? idx : -1)
        .filter(x => x >= 0);
      saveSession();
    });
    container.appendChild(chip);
  });
}

// ── VOTING MATRIX ────────────────────────────────────────────────────────────
function getUserVotes() {
  if (!State.currentUser) return {};
  return State.votes[State.currentUser] || {};
}

function renderVotingTab() {
  const matrix = document.getElementById('vote-matrix');
  matrix.innerHTML = '';

  const userVotes = getUserVotes();
  const favKey = getFavoriteKey();

  State.days.forEach(day => {
    const row = document.createElement('div');
    const isFav = State.orte.some(ort => `${day}_${ort}` === favKey);
    row.className = 'matrix-row' + (isFav ? ' favorite' : '');

    // Day cell
    const dayCell = document.createElement('div');
    dayCell.className = 'day-cell';
    const anyChecked = State.orte.some(ort => userVotes[`${day}_${ort}`]);
    dayCell.innerHTML = `
      <div class="day-check ${anyChecked ? 'checked' : ''}"></div>
      <div class="day-label">${formatDay(day)}</div>
    `;
    dayCell.addEventListener('click', () => toggleDay(row, day));
    row.appendChild(dayCell);

    // Vote cells
    State.orte.forEach(ort => {
      const key = `${day}_${ort}`;
      const cell = document.createElement('div');
      cell.className = 'vote-cell';
      const isYes = !!userVotes[key];
      const isFavCell = key === favKey;
      const btn = document.createElement('div');
      btn.className = 'vote-btn' + (isYes ? ' yes' : '') + (isFavCell && isYes ? ' fav' : '');
      btn.textContent = isYes ? '✓' : '';
      btn.dataset.key = key;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleVote(btn, row, day);
      });
      cell.appendChild(btn);
      row.appendChild(cell);
    });

    matrix.appendChild(row);
  });

  if (State.days.length === 0) {
    matrix.innerHTML = '<div class="empty-state">Noch keine Tage eingetragen. Admin muss zuerst Tage hinzufügen.</div>';
  }
}

function toggleDay(row, day) {
  const check = row.querySelector('.day-check');
  const isChecked = check.classList.contains('checked');
  const userVotes = getUserVotes();

  if (isChecked) {
    check.classList.remove('checked');
    State.orte.forEach(ort => {
      userVotes[`${day}_${ort}`] = false;
    });
  } else {
    check.classList.add('checked');
    State.orte.forEach((ort, i) => {
      if (State.defaultOrte.includes(i)) {
        userVotes[`${day}_${ort}`] = true;
      }
    });
  }

  if (!State.votes[State.currentUser]) State.votes[State.currentUser] = {};
  Object.assign(State.votes[State.currentUser], userVotes);
  renderVotingTab();
}

function toggleVote(btn, row, day) {
  if (!State.currentUser) {
    showToast('Bitte zuerst Namen eingeben', 'error');
    return;
  }
  const key = btn.dataset.key;
  if (!State.votes[State.currentUser]) State.votes[State.currentUser] = {};
  const current = !!State.votes[State.currentUser][key];
  State.votes[State.currentUser][key] = !current;

  // update day checkbox state
  const userVotes = getUserVotes();
  const anyChecked = State.orte.some(ort => userVotes[`${day}_${ort}`]);
  const check = row.querySelector('.day-check');
  check.classList.toggle('checked', anyChecked);

  renderVotingTab();
}

// ── PARTICIPANTS ─────────────────────────────────────────────────────────────
function renderParticipants() {
  const list = document.getElementById('participants-list');
  const names = Object.keys(State.votes);
  list.innerHTML = '';

  if (names.length === 0) {
    list.innerHTML = '<span class="participants-empty">Noch niemand abgestimmt</span>';
    return;
  }

  names.forEach(name => {
    const tag = document.createElement('span');
    tag.className = 'participant-tag' + (name === State.currentUser ? ' active-user' : '');
    tag.textContent = name;
    list.appendChild(tag);
  });
}

// ── NAME / LOGIN ─────────────────────────────────────────────────────────────
function handleNameLoad() {
  const input = document.getElementById('name-input');
  const name = input.value.trim();
  if (!name) { showToast('Bitte Namen eingeben', 'error'); return; }
  State.currentUser = name;
  saveSession();
  renderVotingTab();
  renderParticipants();
  showToast(`Willkommen, ${name}!`, 'success');
}

// ── SAVE VOTES ───────────────────────────────────────────────────────────────
async function saveVotes() {
  if (!State.currentUser) {
    showToast('Bitte zuerst Namen eingeben', 'error');
    return;
  }
  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const userVotes = State.votes[State.currentUser] || {};
    await API.saveVotes(State.currentUser, userVotes);
    showToast('Abstimmung gespeichert!', 'success');
    await loadData();
  } catch (e) {
    showToast('Fehler beim Speichern', 'error');
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Speichern';
  }
}

// ── RESULTS ──────────────────────────────────────────────────────────────────
function getTallies() {
  // Returns { "2025-07-05_Linz": count, ... }
  const tallies = {};
  Object.values(State.votes).forEach(userVotes => {
    Object.entries(userVotes).forEach(([key, val]) => {
      if (val) tallies[key] = (tallies[key] || 0) + 1;
    });
  });
  return tallies;
}

function getFavoriteKey() {
  const tallies = getTallies();
  let maxKey = null, maxVal = 0;
  Object.entries(tallies).forEach(([key, val]) => {
    if (val > maxVal) { maxVal = val; maxKey = key; }
  });
  return maxKey;
}

function renderResults() {
  const container = document.getElementById('results-container');
  container.innerHTML = '';

  const tallies = getTallies();
  const favKey = getFavoriteKey();
  const maxCount = favKey ? tallies[favKey] : 0;

  // Favorite badge
  const titleEl = document.getElementById('results-title');
  const existing = titleEl.querySelector('.favorite-badge');
  if (existing) existing.remove();
  if (favKey) {
    const [day, ort] = favKey.split('_');
    const badge = document.createElement('span');
    badge.className = 'favorite-badge';
    badge.textContent = `⭐ ${formatDay(day)} – ${ort}`;
    titleEl.appendChild(badge);
  }

  if (State.days.length === 0) {
    container.innerHTML = '<div class="empty-state">Noch keine Daten vorhanden.</div>';
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'result-wrap';

  // Header
  const header = document.createElement('div');
  header.className = 'result-header';
  header.innerHTML = `
    <div class="result-header-cell">Tag</div>
    ${State.orte.map(o => `<div class="result-header-cell">${o[0]}</div>`).join('')}
  `;
  wrap.appendChild(header);

  State.days.forEach(day => {
    const isFavRow = State.orte.some(ort => `${day}_${ort}` === favKey);
    const row = document.createElement('div');
    row.className = 'result-row' + (isFavRow ? ' fav-row' : '');

    const dayCell = document.createElement('div');
    dayCell.className = 'result-day-cell';
    dayCell.textContent = formatDay(day);
    row.appendChild(dayCell);

    State.orte.forEach(ort => {
      const key = `${day}_${ort}`;
      const count = tallies[key] || 0;
      const isFavCell = key === favKey;
      const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

      // Voter names
      const voters = Object.entries(State.votes)
        .filter(([, v]) => v[key])
        .map(([name]) => name);

      const cell = document.createElement('div');
      cell.className = 'result-vote-cell' + (isFavCell ? ' fav-cell' : '');
      cell.innerHTML = `
        <span class="tally-num" ${isFavCell ? 'style="color:var(--gold)"' : ''}>${count}</span>
        <div class="tally-bar-wrap">
          <div class="tally-bar ${isFavCell ? 'fav' : ''}" style="width:${pct}%"></div>
        </div>
        ${voters.length ? `<div class="voter-names">${voters.join(', ')}</div>` : ''}
      `;
      row.appendChild(cell);
    });

    wrap.appendChild(row);
  });

  container.appendChild(wrap);
}

// ── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSession();
  renderDefaultChips();

  // Pre-fill name from session
  if (State.currentUser) {
    document.getElementById('name-input').value = State.currentUser;
  }

  // Name load button
  document.getElementById('load-btn').addEventListener('click', handleNameLoad);
  document.getElementById('name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleNameLoad();
  });

  // Save button
  document.getElementById('save-btn').addEventListener('click', saveVotes);

  // Load data
  loadData();
});
