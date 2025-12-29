

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
     LOAD REPORT GROUPS
  --------------------------- */
  async function loadReportGroups() {
    const select = document.getElementById("reportGroup");
    if (!select) return;

    // reset dropdown, keep default
    select.innerHTML = `<option value="">All Groups</option>`;

    try {
      const res = await fetch("/admin/report/groups", {
        credentials: "same-origin"
      });

      if (!res.ok) throw new Error("Failed to load groups");

      const groups = await res.json();

      groups.forEach(group => {
        const opt = document.createElement("option");
        opt.value = group;
        opt.textContent = group;
        select.appendChild(opt);
      });

    } catch (err) {
      console.error("loadReportGroups:", err);
    }
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
    hideAllViews(); 
    let file = "";

    if (page === "inward") {
      file = "inward.html";
      iframeTitle.textContent = window.currentUserGroup
        ? `Inward Entry Form (${window.currentUserGroup})`
        : "Inward Entry Form";
    }

    if (page === "outward") {
      file = "outward.html";
      iframeTitle.textContent = window.currentUserGroup
        ? `Outward Entry Form (${window.currentUserGroup})`
        : "Outward Entry Form";
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


  function hideAllViews() {
  dashboardView.style.display = "none";
  iframeContainer.style.display = "none";

  const adminPanel = document.getElementById("adminPanelView");
  if (adminPanel) adminPanel.style.display = "none";

  const notingsView = document.getElementById("notingsView");
  if (notingsView) notingsView.style.display = "none";

  const emailsView = document.getElementById("emailsView");
  if (emailsView) emailsView.style.display = "none";

}


  /* ============================================================
     PAGE HANDLER
  ============================================================ */
  function loadPage(page) {
    hideAllViews();
    

    if (page === "dashboard") {
      dashboardView.style.display = "block";
      setActiveMenuItem("dashboard");
      loadInwardRecords();
      loadOutwardRecords();
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

         if (typeof window.__adminPanelLoadUsers === "function") {
        window.__adminPanelLoadUsers();
    }

        return;
    }

    if (page === "notings") {
        dashboardView.style.display = "none";
        iframeContainer.style.display = "none";

        const adminPanel = document.getElementById("adminPanelView");
        if (adminPanel) adminPanel.style.display = "none";

        document.getElementById("notingsView").style.display = "block";
        setActiveMenuItem("notings");
        document.getElementById("notingsHindi").value = 0;
        document.getElementById("notingsEnglish").value = 0;
        document.getElementById("notingsEoffice").value = 0;
        document.getElementById("notingsMsg").textContent = "";

        document.getElementById("entryType").value = "";

        const nt = document.getElementById("notingsTitle");
          if (nt) {
            nt.textContent = window.currentUserGroup
              ? `Notings – Monthly Report (${window.currentUserGroup})`
              : "Notings – Monthly Report";
          }


    return;
  }

      if (page === "emails") {
      document.getElementById("emailsView").style.display = "block";
      setActiveMenuItem("emails");
      document.getElementById("emailsMsg").textContent = "";
      document.getElementById("emailsMonth").value = "";
      document.getElementById("emailsYear").value = "";
      document.getElementById("emailsEnglish").value = 0;
      document.getElementById("emailsHindi").value = 0;
      document.getElementById("emailsEntryType").value = "";
      document.getElementById("emailsRegion").value = "";

      const et = document.getElementById("emailsTitle");
if (et) {
  et.textContent = window.currentUserGroup
    ? `Emails – Monthly Entry (${window.currentUserGroup})`
    : "Emails – Monthly Entry";
}

      return;
    }

}  


  /* ============================================================
     INIT
  ============================================================ */

  const session = await fetchSession();

  if (session?.user) {
    const user = session.user;

     window.currentUserGroup = user.group || "";

    document.getElementById("adminName").textContent = user.name;
    document.getElementById("welcomeName").textContent =   user.group ? `${user.name} (${user.group})` : user.name;

    // hide admin for non-admins
    if (user.role !== "admin") {
      const a = document.querySelector('[data-page="admin-panel"]');
      if (a) a.style.display = "none";
    }
  }

   loadReportGroups();
  // Notings back button

const notingsBackBtn = document.getElementById("notingsBackBtn");
if (notingsBackBtn) {
  notingsBackBtn.addEventListener("click", () => {
  loadPage("dashboard");
});

}
// Emails back button
const emailsBackBtn = document.getElementById("emailsBackBtn");
if (emailsBackBtn) {
  emailsBackBtn.addEventListener("click", () => {
    loadPage("dashboard");
  });
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


// Populate year dropdown
(function initNotingsYear() {
  const sel = document.getElementById("notingsYear");
  if (!sel) return;
  const now = new Date().getFullYear();
  for (let y = now + 2; y >= now - 5; y--) {
    const o = document.createElement("option");
    o.value = y;
    o.textContent = y;
    sel.appendChild(o);
  }
})();

(function initEmailsYear() {
  const sel = document.getElementById("emailsYear");
  if (!sel) return;
  const now = new Date().getFullYear();
  for (let y = now + 2; y >= now - 5; y--) {
    const o = document.createElement("option");
    o.value = y;
    o.textContent = y;
    sel.appendChild(o);
  }
})();




// Save notings
document.getElementById("saveNotingsBtn")?.addEventListener("click", () => {

  const msg = document.getElementById("notingsMsg");
  if (!msg) return;


  const payload = {
  month: document.getElementById("notingsMonth").value,
  year: document.getElementById("notingsYear").value,
  entry_type: document.getElementById("entryType").value,
  hindi: Number(document.getElementById("notingsHindi").value) || 0,
  english: Number(document.getElementById("notingsEnglish").value) || 0,
  eoffice: Number(document.getElementById("notingsEoffice").value) || 0
};


  if (!payload.month || !payload.year || !payload.entry_type) {
    msg.textContent = "Please select Month, Year and Entry Type";
    msg.style.color = "red";
    return;
  }


  fetch("/notings/save", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
})
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      msg.textContent = data.message || "Save failed";
      msg.style.color = "red";
      return;
    }

    msg.textContent = "Saved successfully";
    msg.style.color = "green";
  })
  .catch(err => {
    console.error("Save notings error:", err);
    msg.textContent = "Server error";
    msg.style.color = "red";
  });


});

// =========================
// EMAILS: SAVE
// =========================
document.getElementById("saveEmailsBtn")?.addEventListener("click", () => {
  const msg = document.getElementById("emailsMsg");
  if (!msg) return;

  const payload = {
    month: document.getElementById("emailsMonth").value,
    year: document.getElementById("emailsYear").value,
    entry_type: document.getElementById("emailsEntryType").value,
    region: document.getElementById("emailsRegion").value,
    total_english: Number(document.getElementById("emailsEnglish").value) || 0,
    total_hindi: Number(document.getElementById("emailsHindi").value) || 0
  };

  // Validation
  if (!payload.month || !payload.year || !payload.entry_type || !payload.region) {
    msg.textContent = "Please select Month, Year, Type and Region";
    msg.style.color = "red";
    return;
  }

  fetch("/emails/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        msg.textContent = data.message || "Save failed";
        msg.style.color = "red";
        return;
      }

      msg.textContent = "Saved successfully";
      msg.style.color = "green";
    })
    .catch(err => {
      console.error("Save emails error:", err);
      msg.textContent = "Server error";
      msg.style.color = "red";
    });
});


