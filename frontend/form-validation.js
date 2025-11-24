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

/* ---------------- DOM HELPERS ---------------- */
function getByIdAny(...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

/* ---------------- INIT: REGION AUTO-FILL ---------------- */
function initRegion() {
  // support both senderState/senderRegion and receiverState/receiverRegion
  const state = getByIdAny("senderState", "receiverState");
  const region = getByIdAny("senderRegion", "receiverRegion");
  if (!state || !region) return;

  state.addEventListener("change", () => {
    region.value = stateToRegion[state.value] || "";
  });
}

/* ---------------- INIT: MONTH + YEAR AUTO-FILL ---------------- */
function initMonthYear() {
  // support both inwardDate and outwardDate
  const date = getByIdAny("inwardDate", "outwardDate");
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
  // support sender_pin or receiver_pin
  const pin = getByIdAny("sender_pin", "receiver_pin");
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
  // name can be name_of_sender (inward) or receiver_name (outward)
  const name = getByIdAny("name_of_sender", "receiver_name");
  const city = document.querySelector("[name='sender_city']") || document.querySelector("[name='receiver_city']");
  // optional fields
  const issued = document.querySelector("[name='issued_to']") || document.querySelector("[name='reply_issued_by']");
  const ref = document.querySelector("[name='reply_ref_no']");

  if (name) {
    name.addEventListener("input", () => {
      /^[A-Za-z ]+$/.test(name.value)
        ? clearErr(name.id === "name_of_sender" ? "err_name_of_sender" : "err_receiver_name")
        : showErr(name.id === "name_of_sender" ? "err_name_of_sender" : "err_receiver_name", "Only alphabets allowed");
    });
  }

  if (city) {
    city.addEventListener("input", () => {
      const errId = city.name === 'sender_city' ? 'err_sender_city' : 'err_receiver_city';
      /^[A-Za-z ]*$/.test(city.value)
        ? clearErr(errId)
        : showErr(errId, "City must contain only letters");
    });
  }

  if (issued) {
    issued.addEventListener("input", () => {
      const errId = issued.name === 'issued_to' ? 'err_issued_to' : 'err_reply_issued_by';
      /^[A-Za-z ]*$/.test(issued.value)
        ? clearErr(errId)
        : showErr(errId, "Only alphabets allowed");
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

    // Name (sender or receiver)
    const name = getByIdAny("name_of_sender", "receiver_name");
    if (name && !/^[A-Za-z ]+$/.test(name.value)) {
      const errId = name.id === "name_of_sender" ? "err_name_of_sender" : "err_receiver_name";
      showErr(errId, "Only alphabets allowed");
      valid = false;
      if (!firstErrorField) firstErrorField = name;
    }

    // City (sender or receiver)
    const city = document.querySelector("[name='sender_city']") || document.querySelector("[name='receiver_city']");
    if (city && city.value && !/^[A-Za-z ]+$/.test(city.value)) {
      const errId = city.name === 'sender_city' ? 'err_sender_city' : 'err_receiver_city';
      showErr(errId, "City must contain only letters");
      valid = false;
      if (!firstErrorField) firstErrorField = city;
    }

    // Issued To / Reply Issued By (optional)
    const issued = document.querySelector("[name='issued_to']") || document.querySelector("[name='reply_issued_by']");
    if (issued && issued.value && !/^[A-Za-z ]+$/.test(issued.value)) {
      const errId = issued.name === 'issued_to' ? 'err_issued_to' : 'err_reply_issued_by';
      showErr(errId, "Only alphabets allowed");
      valid = false;
      if (!firstErrorField) firstErrorField = issued;
    }

    // PIN (sender or receiver)
    const pin = getByIdAny("sender_pin", "receiver_pin");
    if (pin && !/^\d{6}$/.test(pin.value)) {
      showErr("err_pin", "PIN must be exactly 6 digits");
      valid = false;
      if (!firstErrorField) firstErrorField = pin;
    }

    // Document type (supports both ids)
    const docType = getByIdAny("type_of_document", "document_type");
    if (docType && docType.value === "") {
      showErr("err_doc_type", "Select a document type");
      valid = false;
      if (!firstErrorField) firstErrorField = docType;
    }

    // Reply required (may exist only on inward)
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
      showErr("err_reply_count", "Reply count must be between 0 – 9999");
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
