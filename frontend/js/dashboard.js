/* ===========================================================
   ADMIN DASHBOARD JS
   Fetches and displays recent inward/outward records
   Handles form loading via AJAX
   =========================================================== */

// Load a page (dashboard, inward, outward, admin-panel)
function loadPage(pageName) {
  const dashboardView = document.getElementById("dashboardView");
  const formView = document.getElementById("formView");

  if (pageName === "dashboard") {
    dashboardView.style.display = "block";
    formView.style.display = "none";
    setActiveMenuItem("dashboard");
    loadInwardRecords();
    loadOutwardRecords();
    return;
  }

  // Load form for inward/outward
  if (pageName === "inward" || pageName === "outward") {
    loadForm(pageName);
    return;
  }

  // Admin panel (placeholder)
  if (pageName === "admin-panel") {
    formView.innerHTML = `
      <div style="padding: 32px; background: white; border-radius: 8px; margin: 20px 0;">
        <h2>Admin Panel</h2>
        <p style="color: #999;">Coming soon...</p>
        <button onclick="loadPage('dashboard')" style="background: #4a90e2; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 20px;">
          Back to Dashboard
        </button>
      </div>
    `;
    dashboardView.style.display = "none";
    formView.style.display = "block";
    setActiveMenuItem("admin-panel");
    return;
  }
}

// Load form HTML via AJAX
function loadForm(formType) {
  const formView = document.getElementById("formView");
  const dashboardView = document.getElementById("dashboardView");

  const formFile = formType === "inward" ? "inward.html" : "outward.html";

  fetch(formFile)
    .then(res => res.text())
    .then(html => {
      // Extract just the form content (skip DOCTYPE and head)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const bodyContent = doc.body.innerHTML;

      // Ensure form.css is loaded
      if (!document.querySelector('link[href="css/form.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/form.css';
        document.head.appendChild(link);
      }

      // Add a back button and wrap the form
      formView.innerHTML = `
        <div style="padding: 32px; background: white; border-radius: 8px; margin: 20px 0;">
          <button onclick="loadPage('dashboard')" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-bottom: 20px; font-size: 14px;">
            ← Back to Dashboard
          </button>
          ${bodyContent}
        </div>
      `;

      dashboardView.style.display = "none";
      formView.style.display = "block";
      setActiveMenuItem(formType);

      // Re-initialize form validation if the script was loaded
      if (window.initRegion) initRegion();
      if (window.initMonthYear) initMonthYear();
      if (window.initPin) initPin();
      if (window.initFieldValidations) initFieldValidations();
      if (window.initCounts) initCounts();
      if (window.initFormValidation) initFormValidation();

      // Scroll to top
      document.querySelector(".content").scrollTop = 0;
    })
    .catch(err => {
      console.error(`Error loading form: ${err}`);
      formView.innerHTML = `
        <div style="padding: 32px; color: red;">
          <p>Error loading form. Please try again.</p>
          <button onclick="loadPage('dashboard')" style="background: #4a90e2; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 20px;">
            Back to Dashboard
          </button>
        </div>
      `;
      dashboardView.style.display = "none";
      formView.style.display = "block";
    });
}

// Set active menu item
function setActiveMenuItem(pageName) {
  document.querySelectorAll(".menu-item").forEach(item => {
    item.classList.remove("active");
    if (item.getAttribute("data-page") === pageName) {
      item.classList.add("active");
    }
  });
}

// Fetch and display inward records
async function loadInwardRecords() {
  try {
    const res = await fetch("/inward/all");
    if (!res.ok) throw new Error("Failed to fetch inward records");
    
    const records = await res.json();
    const tbody = document.getElementById("inwardsTbody");
    const totalInwards = document.getElementById("totalInwards");

    totalInwards.textContent = records.length;

    if (records.length === 0) {
      tbody.innerHTML = `
        <tr class="empty-state">
          <td colspan="4" style="text-align:center; padding:20px;">
            <p style="color:#999;">No inward records yet.</p>
          </td>
        </tr>
      `;
      return;
    }

    // Show only the last 5 records (most recent first)
    const recent = records.slice(0, 5);
    tbody.innerHTML = recent.map(record => `
      <tr>
        <td><strong>${record.inward_no || '—'}</strong></td>
        <td>${formatDate(record.date_of_receipt) || '—'}</td>
        <td>${record.name_of_sender || '—'}</td>
        <td>${record.received_in || '—'}</td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Error loading inward records:", err);
    document.getElementById("inwardsTbody").innerHTML = `
      <tr class="empty-state">
        <td colspan="4" style="text-align:center; padding:20px; color:#d9534f;">
          <p>Error loading records. Check console.</p>
        </td>
      </tr>
    `;
  }
}

// Fetch and display outward records (placeholder for future use)
async function loadOutwardRecords() {
  try {
    // When outward_records table is available, uncomment this:
    // const res = await fetch("/outward/all");
    // const records = await res.json();
    // ... populate outwardsTbody similarly
    
    // For now, show placeholder
    const tbody = document.getElementById("outwardsTbody");
    const totalOutwards = document.getElementById("totalOutwards");
    totalOutwards.textContent = "0";
    
  } catch (err) {
    console.error("Error loading outward records:", err);
  }
}

// Helper: Format date
function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { 
    year: "numeric", 
    month: "short", 
    day: "2-digit" 
  });
}

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  // Set up menu item click handlers
  document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const pageName = item.getAttribute("data-page");
      loadPage(pageName);
    });
  });

  // Load dashboard by default
  loadPage("dashboard");
});
