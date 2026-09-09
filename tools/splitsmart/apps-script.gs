/*
SplitSmart backend — Google Apps Script.

SETUP:
1. Create a new Google Sheet (any name), e.g. "SplitSmart Data".
2. Extensions -> Apps Script. Delete any starter code, paste this whole file in.
3. In the function dropdown (top toolbar) select "setupWordSource", click Run once.
   - This WIPES every existing sheet in the spreadsheet and rebuilds a single
     "wordsource" sheet of the 5000 shortest, simplest unique words (fetched
     from the EFF passphrase wordlist). It'll ask you to authorize (needs
     permission to fetch a URL) — click through Advanced -> Go to project -> Allow.
4. Deploy -> New deployment -> type "Web app".
   - Execute as: Me
   - Who has access: Anyone
5. Copy the Web app URL it gives you and paste it into API_URL at the top of app.js.
6. Re-deploy (Deploy -> Manage deployments -> edit -> New version -> Deploy) any
   time you change this file — saving alone does not update the live URL.

Each "party" is one sheet tab named by a human-readable 3-word code, mushed
together with no separators (e.g. "coralmarblequiver"), drawn from the
"wordsource" sheet. That code IS the ledger's name — it's row 1 of the party
sheet in large text; row 2 is the column header; data starts row 3. Rows are
an append-only event log: [type, timestamp, jsonData]. Client rebuilds all
state from this log.

IMPORTANT: saving this file in the Apps Script editor does NOT update the
live Web App — you must redeploy (Deploy -> Manage deployments -> edit ->
New version -> Deploy) every time you change it, or the URL keeps serving
old behavior (e.g. old-format codes).
*/

function doGet(e) {
  return respond(handleAction((e.parameter && e.parameter.action) || '', e.parameter || {}));
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) {}
  return respond(handleAction(body.action || '', body));
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function handleAction(action, p) {
  try {
    if (action === 'create') return createParty();
    if (action === 'exists') return { exists: !!getPartySheet(p.code, false) };
    if (action === 'events') return getEvents(p.code);
    if (action === 'append') return appendEvent(p.code, p.event);
    return { error: 'unknown action' };
  } catch (err) {
    return { error: String(err) };
  }
}

// ====== word-based codes ======

var WORDSOURCE_SHEET = 'wordsource';

// One-time (re-runnable) setup: wipes the whole spreadsheet and rebuilds the
// wordsource sheet with 3000 unique words. Run manually from the Apps Script
// editor — never called by the web app itself.
function setupWordSource() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var wsSheet = ss.getSheetByName(WORDSOURCE_SHEET);
  if (!wsSheet) wsSheet = ss.insertSheet(WORDSOURCE_SHEET);

  // wipe every other sheet clean
  ss.getSheets().forEach(function (sh) {
    if (sh.getName() !== WORDSOURCE_SHEET) ss.deleteSheet(sh);
  });
  wsSheet.clear();

  // EFF's curated passphrase wordlist: short, common, unambiguous, unique words.
  var text = UrlFetchApp.fetch('https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt').getContentText();
  var lines = text.split('\n');
  var words = [];
  for (var i = 0; i < lines.length; i++) {
    var parts = lines[i].trim().split('\t');
    if (parts.length === 2 && /^[a-z]+$/.test(parts[1])) words.push(parts[1]);
  }

  // prefer shorter, simpler words: sort shortest-first (ties broken alphabetically)
  words.sort(function (a, b) { return a.length - b.length || (a < b ? -1 : a > b ? 1 : 0); });

  // de-dupe (list is already unique by construction, this is just a safety net)
  // and keep the 5000 shortest unique words
  var seen = {}, chosen = [];
  for (var i = 0; i < words.length && chosen.length < 5000; i++) {
    if (!seen[words[i]]) { seen[words[i]] = true; chosen.push(words[i]); }
  }

  // shuffle so party codes don't skew toward always picking from the very shortest words
  for (var i = chosen.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = chosen[i]; chosen[i] = chosen[j]; chosen[j] = tmp;
  }

  wsSheet.getRange(1, 1).setValue('word').setFontWeight('bold');
  wsSheet.setFrozenRows(1);
  wsSheet.getRange(2, 1, chosen.length, 1).setValues(chosen.map(function (w) { return [w]; }));

  // single summary box: count of words appearing more than once — should read 0
  var counts = {};
  chosen.forEach(function (w) { counts[w] = (counts[w] || 0) + 1; });
  var dupes = 0;
  for (var w in counts) if (counts[w] > 1) dupes++;
  wsSheet.getRange(1, 3).setValue('duplicates:').setFontWeight('bold');
  wsSheet.getRange(1, 4).setValue(dupes);

  return 'wordsource ready: ' + chosen.length + ' words, ' + dupes + ' duplicates.';
}

function getWordList() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(WORDSOURCE_SHEET);
  if (!sheet) throw new Error('wordsource sheet missing — run setupWordSource() once from the script editor.');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('wordsource sheet is empty — run setupWordSource() once from the script editor.');
  return sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function (r) { return r[0]; }).filter(String);
}

function generateWordCode() {
  var words = getWordList();
  var picked = [], used = {};
  while (picked.length < 3) {
    var w = words[Math.floor(Math.random() * words.length)];
    if (!used[w]) { used[w] = true; picked.push(w); }
  }
  return picked.join(''); // mushed together, no separators
}

// ====== party sheets ======

function getPartySheet(code, create) {
  if (!code) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(code);
  if (!sheet && create) {
    sheet = ss.insertSheet(code);
    sheet.getRange(1, 1, 1, 3).merge();
    sheet.getRange(1, 1).setValue(code).setFontSize(20).setFontWeight('bold').setHorizontalAlignment('center');
    sheet.getRange(2, 1, 1, 3).setValues([['type', 'ts', 'data']]).setFontWeight('bold');
    sheet.setFrozenRows(2);
  }
  return sheet;
}

function createParty() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var code, tries = 0;
  do { code = generateWordCode(); tries++; } while (ss.getSheetByName(code) && tries < 20);
  getPartySheet(code, true);
  return { code: code };
}

function getEvents(code) {
  var sheet = getPartySheet(code, false);
  if (!sheet) return { error: 'not found' };
  var rows = sheet.getDataRange().getValues();
  var events = [];
  for (var i = 2; i < rows.length; i++) { // skip title row + header row
    if (!rows[i][0]) continue;
    events.push({ type: rows[i][0], ts: rows[i][1], data: JSON.parse(rows[i][2]) });
  }
  return { events: events };
}

function appendEvent(code, event) {
  var sheet = getPartySheet(code, false);
  if (!sheet) return { error: 'not found' };
  var ts = new Date().toISOString();
  sheet.appendRow([event.type, ts, JSON.stringify(event.data)]);
  return { ok: true, ts: ts };
}
