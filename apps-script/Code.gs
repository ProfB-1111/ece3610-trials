/**
 * ECE 3610 Final Course Trials — Google Apps Script backend
 * ---------------------------------------------------------
 * Paste this into the Apps Script editor of your Google Sheet
 * (Extensions > Apps Script), set ADMIN_KEY and SUBMIT_CODE in Script Properties
 * (see below), run setup() once,
 * then Deploy > New deployment > Web app (Execute as: Me, Access: Anyone).
 *
 * Sheets used (created by setup()):
 *   Teams : Team | Robot | Comment | Interesting | Learned | PhotoURL | PhotoFileId | Updated
 *           (columns are found by header name, so order doesn't matter;
 *            teams are added automatically when they submit)
 *   Runs  : ID | Timestamp | Team | TimeSec | Status | Notes
 *   State : Key | Value
 */

// ---- SETTINGS ----------------------------------------------------------------
// Secrets are NOT stored in this file (it is public on GitHub).
// Set them in the Apps Script editor: Project Settings (gear) > Script Properties:
//   ADMIN_KEY   = your private key, typed into admin.html
//   SUBMIT_CODE = the code you give students for submit.html
const PHOTO_FOLDER_NAME = 'ECE3610 Trials Robot Photos';
// ---------------------------------------------------------------------------

const TEAM_HEADERS  = ['Team', 'Robot', 'Comment', 'Interesting', 'Learned', 'PhotoURL', 'PhotoFileId', 'Updated'];
const RUN_HEADERS   = ['ID', 'Timestamp', 'Team', 'TimeSec', 'Status', 'Notes'];
const STATE_DEFAULT = { currentTeam: '', nextTeam: '', timerState: 'idle', timerStartMs: 0, timerElapsedMs: 0, updatedMs: 0 };
const MAX_TEXT = 400;       // per comment field
const MAX_TEAM_NAME = 40;
const CACHE_KEY = 'trials_data_v1';

