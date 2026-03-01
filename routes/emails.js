const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireLogin } = require("../middlewares/authMiddleware");

// =========================
// EMAILS: SAVE MONTHLY DATA
// =========================
router.post("/emails/save", requireLogin, async (req, res) => {
    try {
        const groupName = req.session.user.group;

        const {
            month,
            year,
            entry_type,
            region,
            total_english,
            total_hindi
        } = req.body;

        // Basic validation
        if (!month || !year || !entry_type || !region) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        const eng = Math.max(0, Number(total_english) || 0);
        const hin = Math.max(0, Number(total_hindi) || 0);

        const sql = `
      INSERT INTO email_records
        (group_name, month, year, entry_type, region, total_english, total_hindi)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        total_english = VALUES(total_english),
        total_hindi   = VALUES(total_hindi),
        created_at    = CURRENT_TIMESTAMP
    `;

        db.query(
            sql,
            [groupName, month, year, entry_type, region, eng, hin],
            (err) => {
                if (err) {
                    console.error("Email save error:", err);
                    return res.json({ success: false, message: "Database error" });
                }

                res.json({ success: true });
            }
        );
    } catch (err) {
        console.error("Email save exception:", err);
        res.json({ success: false, message: "Server error" });
    }
});

module.exports = router;