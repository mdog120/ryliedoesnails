const dates = [
  { day: "Mon", date: "10", status: "closed" },
  { day: "Tue", date: "11", status: "few" },
  { day: "Wed", date: "12", status: "open" },
  { day: "Thu", date: "13", status: "open" },
  { day: "Fri", date: "14", status: "few" },
  { day: "Sat", date: "15", status: "closed" },
  { day: "Sun", date: "16", status: "closed" },
];
const menuToggle = document.querySelector(".menu-toggle");
const siteMenu = document.querySelector(".site-menu");
menuToggle?.addEventListener("click", () => {
  const opened = siteMenu.classList.toggle("is-open");
  menuToggle.classList.toggle("is-open", opened);
  menuToggle.setAttribute("aria-expanded", String(opened));
});

document
  .querySelectorAll('a[href$=".html"], a[href^="index.html#"]')
  .forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || link.target === "_blank") return;
      event.preventDefault();
      document.body.classList.add("is-leaving");
      window.setTimeout(() => {
        window.location.href = link.href;
      }, 260);
    });
  });

const calendar = document.querySelector("#calendar");
if (calendar) {
  const message = document.querySelector("#slotMessage");
  const title = document.querySelector("#calendarTitle");
  let week = 0;
  let selectedDate = "";
  let selectedTime = "";
  const timeSlots = document.querySelector("#timeSlots");
  const chosenSlot = document.querySelector("#chosenSlot");
  const appointmentTimes = ["10:00 AM", "12:30 PM", "3:00 PM", "5:30 PM"];
  function renderCalendar() {
    calendar.innerHTML = dates
      .map((item) => {
        const n = Number(item.date) + week * 7;
        return `<div class="day ${item.status}"><span class="name">${item.day}</span><span class="date" ${item.status !== "closed" ? `data-date="${item.day} ${n}"` : ""}>${n}</span></div>`;
      })
      .join("");
    calendar.querySelectorAll("[data-date]").forEach((day) =>
      day.addEventListener("click", () => {
        selectedDate = day.dataset.date;
        selectedTime = "";
        chosenSlot.value = "";
        message.textContent = `${selectedDate} — choose a time that feels good ✦`;
        timeSlots.innerHTML = appointmentTimes
          .map(
            (time) =>
              `<button class="time-slot" type="button" data-time="${time}">${time}</button>`,
          )
          .join("");
        timeSlots.querySelectorAll(".time-slot").forEach((button) =>
          button.addEventListener("click", () => {
            selectedTime = button.dataset.time;
            timeSlots
              .querySelectorAll(".time-slot")
              .forEach((slot) =>
                slot.classList.toggle("is-selected", slot === button),
              );
            chosenSlot.value = `${selectedDate} at ${selectedTime}`;
            message.textContent = `${chosenSlot.value} is held while you finish your request ♡`;
          }),
        );
      }),
    );
    title.textContent =
      week === 0 ? "August 2026" : `Week of August ${10 + week * 7}, 2026`;
  }
  document.querySelector("#previous").addEventListener("click", () => {
    if (week > 0) {
      week--;
      renderCalendar();
    }
  });
  document.querySelector("#next").addEventListener("click", () => {
    if (week < 2) {
      week++;
      renderCalendar();
    }
  });
  renderCalendar();
}

const bookingForm = document.querySelector("#bookingForm");
bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const status = document.querySelector("#formStatus");
  if (!bookingForm.reportValidity()) return;
  status.textContent =
    "Your test request looks good! Once the free Google Sheet connection is switched on, this is where it will send directly to Rylie.";
});
