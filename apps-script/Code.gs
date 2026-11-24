/**
 * ECE 3610 Final Course Trials — Google Apps Script backend
 * ---------------------------------------------------------
 * Paste this into the Apps Script editor of your Google Sheet
 * (Extensions > Apps Script), set ADMIN_KEY and SUBMIT_CODE in Script Properties
 * (see below), run setup() once,
 * then Deploy > New deployment > Web app (Execute as: Me, Access: Anyone).
 *
 * Sheets used (created by setup()):
 *   Teams : Team | Robot | Members | Comment | Interesting | Learned | PhotoURL | PhotoFileId | Updated
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
// Training videos go to this Drive folder (yours). Override with Script Property VIDEO_FOLDER_ID if needed.
const VIDEO_FOLDER_ID_DEFAULT = '1DKP5mgN7CmcEyYiT5QCc-U92g2GuRwLn';
const SMALL_VIDEO_MAX_MB = 25;   // fallback path through Apps Script (base64) for small clips
// ---------------------------------------------------------------------------

const TEAM_HEADERS  = ['Team', 'Robot', 'Members', 'Comment', 'Interesting', 'Learned', 'PhotoURL', 'PhotoFileId', 'Photos', 'Updated',
                       'FacesInPhoto', 'PhotoCheckedAt'];          // last two are private (never published)
// Private record of photo consent — this sheet is never published.
const CONSENT_HEADERS = ['Timestamp', 'Team', 'Type', 'PhotoFileId', 'VideoId', 'Person', 'MarkX', 'MarkY', 'Name', 'Confirmed', 'Statement'];
// Training videos. Set Visible to "No" to hide one from the site without deleting it.
const VIDEO_HEADERS = ['ID', 'Timestamp', 'Team', 'FileName', 'SizeMB', 'Status', 'FileId', 'FacesInVideo', 'Visible'];
const RUN_HEADERS   = ['ID', 'Timestamp', 'Team', 'TimeSec', 'Status', 'Notes'];
// timerState: idle (at the start line) | running (on course) | stopped (finished, not saved) | done (run saved)
const STATE_DEFAULT = { currentTeam: '', nextTeam: '', timerState: 'idle', timerStartMs: 0, timerElapsedMs: 0, updatedMs: 0, lastRunId: '' };
const MAX_TEXT = 400;       // per comment field
const MAX_TEAM_NAME = 40;
const MAX_MEMBERS = 8;
const MAX_PHOTOS = 8;   // photos per team; one is the card photo (PhotoURL), all are listed in Photos (JSON)
// Bump BACKEND_VERSION whenever this file changes. The website checks it (MIN_BACKEND in
// assets/api.js) and the read cache is keyed by it, so an older deployment of this project
// can never hand its data to the newer one.
const BACKEND_VERSION = 7;
const CACHE_KEY = 'trials_data_v' + BACKEND_VERSION;

/** Run once from the editor to create sheets + photo folder. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, 'Teams', TEAM_HEADERS);
  ensureSheet_(ss, 'Runs', RUN_HEADERS);
  ensureSheet_(ss, 'Consents', CONSENT_HEADERS);
  ensureSheet_(ss, 'Videos', VIDEO_HEADERS);
  // Touch the services the video upload needs so the authorization prompt asks for them now.
  DriveApp.getFolderById(videoFolderId_()).getName();
  ScriptApp.getOAuthToken();
  UrlFetchApp.getRequest('https://www.googleapis.com/');
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
      case 'videoStart':  result = videoStart_(body); break;
      case 'videoDone':   result = videoDone_(body); break;
      case 'videoSmall':  result = videoSmall_(body); break;
      case 'videoRemove': result = videoRemove_(body); break;
      case 'checkKey':    requireAdmin_(body); result = { ok: true }; break;
      case 'setCurrent':  requireAdmin_(body); result = setCurrent_(body); break;
      case 'setNext':     requireAdmin_(body); result = setNext_(body); break;
      case 'startTimer':  requireAdmin_(body); result = startTimer_(body); break;
      case 'stopTimer':   requireAdmin_(body); result = stopTimer_(body); break;
      case 'resetTimer':  requireAdmin_(body); result = resetTimer_(); break;
      case 'addRun':      requireAdmin_(body); result = addRun_(body); break;
      case 'updateRun':   requireAdmin_(body); result = updateRun_(body); break;
      case 'deleteRun':   requireAdmin_(body); result = deleteRun_(body); break;
      case 'deleteTeam':  requireAdmin_(body); result = deleteTeam_(body); break;
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
      team: get(r, 'Team').trim(), robot: get(r, 'Robot'), members: get(r, 'Members'),
      comment: get(r, 'Comment'), interesting: get(r, 'Interesting'), learned: get(r, 'Learned'),
      photo: get(r, 'PhotoURL'), photos: parsePhotos_(get(r, 'Photos'), get(r, 'PhotoFileId'), get(r, 'PhotoURL')),
      updated: get(r, 'Updated')
    }));
  const runs = rows_(ss.getSheetByName('Runs'))
    .filter(r => r[0])
    .map(r => ({
      id: String(r[0]), ts: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
      team: String(r[2]), time: r[3] === '' ? null : Number(r[3]),
      status: String(r[4] || 'OK'), notes: String(r[5] || '')
    }));
  // Published training videos (uploaded and not hidden)
  const vsh = ss.getSheetByName('Videos'), VH = headerMap_(vsh);
  const vget = (r, k) => VH[k] == null ? '' : String(r[VH[k]] == null ? '' : r[VH[k]]);
  const videos = rows_(vsh)
    .filter(r => vget(r, 'Status') === 'ready' && vget(r, 'FileId') && vget(r, 'Visible').toLowerCase() !== 'no')
    .map(r => ({ team: vget(r, 'Team'), fileId: vget(r, 'FileId'), name: vget(r, 'FileName'),
                 ts: r[VH['Timestamp']] instanceof Date ? r[VH['Timestamp']].toISOString() : vget(r, 'Timestamp') }));
  return { ok: true, version: BACKEND_VERSION, teams: teams, runs: runs, videos: videos, state: readState_(), serverNow: Date.now() };
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

  // Member names (optional, public): every name not already on the card must be confirmed by that person.
  const memberName = n => String(n || '').replace(/[,;]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  const members = (Array.isArray(b.members) ? b.members : []).map(memberName).filter(Boolean);
  if (members.length > MAX_MEMBERS) throw new Error('At most ' + MAX_MEMBERS + ' team member names.');
  const nameConsents = Array.isArray(b.nameConsents) ? b.nameConsents : [];

  // Photos: list of { data: new image (base64) } or { keep: existing Drive id }; b.main = card photo index.
  // Every new photo needs the photo check; faces => every person shown must confirm.
  const prevPhotos = parsePhotos_(vals[H['Photos']], vals[H['PhotoFileId']], vals[H['PhotoURL']]);
  let items;
  if (Array.isArray(b.photos)) items = b.photos;
  else if (b.photo) items = [{ data: b.photo, faces: b.faces, consents: b.consents, statement: b.statement }];  // older page version
  else items = prevPhotos.map(p => ({ keep: p.id }));
  if (!items.length) throw new Error('Add at least one photo of your robot.');
  if (items.length > MAX_PHOTOS) throw new Error('At most ' + MAX_PHOTOS + ' photos.');
  items.forEach((it, k) => {
    const label = items.length > 1 ? 'Photo ' + (k + 1) + ': ' : '';
    if (it.data) {
      if (!/^data:image\/[\w+.-]+;base64,/.test(String(it.data))) throw new Error(label + 'must be an image.');
      if (it.faces !== true && it.faces !== false) throw new Error(label + 'please complete the photo check.');
      if (it.faces) {
        const c = Array.isArray(it.consents) ? it.consents : [];
        if (!c.length) throw new Error(label + 'mark each person in the photo and have them confirm.');
        c.forEach((p, i) => {
          if (!clip_(p.name, 80)) throw new Error(label + 'person ' + (i + 1) + ' needs a name.');
          if (p.confirmed !== true) throw new Error(label + 'person ' + (i + 1) + ' has not confirmed.');
        });
      }
    } else if (!prevPhotos.some(p => p.id === it.keep)) throw new Error('A photo you kept no longer exists. Reload the page and try again.');
  });

  // Names already on this team's card were confirmed before; only new ones need confirmation now.
  const prev = String(vals[H['Members']] || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  const newNames = members.filter(n => prev.indexOf(n.toLowerCase()) < 0);
  newNames.forEach(n => {
    const c = nameConsents.find(x => memberName(x.name).toLowerCase() === n.toLowerCase());
    if (!c || c.confirmed !== true) throw new Error(n + ' has not confirmed their name may be shown.');
  });

  // All checks passed: save new photos, drop removed ones.
  const photoConsents = [], outPhotos = [];
  items.forEach(it => {
    if (it.keep) { outPhotos.push(prevPhotos.find(p => p.id === it.keep)); return; }
    const m = String(it.data).match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
    const file = getPhotoFolder_().createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1],
      safeName_(team) + '_' + Date.now() + '_' + outPhotos.length + '.jpg'));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const rec = { id: file.getId(), url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200' };
    outPhotos.push(rec);
    if (it.faces) photoConsents.push({ fileId: rec.id, consents: it.consents, statement: it.statement || b.statement });
  });
  prevPhotos.filter(p => !outPhotos.some(o => o.id === p.id))
    .forEach(p => { try { DriveApp.getFileById(p.id).setTrashed(true); } catch (_) {} });
  const main = outPhotos[Math.min(Math.max(0, Math.floor(Number(b.main) || 0)), outPhotos.length - 1)];
  const newCount = items.filter(it => it.data).length;

  if (isNew) set('Team', team);                  // keep original spelling on resubmit
  set('Robot', clip_(b.robot, 60));
  set('Members', members.join(', '));
  set('Comment', clip_(b.comment, MAX_TEXT));
  set('Interesting', clip_(b.interesting, MAX_TEXT));
  set('Learned', clip_(b.learned, MAX_TEXT));
  set('PhotoURL', main.url);
  set('PhotoFileId', main.id);
  set('Photos', JSON.stringify(outPhotos));
  set('Updated', new Date().toISOString());
  if (newCount) {
    set('FacesInPhoto', photoConsents.length ? 'Yes (' + photoConsents.length + ' of ' + newCount + ' new)' : 'No');
    set('PhotoCheckedAt', new Date().toISOString());
  }
  sh.getRange(row, 1, 1, ncol).setValues([vals]);

  if (photoConsents.length || newNames.length) {
    const csh = ensureSheet_(sh.getParent(), 'Consents', CONSENT_HEADERS);
    const ch = headerMap_(csh), cn = csh.getLastColumn(), now = new Date().toISOString();
    const row_ = fields => { const r = new Array(cn).fill(''); Object.keys(fields).forEach(k => { if (ch[k] != null) r[ch[k]] = fields[k]; }); return r; };
    const rowsOut = [];
    newNames.forEach((n, i) => rowsOut.push(row_({ Timestamp: now, Team: team, Type: 'Name', Person: i + 1, Name: n,
      Confirmed: 'Yes', Statement: clip_(b.nameStatement, 500) })));
    photoConsents.forEach(pc => pc.consents.forEach((p, i) => rowsOut.push(row_({ Timestamp: now, Team: team, Type: 'Photo',
      PhotoFileId: pc.fileId, Person: i + 1, MarkX: isFinite(p.x) ? Number(p.x) : '', MarkY: isFinite(p.y) ? Number(p.y) : '',
      Name: clip_(p.name, 80), Confirmed: 'Yes', Statement: clip_(pc.statement, 500) }))));
    csh.getRange(csh.getLastRow() + 1, 1, rowsOut.length, cn).setValues(rowsOut);
  }
  return { ok: true, photo: main.url, created: isNew };
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
  const done = status === 'OK' || status === 'ODO';          // ODO = completed with odometry (EC)
  const time = done ? Number(b.time) : (b.time ? Number(b.time) : '');
  if (done && !(time > 0)) throw new Error('Time must be a positive number of seconds.');
  const id = Utilities.getUuid();
  sh.appendRow([id, new Date(), String(b.team), time, status, clip_(b.notes, 200)]);   // real date, no time-zone guessing
  writeState_({ timerState: 'done', timerStartMs: 0, timerElapsedMs: 0, lastRunId: id });   // "Run complete"
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
  if (readState_().lastRunId === String(b.id)) writeState_({ timerState: 'idle', lastRunId: '' });   // its "Run complete" goes too
  return { ok: true };
}

/**
 * Deletes a team completely (manage.html): its Teams row, all runs, video records and
 * consent records, and moves its photos and videos to the Drive trash (recoverable 30 days).
 */
