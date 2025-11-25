/* ===========================================================
   ADMIN DASHBOARD JS
   Fetches and displays recent inward/outward records
   =========================================================== */

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
  loadInwardRecords();
  loadOutwardRecords();
});
