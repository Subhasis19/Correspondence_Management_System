

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
    LOAD DASHBOARD (GLOBAL / MONTHLY)
  --------------------------- */
  async function loadDashboard(month = null, year = null) {
    try {

      let url = "/dashboard/summary";

      if (month && year) {
        url += `?month=${month}&year=${year}`;
      }

      // ===== CONTROL TABLE SCROLL =====
      const inwardScroll = document.querySelector("#inwardsTable")?.closest(".table-scroll");
      const outwardScroll = document.querySelector("#outwardsTable")?.closest(".table-scroll");

      if (month && year) {
        if (inwardScroll) inwardScroll.style.maxHeight = "400px";
        if (outwardScroll) outwardScroll.style.maxHeight = "400px";
      } else {
        if (inwardScroll) inwardScroll.style.maxHeight = "none";
        if (outwardScroll) outwardScroll.style.maxHeight = "none";
      }


      const res = await fetch(url);
      const data = await res.json();

      // Update Cards
      document.getElementById("totalInwards").textContent = data.totalInwards;
      document.getElementById("totalOutwards").textContent = data.totalOutwards;
      document.getElementById("repliesPending").textContent = data.repliesPending;

      // Render Inwards
      const inwardTbody = document.getElementById("inwardsTbody");

      if (!data.inwards.length) {
        inwardTbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align:center; padding:20px; color:#999;">
              No records found.
            </td>
          </tr>`;
      } else {

        const rowsToShow = (month && year)
          ? data.inwards
          : data.inwards.slice(0, 5);

        inwardTbody.innerHTML = rowsToShow.map(r => {

          const isPending =
            r.reply_required === "Yes" && !r.reply_sent_date;

          return `
              <tr 
                class="record-row ${isPending ? 'pending-row' : ''}"
                data-type="inward"
                data-id="${r.s_no}"
              >
              <td>
                <strong>${r.inward_no}</strong>
                ${isPending ? `<span class="pending-badge">Pending</span>` : ''}
              </td>
              <td>${formatDate(r.date_of_receipt)}</td>
              <td>${r.name_of_sender}</td>
              <td>${r.received_in}</td>
            </tr>
          `;
        }).join("");
      }

      // Render Outwards
      const outwardTbody = document.getElementById("outwardsTbody");

      if (!data.outwards.length) {
        outwardTbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align:center; padding:20px; color:#999;">
              No records found.
            </td>
          </tr>`;
      } else {

        const rowsToShow = (month && year)
          ? data.outwards
          : data.outwards.slice(0, 5);

        outwardTbody.innerHTML = rowsToShow.map(r => `
            <tr 
              class="record-row"
              data-type="outward"
              data-id="${r.s_no}"
            >
            <td><strong>${r.outward_no}</strong></td>
            <td>${formatDate(r.date_of_despatch)}</td>
            <td>${r.name_of_receiver}</td>
            <td>${r.reply_from}</td>
          </tr>
        `).join("");
      }

    } catch (err) {
      console.error("loadDashboard error:", err);
    }
  }

  window.loadDashboard = loadDashboard;


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

      tbody.innerHTML = rows.slice(0, 5).map(r => {

      const isPending =
        r.reply_required === "Yes" && !r.has_outward;

      return `
          <tr data-id="${r.s_no}" class="inward-row"
            ${isPending ? 'style="background:#fff3cd;"' : ''}>
          <td>
            <strong>${r.inward_no}</strong>
            ${isPending ? `<span class="pending-badge">Pending</span>` : ''}
          </td>
          <td>${formatDate(r.date_of_receipt)}</td>
          <td>${r.name_of_sender}</td>
          <td>${r.received_in}</td>
        </tr>
      `;
    }).join("");


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
    // let file = "";

    if (page === "inward") {
      // file = "inward.html";
      formFrame.src = "/inward";
      iframeTitle.textContent = window.currentUserGroup
        ? `Inward Entry Form (${window.currentUserGroup})`
        : "Inward Entry Form";
    }

    if (page === "outward") {
      // file = "outward.html";
      formFrame.src = "/outward";
      iframeTitle.textContent = window.currentUserGroup
        ? `Outward Entry Form (${window.currentUserGroup})`
        : "Outward Entry Form";
    }


    // if (!file) return;

    // formFrame.src = file;
    iframeContainer.style.display = "block";
    dashboardView.style.display = "none";

    setActiveMenuItem(page);
  }


  function closeIframe() {
    iframeContainer.style.display = "none";
    dashboardView.style.display = "block";

    formFrame.src = ""; 

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
      loadDashboard();
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

    document.addEventListener("click", async (e) => {
      const row = e.target.closest(".record-row");
      if (!row) return;

      const id = row.dataset.id;
      const type = row.dataset.type;

      if (!id || !type) return;

      try {
        if (type === "inward") {
          document.getElementById("modalTitle").textContent = "Inward Details";
          const res = await fetch(`/inward/details/${id}`);
          const data = await res.json();

          document.getElementById("inwardModalContent").innerHTML = `
            <p><strong>Inward No:</strong> ${data.inward_no}</p>
            <p><strong>Date of Receipt:</strong> ${formatDate(data.date_of_receipt)}</p>
            <p><strong>Month:</strong> ${data.month || "-"}</p>
            <p><strong>Year:</strong> ${data.year || "-"}</p>
            <p><strong>Office:</strong> ${data.received_in}</p>

            <hr>

            <p><strong>Sender Name:</strong> ${data.name_of_sender || "-"}</p>
            <p><strong>Address:</strong> ${data.address_of_sender || "-"}</p>
            <p><strong>City:</strong> ${data.sender_city || "-"}</p>
            <p><strong>State:</strong> ${data.sender_state || "-"}</p>
            <p><strong>PIN:</strong> ${data.sender_pin || "-"}</p>
            <p><strong>Region:</strong> ${data.sender_region || "-"}</p>
            <p><strong>Organisation Type:</strong> ${data.sender_org_type || "-"}</p>

            <hr>

            <p><strong>Document Type:</strong> ${data.type_of_document}</p>
            <p><strong>Language:</strong> ${data.language_of_document}</p>
            <p><strong>Document Count:</strong> ${data.count}</p>
            <p><strong>Remarks:</strong> ${data.remarks || "-"}</p>
            <p><strong>Issued To:</strong> ${data.issued_to || "-"}</p>

            <hr>

            <p><strong>Reply Required:</strong> ${data.reply_required}</p>
            <p><strong>Reply Sent Date:</strong> ${
              data.reply_sent_date
                ? new Date(data.reply_sent_date).toLocaleDateString("en-IN")
                : "-"
            }</p>
            <p><strong>Reply Reference No:</strong> ${data.reply_ref_no || "-"}</p>
            <p><strong>Reply Sent By:</strong> ${data.reply_sent_by || "-"}</p>
            <p><strong>Reply Language:</strong> ${data.reply_sent_in || "-"}</p>
            <p><strong>Reply Count:</strong> ${data.reply_count || 0}</p>
            <p><strong>Created At:</strong> ${formatDate(data.created_at)}</p>
          `;

          document.getElementById("inwardModal").style.display = "flex";
        }

        else if (type === "outward") {
          document.getElementById("modalTitle").textContent = "Outward Details";
          const res = await fetch(`/outward/details/${id}`);
          const data = await res.json();

          document.getElementById("inwardModalContent").innerHTML = `
            <p><strong>Outward No:</strong> ${data.outward_no}</p>
            <p><strong>Date of Despatch:</strong> ${formatDate(data.date_of_despatch)}</p>
            <p><strong>Month:</strong> ${data.month || "-"}</p>
            <p><strong>Year:</strong> ${data.year || "-"}</p>
            <p><strong>Reply From (Office):</strong> ${data.reply_from || "-"}</p>

            <hr>

            <p><strong>Receiver Name:</strong> ${data.name_of_receiver || "-"}</p>
            <p><strong>Address:</strong> ${data.address_of_receiver || "-"}</p>
            <p><strong>City:</strong> ${data.receiver_city || "-"}</p>
            <p><strong>State:</strong> ${data.receiver_state || "-"}</p>
            <p><strong>PIN:</strong> ${data.receiver_pin || "-"}</p>
            <p><strong>Region:</strong> ${data.receiver_region || "-"}</p>
            <p><strong>Organisation Type:</strong> ${data.receiver_org_type || "-"}</p>

            <hr>

            <p><strong>Document Type:</strong> ${data.type_of_document || "-"}</p>
            <p><strong>Language:</strong> ${data.language_of_document || "-"}</p>
            <p><strong>Document Count:</strong> ${data.count || 0}</p>

            <hr>

            <p><strong>Linked Inward No:</strong> ${data.inward_no || "-"}</p>

            <hr>

            <p><strong>Reply Issued By:</strong> ${data.reply_issued_by || "-"}</p>
            <p><strong>Reply Sent Date:</strong> ${
              data.reply_sent_date ? formatDate(data.reply_sent_date) : "-"
            }</p>
            <p><strong>Reply Reference No:</strong> ${data.reply_ref_no || "-"}</p>
            <p><strong>Reply Sent By:</strong> ${data.reply_sent_by || "-"}</p>
            <p><strong>Reply Language:</strong> ${data.reply_sent_in || "-"}</p>
            <p><strong>Reply Count:</strong> ${data.reply_count || 0}</p>

            <hr>

            <p><strong>Group Name:</strong> ${data.group_name || "-"}</p>
            <p><strong>Created At:</strong> ${formatDate(data.created_at)}</p>
          `;

          document.getElementById("inwardModal").style.display = "flex";
        }


      } catch (err) {
        console.error("Modal error:", err);
      }
    });

    document.getElementById("closeInwardModal")?.addEventListener("click", () => {
    document.getElementById("inwardModal").style.display = "none";
    });

    // Close when clicking outside modal
    document.getElementById("inwardModal")?.addEventListener("click", (e) => {
      if (e.target.id === "inwardModal") {
        document.getElementById("inwardModal").style.display = "none";
      }
    });

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


// Populate dashboard year dropdown for dashboard report filtering 
(function initDashboardYear() {
  const sel = document.getElementById("dashYear");
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


// Dashboard Filter Apply
document.getElementById("dashFilterBtn")?.addEventListener("click", () => {
  const month = document.getElementById("dashMonth").value;
  const year = document.getElementById("dashYear").value;

  console.log("Selected:", month, year);

  if (!month || !year) {
    alert("Select Month and Year");
    return;
  }

  document.getElementById("dashFilterLabel").textContent =
    `Showing Data For: ${document.getElementById("dashMonth").selectedOptions[0].text} ${year}`;

  loadDashboard(month, year);
});

// Dashboard Filter Clear
document.getElementById("dashClearBtn")?.addEventListener("click", () => {
  document.getElementById("dashMonth").value = "";
  document.getElementById("dashYear").value = "";
  document.getElementById("dashFilterLabel").textContent = "";
  loadDashboard(); // back to global
});