function deleteTeam_(b) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tsh = ss.getSheetByName('Teams'), H = headerMap_(tsh);
  const row = findRow_(tsh, H['Team'], String(b.team || '').replace(/\s+/g, ' ').trim(), true);
  if (!row) throw new Error('Team not found.');
  const vals = tsh.getRange(row, 1, 1, tsh.getLastColumn()).getValues()[0];
  const team = String(vals[H['Team']]).trim(), key = team.toLowerCase();

  const files = new Set(parsePhotos_(vals[H['Photos']], vals[H['PhotoFileId']], vals[H['PhotoURL']]).map(p => p.id));
  const vsh = ss.getSheetByName('Videos');
  if (vsh) {
    const VH = headerMap_(vsh);
    rows_(vsh).forEach(r => { if (String(r[VH['Team']]).trim().toLowerCase() === key && r[VH['FileId']]) files.add(String(r[VH['FileId']])); });
  }
  let trashed = 0;
  files.forEach(id => { try { DriveApp.getFileById(id).setTrashed(true); trashed++; } catch (_) {} });

  const removed = {
    files: trashed,
    runs: deleteRowsWhere_(ss.getSheetByName('Runs'), 'Team', key),
    videos: deleteRowsWhere_(vsh, 'Team', key),
    consents: deleteRowsWhere_(ss.getSheetByName('Consents'), 'Team', key)
  };
  tsh.deleteRow(row);

  const st = readState_(), patch = {};
  if (st.currentTeam.trim().toLowerCase() === key) Object.assign(patch, { currentTeam: '', timerState: 'idle', timerStartMs: 0, timerElapsedMs: 0, lastRunId: '' });
  if (st.nextTeam.trim().toLowerCase() === key) patch.nextTeam = '';
  if (Object.keys(patch).length) writeState_(patch);
  return { ok: true, team: team, removed: removed };
}

