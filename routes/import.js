const XLSX = require("xlsx");
const fs = require("fs");
const express = require("express");
const router = express.Router();
const path = require("path");
const { dbQuery, pool } = require("../db");
const multer = require("multer");
const { requireAdmin } = require("../middlewares/authMiddleware");

// ================================
// MULTER STORAGE CONFIG
// ================================

const inwardStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../uploads/excel/inward"));
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/\s+/g, "_");
        cb(null, `${timestamp}_${safeName}`);
    }
});

const outwardStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../uploads/excel/outward"));
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/\s+/g, "_");
        cb(null, `${timestamp}_${safeName}`);
    }
});

const uploadInward = multer({ storage: inwardStorage });
const uploadOutward = multer({ storage: outwardStorage });

function cleanExcelRows(rawRows) {
  return rawRows.map(row => {
    const cleaned = {};

    Object.keys(row).forEach(key => {
      const cleanKey = key
        .replace(/\n/g, "")
        .replace(/\r/g, "")
        .trim();

      cleaned[cleanKey] = row[key];
    });

    return cleaned;
  });
}

function readExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    defval: ""   
  });
  return cleanExcelRows(rawRows);
}

// ================================
// ROUTE: UPLOAD INWARD EXCEL
// ================================

router.post(
    "/admin/import-inward-upload",
    requireAdmin,
    uploadInward.single("file"),
    async (req, res) => {
        try {

            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }

            const filePath = req.file.path;

            const rows = readExcel(filePath);

            // PREVIEW ALL ROWS (files usually <200 rows)
            const preview = rows;

            res.json({
                success: true,
                message: "File uploaded and parsed",
                file: req.file.filename,
                totalRows: rows.length,
                preview: preview
            });

        } catch (err) {
            console.error("Excel parse error:", err);
            res.status(500).json({ message: "Failed to parse Excel file" });
        }
    }
);

// ================================
// ROUTE: UPLOAD OUTWARD EXCEL
// ================================

router.post(
    "/admin/import-outward-upload",
    requireAdmin,
    uploadOutward.single("file"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }

            res.json({
                success: true,
                message: "File uploaded successfully",
                file: req.file.filename,
                path: req.file.path
            });

        } catch (err) {
            console.error("Upload error:", err);
            res.status(500).json({ message: "Upload failed" });
        }
    }
);

function normalizeLanguage(value) {

    const v = String(value)
        .toUpperCase()
        .replace(/\s/g, "");

    if (v === "E" || v === "ENGLISH") return "English";

    if (v === "H" || v === "HINDI" || v === "HI") return "Hindi";

    if (
        v === "BI" ||
        v === "BI,H" ||
        v === "H,BI" ||
        v === "BI,E" ||
        v === "E,BI" ||
        v === "E,H"  ||
        v === "H,E"
    ) {
        return "Bilingual";
    }

    return null; // invalid value
}


function normalizeReplyRequired(value) {

    const v = String(value)
        .toUpperCase()
        .trim();

    if (v === "Y") return "Yes";

    if (v === "N") return "No";

    return null; // invalid
}


function parseExcelDate(value) {

    if (!value) return null;

    // Excel numeric date
    if (typeof value === "number") {

        const date = new Date(
            Math.round((value - 25569) * 86400 * 1000)
        );

        return date.toISOString().split("T")[0];
    }

    // String format: DD.MM.YY
    if (typeof value === "string") {

        const parts = value.split(".");

        if (parts.length === 3) {

            let [d, m, y] = parts;

            if (y.length === 2) {
                y = "20" + y;
            }

            return `${y}-${m}-${d}`;
        }
    }

    return null;
}

