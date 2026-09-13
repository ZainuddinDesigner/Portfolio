/**
 * Zainuddin Portfolio — enquiry form → Google Sheet
 *
 * SETUP (one time, ~3 minutes):
 * 1. Open the sheet: https://docs.google.com/spreadsheets/d/1dUEpKnrcF4w_9pynzEl7k2q_ir7KujR-GXqzwmROrEg/edit
 * 2. Extensions → Apps Script. Delete any code there and paste this whole file. Save.
 * 3. Deploy → New deployment → gear icon → "Web app".
 *      Execute as:      Me
 *      Who has access:  Anyone
 *    Click Deploy and approve the permissions with your Google account.
 * 4. Copy the Web app URL (ends in /exec) and paste it into
 *    website/js/main.js → const SHEET_ENDPOINT = "…";
 *
 * If you edit this script later: Deploy → Manage deployments → Edit → Version: New version → Deploy
 * (the /exec URL stays the same).
 */

const SHEET_ID = "1dUEpKnrcF4w_9pynzEl7k2q_ir7KujR-GXqzwmROrEg";
const SHEET_NAME = "Enquiries";
const HEADERS = ["Timestamp", "Name", "Email", "Phone", "Project Type", "Message", "Source", "Page"];

// Optional: get an email for every new enquiry. Leave "" to disable.
const NOTIFY_EMAIL = "zainudinzainu23@gmail.com";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const p = (e && e.parameter) || {};

    // Honeypot: bots fill the hidden "company" field — silently ignore them.
    if (p.company) return json({ ok: true });

    const clean = (v, max) => String(v || "").replace(/^[=+\-@]/, "'$&").trim().slice(0, max);
    const row = {
      name: clean(p.name, 120),
      email: clean(p.email, 160),
      phone: clean(p.phone, 40),
      type: clean(p.type, 60),
      message: clean(p.message, 3000),
      source: clean(p.source, 60),
      page: clean(p.page, 300),
    };
    if (!row.name || !row.email || !row.message) return json({ ok: false, error: "Missing required fields" });

    const sheet = getSheet();
    sheet.appendRow([new Date(), row.name, row.email, row.phone, row.type, row.message, row.source, row.page]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        replyTo: row.email,
        subject: "New project enquiry — " + (row.type || "General") + " — " + row.name,
        body:
          "Name: " + row.name + "\nEmail: " + row.email + "\nPhone: " + (row.phone || "—") +
          "\nProject type: " + row.type + "\n\n" + row.message + "\n\nSent from: " + row.page,
      });
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the /exec URL in a browser just confirms the script is live.
function doGet() {
  return json({ ok: true, status: "Enquiry endpoint is running" });
}

function getSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#cb997e");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(6, 420);
  }
  return sheet;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
