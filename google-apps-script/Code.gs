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
    let matchingRow = 0;
    for (let row = 1; row < values.length; row += 1) {
      const [date, time, , status] = values[row];
      if (dateKey_(date, timeZone) === request.appointmentDate && String(time) === request.appointmentTime && String(status).trim() === 'Open') { matchingRow = row + 1; break; }
    }
    if (!matchingRow) return response_({ ok: false, message: 'That time was just taken. Please choose another opening.' });
    let designUrl = '';
    if (request.design && request.design.data) {
      const folder = getDesignFolder_();
      const file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(request.design.data), request.design.type || 'image/jpeg', request.design.name || 'design-inspiration.jpg'));
      designUrl = file.getUrl();
    }
    appointments.appendRow(['Pending', request.appointmentDate, request.appointmentTime, request.name, request.age, request.payment, request.service, request.shape, request.notes, designUrl, request.contact, new Date(), '']);
    availability.getRange(matchingRow, 4).setValue('Requested');
    return response_({ ok: true, message: 'Your request was sent to Rylie!' });
  } catch (error) { return response_({ ok: false, message: error.message }); }
}

function getAvailability_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const values = spreadsheet.getSheetByName('Availability').getDataRange().getDisplayValues();
  const timeZone = spreadsheet.getSpreadsheetTimeZone();
  const openings = {};
  for (let row = 1; row < values.length; row += 1) {
    const [date, time, , status] = values[row];
    if (String(status).trim() === 'Open') {
      const key = dateKey_(date, timeZone);
      if (!openings[key]) openings[key] = [];
      openings[key].push(String(time));
    }
  }
  return { openings };
}

function getDesignFolder_() { const folders = DriveApp.getFoldersByName('Rylie Nails — Design Inspiration'); return folders.hasNext() ? folders.next() : DriveApp.createFolder('Rylie Nails — Design Inspiration'); }
function dateKey_(date, timeZone) { return Utilities.formatDate(new Date(date), timeZone, 'yyyy-MM-dd'); }
function response_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
