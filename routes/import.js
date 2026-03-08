const XLSX = require("xlsx");
const fs = require("fs");
const express = require("express");
const router = express.Router();
const path = require("path");
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

            // READ EXCEL FILE
            const workbook = XLSX.readFile(filePath);

            const sheetName = workbook.SheetNames[0];

            const sheet = workbook.Sheets[sheetName];

            // CONVERT TO JSON
            let rawRows = XLSX.utils.sheet_to_json(sheet);

            let rows = rawRows.map(row => {
                const cleaned = {};

                Object.keys(row).forEach(key => {

                    const cleanKey = key
                        .replace(/\n/g, "")   // remove newline
                        .replace(/\r/g, "")
                        .trim();              // remove spaces

                    cleaned[cleanKey] = row[key];

                });

                return cleaned;
            });
            // LIMIT PREVIEW (only first 20 rows)
            const preview = rows.slice(0, 20);

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

module.exports = router;