const SPREADSHEET_ID = '1Sz8tiEGEWx4iDg5orED0LjDEdCCIEvWM_OfXuT78oUk';

function doGet(event) {
  const data = getAvailability_();
  const callback = event.parameter.callback;
  const body = callback ? `${callback}(${JSON.stringify(data)})` : JSON.stringify(data);
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function doPost(event) {
  try {
    const request = JSON.parse(event.postData.contents);
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const availability = spreadsheet.getSheetByName('Availability');
    const appointments = spreadsheet.getSheetByName('Appointments');
    const timeZone = spreadsheet.getSpreadsheetTimeZone();
    const values = availability.getDataRange().getDisplayValues();
    const confirmedSlots = getConfirmedSlots_(appointments, timeZone);
    let matchingRow = 0;
    for (let row = 1; row < values.length; row += 1) {
      const [date, time, , status] = values[row];
      const slotKey = `${dateKey_(date, timeZone)}|${String(time).trim()}`;
      if (dateKey_(date, timeZone) === request.appointmentDate && String(time).trim() === request.appointmentTime && String(status).trim() === 'Open' && !confirmedSlots.has(slotKey) && isBookable_(date, time, timeZone)) { matchingRow = row + 1; break; }
    }
    if (!matchingRow) return response_({ ok: false, message: 'That time was just taken. Please choose another opening.' });
    let designUrl = '';
    if (request.design && request.design.data) {
      const folder = getDesignFolder_();
      const file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(request.design.data), request.design.type || 'image/jpeg', request.design.name || 'design-inspiration.jpg'));
      designUrl = file.getUrl();
    }
    appointments.appendRow(['Pending', request.appointmentDate, request.appointmentTime, request.name, request.age, request.payment, request.service, request.shape, request.notes, designUrl, request.contact, new Date(), '']);
    return response_({ ok: true, message: 'Your request was sent to Rylie!' });
  } catch (error) { return response_({ ok: false, message: error.message }); }
}

function getAvailability_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const availability = spreadsheet.getSheetByName('Availability');
  const timeZone = spreadsheet.getSpreadsheetTimeZone();
  const values = availability.getDataRange().getDisplayValues();
  const confirmedSlots = getConfirmedSlots_(spreadsheet.getSheetByName('Appointments'), timeZone);
  const openings = {};
  for (let row = 1; row < values.length; row += 1) {
    const [date, time, , status] = values[row];
    const slotKey = `${dateKey_(date, timeZone)}|${String(time).trim()}`;
    if (String(status).trim() === 'Open' && !confirmedSlots.has(slotKey) && isBookable_(date, time, timeZone)) {
      const key = dateKey_(date, timeZone);
      if (!openings[key]) openings[key] = [];
      openings[key].push(String(time));
    }
  }
  return { openings };
}

function getConfirmedSlots_(appointments, timeZone) {
  const slots = new Set();
  const values = appointments.getDataRange().getDisplayValues();
  for (let row = 1; row < values.length; row += 1) {
    const [status, date, time] = values[row];
    const isConfirmed = ['Confirmed', 'Booked'].includes(String(status).trim());
    if (isConfirmed && date && time) slots.add(`${dateKey_(date, timeZone)}|${String(time).trim()}`);
  }
  return slots;
}

function isBookable_(date, time, timeZone) {
  const dateText = String(date).trim();
  const format = /^\d{4}-\d{2}-\d{2}$/.test(dateText) ? 'yyyy-MM-dd h:mm a' : 'MMM d, yyyy h:mm a';
  const startTime = Utilities.parseDate(`${dateText} ${String(time).trim()}`, timeZone, format);
  return startTime.getTime() - Date.now() > 2 * 60 * 60 * 1000;
}

function getDesignFolder_() { const folders = DriveApp.getFoldersByName('Rylie Nails — Design Inspiration'); return folders.hasNext() ? folders.next() : DriveApp.createFolder('Rylie Nails — Design Inspiration'); }
function dateKey_(date, timeZone) { return Utilities.formatDate(new Date(date), timeZone, 'yyyy-MM-dd'); }
function response_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
