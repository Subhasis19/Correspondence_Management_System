/* ===== Report UI: view + pdf generation ===== */
(function () {
  // helper template: render report HTML 

  let cachedReportHtml = "";

  function resetPdfCache() {
  cachedReportHtml = "";
  const pdfBtn = document.getElementById("downloadPdfBtn");
  if (pdfBtn) {
    pdfBtn.disabled = true;
    pdfBtn.style.opacity = "0.6";
    pdfBtn.style.cursor = "not-allowed";
  }
}


function renderReportHtml(payload, filters) {
  const { month, year, office } = filters;
  const s = payload || {};

  /* -----------------------------
     Helpers
  ----------------------------- */
  const safe = (val) => (val == null ? 0 : val);

  const inward = (region) => ({
    rEng: safe(s.inwardByRegion?.[region]?.receivedEnglish),
    rHin: safe(s.inwardByRegion?.[region]?.repliedHindi),
    rEngRep: safe(s.inwardByRegion?.[region]?.repliedEnglish),
    notExp: safe(s.inwardByRegion?.[region]?.notExpected),
  });

  const section3 = (region) => {
  const r = s.section3ByRegion?.[region] || {};
  return {
    h: safe(r.hindi),
    e: safe(r.english),
    total: safe(r.total),
    percent: safe(r.percent)
  };
};


  const emailReceived = (region, type) =>
    safe(s.emailReceived?.[region]?.[type]);

  const emailReplied = (region) =>
    safe(s.emailReplied?.[region]);

  const inwardA = inward("A");
  const inwardB = inward("B");
  const inwardC = inward("C");

  const sec3A = section3("A");
  const sec3B = section3("B");
  const sec3C = section3("C");


  const notHin = safe(s.notingsHindi);
  const notEng = safe(s.notingsEnglish);

  /* -----------------------------
      Template 
  ----------------------------- */
  return `
<div id="reportHtml" style="font-family: Arial; font-size:14px; color:#000;">

  <h3 style="margin-bottom:4px;">Monthly data for Quarterly Report for Hindi Rajbhasha</h3>
  <div><strong>Month / Year : </strong>${month} / ${year}</div>
  <div>
    Office:
      <strong>${office || "All Offices"}</strong>
  </div>


  <!-- Section 1 -->
  <h4 style="margin-top:20px;">1. Letters received in Hindi (Official Language Rule - 5)</h4>
  <table style="width:100%; border-collapse:collapse;">
    <tr><td>Total letters received in Hindi</td><td>${safe(s.lettersReceivedHindi)}</td></tr>
    <tr><td>No. of letters not to be replied to</td><td>${safe(s.notExpectedTotal)}</td></tr>
    <tr><td>Replied in Hindi</td><td>${safe(s.repliesSentHindi)}</td></tr>
    <tr><td>Replied in English</td><td>${safe(s.repliesSentEnglish)}</td></tr>
  </table>

  <!-- Section 2 -->
  <h4 style="margin-top:25px;">2. Letters received in English but replied in Hindi</h4>

  <!-- Region A -->
  <div style="margin-top:10px;">From Region 'A'</div>
  <table style="width:100%; border-collapse:collapse;">
    <tr><td>Letters received in English</td><td>${inwardA.rEng}</td></tr>
    <tr><td>Replied in Hindi</td><td>${inwardA.rHin}</td></tr>
    <tr><td>Replied in English</td><td>${inwardA.rEngRep}</td></tr>
    <tr><td>Not expected to be replied</td><td>${inwardA.notExp}</td></tr>
  </table>

  <!-- Region B -->
  <div style="margin-top:10px;">From Region 'B'</div>
  <table style="width:100%; border-collapse:collapse;">
    <tr><td>Letters received in English</td><td>${inwardB.rEng}</td></tr>
    <tr><td>Replied in Hindi</td><td>${inwardB.rHin}</td></tr>
    <tr><td>Replied in English</td><td>${inwardB.rEngRep}</td></tr>
    <tr><td>Not expected to be replied</td><td>${inwardB.notExp}</td></tr>
  </table>

  <!-- Region C -->
  <div style="margin-top:10px;">From Region 'C'</div>
  <table style="width:100%; border-collapse:collapse;">
    <tr><td>Letters received in English</td><td>${inwardC.rEng}</td></tr>
    <tr><td>Replied in Hindi</td><td>${inwardC.rHin}</td></tr>
    <tr><td>Replied in English</td><td>${inwardC.rEngRep}</td></tr>
    <tr><td>Not expected to be replied</td><td>${inwardC.notExp}</td></tr>
  </table>


  <!-- Section 3 -->
  <h4 style="margin-top:25px;">3. Details of original letters issued</h4>

  <!-- Region A -->
  <div>To Region 'A'</div>
  <table style="width:100%; border-collapse:collapse;">
    <tr><td>Issued in Hindi/Bilingual</td><td>${sec3A.h}</td></tr>
    <tr><td>Issued in English</td><td>${sec3A.e}</td></tr>
    <tr><td>Total issued</td><td>${sec3A.total}</td></tr>
    <tr><td>Percentage Hindi/Bilingual</td><td>${sec3A.percent}%</td></tr>
  </table>

  <!-- Region B -->
  <div style="margin-top:10px;">To Region 'B'</div>
  <table style="width:100%; border-collapse:collapse;">
    <tr><td>Issued in Hindi/Bilingual</td><td>${sec3B.h}</td></tr>
    <tr><td>Issued in English</td><td>${sec3B.e}</td></tr>
    <tr><td>Total issued</td><td>${sec3B.total}</td></tr>
    <tr><td>Percentage Hindi/Bilingual</td><td>${sec3B.percent}%</td></tr>
  </table>

  <!-- Region C -->
  <div style="margin-top:10px;">To Region 'C'</div>
  <table style="width:100%; border-collapse:collapse;">
    <tr><td>Issued in Hindi/Bilingual</td><td>${sec3C.h}</td></tr>
    <tr><td>Issued in English</td><td>${sec3C.e}</td></tr>
    <tr><td>Total issued</td><td>${sec3C.total}</td></tr>
    <tr><td>Percentage Hindi/Bilingual</td><td>${sec3C.percent}%</td></tr>
  </table>

  <!-- Section 4 -->
  <h4 style="margin-top:25px;">4. Notings on files/documents (during quarter)</h4>
  <table style="width:100%; border-collapse:collapse;">
    <tr><td>Notings in Hindi (pages)</td><td>${notHin}</td></tr>
    <tr><td>Notings in English (pages)</td><td>${notEng}</td></tr>
    <tr><td>Total Notings</td><td>${notHin + notEng}</td></tr>
    <tr><td>Comments sent through e-office</td><td>${safe(s.notingsEoffice)}</td></tr>
  </table>

  <!-- Section 5 -->
  <h4 style="margin-top:25px;">5. Emails received</h4>
  <table style="width:60%; border-collapse:collapse;">
    <tr><th>Region</th><th>English</th><th>Hindi</th></tr>
    <tr><td>A</td><td>${emailReceived("A","eng")}</td><td>${emailReceived("A","hin")}</td></tr>
    <tr><td>B</td><td>${emailReceived("B","eng")}</td><td>${emailReceived("B","hin")}</td></tr>
    <tr><td>C</td><td>${emailReceived("C","eng")}</td><td>${emailReceived("C","hin")}</td></tr>
    
  </table>

  <!-- Section 6 -->
  <h4 style="margin-top:25px;">6. Emails replied in Hindi</h4>
  <table style="width:40%; border-collapse:collapse;">
    <tr><th>Region</th><th>Nos</th></tr>
    <tr><td>A</td><td>${emailReplied("A")}</td></tr>
    <tr><td>B</td><td>${emailReplied("B")}</td></tr>
    <tr><td>C</td><td>${emailReplied("C")}</td></tr>
  </table>

  <!-- Footer -->
  <div style="margin-top:40px;">

    <div>
      Group Name:
      <strong>${filters.group || "All Groups"}</strong>
    </div>

    <div style="margin-top:10px;">Group Head Name: <strong>${s.groupHeadName || ""}</strong></div>
    <div style="margin-top:10px;">Signature: __________________________</div>
  </div>

</div>
`;
}


  async function fetchReportData(filters) {
    const body = JSON.stringify(filters);
    const res = await fetch("/admin/report/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body
    });
    if (!res.ok) {
      const j = await res.json().catch(()=>null);
      throw new Error((j && j.message) || "Failed to fetch report data");
    }
    return await res.json();
  }

  function injectReportStylesheet() {
  if (!document.getElementById("report-css")) {
    const link = document.createElement("link");
    link.id = "report-css";
    link.rel = "stylesheet";
    link.href = "/css/report.css";   
    document.head.appendChild(link);
  }
}


  // render preview into container
  async function viewReport() {
    const month = Number(document.getElementById("reportMonth").value);
    const year = Number(document.getElementById("reportYear").value);
    const office = document.getElementById("reportOffice").value || "";
    const group = document.getElementById("reportGroup").value || "";

    if (!month || !year) return alert("Select month and year");

    const filters = { month, year, office, group };
    const container = document.getElementById("reportPreviewContainer");
    container.innerHTML = `<div style="padding:30px;text-align:center;color:#777">Loading report…</div>`;

    try {
      const data = await fetchReportData(filters);
      injectReportStylesheet();

      const html = renderReportHtml(data, filters);
      container.innerHTML = html;

// Cache HTML for PDF
cachedReportHtml = html;

// Enable PDF button now
const pdfBtn = document.getElementById("downloadPdfBtn");
if (pdfBtn) {
  pdfBtn.disabled = false;
  pdfBtn.style.opacity = "1";
  pdfBtn.style.cursor = "pointer";
}


    } catch (err) {
      console.error("viewReport:", err);
      container.innerHTML = `<div style="padding:30px;text-align:center;color:#c00">${err.message}</div>`;
    }
  }

  async function generatePdf() {
  const month = Number(document.getElementById("reportMonth").value);
  const year = Number(document.getElementById("reportYear").value);

  if (!month || !year) {
    alert("Select month and year");
    return;
  }

  
  if (!cachedReportHtml) {
    alert("Please click View Report before generating PDF");
    return;
  }

  // Month name for filename
  const monthName = new Date(year, month - 1).toLocaleString("en-US", {
    month: "short"
  });

  const filename = `Rajbhasha_Report_${monthName}_${year}.pdf`;

  try {
    const res = await fetch("/admin/report/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        html: cachedReportHtml,
        filename
      })
    });

    if (!res.ok) {
      const j = await res.json().catch(() => null);
      throw new Error((j && j.message) || "PDF generation failed");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);

  } catch (err) {
    console.error("generatePdf:", err);
    alert(err.message || "Failed to generate PDF");
  }
}


  document.addEventListener("DOMContentLoaded", () => {
  const viewBtn = document.getElementById("viewReportBtn");
  const pdfBtn = document.getElementById("downloadPdfBtn");

  // Disable PDF button initially
  if (pdfBtn) {
    pdfBtn.disabled = true;
    pdfBtn.style.opacity = "0.6";
    pdfBtn.style.cursor = "not-allowed";
  }

  if (viewBtn) viewBtn.addEventListener("click", viewReport);
  if (pdfBtn) pdfBtn.addEventListener("click", generatePdf);
  ["reportMonth","reportYear","reportOffice","reportGroup"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("change", resetPdfCache);
});

});

})();


document.addEventListener("DOMContentLoaded", () => {
  const yearSelect = document.getElementById("reportYear");
  if (!yearSelect) return;

  const currentYear = new Date().getFullYear();

  // Generate range: current year → 5 years back and 2 year future 
  for (let y = currentYear + 2; y >= currentYear - 5; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
});
