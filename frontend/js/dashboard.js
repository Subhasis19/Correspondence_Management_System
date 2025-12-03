

(async function () {

  /* ---------------------------
     FETCH SESSION
  --------------------------- */
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

  /* ---------------------------
     SIDEBAR HIGHLIGHT
  --------------------------- */
  function setActiveMenuItem(page) {
    document.querySelectorAll(".menu-item").forEach((it) => {
      it.classList.remove("active");
      if (it.dataset.page === page) it.classList.add("active");
    });
  }

  /* ---------------------------
     DATE FORMATTER
  --------------------------- */
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  /* ---------------------------
     LOAD INWARD RECORDS
  --------------------------- */
  async function loadInwardRecords() {
    try {
      const res = await fetch("/inward/all");
      const rows = await res.json();

      document.getElementById("totalInwards").textContent = rows.length;

      const tbody = document.getElementById("inwardsTbody");

      if (!rows.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align:center; padding:20px; color:#999;">
              No recent records.
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

  /* ---------------------------
     LOAD OUTWARD RECORDS
  --------------------------- */
  async function loadOutwardRecords() {
    try {
      const res = await fetch("/outward/all");
      const rows = await res.json();

      document.getElementById("totalOutwards").textContent = rows.length;

      const tbody = document.getElementById("outwardsTbody");

      if (!rows.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align:center; padding:20px; color:#999;">
              No recent records.
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

  /* ============================================================
     IFRAME LOADER
  ============================================================ */

  const dashboardView = document.getElementById("dashboardView");
  const iframeContainer = document.getElementById("iframeContainer");
  const formFrame = document.getElementById("formFrame");
  const iframeTitle = document.getElementById("iframeTitle");


  function openIframe(page) {
    let file = "";

    if (page === "inward") {
      file = "inward.html";
      iframeTitle.textContent = "Inward Entry Form";
    }

    if (page === "outward") {
      file = "outward.html";
      iframeTitle.textContent = "Outward Entry Form";
    }

    if (!file) return;

    formFrame.src = file;
    iframeContainer.style.display = "block";
    dashboardView.style.display = "none";

    setActiveMenuItem(page);
  }


  function closeIframe() {
    iframeContainer.style.display = "none";
    dashboardView.style.display = "block";

    formFrame.src = ""; // reset iframe

    setActiveMenuItem("dashboard");
    loadInwardRecords();
    loadOutwardRecords();
  }


  // Close button action
  document.getElementById("iframeClose").addEventListener("click", closeIframe);


  /* ============================================================
     PAGE HANDLER
  ============================================================ */
  function loadPage(page) {
    if (page === "dashboard") {
      closeIframe();
      return;
    }

    if (page === "inward" || page === "outward") {
      openIframe(page);
      return;
    }

     if (page === "admin-panel") {
        dashboardView.style.display = "none";
        iframeContainer.style.display = "none";
        document.getElementById("adminPanelView").style.display = "block";

        setActiveMenuItem("admin-panel");

        document.getElementById("adminBackBtn").onclick = () => loadPage("dashboard");

        return;
    }

}  //  <-- ADD THIS CLOSING BRACE TO END loadPage()


  /* ============================================================
     INIT
  ============================================================ */

  const session = await fetchSession();

  if (session?.user) {
    const user = session.user;

    document.getElementById("adminName").textContent = user.name;
    document.getElementById("welcomeName").textContent = user.name;

    // hide admin for non-admins
    if (user.role !== "admin") {
      const a = document.querySelector('[data-page="admin-panel"]');
      if (a) a.style.display = "none";
    }
  }

  // Sidebar click handlers
  document.querySelectorAll(".menu-item").forEach((it) => {
    it.addEventListener("click", (e) => {
      e.preventDefault();
      loadPage(it.dataset.page);
    });
  });

  // First load = dashboard
  loadPage("dashboard");
  setActiveMenuItem("dashboard");

})();
