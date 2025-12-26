/* ===== Report UI: view + pdf generation ===== */
(function () {
  // helper template: render report HTML 

  let cachedReportHtml = "";

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

  const outward = (region) => {
    const o = s.outwardByRegion?.[region] || {};
    const h = safe(o.hindi);
    const e = safe(o.english);
    const total = h + e;
    return {
      h, e,
      total,
      percent: total ? Math.round((h / total) * 100) : 0
    };
  };

  const emailReceived = (region, type) =>
    safe(s.emailReceived?.[region]?.[type]);

  const emailReplied = (region) =>
    safe(s.emailReplied?.[region]);

  const inwardA = inward("A");
  const inwardB = inward("B");

  const outA = outward("A");
  const outB = outward("B");
  const outC = outward("C");

  const notHin = safe(s.notingsHindi);
  const notEng = safe(s.notingsEnglish);

  /* -----------------------------
      Template 
  ----------------------------- */
  return `
<div id="reportHtml" style="font-family: Arial; font-size:14px; color:#000;">

  <h3 style="margin-bottom:4px;">Monthly data for Quarterly Report for Hindi Rajbhasha</h3>
  <div><strong>Month / Year : </strong>${month} / ${year}</div>
  ${office ? `<div>Office: <strong>${office}</strong></div>` : ""}

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

  <!-- Section 3 -->
  <h4 style="margin-top:25px;">3. Details of original letters issued</h4>

  <!-- Region A -->
  <div>To Region 'A'</div>
  <table style="width:100%; border-collapse:collapse;">
    <tr><td>Issued in Hindi/Bilingual</td><td>${outA.h}</td></tr>
    <tr><td>Issued in English</td><td>${outA.e}</td></tr>
    <tr><td>Total issued</td><td>${outA.total}</td></tr>
    <tr><td>Percentage Hindi/Bilingual</td><td>${outA.percent}%</td></tr>
  </table>

  <!-- Region B -->
  <div style="margin-top:10px;">To Region 'B'</div>
  <table style="width:100%; border-collapse:collapse;">
    <tr><td>Issued in Hindi/Bilingual</td><td>${outB.h}</td></tr>
    <tr><td>Issued in English</td><td>${outB.e}</td></tr>
    <tr><td>Total issued</td><td>${outB.total}</td></tr>
    <tr><td>Percentage Hindi/Bilingual</td><td>${outB.percent}%</td></tr>
  </table>

  <!-- Region C -->
  <div style="margin-top:10px;">To Region 'C'</div>
  <table style="width:100%; border-collapse:collapse;">
    <tr><td>Issued in Hindi/Bilingual</td><td>${outC.h}</td></tr>
    <tr><td>Issued in English</td><td>${outC.e}</td></tr>
    <tr><td>Total issued</td><td>${outC.total}</td></tr>
    <tr><td>Percentage Hindi/Bilingual</td><td>${outC.percent}%</td></tr>
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
    <div>Group Name: <strong>${s.groupName || ""}</strong></div>
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

    if (!month || !year) return alert("Select month and year");

    const filters = { month, year, office };
    const container = document.getElementById("reportPreviewContainer");
    container.innerHTML = `<div style="padding:30px;text-align:center;color:#777">Loading report…</div>`;

    try {
      const data = await fetchReportData(filters);
      injectReportStylesheet();
      // container.innerHTML = renderReportHtml(data, filters);

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
