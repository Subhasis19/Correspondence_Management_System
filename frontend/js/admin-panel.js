// admin-panel.js
// Handles loading users, add/edit/delete from Admin Panel
// Requires: dashboard.js shows #adminPanelView and has a button #addUserBtn

(async function () {
    // Utility: create element from HTML string
    function createEl(html) {
        const tmp = document.createElement("div");
        tmp.innerHTML = html.trim();
        return tmp.firstChild;
    }

    // Show simple toast via alert for now
    function showMsg(msg) {
        alert(msg);
    }

    // Fetch users from backend
    async function loadUsers() {
        const tbody = document.querySelector("#usersTable tbody");
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#999;">Loading users…</td></tr>`;

        try {
            const res = await fetch("/admin/users", { credentials: "same-origin" });
            if (!res.ok) {
                if (res.status === 403) {
                    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#999;">Access denied</td></tr>`;
                } else {
                    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#999;">Failed to load</td></tr>`;
                }
                return;
            }

            const rows = await res.json();
            renderUsersTable(rows);
        } catch (err) {
            console.error("loadUsers:", err);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#999;">Error loading users</td></tr>`;
        }
    }

    // Render table body
    function renderUsersTable(users) {
        const tbody = document.querySelector("#usersTable tbody");
        if (!tbody) return;

        if (!users || users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#999;">No users found.</td></tr>`;
            return;
        }

        tbody.innerHTML = users
            .map(
                (u) => `
      <tr data-id="${u.id}">
        <td>${escapeHtml(u.name || "")}</td>
        <td>${escapeHtml(u.email || "")}</td>
        <td>${escapeHtml(u.mobile || "")}</td>
        <td>${escapeHtml(u.group_name || "")}</td>
        <td>
          <button class="action-btn action-edit" data-action="edit" data-id="${u.id
                    }">Edit</button>
          <button class="action-btn action-delete" data-action="delete" data-id="${u.id
                    }">Delete</button>
        </td>
      </tr>
    `
            )
            .join("");
    }

    // Simple HTML escaper
    function escapeHtml(s) {
        return String(s || "").replace(/[&<>"'`=\/]/g, function (c) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
                "/": "&#x2F;",
                "`": "&#x60;",
                "=": "&#x3D;",
            }[c];
        });
    }

    // Open modal for Add or Edit
    function openUserModal({ mode = "add", user = {} } = {}) {
        // modal markup
        const modal = createEl(`
      <div class="admin-modal-overlay" style="
          position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
          background:rgba(0,0,0,0.4); z-index:9999;">
        <div class="admin-modal" style="
            width:520px; max-width:94%; background:#fff; border-radius:10px; padding:18px;
            box-shadow:0 8px 24px rgba(0,0,0,0.12);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="margin:0;">${mode === "add" ? "Add User" : "Edit User"
            }</h3>
            <button id="modalClose" style="border:none;background:transparent; font-size:18px; cursor:pointer;">✕</button>
          </div>

          <form id="adminUserForm">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div>
                <label style="font-size:13px;">Name*</label>
                <input name="name" value="${escapeAttr(
                user.name || ""
            )}" required style="width:100%; padding:8px; margin-top:6px;"/>
              </div>
              <div>
                <label style="font-size:13px;">Email*</label>
                <input name="email" value="${escapeAttr(
                user.email || ""
            )}" type="email" required style="width:100%; padding:8px; margin-top:6px;"/>
              </div>

              <div>
                <label style="font-size:13px;">Mobile</label>
                <input name="mobile" value="${escapeAttr(
                user.mobile || ""
            )}" style="width:100%; padding:8px; margin-top:6px;"/>
              </div>

              

              <div style="grid-column: 1 / -1;">
  <label style="font-size:13px;">Group*</label>
  <select name="group_name" required style="width:100%; padding:8px; margin-top:6px;">
      <option value="">Select Group</option>
      <option value="Admin" ${user.group_name === "Admin" ? "selected" : ""}>Admin</option>
      <option value="HR" ${user.group_name === "HR" ? "selected" : ""}>HR</option>
      <option value="Finance" ${user.group_name === "Finance" ? "selected" : ""}>Finance</option>
      <option value="SWT" ${user.group_name === "SWT" ? "selected" : ""}>SWT</option>
      <option value="HWT" ${user.group_name === "HWT" ? "selected" : ""}>HWT</option>
      <option value="ISS" ${user.group_name === "ISS" ? "selected" : ""}>ISS</option>
      <option value="CH Office" ${user.group_name === "CH Office" ? "selected" : ""}>CH Office</option>
      <option value="MIS" ${user.group_name === "MIS" ? "selected" : ""}>MIS</option>
      <option value="PMU" ${user.group_name === "PMU" ? "selected" : ""}>PMU</option>
      <option value="E&T" ${user.group_name === "E&T" ? "selected" : ""}>E&T</option>
      <option value="NetOps" ${user.group_name === "NetOps" ? "selected" : ""}>NetOps</option>
      <option value="MMG" ${user.group_name === "MMG" ? "selected" : ""}>MMG</option>
  </select>
</div>


              ${mode === "add"
                ? `
                <div style="grid-column: 1 / -1;">
                  <label style="font-size:13px;">Temporary Password*</label>
                  <input name="password" type="password" required style="width:100%; padding:8px; margin-top:6px;" placeholder="Set temporary password" />
                  <p style="font-size:12px; color:#666; margin-top:6px;">User can change password after first login.</p>
                </div>
              `
                : ""
            }
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
              <button type="button" id="cancelBtn" style="padding:8px 12px; border-radius:6px; border:1px solid #ddd; background:#fff; cursor:pointer;">Cancel</button>
              <button type="submit" id="saveBtn" style="padding:8px 12px; background:var(--primary); color:#fff; border:none; border-radius:6px; cursor:pointer;">
                ${mode === "add" ? "Create User" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    `);

        document.body.appendChild(modal);

        // helpers
        const overlay = modal;
        const form = modal.querySelector("#adminUserForm");
        const cancelBtn = modal.querySelector("#cancelBtn");
        const closeBtn = modal.querySelector("#modalClose");

        function closeModal() {
            overlay.remove();
        }

        cancelBtn.addEventListener("click", closeModal);
        closeBtn.addEventListener("click", closeModal);
        overlay.addEventListener("click", (ev) => {
            if (ev.target === overlay) closeModal();
        });

        form.addEventListener("submit", async (ev) => {
            ev.preventDefault();

            const fd = new FormData(form);
            const payload = {
                name: (fd.get("name") || "").trim(),
                email: (fd.get("email") || "").trim(),
                mobile: (fd.get("mobile") || "").trim(),
                group_name: (fd.get("group_name") || "").trim(),
            };

            try {
                if (mode === "add") {
                    const password = (fd.get("password") || "").trim();
                    if (!password) return showMsg("Password required");
                    payload.password = password;

                    const res = await fetch("/admin/users/add", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "same-origin",
                        body: JSON.stringify(payload),
                    });

                    const j = await res.json().catch(() => null);
                    if (!res.ok) {
                        showMsg((j && j.message) || "Failed to create user");
                        return;
                    }

                    showMsg("User created");
                    closeModal();
                    loadUsers();
                    return;
                } else {
                    // edit
                    const res = await fetch(`/admin/users/update/${user.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        credentials: "same-origin",
                        body: JSON.stringify(payload),
                    });

                    const j = await res.json().catch(() => null);
                    if (!res.ok) {
                        showMsg((j && j.message) || "Failed to update user");
                        return;
                    }

                    showMsg("User updated");
                    closeModal();
                    loadUsers();
                }
            } catch (err) {
                console.error("user modal submit:", err);
                showMsg("Network error");
            }
        });
    }

    // Escape attr values in inputs
    function escapeAttr(s) {
        return String(s || "")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // Delete user action (with confirmation)
    async function deleteUser(id) {
        if (!confirm("Delete this user? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/admin/users/delete/${id}`, {
                method: "DELETE",
                credentials: "same-origin",
            });
            const j = await res.json().catch(() => null);
            if (!res.ok) {
                showMsg((j && j.message) || "Failed to delete user");
                return;
            }
            showMsg("User deleted");
            loadUsers();
        } catch (err) {
            console.error("deleteUser:", err);
            showMsg("Network error");
        }
    }

    // Click delegation for edit/delete buttons
    function attachTableHandlers() {
        const table = document.getElementById("usersTable");
        if (!table) return;

        table.removeEventListener("click", table._adminClickHandler);
        const handler = (ev) => {
            const btn = ev.target.closest("button[data-action]");
            if (!btn) return;

            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (!id) return;

            if (action === "edit") {
                // fetch user's current row data from DOM or reload from server if needed
                const tr = btn.closest("tr");
                const user = {
                    id: Number(id),
                    name: tr.children[0].textContent.trim(),
                    email: tr.children[1].textContent.trim(),
                    mobile: tr.children[2].textContent.trim(),
                    group_name: tr.children[4].textContent.trim(),
                };
                openUserModal({ mode: "edit", user });
                return;
            }

            if (action === "delete") {
                // prevent deleting self via UI: get current session id by trying to read from #adminName? server also prevents
                const currentUserId = window.__CURRENT_USER_ID || null;
                if (Number(id) === Number(currentUserId)) {
                    showMsg("You cannot delete your own account");
                    return;
                }
                deleteUser(id);
                return;
            }
        };

        table.addEventListener("click", handler);
        table._adminClickHandler = handler;
    }

    // Hook Add User button
    function initAddUserBtn() {
        const btn = document.getElementById("addUserBtn");
        if (!btn) return;
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            openUserModal({ mode: "add" });
        });
    }

    // Try to fetch session-info to store current user id for UI-level protection
    async function fetchCurrentUserId() {
        try {
            const res = await fetch("/session-info", { credentials: "same-origin" });
            if (!res.ok) return;
            const j = await res.json();
            if (j && j.user && j.user.id) {
                window.__CURRENT_USER_ID = j.user.id;
            }
        } catch (err) {
            // ignore
        }
    }

    // Public function connecting points: called by dashboard.js when admin panel opens
    window.__adminPanelLoadUsers = loadUsers; // expose for dashboard to call

    // Init
    document.addEventListener("DOMContentLoaded", () => {
        initAddUserBtn();
        attachTableHandlers();
        fetchCurrentUserId();
        // If admin-panel already visible on load, load users
        if (document.getElementById("adminPanelView")?.style.display !== "none") {
            loadUsers();
        }
    });

    // Also try to automatically attach a click observer in case admin view is shown later
    // (Dashboard will call window.__adminPanelLoadUsers when it shows admin view)
})();
