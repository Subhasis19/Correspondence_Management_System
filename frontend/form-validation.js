/* ===========================================================
   UNIVERSAL FORM VALIDATION (Inward + Outward)
   Safe, modular, and fully compatible with your HTML
   =========================================================== */

/* ---------------- STATE → REGION MAP ---------------- */
const stateToRegion = {
  Bihar: "A", Haryana: "A", "Himachal Pradesh": "A", "Madhya Pradesh": "A",
  Rajasthan: "A", "Uttar Pradesh": "A", Jharkhand: "A", Chhattisgarh: "A",
  Uttarakhand: "A", Delhi: "A", "Andaman & Nicobar Islands": "A",
  Gujarat: "B", Maharashtra: "B", Punjab: "B", Chandigarh: "B",
  "Daman & Diu": "B", "Dadra & Nagar Haveli": "B",
  "Andhra Pradesh": "C", "Arunachal Pradesh": "C", Assam: "C", Goa: "C",
  Kerala: "C", "Tamil Nadu": "C", "West Bengal": "C", Karnataka: "C",
  Odisha: "C", Telangana: "C", Sikkim: "C", Tripura: "C",
  Meghalaya: "C", Mizoram: "C", Nagaland: "C", Manipur: "C",
  Puducherry: "C", Lakshadweep: "C", Ladakh: "C", "Jammu & Kashmir": "C",
};

/* ---------------- ERROR HELPERS ---------------- */
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "block";
  el.textContent = msg;
}

function clearErr(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "none";
}

/* ---------------- INIT: REGION AUTO-FILL ---------------- */
function initRegion() {
  const state = document.getElementById("senderState");
  const region = document.getElementById("senderRegion");
  if (!state || !region) return;

  state.addEventListener("change", () => {
    region.value = stateToRegion[state.value] || "";
  });
}

/* ---------------- INIT: MONTH + YEAR AUTO-FILL ---------------- */
function initMonthYear() {
  const date = document.getElementById("inwardDate");
  const month = document.getElementById("month");
  const year = document.getElementById("year");
  if (!date || !month || !year) return;

  date.addEventListener("change", () => {
    const d = new Date(date.value);
    if (isNaN(d)) return;

    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    month.value = months[d.getMonth()];
    year.value = d.getFullYear();
  });
}

/* ---------------- INIT: PIN VALIDATION ---------------- */
function initPin() {
  const pin = document.getElementById("sender_pin");
  if (!pin) return;

  pin.addEventListener("input", () => {
    pin.value = pin.value.replace(/\D/g, "").slice(0, 6);

    /^\d{6}$/.test(pin.value)
      ? clearErr("err_pin")
      : showErr("err_pin", "PIN must be exactly 6 digits");
  });
}

/* ---------------- INIT: TEXT FIELD VALIDATIONS ---------------- */
function initFieldValidations() {
  const name = document.getElementById("name_of_sender");
  const city = document.querySelector("[name='sender_city']");
  const issued = document.querySelector("[name='issued_to']");
  const ref = document.querySelector("[name='reply_ref_no']");

  if (name) {
    name.addEventListener("input", () => {
      /^[A-Za-z ]+$/.test(name.value)
        ? clearErr("err_name_of_sender")
        : showErr("err_name_of_sender", "Only alphabets allowed");
    });
  }

  if (city) {
    city.addEventListener("input", () => {
      /^[A-Za-z ]*$/.test(city.value)
        ? clearErr("err_sender_city")
        : showErr("err_sender_city", "City must contain only letters");
    });
  }

  if (issued) {
    issued.addEventListener("input", () => {
      /^[A-Za-z ]*$/.test(issued.value)
        ? clearErr("err_issued_to")
        : showErr("err_issued_to", "Only alphabets allowed");
    });
  }

  if (ref) {
    ref.addEventListener("input", () => {
      ref.value.length > 100
        ? showErr("err_reply_ref_no", "Max 100 characters allowed")
        : clearErr("err_reply_ref_no");
    });
  }
}

