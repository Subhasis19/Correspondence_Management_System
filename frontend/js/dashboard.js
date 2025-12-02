/* ===========================================================
   CLEAN + FIXED DASHBOARD CONTROLLER
   - No blank white screen on first load
   - No redirect loops
   - Sidebar active state fixed
   - Form CSS loading fixed
   - Form JS reinitialization fixed
   - Outward → Inward search rebind fixed
   - All your old features preserved
=========================================================== */

(async function () {

  /* ------------------ SESSION ------------------ */
  async function fetchSession() {
    try {
      const r = await fetch("/session-info");
      if (!r.ok) throw new Error("Not logged in");
      return await r.json();
    } catch (e) {
      console.error("Session fetch failed:", e);
      window.location.href = "/";
      return null;
    }
  }

  /* ------------------ UI HELPERS ------------------ */
  function setActiveMenuItem(pageName) {
    document.querySelectorAll(".menu-item").forEach((it) => {
      it.classList.remove("active");
      if (it.dataset.page === pageName) it.classList.add("active");
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  /* ------------------ LOAD DASHBOARD DATA ------------------ */
  async function loadInwardRecords() {
    try {
      const res = await fetch("/inward/all");
      const rows = await res.json();

      document.getElementById("totalInwards").textContent = rows.length;

      const tbody = document.getElementById("inwardsTbody");

      if (rows.length === 0) {
        tbody.innerHTML = `
          <tr class="empty-state">
            <td colspan="4" style="text-align:center;padding:20px;color:#999">
              No recent inward records.
            </td>
          </tr>`;
        return;
      }

      tbody.innerHTML = rows.slice(0, 5).map(r => `
        <tr>
          <td><strong>${r.inward_no}</strong></td>
          <td>${formatDate(r.date_of_receipt)}</td>
          <td>${r.name_of_sender}</td>
          <td>${r.received_in}</td>
        </tr>
      `).join("");

    } catch (err) {
      console.error("loadInwardRecords:", err);
    }
  }

  async function loadOutwardRecords() {
    try {
      const res = await fetch("/outward/all");
      const rows = await res.json();

      document.getElementById("totalOutwards").textContent = rows.length;

      const tbody = document.getElementById("outwardsTbody");

      if (rows.length === 0) {
        tbody.innerHTML = `
          <tr class="empty-state">
            <td colspan="4" style="text-align:center;padding:20px;color:#999">
              No recent outward records.
            </td>
          </tr>`;
        return;
      }

      tbody.innerHTML = rows.slice(0, 5).map(r => `
        <tr>
          <td><strong>${r.outward_no}</strong></td>
          <td>${formatDate(r.date_of_despatch)}</td>
          <td>${r.name_of_receiver}</td>
          <td>${r.reply_from}</td>
        </tr>
      `).join("");

    } catch (err) {
      console.error("loadOutwardRecords:", err);
    }
  }

  /* ------------------ FORM HELPERS ------------------ */

  function ensureFormCss() {
    if (!document.querySelector('link[href="css/form.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "css/form.css";
      document.head.appendChild(link);
    }
  }

  function extractFormHtml(doc) {
    return (
      doc.querySelector("#inwardForm")?.outerHTML ||
      doc.querySelector("#outwardForm")?.outerHTML ||
      doc.querySelector(".form-wrapper")?.outerHTML ||
      doc.body.innerHTML
    );
  }

  function reinitFormHelpers() {
    if (window.initRegion) initRegion();
    if (window.initMonthYear) initMonthYear();
    if (window.initPin) initPin();
    if (window.initFieldValidations) initFieldValidations();
    if (window.initCounts) initCounts();
    if (window.initFormValidation) initFormValidation();

    bindOutwardInwardSearch();
  }

  /* ------------------ LIVE SEARCH OUTWARD → INWARD ------------------ */
  function bindOutwardInwardSearch() {
    const inwardInput =
      document.querySelector("[name='inward_no']") ||
      document.getElementById("inward_no");

    if (!inwardInput) return;

    const boxId = "inward-autocomplete-box";
    document.getElementById(boxId)?.remove();

    const box = document.createElement("div");
    box.id = boxId;
    box.style.position = "absolute";
    box.style.zIndex = 9999;
    box.style.background = "#fff";
    box.style.border = "1px solid #ddd";
    box.style.maxHeight = "220px";
    box.style.overflowY = "auto";
    box.style.display = "none";
    document.body.appendChild(box);

    function positionBox() {
      const rect = inwardInput.getBoundingClientRect();
      box.style.left = rect.left + "px";
      box.style.top = rect.bottom + window.scrollY + "px";
      box.style.width = rect.width + "px";
    }

    let timer = null;

    inwardInput.addEventListener("input", () => {
      const q = inwardInput.value.trim();

      clearTimeout(timer);

      if (!q) {
        box.style.display = "none";
        return;
      }

      timer = setTimeout(async () => {
        const res = await fetch(`/api/inward/search?q=${encodeURIComponent(q)}`);
        const items = await res.json();

        if (items.length === 0) {
          box.style.display = "none";
          return;
        }

        box.innerHTML = items.map(i => `
          <div class="inward-suggestion" data-item='${JSON.stringify(i)}'
               style="padding:8px;cursor:pointer;border-bottom:1px solid #eee">
            <div style="font-weight:600">${i.inward_no}</div>
            <div style="font-size:12px;color:#666">${i.name_of_sender}</div>
          </div>
        `).join("");

        positionBox();
        box.style.display = "block";
      }, 200);
    });

    box.addEventListener("click", e => {
      const item = e.target.closest(".inward-suggestion");
      if (!item) return;

      const data = JSON.parse(item.dataset.item);
      inwardInput.value = data.inward_no;

      // autofill receiver fields
      const map = {
        name_of_receiver: data.name_of_sender,
        address_of_receiver: data.address_of_sender,
        receiver_city: data.sender_city,
        receiver_state: data.sender_state,
        receiver_pin: data.sender_pin,
        receiver_region: data.sender_region,
        receiver_org_type: data.sender_org_type,
      };

      Object.entries(map).forEach(([k, v]) => {
        const el = document.querySelector(`[name='${k}']`);
        if (el) el.value = v;
      });

      box.style.display = "none";
    });

    window.addEventListener("scroll", positionBox);
    window.addEventListener("resize", positionBox);
  }

  /* ------------------ LOAD FORM ------------------ */
  async function loadForm(type) {
    const dashboardView = document.getElementById("dashboardView");
    const formView = document.getElementById("formView");

    try {
      const r = await fetch(type + ".html");
      const txt = await r.text();

      const doc = new DOMParser().parseFromString(txt, "text/html");

      ensureFormCss();

      const html = extractFormHtml(doc);

      formView.innerHTML = `
        <div class="form-wrapper-inner" 
             style="padding:24px;background:#fff;border-radius:8px;margin:20px 0;">
          <button class="back-btn">← Back to Dashboard</button>
          ${html}
        </div>
      `;

      formView.querySelector(".back-btn").onclick = () => loadPage("dashboard");

      dashboardView.style.display = "none";
      formView.style.display = "block";

      setActiveMenuItem(type);

      reinitFormHelpers();

    } catch (err) {
      console.error("loadForm error:", err);
      formView.innerHTML = `<div style="padding:20px;color:red">Failed to load form.</div>`;
    }
  }

  /* ------------------ MAIN PAGE LOADER ------------------ */
  function loadPage(pageName) {
    const dashboardView = document.getElementById("dashboardView");
    const formView = document.getElementById("formView");

   if (pageName === "dashboard") {
  dashboardView.style.display = "block";
  formView.style.display = "none";

  setActiveMenuItem("dashboard");
  loadInwardRecords();
  loadOutwardRecords();

  
  const pageContainer = document.querySelector(".content");
  if (pageContainer) pageContainer.scrollTop = 0;

  return;
}


    if (pageName === "inward" || pageName === "outward") {
      loadForm(pageName);
      return;
    }

    if (pageName === "admin-panel") {
      formView.innerHTML = `
        <div style="padding:32px;background:#fff;border-radius:8px">
          <h2>Admin Panel</h2>
          <p style="color:#888">Coming soon...</p>
          <button id="adminBack">← Back to Dashboard</button>
        </div>
      `;
      dashboardView.style.display = "none";
      formView.style.display = "block";
      setActiveMenuItem("admin-panel");

      document.getElementById("adminBack").onclick = () =>
        loadPage("dashboard");
    }
  }

  /* ------------------ INIT ------------------ */
  const session = await fetchSession();

  if (session?.user) {
    const user = session.user;

    document.getElementById("adminName").textContent = user.name;
    document.getElementById("welcomeName").textContent = user.name;

    if (user.role !== "admin") {
      const adminItem = document.querySelector('[data-page="admin-panel"]');
      if (adminItem) adminItem.style.display = "none";
    }
  }

  document.querySelectorAll(".menu-item").forEach((it) => {
    it.addEventListener("click", (e) => {
      e.preventDefault();
      loadPage(it.dataset.page);
    });
  });

  /* ---- Always load dashboard on first load ---- */
  loadPage("dashboard");
  setActiveMenuItem("dashboard");
})();
