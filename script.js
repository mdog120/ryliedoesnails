const calendarWeeks = ["2026-07-27", "2026-08-03", "2026-08-10"];
let liveOpenings = { "2026-07-27": ["9:00 AM", "1:00 PM", "5:15 PM"], "2026-08-03": ["9:00 AM", "1:00 PM", "5:15 PM"], "2026-08-10": ["9:00 AM", "1:00 PM", "5:15 PM"] };
let bookingSelection = { date: "", time: "" };

const menuToggle = document.querySelector(".menu-toggle");
const siteMenu = document.querySelector(".site-menu");
menuToggle?.addEventListener("click", () => { const opened = siteMenu.classList.toggle("is-open"); menuToggle.classList.toggle("is-open", opened); menuToggle.setAttribute("aria-expanded", String(opened)); });
document.querySelectorAll('a[href$=".html"], a[href^="index.html#"]').forEach((link) => link.addEventListener("click", (event) => { if (event.metaKey || event.ctrlKey || link.target === "_blank") return; event.preventDefault(); document.body.classList.add("is-leaving"); window.setTimeout(() => { window.location.href = link.href; }, 260); }));

const calendar = document.querySelector("#calendar");
if (calendar) {
  const message = document.querySelector("#slotMessage"); const title = document.querySelector("#calendarTitle"); const timeSlots = document.querySelector("#timeSlots"); const chosenSlot = document.querySelector("#chosenSlot"); let week = 0;
  const dateLabel = (date) => new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  function renderCalendar() {
    const monday = new Date(`${calendarWeeks[week]}T12:00:00`);
    calendar.innerHTML = Array.from({ length: 7 }, (_, index) => { const date = new Date(monday); date.setDate(monday.getDate() + index); const iso = date.toISOString().slice(0, 10); const isOpen = (liveOpenings[iso] || []).length > 0; return `<div class="day ${isOpen ? "open" : "closed"}"><span class="name">${date.toLocaleDateString("en-US", { weekday: "short" })}</span><span class="date" ${isOpen ? `data-date="${iso}"` : ""}>${date.getDate()}</span></div>`; }).join("");
    calendar.querySelectorAll("[data-date]").forEach((day) => day.addEventListener("click", () => { bookingSelection = { date: day.dataset.date, time: "" }; chosenSlot.value = ""; message.textContent = `${dateLabel(bookingSelection.date)} — choose a time that feels good ✦`; timeSlots.innerHTML = (liveOpenings[bookingSelection.date] || []).map((time) => `<button class="time-slot" type="button" data-time="${time}">${time}</button>`).join(""); timeSlots.querySelectorAll(".time-slot").forEach((button) => button.addEventListener("click", () => { bookingSelection.time = button.dataset.time; timeSlots.querySelectorAll(".time-slot").forEach((slot) => slot.classList.toggle("is-selected", slot === button)); chosenSlot.value = `${dateLabel(bookingSelection.date)} at ${bookingSelection.time}`; message.textContent = `${chosenSlot.value} is held while you finish your request ♡`; })); }));
    title.textContent = new Date(`${calendarWeeks[week]}T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  window.rylieAvailability = (data) => { if (data?.openings) { liveOpenings = data.openings; renderCalendar(); } };
  const endpoint = window.RYLIE_BOOKING_CONFIG?.endpoint;
  if (endpoint) { const script = document.createElement("script"); script.src = `${endpoint}?callback=rylieAvailability`; document.head.appendChild(script); }
  document.querySelector("#previous").addEventListener("click", () => { if (week > 0) { week--; renderCalendar(); } }); document.querySelector("#next").addEventListener("click", () => { if (week < 2) { week++; renderCalendar(); } }); renderCalendar();
}

const bookingForm = document.querySelector("#bookingForm");
bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault(); const status = document.querySelector("#formStatus"); if (!bookingForm.reportValidity()) return; const endpoint = window.RYLIE_BOOKING_CONFIG?.endpoint;
  if (!endpoint) { status.textContent = "The website is ready, but it needs the free Google Apps Script link before requests can send to Rylie."; return; }
  const send = (design) => { const payload = { name: bookingForm.elements.name.value, age: bookingForm.elements.age.value, contact: bookingForm.elements.contact.value, payment: bookingForm.elements.payment.value, service: bookingForm.elements.service.value, shape: bookingForm.elements.shape.value, notes: bookingForm.elements.notes.value, appointmentDate: bookingSelection.date, appointmentTime: bookingSelection.time, design }; fetch(endpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) }); status.textContent = "Your request was sent to Rylie! She’ll reach out to confirm it soon ♡"; bookingForm.reset(); };
  const file = bookingForm.elements.design.files[0]; if (!file) return send(null); if (file.size > 5 * 1024 * 1024) { status.textContent = "Please choose an inspiration image smaller than 5 MB."; return; } const reader = new FileReader(); reader.onload = () => send({ name: file.name, type: file.type, data: reader.result.split(",")[1] }); reader.readAsDataURL(file);
});
