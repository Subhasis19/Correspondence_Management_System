const express = require("express");
const router = express.Router();
const { pool: db } = require("../db");
const { requireLogin } = require("../middlewares/authMiddleware");

// =========================
// NOTINGS: SAVE MONTHLY DATA
// =========================
router.post("/notings/save", requireLogin, (req, res) => {
    const groupName = req.session.user.group;
    const { month, year, entry_type, hindi, english, eoffice } = req.body;

    // Validation
    if (!month || !year || !entry_type) {
        return res.status(400).json({
            success: false,
            message: "Month, Year and Entry Type are required",
        });
    }

    const sql = `
    INSERT INTO notings_records
      (group_name, month, year, entry_type, notings_hindi_pages, notings_english_pages, eoffice_comments)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      notings_hindi_pages = VALUES(notings_hindi_pages),
      notings_english_pages = VALUES(notings_english_pages),
      eoffice_comments = VALUES(eoffice_comments)
  `;

    const params = [
        groupName,
        Number(month),
        Number(year),
        entry_type,
        Number(hindi) || 0,
        Number(english) || 0,
        Number(eoffice) || 0,
    ];

    db.query(sql, params, (err) => {
        if (err) {
            console.error("Notings save error:", err);
            return res.status(500).json({
                success: false,
                message: "Database error",
            });
        }

        res.json({
            success: true,
            message: "Notings saved successfully",
        });
    });
});

module.exports = router;
