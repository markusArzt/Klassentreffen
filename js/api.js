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

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }

  // ── PUBLIC API ───────────────────────────────────────────────────────────

  /** Fetch all current data: days, votes, participants */
  async function getData() {
    return request('getData');
  }

  /**
   * Save or update a participant's votes.
   * votes: { "2025-07-05_Linz": true, "2025-07-05_Wien": true, ... }
   */
  async function saveVotes(name, votes) {
    return request('saveVotes', { name, votes });
  }

  /** Admin: verify password */
  async function verifyAdmin(password) {
    return request('verifyAdmin', { password });
  }

  /** Admin: set days available for voting */
  async function setDays(days) {
    return request('setDays', { days });
  }

  /** Admin: change admin password */
  async function changePassword(oldPassword, newPassword) {
    return request('changePassword', { oldPassword, newPassword });
  }

  return { getData, saveVotes, verifyAdmin, setDays, changePassword };
})();
