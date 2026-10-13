/**
 * Link Shelf — Google Sheets backend (Google Apps Script)
 *
 * Paste this whole file into Extensions → Apps Script of your Google Sheet,
 * change SECRET below, then Deploy → New deployment → Web app.
 * See README.md for the full step-by-step.
 */

// 1) CHANGE THIS to your own long password. The website asks for it once.
const SECRET = 'change-me-to-a-long-secret';

const SHEET_NAME = 'Links';
const HEADERS = ['id', 'title', 'url', 'tags', 'note', 'pinned', 'opens', 'lastOpened', 'created'];

/* ---------------- HTTP entry points ---------------- */

function doGet(e) {
  return handle_(e && e.parameter ? e.parameter : {});
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return json_({ ok: false, error: 'Bad request body' }); }
  return handle_(body);
}

function handle_(req) {
  if (SECRET === 'change-me-to-a-long-secret') {
    return json_({ ok: false, error: 'Set your own SECRET in Code.gs and redeploy.' });
  }
  if (req.key !== SECRET) return json_({ ok: false, error: 'Wrong secret key.' });

  const action = req.action || 'list';
  if (action === 'list') return ok_();

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    switch (action) {
      case 'add':    addLinks_(req.links || []); break;
      case 'update': updateLink_(req.id, req.patch || {}); break;
      case 'delete': deleteLink_(req.id); break;
      case 'open':   openLink_(req.id); break;
      default: return json_({ ok: false, error: 'Unknown action: ' + action });
    }
  } finally {
    lock.releaseLock();
  }
  return ok_();
}

/* ---------------- Actions ---------------- */

function addLinks_(items) {
  const sheet = getSheet_();
  const existing = new Set(readAll_().map(l => l.url));
  const now = new Date();
  const rows = [];
  items.forEach(it => {
    const url = String(it.url || '').trim();
    if (!/^https?:\/\//i.test(url) || existing.has(url)) return;
    existing.add(url);
    rows.push([
      Utilities.getUuid().slice(0, 8),
      safe_(it.title || url),
      url,
      safe_((it.tags || []).join(', ')),
      safe_(it.note || ''),
      !!it.pinned,
      0,
      '',
      now
    ]);
  });
  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
  }
}

function updateLink_(id, patch) {
  const sheet = getSheet_();
  const row = findRow_(sheet, id);
  if (!row) return;
  const cols = { title: 2, url: 3, tags: 4, note: 5, pinned: 6 };
  Object.keys(patch).forEach(k => {
    if (!cols[k]) return;
    let v = patch[k];
    if (k === 'tags') v = (v || []).join(', ');
    if (k === 'pinned') v = !!v; else v = safe_(v);
    sheet.getRange(row, cols[k]).setValue(v);
  });
}

function deleteLink_(id) {
  const sheet = getSheet_();
  const row = findRow_(sheet, id);
  if (row) sheet.deleteRow(row);
}

function openLink_(id) {
  const sheet = getSheet_();
  const row = findRow_(sheet, id);
  if (!row) return;
  const opens = Number(sheet.getRange(row, 7).getValue()) || 0;
  sheet.getRange(row, 7, 1, 2).setValues([[opens + 1, new Date()]]);
}

/* ---------------- Helpers ---------------- */

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readAll_() {
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const values = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  return values
    .filter(r => r[0] && r[2])
    .map(r => ({
      id: String(r[0]),
      title: String(r[1]),
      url: String(r[2]),
      tags: String(r[3] || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
      note: String(r[4] || ''),
      pinned: r[5] === true || String(r[5]).toUpperCase() === 'TRUE',
      opens: Number(r[6]) || 0,
      lastOpened: r[7] instanceof Date ? r[7].getTime() : 0,
      created: r[8] instanceof Date ? r[8].getTime() : 0
    }));
}

function findRow_(sheet, id) {
  if (!id) return 0;
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return 0;
}

// Stop text like "=SOMETHING()" from being treated as a formula.
function safe_(v) {
  v = String(v == null ? '' : v).slice(0, 2000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function ok_() {
  return json_({ ok: true, links: readAll_(), sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl() });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
