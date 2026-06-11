/**
 * api.js
 * All communication with the Google Apps Script backend.
 * Replace SCRIPT_URL with your deployed Apps Script web app URL.
 */

const API = (() => {
  // ── CONFIG ──────────────────────────────────────────────────────────────
  // After deploying the Apps Script (see README.md), paste the URL here:
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzD7OcIInhxngWRg1hcGHmKizmf6XZie3dbC-4CfcMup4inm_LruR8cGXtg5SJ29ZnE/exec';

  // ── HELPERS ─────────────────────────────────────────────────────────────
  async function request(action, payload = {}) {
    const url = new URL(SCRIPT_URL);
    url.searchParams.set('action', action);
    url.searchParams.set('payload', JSON.stringify(payload));

    // Apps Script redirects to googleusercontent.com — we must follow and read that
    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      mode: 'cors',
      credentials: 'omit',
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    const cleaned = text.trim().replace(/^\uFEFF/, '');

    let data;
    try {
      data = JSON.parse(cleaned);
    } catch {
      throw new Error('Ungültige Antwort: ' + cleaned.slice(0, 200));
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