/** Run once from the editor to create sheets + photo folder. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, 'Teams', TEAM_HEADERS);
  ensureSheet_(ss, 'Runs', RUN_HEADERS);
  const st = ensureSheet_(ss, 'State', ['Key', 'Value']);
  if (st.getLastRow() < 2) {
    Object.keys(STATE_DEFAULT).forEach(k => st.appendRow([k, STATE_DEFAULT[k]]));
  }
  getPhotoFolder_();
  ['ADMIN_KEY', 'SUBMIT_CODE'].forEach(k => {
    if (!PropertiesService.getScriptProperties().getProperty(k))
      Logger.log('WARNING: ' + k + ' is not set yet (Project Settings > Script Properties).');
  });
  Logger.log('Setup complete. Teams appear in the Teams sheet as they submit (you can also type names in column "Team").');
}

// ---------------------------------------------------------------- HTTP ----

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'data';
    if (action === 'data') {
      // Short cache so many viewers polling at once stay fast; any write clears it.
      const cache = CacheService.getScriptCache();
      let body = cache.get(CACHE_KEY);
      if (!body) {
        const d = readAll_(); delete d.serverNow;
        body = JSON.stringify(d);
        try { cache.put(CACHE_KEY, body, 2); } catch (_) {}   // too large -> skip caching
      }
      const out = JSON.parse(body); out.serverNow = Date.now();
      return json_(out);
    }
    return json_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    lock.waitLock(15000);
    let result;
    switch (body.action) {
      case 'submit':      result = submitTeam_(body); break;
      case 'checkKey':    requireAdmin_(body); result = { ok: true }; break;
      case 'setCurrent':  requireAdmin_(body); result = setCurrent_(body); break;
      case 'setNext':     requireAdmin_(body); result = setNext_(body); break;
      case 'startTimer':  requireAdmin_(body); result = startTimer_(body); break;
      case 'stopTimer':   requireAdmin_(body); result = stopTimer_(body); break;
      case 'resetTimer':  requireAdmin_(body); result = resetTimer_(); break;
      case 'addRun':      requireAdmin_(body); result = addRun_(body); break;
      case 'updateRun':   requireAdmin_(body); result = updateRun_(body); break;
      case 'deleteRun':   requireAdmin_(body); result = deleteRun_(body); break;
      default: result = { ok: false, error: 'Unknown action' };
    }
    CacheService.getScriptCache().remove(CACHE_KEY);
    return json_(result);
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// ------------------------------------------------------------- Actions ----

function readAll_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tsh = ss.getSheetByName('Teams');
  const H = headerMap_(tsh);
  const get = (r, name) => H[name] == null ? '' : String(r[H[name]] == null ? '' : r[H[name]]);
  // Only these fields are published; any other columns (e.g. private notes) stay in the sheet.
  const teams = rows_(tsh)
    .filter(r => get(r, 'Team').trim() !== '')
    .map(r => ({
      team: get(r, 'Team').trim(), robot: get(r, 'Robot'),
      comment: get(r, 'Comment'), interesting: get(r, 'Interesting'), learned: get(r, 'Learned'),
      photo: get(r, 'PhotoURL'), updated: get(r, 'Updated')
    }));
  const runs = rows_(ss.getSheetByName('Runs'))
    .filter(r => r[0])
    .map(r => ({
      id: String(r[0]), ts: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
      team: String(r[2]), time: r[3] === '' ? null : Number(r[3]),
      status: String(r[4] || 'OK'), notes: String(r[5] || '')
    }));
  return { ok: true, teams: teams, runs: runs, state: readState_(), serverNow: Date.now() };
}

function submitTeam_(b) {
  if (String(b.code || '').trim() !== secret_('SUBMIT_CODE')) throw new Error('Incorrect submission code.');
  const team = String(b.team || '').replace(/\s+/g, ' ').trim();
  if (team.length < 2 || team.length > MAX_TEAM_NAME) throw new Error('Team name must be 2–' + MAX_TEAM_NAME + ' characters.');
  if (!String(b.comment || b.interesting || b.learned || '').trim()) throw new Error('Please fill in at least one comment.');

  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Teams');
  ensureSheet_(sh.getParent(), 'Teams', TEAM_HEADERS);           // adds any missing columns
  const H = headerMap_(sh), ncol = sh.getLastColumn();
  let row = findRow_(sh, H['Team'], team, true);
  const isNew = !row;
  if (isNew) { row = sh.getLastRow() + 1; }
  const vals = isNew ? new Array(ncol).fill('') : sh.getRange(row, 1, 1, ncol).getValues()[0];
  const set = (name, v) => { vals[H[name]] = v; };

  let photoUrl = vals[H['PhotoURL']], photoId = vals[H['PhotoFileId']];
  if (b.photo) {
    const m = String(b.photo).match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
    if (!m) throw new Error('Photo must be an image.');
    const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], safeName_(team) + '_' + Date.now() + '.jpg');
    const file = getPhotoFolder_().createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    if (photoId) { try { DriveApp.getFileById(photoId).setTrashed(true); } catch (_) {} }
    photoId = file.getId();
    photoUrl = 'https://drive.google.com/thumbnail?id=' + photoId + '&sz=w1200';
  }

  if (isNew) set('Team', team);                  // keep original spelling on resubmit
  set('Robot', clip_(b.robot, 60));
  set('Comment', clip_(b.comment, MAX_TEXT));
  set('Interesting', clip_(b.interesting, MAX_TEXT));
  set('Learned', clip_(b.learned, MAX_TEXT));
  set('PhotoURL', photoUrl);
  set('PhotoFileId', photoId);
  set('Updated', new Date().toISOString());
  sh.getRange(row, 1, 1, ncol).setValues([vals]);
  return { ok: true, photo: photoUrl, created: isNew };
}

function setCurrent_(b) {
  const team = String(b.team || '');
  const patch = { currentTeam: team, timerState: 'idle', timerStartMs: 0, timerElapsedMs: 0 };
  if (team && readState_().nextTeam.toLowerCase() === team.toLowerCase()) patch.nextTeam = '';
  writeState_(patch);
  return { ok: true, state: readState_() };
}

function setNext_(b) {
  writeState_({ nextTeam: String(b.team || '') });
  return { ok: true, state: readState_() };
}

function startTimer_(b) {
  // Convert the admin's start time into server time, correcting for request delay.
  const lag = Math.max(0, Number(b.clientNowMs || 0) - Number(b.startClientMs || 0));
  const start = Date.now() - lag;
  // updatedMs = when it really happened, so viewers can replay it exactly STREAM_DELAY_MS later
  writeState_({ timerState: 'running', timerStartMs: start, timerElapsedMs: 0, updatedMs: start });
  return { ok: true, state: readState_() };
}

function stopTimer_(b) {
  const elapsed = Number(b.elapsedMs || 0);
  const start = readState_().timerStartMs;
  writeState_({ timerState: 'stopped', timerElapsedMs: elapsed, updatedMs: start ? start + elapsed : Date.now() });
  return { ok: true, state: readState_() };
}

function resetTimer_() {
  writeState_({ timerState: 'idle', timerStartMs: 0, timerElapsedMs: 0 });
  return { ok: true, state: readState_() };
}

function addRun_(b) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Runs');
  const status = normStatus_(b.status);
  const time = status === 'OK' ? Number(b.time) : (b.time ? Number(b.time) : '');
  if (status === 'OK' && !(time > 0)) throw new Error('Time must be a positive number of seconds.');
  const id = Utilities.getUuid();
  sh.appendRow([id, new Date().toISOString(), String(b.team), time, status, clip_(b.notes, 200)]);
  writeState_({ timerState: 'idle', timerStartMs: 0, timerElapsedMs: 0 });
  return { ok: true, id: id };
}

function updateRun_(b) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Runs');
  const row = findRow_(sh, 0, b.id, false);
  if (!row) throw new Error('Run not found.');
  const status = normStatus_(b.status);
  const time = b.time === '' || b.time == null ? '' : Number(b.time);
  sh.getRange(row, 4, 1, 3).setValues([[time, status, clip_(b.notes, 200)]]);
  return { ok: true };
}

function deleteRun_(b) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Runs');
  const row = findRow_(sh, 0, b.id, false);
  if (!row) throw new Error('Run not found.');
  sh.deleteRow(row);
  return { ok: true };
}

// ------------------------------------------------------------- Helpers ----

function requireAdmin_(b) { if (String(b.key || '') !== secret_('ADMIN_KEY')) throw new Error('Invalid admin key.'); }

/** Reads a key from Script Properties. Refuses to run with a missing key. */
function secret_(name) {
  const v = PropertiesService.getScriptProperties().getProperty(name);
  if (!v || !String(v).trim()) throw new Error(name + ' is not set. Add it in Apps Script > Project Settings > Script Properties.');
  return String(v).trim();
}

