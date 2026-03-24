const express = require("express");
const router = express.Router();
const { pool: db } = require("../db");
const { requireLogin } = require("../middlewares/authMiddleware");

// =========================
// NOTINGS: SAVE MONTHLY DATA
// =========================
router.post("/notings/save", requireLogin, (req, res) => {
    const { id } = req.body;
    const groupName = req.session.user.group;
    const userRole = req.session.user.role; 

    const { month, year, entry_type, hindi, english, eoffice } = req.body;

    if (!month || !year || !entry_type) {
        return res.status(400).json({
            success: false,
            message: "Month, Year and Entry Type are required",
        });
    }

    // CHECK IF ALREADY EXISTS
    const checkSql = `
        SELECT id, status FROM notings_records
        WHERE group_name = ? AND month = ? AND year = ? AND entry_type = ?
    `;

    db.query(checkSql, [groupName, month, year, entry_type], (err, rows) => {
        if (err) {
            console.error("Check error:", err);
            return res.status(500).json({ success: false, message: "DB error" });
        }

        if (rows.length > 0) {
            // If already confirmed → no one can edit
            if (rows[0].status === "confirmed") {
                return res.status(400).json({
                    success: false,
                    message: "Already confirmed. Cannot modify.",
                });
            }

            // If user → block
            if (userRole !== "admin") {
                return res.status(400).json({
                    success: false,
                    message: "Already submitted. Waiting for admin approval.",
                });
            }
        }
        // ✅ ADMIN EDIT MODE
        if (id && userRole === "admin") {
            const updateSql = `
                UPDATE notings_records
                SET notings_hindi_pages = ?,
                    notings_english_pages = ?,
                    eoffice_comments = ?
                WHERE id = ?
            `;

            return db.query(updateSql, [
                Number(hindi) || 0,
                Number(english) || 0,
                Number(eoffice) || 0,
                id
            ], (err) => {
                if (err) {
                    return res.status(500).json({ success: false });
                }

                res.json({ success: true, message: "Updated successfully" });
            });
        }

        // INSERT OR ADMIN UPDATE
        const sql = `
            INSERT INTO notings_records
            (group_name, month, year, entry_type, notings_hindi_pages, notings_english_pages, eoffice_comments , status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
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
                message: userRole === "admin"
                    ? "Updated successfully"
                    : "Submitted successfully",
            });
        });
    });
});



    // =========================
    // CHECK NOTINGS STATUS
    // =========================
    router.get("/notings/check", requireLogin, (req, res) => {
        const groupName = req.session.user.group;
        const { month, year, entry_type } = req.query;

        if (!month || !year || !entry_type) {
            return res.json({ exists: false });
        }

        const sql = `
            SELECT id, status FROM notings_records
            WHERE group_name = ? AND month = ? AND year = ? AND entry_type = ?
        `;

        db.query(sql, [groupName, month, year, entry_type], (err, rows) => {
            if (err) {
                console.error("Check status error:", err);
                return res.json({ exists: false });
            }

            if (rows.length === 0) {
                return res.json({ exists: false });
            }

            res.json({
                exists: true,
                status: rows[0].status
            });
        });
    });

    // =========================
    // ADMIN: GET ALL NOTINGS
    // =========================
    router.get("/admin/notings", requireLogin, (req, res) => {
        if (req.session.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const { month, year, group } = req.query;

        //  DO NOT RETURN ALL DATA
        if (!month || !year || !group) {
            return res.json([]); // safe: no filter = no data
        }

        const sql = `
            SELECT *
            FROM notings_records
            WHERE month = ? AND year = ? AND group_name = ?
            ORDER BY id DESC
        `;

        db.query(sql, [month, year, group], (err, rows) => {
            if (err) {
                console.error("Fetch notings error:", err);
                return res.status(500).json({ message: "DB error" });
            }

            res.json(rows);
        });
    });

    // =========================
    // ADMIN: CONFIRM NOTINGS
    // =========================
    router.post("/admin/notings/confirm", requireLogin, (req, res) => {
        if (req.session.user.role !== "admin") {
            return res.status(403).json({ success: false });
        }

        const { id } = req.body;

        const sql = `
            UPDATE notings_records
            SET status = 'confirmed'
            WHERE id = ?
        `;

        db.query(sql, [id], (err) => {
            if (err) {
                console.error("Confirm error:", err);
                return res.status(500).json({ success: false });
            }

            res.json({ success: true });
        });
    });
    // =========================
    // GET SINGLE NOTING (ADMIN EDIT)
    // =========================
    router.get("/notings/:id", requireLogin, (req, res) => {
        const { id } = req.params;

        const sql = `SELECT * FROM notings_records WHERE id = ?`;

        db.query(sql, [id], (err, rows) => {
            if (err || !rows.length) {
                return res.status(404).json({ message: "Not found" });
            }

            res.json(rows[0]);
        });
    });


module.exports = router;