/** Deletes every row whose column `col` equals `key` (case-insensitive). Returns the count. */
function deleteRowsWhere_(sh, col, key) {
  if (!sh) return 0;
  const H = headerMap_(sh); if (H[col] == null) return 0;
  const data = rows_(sh); let n = 0;
  for (let i = data.length - 1; i >= 0; i--) {                 // bottom-up keeps row numbers valid
    if (String(data[i][H[col]]).trim().toLowerCase() === key) { sh.deleteRow(i + 2); n++; }
  }
  return n;
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

// ------------------------------------------------------------- Videos ----
// Large files never pass through Apps Script: videoStart_ opens a Drive "resumable upload"
// session in your folder and returns its one-time URL; the browser sends the file there
// directly, then calls videoDone_. Small clips can use videoSmall_ (base64) as a fallback.

function videoFolderId_() {
  return PropertiesService.getScriptProperties().getProperty('VIDEO_FOLDER_ID') || VIDEO_FOLDER_ID_DEFAULT;
}

/** Shared checks: pass key, existing team, consent for people shown. Returns the team's exact name. */
function videoChecks_(b) {
  if (String(b.code || '').trim() !== secret_('SUBMIT_CODE')) throw new Error('Incorrect submission code.');
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Teams');
  const H = headerMap_(sh), row = findRow_(sh, H['Team'], String(b.team || '').replace(/\s+/g, ' ').trim(), true);
  if (!row) throw new Error('Submit your team card first, then add videos.');
  if (b.faces !== true && b.faces !== false) throw new Error('Please complete the video check.');
  if (b.faces) {
    const c = Array.isArray(b.consents) ? b.consents : [];
    if (!c.length) throw new Error('List each person shown in the videos and have them confirm.');
    c.forEach((p, i) => {
      if (!clip_(p.name, 80)) throw new Error('Person ' + (i + 1) + ': name is required.');
      if (p.confirmed !== true) throw new Error('Person ' + (i + 1) + ' has not confirmed.');
    });
  }
  return String(sh.getRange(row, H['Team'] + 1).getValue()).trim();
}

/** Adds a Videos row (+ Consents rows when people are shown). Returns the row ID. */
function recordVideo_(team, fileName, sizeBytes, b, status, fileId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const vsh = ensureSheet_(ss, 'Videos', VIDEO_HEADERS), VH = headerMap_(vsh), n = vsh.getLastColumn();
  const id = Utilities.getUuid(), now = new Date();
  const r = new Array(n).fill(''); const put = (k, v) => { if (VH[k] != null) r[VH[k]] = v; };
  put('ID', id); put('Timestamp', now); put('Team', team); put('FileName', fileName);
  put('SizeMB', Math.round(sizeBytes / 1048576 * 10) / 10); put('Status', status); put('FileId', fileId || '');
  put('FacesInVideo', b.faces ? 'Yes (' + b.consents.length + ')' : 'No'); put('Visible', 'Yes');
  vsh.appendRow(r);
  if (b.faces) {
    const csh = ensureSheet_(ss, 'Consents', CONSENT_HEADERS), CH = headerMap_(csh), cn = csh.getLastColumn();
    const out = b.consents.map((p, i) => {
      const c = new Array(cn).fill(''); const cp = (k, v) => { if (CH[k] != null) c[CH[k]] = v; };
      cp('Timestamp', now.toISOString()); cp('Team', team); cp('Type', 'Video'); cp('VideoId', id); cp('Person', i + 1);
      cp('Name', clip_(p.name, 80)); cp('Confirmed', 'Yes'); cp('Statement', clip_(b.statement, 500));
      return c;
    });
    csh.getRange(csh.getLastRow() + 1, 1, out.length, cn).setValues(out);
  }
  return id;
}

function videoFileName_(team, name) {
  const base = String(name || 'video').replace(/[^\w.\- ]+/g, '_').slice(-80);
  return safeName_(team) + '_' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd-HHmmss') + '_' + base;
}

function videoStart_(b) {
  const team = videoChecks_(b);
  const size = Number(b.size);
  if (!(size > 0)) throw new Error('Empty video file.');
  const mime = /^video\/[\w.+-]+$/.test(String(b.mime)) ? String(b.mime) : 'video/mp4';
  const fileName = videoFileName_(team, b.name);
  const headers = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
                    'X-Upload-Content-Type': mime, 'X-Upload-Content-Length': String(size) };
  // The page's origin lets the browser send the file to Google directly (CORS).
  if (/^https?:\/\/[\w.-]+(:\d+)?$/.test(String(b.origin || ''))) headers.Origin = String(b.origin);
  const res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id', {
    method: 'post', contentType: 'application/json; charset=UTF-8', headers: headers, muteHttpExceptions: true,
    payload: JSON.stringify({ name: fileName, parents: [videoFolderId_()], description: 'ECE 3610 training video · ' + team })
  });
  const h = res.getAllHeaders(), url = h.Location || h.location;
  if (res.getResponseCode() !== 200 || !url) throw new Error('Could not start the upload (' + res.getResponseCode() + ').');
  const id = recordVideo_(team, fileName, size, b, 'uploading', '');
  return { ok: true, id: id, uploadUrl: url };
}