/* ---------------- INIT: COUNT VALIDATION ---------------- */
function initCounts() {
  const count = document.querySelector("[name='count']");
  const rcount = document.querySelector("[name='reply_count']");

  if (count) {
    count.addEventListener("input", () => {
      if (count.value < 0) count.value = 0;
      count.value > 9999
        ? showErr("err_count", "Maximum allowed is 9999")
        : clearErr("err_count");
    });
  }

  if (rcount) {
    rcount.addEventListener("input", () => {
      if (rcount.value < 0) rcount.value = 0;
      rcount.value > 9999
        ? showErr("err_reply_count", "Maximum allowed is 9999")
        : clearErr("err_reply_count");
    });
  }
}

/* ---------------- FULL FORM VALIDATION ---------------- */
function initFormValidation() {
  const form =
    document.getElementById("inwardForm") ||
    document.getElementById("outwardForm");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    let valid = true;
    let firstErrorField = null;

    // Remove old errors
    document.querySelectorAll(".error").forEach((el) => (el.style.display = "none"));

    /* REQUIRED FIELDS (HTML required attribute) */
    form.querySelectorAll("[required]").forEach((field) => {
      const err = field.parentElement.querySelector(".error");
      if (!err) return;

      if (field.value.trim() === "") {
        valid = false;
        err.style.display = "block";
        err.textContent = "This field is required";

        if (!firstErrorField) firstErrorField = field;
      }
    });

    /* ADDITIONAL CUSTOM VALIDATION BELOW (identical to your old JS) */

    // Sender name
    const name = document.getElementById("name_of_sender");
    if (name && !/^[A-Za-z ]+$/.test(name.value)) {
      showErr("err_name_of_sender", "Only alphabets allowed");
      valid = false;
      if (!firstErrorField) firstErrorField = name;
    }

    // City
    const city = document.querySelector("[name='sender_city']");
    if (city && city.value && !/^[A-Za-z ]+$/.test(city.value)) {
      showErr("err_sender_city", "City must contain only letters");
      valid = false;
      if (!firstErrorField) firstErrorField = city;
    }

    // Issued To
    const issued = document.querySelector("[name='issued_to']");
    if (issued && issued.value && !/^[A-Za-z ]+$/.test(issued.value)) {
      showErr("err_issued_to", "Only alphabets allowed");
      valid = false;
      if (!firstErrorField) firstErrorField = issued;
    }

    // PIN
    const pin = document.getElementById("sender_pin");
    if (pin && !/^\d{6}$/.test(pin.value)) {
      showErr("err_pin", "PIN must be exactly 6 digits");
      valid = false;
      if (!firstErrorField) firstErrorField = pin;
    }

    // Document type
    const docType = document.getElementById("type_of_document");
    if (docType && docType.value === "") {
      showErr("err_doc_type", "Select a document type");
      valid = false;
      if (!firstErrorField) firstErrorField = docType;
    }

    // Reply required
    const reply = document.getElementById("reply_required");
    if (reply && reply.value === "") {
      showErr("err_reply_required", "Choose yes or no");
      valid = false;
      if (!firstErrorField) firstErrorField = reply;
    }

    // Count 0–9999
    const ct = document.querySelector("[name='count']");
    if (ct && ct.value && (ct.value < 0 || ct.value > 9999)) {
      showErr("err_count", "Count must be between 0 and 9999");
      valid = false;
      if (!firstErrorField) firstErrorField = ct;
    }

    // Reply Count 0–9999
    const rct = document.querySelector("[name='reply_count']");
    if (rct && rct.value && (rct.value < 0 || rct.value > 9999)) {
      showErr("err_reply_count", "Reply count must be between 0–9999");
      valid = false;
      if (!firstErrorField) firstErrorField = rct;
    }

    if (!valid) {
      e.preventDefault();
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  });
}

/* ---------------- INITIALIZE ALL ON LOAD ---------------- */
window.addEventListener("DOMContentLoaded", () => {
  initRegion();
  initMonthYear();
  initPin();
  initFieldValidations();
  initCounts();
  initFormValidation();
});