function readState_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('State');
  const s = Object.assign({}, STATE_DEFAULT);
  rows_(sh).forEach(r => { if (r[0] in s) s[r[0]] = typeof STATE_DEFAULT[r[0]] === 'number' ? Number(r[1]) || 0 : String(r[1]); });
  return s;
}

function writeState_(patch) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('State');
  if (!('updatedMs' in patch)) patch.updatedMs = Date.now();
  const data = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues() : [];
  Object.keys(patch).forEach(k => {
    const i = data.findIndex(r => r[0] === k);
    if (i >= 0) sh.getRange(i + 2, 2).setValue(patch[k]);
    else { sh.appendRow([k, patch[k]]); data.push([k, patch[k]]); }
  });
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  } else {
    // Older layout? Append any missing columns at the end (existing data untouched).
    const have = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    headers.filter(h => have.indexOf(h) < 0).forEach(h => {
      const c = sh.getLastColumn() + 1;
      sh.getRange(1, c).setValue(h).setFontWeight('bold');
    });
  }
  return sh;
}

/** { headerName: zeroBasedColumnIndex } from row 1. */
function headerMap_(sh) {
  const m = {};
  if (!sh || sh.getLastColumn() === 0) return m;
  sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].forEach((h, i) => { if (h !== '') m[String(h).trim()] = i; });
  return m;
}

function rows_(sh) {
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
}

function findRow_(sh, col, value, caseInsensitive) {
  const want = caseInsensitive ? String(value).trim().toLowerCase() : String(value);
  const data = rows_(sh);
  for (let i = 0; i < data.length; i++) {
    const v = caseInsensitive ? String(data[i][col]).trim().toLowerCase() : String(data[i][col]);
    if (v === want) return i + 2;
  }
  return 0;
}

function getPhotoFolder_() {
  const it = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(PHOTO_FOLDER_NAME);
}

function normStatus_(s) { s = String(s || 'OK').toUpperCase(); return ['OK', 'DNF', 'DQ'].indexOf(s) >= 0 ? s : 'OK'; }
function clip_(s, n) { return String(s || '').trim().slice(0, n); }
function safeName_(s) { return String(s).replace(/[^\w-]+/g, '_').slice(0, 40); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