function videoDone_(b) {
  if (String(b.code || '').trim() !== secret_('SUBMIT_CODE')) throw new Error('Incorrect submission code.');
  const vsh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Videos'), VH = headerMap_(vsh);
  const row = findRow_(vsh, VH['ID'], String(b.id || ''), false);
  if (!row) throw new Error('Upload not found.');
  const file = DriveApp.getFileById(String(b.fileId || ''));             // throws if it doesn't exist
  let inFolder = false; const ps = file.getParents();
  while (ps.hasNext()) if (ps.next().getId() === videoFolderId_()) inFolder = true;
  if (!inFolder) throw new Error('Uploaded file is not in the video folder.');
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  vsh.getRange(row, VH['Status'] + 1).setValue('ready');
  vsh.getRange(row, VH['FileId'] + 1).setValue(file.getId());
  return { ok: true, fileId: file.getId() };
}

/** Removes one of a team's training videos (edit mode): hidden from the site, file moved to Drive trash. */
function videoRemove_(b) {
  if (String(b.code || '').trim() !== secret_('SUBMIT_CODE')) throw new Error('Incorrect submission code.');
  const vsh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Videos'), VH = headerMap_(vsh);
  const want = String(b.team || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const data = rows_(vsh);
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][VH['FileId']]) === String(b.fileId) && String(data[i][VH['Team']]).trim().toLowerCase() === want) {
      vsh.getRange(i + 2, VH['Status'] + 1).setValue('removed');
      vsh.getRange(i + 2, VH['Visible'] + 1).setValue('No');
      try { DriveApp.getFileById(String(b.fileId)).setTrashed(true); } catch (_) {}
      return { ok: true };
    }
  }
  throw new Error('Video not found.');
}

