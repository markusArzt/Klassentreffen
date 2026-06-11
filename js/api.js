/**
 * api.js
 * All communication with the Google Apps Script backend.
 * Replace SCRIPT_URL with your deployed Apps Script web app URL.
 */

const API = (() => {
  // ── CONFIG ──────────────────────────────────────────────────────────────
  // After deploying the Apps Script (see README.md), paste the URL here:
  const SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';

  // ── HELPERS ─────────────────────────────────────────────────────────────
  async function request(action, payload = {}) {
    // Google Apps Script requires GET with payload as query param to avoid
    // CORS preflight / 302 redirect issues from external origins
    const url = new URL(SCRIPT_URL);
    url.searchParams.set('action', action);
    url.searchParams.set('payload', JSON.stringify(payload));

    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Ungültige Antwort vom Server: ' + text.slice(0, 100));
    }

    if (data.error) throw new Error(data.error);
    return data;
  }

  // ── PUBLIC API ───────────────────────────────────────────────────────────

  async function getData() {
    return request('getData');
  }

  async function saveVotes(name, votes) {
    return request('saveVotes', { name, votes });
  }

  async function verifyAdmin(password) {
    return request('verifyAdmin', { password });
  }

  async function setDays(days) {
    return request('setDays', { days });
  }

  async function changePassword(oldPassword, newPassword) {
    return request('changePassword', { oldPassword, newPassword });
  }

  return { getData, saveVotes, verifyAdmin, setDays, changePassword };
})();
