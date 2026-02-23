/* ===========================================================
   UNIVERSAL FORM VALIDATION (Inward + Outward)
   =========================================================== */

/* ---------------- STATE → REGION MAP ---------------- */
const stateToRegion = {
  Bihar: "A",
  Haryana: "A",
  "Himachal Pradesh": "A",
  "Madhya Pradesh": "A",
  Rajasthan: "A",
  "Uttar Pradesh": "A",
  Jharkhand: "A",
  Chhattisgarh: "A",
  Uttarakhand: "A",
  Delhi: "A",
  "Andaman & Nicobar Islands": "A",
  Gujarat: "B",
  Maharashtra: "B",
  Punjab: "B",
  Chandigarh: "B",
  "Daman & Diu": "B",
  "Dadra & Nagar Haveli": "B",
  "Andhra Pradesh": "C",
  "Arunachal Pradesh": "C",
  Assam: "C",
  Goa: "C",
  Kerala: "C",
  "Tamil Nadu": "C",
  "West Bengal": "C",
  Karnataka: "C",
  Odisha: "C",
  Telangana: "C",
  Sikkim: "C",
  Tripura: "C",
  Meghalaya: "C",
  Mizoram: "C",
  Nagaland: "C",
  Manipur: "C",
  Puducherry: "C",
  Lakshadweep: "C",
  Ladakh: "C",
  "Jammu & Kashmir": "C",
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
  // if (!date || !month || !year) return;
  if (!date) return;
  if (!month || !year) return;


  date.addEventListener("change", () => {
    const d = new Date(date.value);
    if (isNaN(d)) return;

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
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
  const name = getByIdAny("name_of_sender", "name_of_receiver");

  const city =
    document.querySelector("[name='sender_city']") ||
    document.querySelector("[name='receiver_city']");
  // optional fields
  const issued =
    document.querySelector("[name='issued_to']") ||
    document.querySelector("[name='reply_issued_by']");
  const ref = document.querySelector("[name='reply_ref_no']");

  if (name) {
    name.addEventListener("input", () => {
      /^[A-Za-z .]+$/.test(name.value)
        ? clearErr(
            name.id === "name_of_sender"
              ? "err_name_of_sender"
              : "err_receiver_name"
          )
        : showErr(
            name.id === "name_of_sender"
              ? "err_name_of_sender"
              : "err_receiver_name",
            "Only alphabets allowed"
          );
    });
  }

  if (city) {
    city.addEventListener("input", () => {
      const errId =
        city.name === "sender_city" ? "err_sender_city" : "err_receiver_city";
      /^[A-Za-z ]*$/.test(city.value)
        ? clearErr(errId)
        : showErr(errId, "City must contain only letters");
    });
  }

  if (issued) {
    issued.addEventListener("input", () => {
      const errId =
        issued.name === "issued_to" ? "err_issued_to" : "err_reply_issued_by";
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

/* ---------------- TOGGLE REPLY FIELDS WHEN REPLY_REQUIRED CHANGES ---------------- */
function initReplyToggle() {
  const replyRequired = document.getElementById("reply_required");
  if (!replyRequired) return;

  const isInwardForm = !!document.getElementById("inwardForm");

  const replyFields = [
    "[name='reply_sent_date']",
    "[name='reply_ref_no']",
    "[name='reply_sent_by']",
    "[name='reply_sent_in']",
    "[name='reply_count']"
  ];

  function applyState() {
    replyFields.forEach(sel => {
      const el = document.querySelector(sel);
      if (!el) return;

      // INWARD: always disabled
      if (isInwardForm) {
        el.disabled = true;
        el.classList.add("disabled-field");
        return;
      }

      // OUTWARD logic (unchanged)
      const enable = replyRequired.value === "Yes";
      el.disabled = !enable;

      if (!enable) el.value = "";
    });
  }

  applyState();
  replyRequired.addEventListener("change", applyState);
}



/* ---------------- TOGGLE OTHER DOCUMENT INPUT (INWARD + OUTWARD) ---------------- */
function initOtherDocumentToggle() {
  // Inward
  const inwardDoc = document.getElementById("type_of_document");
  const inwardWrap = document.getElementById("otherDocWrapper");
  const inwardInput = document.getElementById("other_document");

  // Outward
  const outwardDoc = document.getElementById("type_of_document");
  const outwardWrap = document.getElementById("otherDocWrapperOutward");
  const outwardInput = document.getElementById("other_document_outward");

  function toggle(doc, wrap, input) {
    if (!doc || !wrap || !input) return;

    if (doc.value === "Other Document") {
      wrap.style.display = "block";
      input.setAttribute("required", "required");
    } else {
      wrap.style.display = "none";
      input.removeAttribute("required");
      input.value = "";
      clearErr("err_other_document");
      clearErr("err_other_document_outward");
    }
  }

  // Inward binding
  if (inwardDoc) {
    toggle(inwardDoc, inwardWrap, inwardInput);
    inwardDoc.addEventListener("change", () =>
      toggle(inwardDoc, inwardWrap, inwardInput)
    );
  }

  // Outward binding
  if (outwardDoc) {
    toggle(outwardDoc, outwardWrap, outwardInput);
    outwardDoc.addEventListener("change", () =>
      toggle(outwardDoc, outwardWrap, outwardInput)
    );
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

    
    document
      .querySelectorAll(".error")
      .forEach((el) => (el.style.display = "none"));

    /* REQUIRED FIELDS (HTML required attribute) */
    form.querySelectorAll("[required]").forEach((field) => {
      if (field.disabled) return;
      const err = field.parentElement.querySelector(".error");
      if (!err) return;

      if (field.value.trim() === "") {
  valid = false;

  // Human-friendly field name
  const label =
    field.getAttribute("data-label") ||
    field.previousElementSibling?.textContent ||
    "This field";

  err.style.display = "block";
  err.textContent = `${label} is required`;

  field.classList.add("error-input");

  if (!firstErrorField) firstErrorField = field;
} else {
  field.classList.remove("error-input");
}
    });


    /* ADDITIONAL CUSTOM VALIDATION BELOW (identical to your old JS) */

    // Name (sender or receiver)
    const name = getByIdAny("name_of_sender", "name_of_receiver");
    if (name && !/^[A-Za-z .]+$/.test(name.value)) {
      const errId =
        name.id === "name_of_sender"
          ? "err_name_of_sender"
          : "err_receiver_name";
      showErr(errId, "Only alphabets, space and dot allowed");
      valid = false;
      if (!firstErrorField) firstErrorField = name;
    }

    // City (sender or receiver)
    const city =
      document.querySelector("[name='sender_city']") ||
      document.querySelector("[name='receiver_city']");
    if (city && city.value && !/^[A-Za-z ]+$/.test(city.value)) {
      const errId =
        city.name === "sender_city" ? "err_sender_city" : "err_receiver_city";
      showErr(errId, "City must contain only letters");
      valid = false;
      if (!firstErrorField) firstErrorField = city;
    }

    // Issued To / Reply Issued By (optional)
    const issued =
      document.querySelector("[name='issued_to']") ||
      document.querySelector("[name='reply_issued_by']");
    if (issued && issued.value && !/^[A-Za-z ]+$/.test(issued.value)) {
      const errId =
        issued.name === "issued_to" ? "err_issued_to" : "err_reply_issued_by";
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

// Other Document text validation (INWARD + OUTWARD)
const inwardOther = document.getElementById("other_document");
const outwardOther = document.getElementById("other_document_outward");

if (docType && docType.value === "Other Document") {
  const activeOther =
    inwardOther && inwardOther.offsetParent !== null
      ? inwardOther
      : outwardOther;

  const errId =
    activeOther === inwardOther
      ? "err_other_document"
      : "err_other_document_outward";

  if (!activeOther || activeOther.value.trim() === "") {
    showErr(errId, "Please specify the document type");
    valid = false;
    if (!firstErrorField) firstErrorField = activeOther;
  }
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
   
      // inside initFormValidation submit handler, before finalizing `valid`:
const replyRequiredField = document.querySelector("[name='reply_required']");
const replyIsRequired = replyRequiredField ? replyRequiredField.value === "Yes" : false;

// Validate reply fields only if replyIsRequired === true
if (replyIsRequired) {
  
  const rct = document.querySelector("[name='reply_count']");
  if (rct && rct.value && (rct.value < 0 || rct.value > 9999)) {
    showErr("err_reply_count", "Reply count must be between 0 – 9999");
    valid = false;
    if (!firstErrorField) firstErrorField = rct;
  }
}

    // Reply Count 0–9999
    // const rct = document.querySelector("[name='reply_count']");
    // if (rct && rct.value && (rct.value < 0 || rct.value > 9999)) {
    //   showErr("err_reply_count", "Reply count must be between 0 – 9999");
    //   valid = false;
    //   if (!firstErrorField) firstErrorField = rct;
    // }

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
  initReplyToggle();
  initOtherDocumentToggle();
  initFormValidation();
});


/* 
   OUTWARD: LIVE SEARCH BY inward_no + AUTO-FILL 
   - Shows "No results found"
   - nicer styling (rounded card + shadow)
   - shows inward_no, sender name, city, date, office
   - keeps all auto-filled fields editable
  */

window.addEventListener("DOMContentLoaded", () => {
  const inwardInput = document.querySelector('input[name="inward_no"]');
  if (!inwardInput) return; // only run on outward form

  // Create suggestion dropdown container
  const suggestBox = document.createElement("div");
  suggestBox.className = "suggest-box";
  suggestBox.style.position = "absolute";
  suggestBox.style.top = inwardInput.offsetHeight + 6 + "px";
  suggestBox.style.left = "0px";
  suggestBox.style.width = Math.max(inwardInput.offsetWidth, 320) + "px";
  suggestBox.style.background = "#fff";
  suggestBox.style.border = "1px solid rgba(20,30,60,0.08)";
  suggestBox.style.borderRadius = "8px";
  suggestBox.style.boxShadow = "0 8px 24px rgba(20,30,60,0.08)";
  suggestBox.style.maxHeight = "260px";
  suggestBox.style.overflowY = "auto";
  suggestBox.style.display = "none";
  suggestBox.style.zIndex = "9999";
  suggestBox.style.padding = "6px 6px";

  inwardInput.parentElement.style.position = "relative";
  inwardInput.parentElement.appendChild(suggestBox);

  let searchTimeout = null;

  inwardInput.addEventListener("input", () => {
    const q = inwardInput.value.trim();
    if (!q) {
      suggestBox.style.display = "none";
      suggestBox.innerHTML = "";
      return;
    }

    // Delay to prevent too many API calls
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => fetchSearchResults(q), 220);
  });

  async function fetchSearchResults(q) {
    try {
      const res = await fetch(`/api/inward/search?q=${q}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Network error");
      const rows = await res.json();

      suggestBox.innerHTML = "";

      if (!rows || rows.length === 0) {
        const noRes = document.createElement("div");
        noRes.style.padding = "12px";
        noRes.style.color = "#666";
        noRes.style.textAlign = "center";
        noRes.textContent = "No results found";
        suggestBox.appendChild(noRes);
        suggestBox.style.display = "block";
        return;
      }

      rows.forEach((row) => {
        const item = document.createElement("div");
        item.className = "suggest-item";
        item.style.padding = "10px";
        item.style.cursor = "pointer";
        item.style.borderRadius = "6px";
        item.style.marginBottom = "6px";
        item.style.background = "transparent";

        item.innerHTML = `
          <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
            <div>
              <div style="font-weight:600; font-size:14px; color:#0b3b66;">${
                row.inward_no
              }</div>
              <div style="font-size:13px; color:#334155; margin-top:4px;">
                ${row.name_of_sender ? escapeHtml(row.name_of_sender) : ""}
                ${
                  row.sender_city
                    ? `<span style="color:#6b7280"> — ${escapeHtml(
                        row.sender_city
                      )}</span>`
                    : ""
                }
              </div>
            </div>
            <div style="text-align:right; font-size:12px; color:#6b7280;">
              ${row.date_of_receipt ? formatDateShort(row.date_of_receipt) : ""}
              <div style="margin-top:6px; font-weight:600; color:#0b3b66;">${
                row.received_in || ""
              }</div>
            </div>
          </div>
        `;

        item.addEventListener(
          "mouseenter",
          () => (item.style.background = "#f6f9ff")
        );
        item.addEventListener(
          "mouseleave",
          () => (item.style.background = "transparent")
        );
        item.addEventListener("click", () => fillOutwardFields(row));
        suggestBox.appendChild(item);
      });

      suggestBox.style.display = "block";
    } catch (err) {
      console.error("Search error:", err);
      suggestBox.style.display = "none";
    }
  }

  function fillOutwardFields(r) {
    // Fill the input with selected inward_no
    inwardInput.value = r.inward_no;

    // Hide suggestions
    suggestBox.style.display = "none";

    // Map sender → receiver fields (keeps editable)
    const map = {
      name_of_receiver: r.name_of_sender,
      address_of_receiver: r.address_of_sender,
      receiver_city: r.sender_city,
      receiver_state: r.sender_state,
      receiver_pin: r.sender_pin,
      receiver_region: r.sender_region,
      receiver_org_type: r.sender_org_type,
      type_of_document: r.type_of_document,
      language_of_document: r.language_of_document,
      count: r.count, 
      reply_issued_by: r.reply_issued_by,
      // reply_sent_date: r.reply_sent_date 
      reply_sent_date: r.reply_sent_date
      ? r.reply_sent_date.substring(0, 10)
        : ""
        };

    Object.entries(map).forEach(([field, value]) => {
      const el = document.querySelector(`[name="${field}"]`);
      if (el) el.value = value || "";
    });


    // AUTO-FILL OTHER DOCUMENT 
    const docSelect = document.getElementById("type_of_document");
    const otherWrap = document.getElementById("otherDocWrapperOutward");
    const otherInput = document.getElementById("other_document_outward");

    if (docSelect && otherWrap && otherInput) {
      // If inward document is NOT Letter or Bill → treat as Other
      if (
        r.type_of_document &&
        !["Letter", "Bill"].includes(r.type_of_document)
      ) {
        docSelect.value = "Other Document";
        otherWrap.style.display = "block";
        otherInput.value = r.type_of_document;
        otherInput.setAttribute("required", "required");
      } else {
        otherWrap.style.display = "none";
        otherInput.value = "";
        otherInput.removeAttribute("required");
      }
    }


    // add hidden inward_s_no if needed for backend optimization
    let hidden = document.querySelector('input[name="inward_s_no"]');
    if (!hidden) {
      hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = "inward_s_no";
      inwardInput.form.appendChild(hidden);
    }
    hidden.value = r.s_no;
  }

  // Utilities
  function formatDateShort(d) {
    // d may be YYYY-MM-DD or Date object — convert
    if (!d) return "";
    const parts = String(d).split("T")[0].split("-"); // YYYY-MM-DD
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
    return d;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Hide suggestion box when clicking outside
  document.addEventListener("click", (e) => {
    if (!suggestBox.contains(e.target) && e.target !== inwardInput) {
      suggestBox.style.display = "none";
    }
  });

  // Handle keyboard navigation (optional small UX)
  let focusedIndex = -1;
  inwardInput.addEventListener("keydown", (ev) => {
    const items = Array.from(suggestBox.querySelectorAll(".suggest-item"));
    if (items.length === 0) return;

    if (ev.key === "ArrowDown") {
      focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
      items.forEach(
        (it, i) =>
          (it.style.background = i === focusedIndex ? "#eef6ff" : "transparent")
      );
      ev.preventDefault();
    } else if (ev.key === "ArrowUp") {
      focusedIndex = Math.max(focusedIndex - 1, 0);
      items.forEach(
        (it, i) =>
          (it.style.background = i === focusedIndex ? "#eef6ff" : "transparent")
      );
      ev.preventDefault();
    } else if (ev.key === "Enter") {
      if (focusedIndex >= 0 && items[focusedIndex]) {
        items[focusedIndex].click();
        ev.preventDefault();
      }
    }
  });
});

// ==================================================
// APPLY DOCUMENT TYPE (USED IN EDIT MODE)
// ==================================================
function applyDocumentType(selectId, wrapperId, inputId, dbValue) {
  const docSelect = document.getElementById(selectId);
  const otherWrap = document.getElementById(wrapperId);
  const otherInput = document.getElementById(inputId);

  if (!docSelect || !otherWrap || !otherInput) return;
  if (!dbValue) return;

  if (["Letter", "Bill"].includes(dbValue)) {
    docSelect.value = dbValue;
    otherWrap.style.display = "none";
    otherInput.value = "";
    otherInput.removeAttribute("required");
  } else {
    docSelect.value = "Other Document";
    otherWrap.style.display = "block";
    otherInput.value = dbValue;
    otherInput.setAttribute("required", "required");
  }
}