function videoSmall_(b) {
  const team = videoChecks_(b);
  const m = String(b.data || '').match(/^data:(video\/[\w.+-]+);base64,(.+)$/);
  if (!m) throw new Error('Video must be a video file.');
  const bytes = Utilities.base64Decode(m[2]);
  if (bytes.length > SMALL_VIDEO_MAX_MB * 1048576) throw new Error('Video too large for this upload path.');
  const fileName = videoFileName_(team, b.name);
  const file = DriveApp.getFolderById(videoFolderId_()).createFile(Utilities.newBlob(bytes, m[1], fileName));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  recordVideo_(team, fileName, bytes.length, b, 'ready', file.getId());
  return { ok: true, fileId: file.getId() };
}

/** Team photo list from the Photos column (JSON); falls back to the single card photo. */
function parsePhotos_(json, id, url) {
  try { const a = JSON.parse(json || '[]'); if (Array.isArray(a) && a.length) return a.filter(p => p && p.id && p.url); } catch (_) {}
  return id ? [{ id: String(id), url: String(url || 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1200') }] : [];
}

function getPhotoFolder_() {
  const it = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(PHOTO_FOLDER_NAME);
}

function normStatus_(s) { s = String(s || 'OK').toUpperCase(); return ['OK', 'ODO', 'DNF', 'DQ'].indexOf(s) >= 0 ? s : 'OK'; }
function clip_(s, n) { return String(s || '').trim().slice(0, n); }
function safeName_(s) { return String(s).replace(/[^\w-]+/g, '_').slice(0, 40); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