router.post("/admin/import-inward-validate", requireAdmin, async (req, res) => {

    try {

        const { file } = req.body;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Missing file name"
            });
        }

        const filePath = path.join(
            __dirname,
            "../uploads/excel/inward",
            file
        );

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        const rows = readExcel(filePath);

        
        const inwardNos = rows
        .map(r => r.inward_no)
        .filter(Boolean)
        .map(n => String(n).trim());

        const existing = await dbQuery(
            "SELECT inward_no FROM inward_records WHERE inward_no IN (?)",
            [inwardNos]
        );

        const existingSet = new Set(
            existing.map(r => String(r.inward_no).trim())
        );

        const skippedRows = [];
        const dbDuplicates = [];
        const excelDuplicates = [];
        const seen = new Set();

        rows.forEach((r, index) => {

            if (!r.inward_no) {

                skippedRows.push({
                    row: index + 2,
                    inward_no: "",
                    reason: "Missing inward number"
                });

                return;
            }

            // Validate language_of_document
            const language = normalizeLanguage(r.language_of_document);

            if (!language) {

                skippedRows.push({
                    row: index + 2,
                    inward_no: r.inward_no || "",
                    reason: "Invalid Language of Document"
                });

                return;
            }

            // Validate reply_required
            const replyRequired = normalizeReplyRequired(r.reply_required);

                if (!replyRequired) {

                    skippedRows.push({
                        row: index + 2,
                        inward_no: r.inward_no || "",
                        reason: "Invalid Reply Required value"
                    });

                    return;
                }


            const inwardNo = String(r.inward_no).trim();

            if (seen.has(inwardNo)) {

                excelDuplicates.push(inwardNo);

                skippedRows.push({
                    row: index + 2,
                    inward_no: inwardNo,
                    reason: "Duplicate inside Excel"
                });

                return;
            }

            seen.add(inwardNo);

            if (existingSet.has(inwardNo)) {

                dbDuplicates.push(inwardNo);

                skippedRows.push({
                    row: index + 2,
                    inward_no: inwardNo,
                    reason: "Duplicate in database"
                });

            }

        });

        res.json({
            success: true,
            inserted: rows.length - skippedRows.length,
            skipped: skippedRows.length,
            dbDuplicates: dbDuplicates || [],
            excelDuplicates: excelDuplicates || [],
            skippedRows: skippedRows || []
        });

    } catch (err) {

        console.error("VALIDATION ERROR >>>", err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


router.post("/admin/import-inward-confirm", requireAdmin, async (req, res) => {

    try {

        const { file } = req.body;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Missing file name"
            });
        }

        const filePath = path.join(
            __dirname,
            "../uploads/excel/inward",
            file
        );

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        const rows = readExcel(filePath);

        // COLLECT inward numbers
        
        
        const inwardNos = rows
        .map(r => r.inward_no)
        .filter(Boolean)
        .map(n => String(n).trim());

        const existing = await dbQuery(
            "SELECT inward_no FROM inward_records WHERE inward_no IN (?)",
            [inwardNos]
        );

        const existingSet = new Set(
            existing.map(r => String(r.inward_no).trim())
        );

        const dbDuplicates = [];
        const excelDuplicates = [];
        const skippedRows = [];
        const seen = new Set();
        const rowsToInsert = [];

        rows.forEach((r, index) => {
            if (!r.inward_no) return; // skip empty rows

            const inwardNo = String(r.inward_no).trim();

            if (seen.has(inwardNo)) {
                excelDuplicates.push(inwardNo);

                skippedRows.push({
                    row: index + 2, // +2 because Excel header + 0 index
                    inward_no: inwardNo,
                    reason: "Duplicate inside Excel"
                });

                return;
            }

                seen.add(inwardNo);

                if (existingSet.has(inwardNo)) {

                    dbDuplicates.push(inwardNo);

                    skippedRows.push({
                        row: index + 2,
                        inward_no: inwardNo,
                        reason: "Duplicate in database"
                    });

                    return;
                }
            r.inward_no = inwardNo;
            rowsToInsert.push(r);

        });

        // PREPARE BULK INSERT
        const values = rowsToInsert.map(r => [

            parseExcelDate(r.date_of_receipt),
            r.inward_no,
            r.month,
            r.year,
            r.received_in,
            r.name_of_sender,
            r.address_of_sender,
            r.sender_city,
            r.sender_state,
            r.sender_pin,
            r.sender_region,
            r.sender_org_type,
            r.type_of_document,
            normalizeLanguage(r.language_of_document),
            r.count,
            r.remarks,
            r.issued_to,
            normalizeReplyRequired(r.reply_required),
            req.session?.user?.group_name || null
        ]);

        if (values.length) {

            const connection = await pool.promise().getConnection();

            try {

                await connection.beginTransaction();

                await connection.query(
                    `INSERT INTO inward_records (
                        date_of_receipt,
                        inward_no,
                        month,
                        year,
                        received_in,
                        name_of_sender,
                        address_of_sender,
                        sender_city,
                        sender_state,
                        sender_pin,
                        sender_region,
                        sender_org_type,
                        type_of_document,
                        language_of_document,
                        count,
                        remarks,
                        issued_to,
                        reply_required,
                        group_name
                    ) VALUES ?`,
                    [values]
                );

                await connection.commit();

            } catch (err) {

                await connection.rollback();
                throw err;

            } finally {

                connection.release();

            }

        }

        res.json({
            success: true,
            inserted: values.length,
            skipped: skippedRows.length,
            dbDuplicates,
            excelDuplicates,
            skippedRows
        });

    } catch (err) {

        console.error("IMPORT ERROR >>>", err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});



module.exports = router;