/**
 * Link Shelf — Google Sheets backend (Google Apps Script)
 * Stores links in the "Links" tab and tasks in the "Tasks" tab.
 *
 * Paste this whole file into Extensions → Apps Script of your Google Sheet,
 * change SECRET below, then Deploy → New deployment → Web app.
 * See README.md for the full step-by-step.
 */

// 1) CHANGE THIS to your own long password. The website asks for it once.
const SECRET = 'change-me-to-a-long-secret';

const SHEET_NAME = 'Links';
const HEADERS = ['id', 'title', 'url', 'tags', 'note', 'pinned', 'opens', 'lastOpened', 'created'];

const TASK_SHEET = 'Tasks';
const TASK_HEADERS = ['id', 'title', 'notes', 'status', 'progress', 'priority', 'due', 'tags', 'steps', 'created', 'updated', 'completed'];
const STATUSES = ['todo', 'doing', 'done'];
const PRIORITIES = ['', 'low', 'med', 'high'];

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
      case 'taskAdd':    addTask_(req.task || {}); break;
      case 'taskUpdate': updateTask_(req.id, req.patch || {}); break;
      case 'taskDelete': deleteTask_(req.id); break;
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

/* ---------------- Tasks ---------------- */

function addTask_(t) {
  const title = String(t.title || '').trim();
  if (!title) return;
  const sheet = getSheet_(TASK_SHEET, TASK_HEADERS);
  const now = new Date();
  const status = taskValue_('status', t.status);
  sheet.appendRow([
    Utilities.getUuid().slice(0, 8),
    taskValue_('title', title),
    taskValue_('notes', t.notes),
    status,
    taskValue_('progress', t.progress),
    taskValue_('priority', t.priority),
    taskValue_('due', t.due),
    taskValue_('tags', t.tags),
    taskValue_('steps', t.steps),
    now,
    now,
    status === 'done' ? now : ''
  ]);
}

function updateTask_(id, patch) {
  const sheet = getSheet_(TASK_SHEET, TASK_HEADERS);
  const row = findRow_(sheet, id);
  if (!row) return;
  const range = sheet.getRange(row, 1, 1, TASK_HEADERS.length);
  const vals = range.getValues()[0];
  const cols = { title: 1, notes: 2, status: 3, progress: 4, priority: 5, due: 6, tags: 7, steps: 8 };
  Object.keys(patch).forEach(k => {
    if (cols[k] === undefined) return;
    if (k === 'title' && !String(patch[k] || '').trim()) return;
    vals[cols[k]] = taskValue_(k, patch[k]);
  });
  // The whole row is written back, so re-escape text read from the sheet.
  [1, 2, 7].forEach(i => { vals[i] = safe_(vals[i]); });
  vals[6] = dueText_(vals[6], SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone());
  vals[10] = new Date();
  if ('status' in patch) vals[11] = vals[3] === 'done' ? (vals[11] || new Date()) : '';
  range.setValues([vals]);
}

function deleteTask_(id) {
  const sheet = getSheet_(TASK_SHEET, TASK_HEADERS);
  const row = findRow_(sheet, id);
  if (row) sheet.deleteRow(row);
}

function readTasks_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TASK_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const tz = ss.getSpreadsheetTimeZone();
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, TASK_HEADERS.length).getValues();
  return values
    .filter(r => r[0] && r[1])
    .map(r => ({
      id: String(r[0]),
      title: String(r[1]),
      notes: String(r[2] || ''),
      status: taskValue_('status', r[3]),
      progress: taskValue_('progress', r[4]),
      priority: taskValue_('priority', r[5]),
      due: dueText_(r[6], tz),
      tags: String(r[7] || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
      steps: parseSteps_(r[8]),
      created: r[9] instanceof Date ? r[9].getTime() : 0,
      updated: r[10] instanceof Date ? r[10].getTime() : 0,
      completed: r[11] instanceof Date ? r[11].getTime() : 0
    }));
}

// Cleans one task field coming from the website (or typed into the sheet by hand).
function taskValue_(key, v) {
  switch (key) {
    case 'status': {
      const s = String(v || '').trim().toLowerCase().replace(/[\s_-]/g, '');
      if (s === 'doing' || s === 'inprogress' || s === 'started') return 'doing';
      return s === 'done' || s === 'completed' ? 'done' : 'todo';
    }
    case 'progress': return Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    case 'priority': {
      const p = String(v || '').trim().toLowerCase();
      if (p === 'medium') return 'med';
      return PRIORITIES.indexOf(p) >= 0 ? p : '';
    }
    case 'due': return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '';
    case 'tags': return safe_((Array.isArray(v) ? v : []).map(String).join(', '));
    case 'steps': {
      const steps = (Array.isArray(v) ? v : []).slice(0, 50)
        .map(s => ({ t: String((s && s.t) || '').slice(0, 300), d: !!(s && s.d) }))
        .filter(s => s.t.trim());
      return steps.length ? JSON.stringify(steps) : '';
    }
    default: return safe_(v);
  }
}

// The due column is plain text (yyyy-MM-dd), but a date typed into the sheet by hand is read as a Date.
function dueText_(v, tz) {
  if (v instanceof Date) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  return taskValue_('due', v);
}

function parseSteps_(v) {
  if (!v) return [];
  try {
    const a = JSON.parse(String(v));
    return Array.isArray(a) ? a.map(s => ({ t: String(s.t || ''), d: !!s.d })).filter(s => s.t) : [];
  } catch (e) {
    return [];
  }
}

/* ---------------- Helpers ---------------- */

function getSheet_(name, headers) {
  name = name || SHEET_NAME;
  headers = headers || HEADERS;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    // Keep due dates as plain text so the sheet doesn't reformat them.
    if (name === TASK_SHEET) sheet.getRange('G:G').setNumberFormat('@');
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
  return json_({ ok: true, links: readAll_(), tasks: readTasks_(), sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl() });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
