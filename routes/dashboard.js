const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../db");
const { requireLogin } = require("../middlewares/authMiddleware");

// Helper: Promisify db.query
function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

// Helper: Get Month Date Range
function getMonthDateRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

// =============================================
// DASHBOARD VIEW
// =============================================
router.get("/dashboard.html", requireLogin, (req, res) => {
  // Pass to static middleware or send file directly
  res.sendFile(path.join(__dirname, "../frontend/dashboard.html"));
});

// =============================================
// DASHBOARD (GLOBAL + MONTHLY SUMMARY)
// =============================================
router.get("/dashboard/summary", requireLogin, async (req, res) => {
  try {
    const { month, year } = req.query;

    let start = null;
    let end = null;

    if (month && year) {
      const range = getMonthDateRange(Number(year), Number(month));
      start = range.start;
      end = range.end;
    }

    // -------- INWARD QUERY --------
    let inwardSql = `
      SELECT 
        i.*,
        o.s_no AS has_outward
      FROM inward_records i
      LEFT JOIN outward_records o
        ON i.s_no = o.inward_s_no
    `;
    let inwardParams = [];

    if (start && end) {
      inwardSql += ` WHERE date_of_receipt >= ? AND date_of_receipt < ? `;
      inwardParams.push(start, end);
    }
    inwardSql += ` ORDER BY s_no DESC`;
    const inwardRows = await dbQuery(inwardSql, inwardParams);

    // -------- OUTWARD QUERY --------
    let outwardSql = `SELECT * FROM outward_records`;
    let outwardParams = [];

    if (start && end) {
      outwardSql += ` WHERE date_of_despatch >= ? AND date_of_despatch < ? `;
      outwardParams.push(start, end);
    }
    outwardSql += ` ORDER BY s_no DESC`;
    const outwardRows = await dbQuery(outwardSql, outwardParams);

    // -------- COUNTS --------
    const totalInwards = inwardRows.length;
    const totalOutwards = outwardRows.length;
    const repliesPending = inwardRows.filter(r => r.reply_required === "Yes" && !r.has_outward).length;

    res.json({
      totalInwards,
      totalOutwards,
      repliesPending,
      inwards: inwardRows,
      outwards: outwardRows
    });

  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;