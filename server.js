const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const db = require("./db");
require("dotenv").config();

const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();

  //  CORE MIDDLEWARE

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

  //  SESSION CONFIG 
app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret-session-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  })
);

  //  AUTH MIDDLEWARES
function requireLogin(req, res, next) {
  if (!req.session.user) {
    // if JSON request
    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    return res.redirect("/");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admins only" });
  }
  next();
}

  //  PROTECT DASHBOARD.HTML 
app.get("/dashboard.html", requireLogin, (req, res, next) => next());
app.use(express.static("frontend"));

  //  EMAIL TRANSPORTER
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((err) => {
  console.log(err ? "Email config error" : "Email transporter ready");
});

  //  OTP SYSTEM
  app.post("/send-otp", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send({ success: false, message: "Email required" });

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  req.session.otp = otp;
  req.session.otpEmail = email;
  req.session.otpExpires = expiresAt;

  transporter.sendMail(
    {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP",
      text: `Your OTP is ${otp}. Valid for 5 minutes.`
    },
    (err) => {
      if (err) return res.status(500).send({ success: false, message: "Mail error" });
      console.log("OTP sent");
      res.send({ success: true });
    }
  );
});

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!req.session.otp || req.session.otpEmail !== email)
    return res.status(400).send({ verified: false, message: "OTP not requested" });

  if (Date.now() > req.session.otpExpires)
    return res.status(400).send({ verified: false, message: "OTP expired" });

  if (req.session.otp !== otp)
    return res.status(400).send({ verified: false, message: "Invalid OTP" });

  req.session.otpVerified = true;
  req.session.verifiedEmail = email;

  delete req.session.otp;
  delete req.session.otpExpires;

  res.send({ verified: true });
});

  //  USER REGISTRATION

app.post("/register", (req, res) => {
  const { name, email, mobile, password, confirmPassword, group_name } = req.body;

  if (!req.session.otpVerified || req.session.verifiedEmail !== email) {
    return res.send('Verify OTP first <a href="register.html">Try again</a>');
  }

  if (password !== confirmPassword) {
    return res.send('Passwords do not match <a href="register.html">Try again</a>');
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;

    db.query(
      "INSERT INTO users (name, email, mobile, password, role, group_name) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, mobile, hash, "user", group_name],
      (err) => {
        if (err) return res.send("Error: " + err.message);

        req.session.otpVerified = false;
        delete req.session.verifiedEmail;

        res.send('Registration complete <a href="/">Login</a>');
      }
    );
  });
});

  //  LOGIN

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) throw err;
    if (rows.length === 0) return res.send("User not found");

    const user = rows[0];

    bcrypt.compare(password, user.password, (err, match) => {
      if (!match) return res.send("Invalid password");

      // save session
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        group: user.group_name
      };

      res.redirect("/dashboard.html");
    });
  });
});

  //  SESSION INFO

app.get("/session-info", requireLogin, (req, res) => {
  res.json({ loggedIn: true, user: req.session.user });
});

  //  LOGOUT

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

  //  RANDOM NUMBER GENERATORS

function generateInwardNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
  return `INW/${year}/${rand}`;
}

function generateOutwardNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
  return `OUTW/${year}/${rand}`;
}




// =============================================
// REPORT CALCULATION  FUNCTIONS  — NEW VERSION
// =============================================

function getMonthDateRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

async function calculateReportData(month, year, office = "") {
  const { start, end } = getMonthDateRange(year, month);

  const inOfficeCond = office ? "AND received_in = ?" : "";
  const outOfficeCond = office ? "AND reply_from = ?" : "";

  const paramsIn = office ? [start, end, office] : [start, end];
  const paramsOut = office ? [start, end, office] : [start, end];

  // -----------------------------
  // SQL BLOCKS
  // -----------------------------
  const sqlHindi = `
    SELECT COUNT(*) AS cnt
    FROM inward_records
    WHERE date_of_receipt >= ? AND date_of_receipt < ?
    ${inOfficeCond}
    AND language_of_document IN ('Hindi','Bilingual')
  `;

  const sqlReplyHindi = `
    SELECT COUNT(*) AS cnt
    FROM inward_records
    WHERE date_of_receipt >= ? AND date_of_receipt < ?
    ${inOfficeCond}
    AND reply_sent_in = 'Hindi'
  `;

  const sqlReplyEnglish = `
    SELECT COUNT(*) AS cnt
    FROM inward_records
    WHERE date_of_receipt >= ? AND date_of_receipt < ?
    ${inOfficeCond}
    AND reply_required = 'Yes'
    AND reply_sent_date IS NOT NULL
    AND reply_sent_in = 'English'
  `;

  const sqlNotExpected = `
    SELECT COUNT(*) AS cnt
    FROM inward_records
    WHERE date_of_receipt >= ? AND date_of_receipt < ?
    ${inOfficeCond}
    AND reply_required = 'No'
  `;

  const sqlInwardRegion = `
    SELECT COALESCE(sender_region, 'Unknown') AS region,
           SUM(language_of_document = 'English') AS receivedEnglish,
           SUM(reply_sent_in = 'Hindi') AS repliedHindi,
           SUM(reply_sent_in = 'English') AS repliedEnglish,
           SUM(reply_required = 'No') AS notExpected
    FROM inward_records
    WHERE date_of_receipt >= ? AND date_of_receipt < ?
    ${inOfficeCond}
    GROUP BY region
  `;

  const sqlOutwardRegion = `
    SELECT COALESCE(receiver_region, 'Unknown') AS region,
           SUM(language_of_document IN ('Hindi','Bilingual')) AS hindi,
           SUM(language_of_document = 'English') AS english,
           COUNT(*) AS total
    FROM outward_records
    WHERE date_of_despatch >= ? AND date_of_despatch < ?
    ${outOfficeCond}
    GROUP BY region
  `;

  const sqlTotalInward = `
    SELECT COUNT(*) AS cnt
    FROM inward_records
    WHERE date_of_receipt >= ? AND date_of_receipt < ?
    ${inOfficeCond}
  `;

  const sqlTotalOutward = `
    SELECT COUNT(*) AS cnt
    FROM outward_records
    WHERE date_of_despatch >= ? AND date_of_despatch < ?
    ${outOfficeCond}
  `;

  // -----------------------------
  // RUN ALL QUERIES IN PARALLEL
  // -----------------------------
  const [
    rowsHindi,
    rowsReplyHindi,
    rowsReplyEnglish,
    rowsNotExpected,
    rowsInwardRegion,
    rowsOutwardRegion,
    totalInward,
    totalOutward
  ] = await Promise.all([
    dbQuery(sqlHindi, paramsIn),
    dbQuery(sqlReplyHindi, paramsIn),
    dbQuery(sqlReplyEnglish, paramsIn),
    dbQuery(sqlNotExpected, paramsIn),
    dbQuery(sqlInwardRegion, paramsIn),
    dbQuery(sqlOutwardRegion, paramsOut),
    dbQuery(sqlTotalInward, paramsIn),
    dbQuery(sqlTotalOutward, paramsOut)
  ]);

  // -----------------------------
  // BUILD REGION MAPS
  // -----------------------------
  const inwardByRegion = { A: {}, B: {}, C: {}, Unknown: {} };
  const outwardByRegion = { A: {}, B: {}, C: {}, Unknown: {} };

  rowsInwardRegion.forEach((r) => {
    inwardByRegion[r.region] = {
      receivedEnglish: r.receivedEnglish || 0,
      repliedHindi: r.repliedHindi || 0,
      repliedEnglish: r.repliedEnglish || 0,
      notExpected: r.notExpected || 0
    };
  });

  rowsOutwardRegion.forEach((r) => {
    outwardByRegion[r.region] = {
      hindi: r.hindi || 0,
      english: r.english || 0,
      total: r.total || 0
    };
  });

  // Ensure all regions exist
  ["A", "B", "C", "Unknown"].forEach((r) => {
    inwardByRegion[r] ||= { receivedEnglish: 0, repliedHindi: 0, repliedEnglish: 0, notExpected: 0 };
    outwardByRegion[r] ||= { hindi: 0, english: 0, total: 0 };
  });

  // -----------------------------
  // EMAIL/NOTINGS DEFAULTS
  // -----------------------------
  const emailReceived = { A: { eng: 0, hin: 0 }, B: { eng: 0, hin: 0 }, C: { eng: 0, hin: 0 } };
  const emailReplied = { A: 0, B: 0, C: 0 };

  // NOTINGS defaults
  const notingsHindi = 0;
  const notingsEnglish = 0;
  const notingsEoffice = 0;

  // -----------------------------
  // GROUP NAME DATA (from admin)
  // -----------------------------
  const adminRow = await dbQuery(
    "SELECT name, group_name FROM users WHERE role='admin' LIMIT 1"
  );

  const groupName = adminRow[0]?.group_name || "";
  const groupHeadName = adminRow[0]?.name || "";

  // -----------------------------
  // FINAL RETURN OBJECT
  // -----------------------------
  return {
    lettersReceivedHindi: rowsHindi[0].cnt,
    repliesSentHindi: rowsReplyHindi[0].cnt,
    repliesSentEnglish: rowsReplyEnglish[0].cnt,
    notExpectedTotal: rowsNotExpected[0].cnt,

    inwardByRegion,
    outwardByRegion,

    totalInwards: totalInward[0].cnt,
    totalOutwards: totalOutward[0].cnt,

    emailReceived,
    emailReplied,

    notingsHindi,
    notingsEnglish,
    notingsEoffice,

    groupName,
    groupHeadName
  };
}


  //  INWARD ENTRY

app.post("/inward/add", requireLogin, async (req, res) => {
  try {
    const data = req.body;

        // REQUIRED FIELD VALIDATION (BEFORE ANY DB LOGIC)
    const requiredFields = [
      { key: "date_of_receipt", label: "Inward Date" },
      { key: "received_in", label: "Office" },
      { key: "name_of_sender", label: "Sender Name" },
      { key: "type_of_document", label: "Document Type" },
      { key: "reply_required", label: "Reply Required" }
    ];

    for (const field of requiredFields) {
      if (!data[field.key] || String(data[field.key]).trim() === "") {
        return res.status(400).send(`${field.label} is required`);
      }
    }


    if (!/^\d{6}$/.test(data.sender_pin))
      return res.status(400).send("Invalid PIN");

    if (!/^[A-Za-z0-9 .,'&()-]+$/.test(data.name_of_sender))
      return res.status(400).send("Invalid sender name");

   
// Normalize reply fields if reply not required
if (data.reply_required === "No") {
  data.reply_sent_date = null;
  data.reply_ref_no = null;
  data.reply_sent_by = null;
  data.reply_sent_in = null;
  data.reply_count = 0;
}


    const safeCount = Math.max(0, Number(data.count) || 0);
    const safeReplyCount = Math.max(0, Number(data.reply_count) || 0);

    let inward_no;
    let success = false;

    for (let i = 0; i < 5; i++) {
      inward_no = generateInwardNumber();

      try {
        await new Promise((resolve, reject) =>
          db.query(
            `INSERT INTO inward_records (
              date_of_receipt, month, year, received_in,
              name_of_sender, address_of_sender, sender_city,
              sender_state, sender_pin, sender_region, sender_org_type,
              inward_no, type_of_document, language_of_document, count,
              remarks, issued_to, reply_required, reply_sent_date,
              reply_ref_no, reply_sent_by, reply_sent_in, reply_count
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              data.date_of_receipt, data.month, data.year, data.received_in,
              data.name_of_sender, data.address_of_sender, data.sender_city,
              data.sender_state, data.sender_pin, data.sender_region, data.sender_org_type,
              inward_no, data.type_of_document, data.language_of_document, safeCount,
              data.remarks, data.issued_to, data.reply_required, data.reply_sent_date || null,
              data.reply_ref_no, data.reply_sent_by, data.reply_sent_in, safeReplyCount
            ],
            (err) => (err ? reject(err) : resolve())
          )
        );
        success = true;
        break;
      } catch (err) {
        if (err.code !== "ER_DUP_ENTRY") throw err;
      }
    }

    if (!success) return res.status(500).send("Failed to generate inward number");

    res.send(`
      <h3 style="text-align:center;">Inward Entry Saved</h3>
      <p style="text-align:center;">Inward No: <strong>${inward_no}</strong></p>
      <p style="text-align:center;"><a href="/inward.html">Add another</a></p>
    `);
  } catch (err) {
    console.error("DB ERROR:", err.sqlMessage || err);
    res.status(500).send(err.sqlMessage || "Server error");
  }
});

  //  INWARD LIST

app.get("/inward/all", requireLogin, (req, res) => {
  db.query("SELECT * FROM inward_records ORDER BY s_no DESC", (err, rows) => {
    if (err) return res.status(500).send("Error");
    res.json(rows);
  });
});
// OUTWARD: LIVE SEARCH BY inward_no + AUTO-FILL
app.get("/api/inward/search", requireLogin, (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);

  const sql = `
    SELECT 
      s_no, inward_no,
      name_of_sender, address_of_sender, sender_city,
      sender_state, sender_pin, sender_region, sender_org_type,
      date_of_receipt, received_in
    FROM inward_records
    WHERE inward_no LIKE ?
    ORDER BY s_no DESC
    LIMIT 10
  `;

  db.query(sql, [`%${q}%`], (err, results) => {
    if (err) {
      console.error("Search error:", err);
      return res.status(500).json([]);
    }
    res.json(results);
  });
});
  //  OUTWARD ENTRY

app.post("/outward/add", requireLogin, async (req, res) => {
  try {
    const data = req.body;

// Normalize reply fields safely
if (data.reply_required === "No") {
  data.reply_sent_date = null;
  data.reply_ref_no = null;
  data.reply_sent_by = null;
  data.reply_sent_in = null;
  data.reply_count = 0;
} else {
  data.reply_sent_date = data.reply_sent_date || null;
  data.reply_ref_no = data.reply_ref_no || null;
  data.reply_sent_by = data.reply_sent_by || null;
  data.reply_sent_in = data.reply_sent_in || null;
}



    if (!/^\d{6}$/.test(data.receiver_pin))
      return res.status(400).send("Invalid PIN");

    if (!/^[A-Za-z0-9 .,'&()-]+$/.test(data.name_of_receiver))
      return res.status(400).send("Invalid receiver name");


    const safeCount = Math.max(0, Number(data.count) || 0);
    const safeReplyCount = Math.max(0, Number(data.reply_count) || 0);

    let inward_s_no = null;

    if (data.inward_no) {
      const result = await new Promise((resolve) =>
        db.query(
          "SELECT s_no FROM inward_records WHERE inward_no = ? LIMIT 1",
          [data.inward_no],
          (err, rows) => resolve(rows)
        )
      );
      if (result.length > 0) inward_s_no = result[0].s_no;
    }

    let outward_no;
    let success = false;

    for (let i = 0; i < 5; i++) {
      outward_no = generateOutwardNumber();

      try {
        await new Promise((resolve, reject) =>
          db.query(
            `INSERT INTO outward_records (
              date_of_despatch, month, year, reply_from,
              name_of_receiver, address_of_receiver, receiver_city,
              receiver_state, receiver_pin, receiver_region, receiver_org_type,
              outward_no, type_of_document, language_of_document, count,
              inward_no, inward_s_no, reply_issued_by, reply_sent_date,
              reply_ref_no, reply_sent_by, reply_sent_in, reply_count
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              data.date_of_despatch, data.month, data.year, data.reply_from,
              data.name_of_receiver, data.address_of_receiver, data.receiver_city,
              data.receiver_state, data.receiver_pin, data.receiver_region, data.receiver_org_type,
              outward_no, data.type_of_document, data.language_of_document, safeCount,
              data.inward_no || null, inward_s_no, data.reply_issued_by,
              data.reply_sent_date || null, data.reply_ref_no, data.reply_sent_by,
              data.reply_sent_in, safeReplyCount
            ],
            (err) => (err ? reject(err) : resolve())
          )
        );
        success = true;
        break;
      } catch (err) {
        if (err.code !== "ER_DUP_ENTRY") throw err;
      }
    }

    if (!success) return res.status(500).send("Failed to generate outward number");

    res.send(`
      <h3 style="text-align:center;">Outward Entry Saved</h3>
      <p style="text-align:center;">Outward No: <strong>${outward_no}</strong></p>
      <p style="text-align:center;"><a href="/outward.html">Add another</a></p>
    `);
  } catch (err) {
      console.error("DB ERROR:", err.sqlMessage || err);
      res.status(500).send(err.sqlMessage || "Server error");
    }
});

  //  OUTWARD LIST

app.get("/outward/all", requireLogin, (req, res) => {
  db.query("SELECT * FROM outward_records ORDER BY s_no DESC", (err, rows) => {
    if (err) return res.status(500).send("Error");
    res.json(rows);
  });
});


// =========================
// ADMIN: GET ALL USERS
// =========================
app.get("/admin/users", requireAdmin, (req, res) => {
  const sql = "SELECT id, name, email, mobile, role, group_name FROM users ORDER BY id DESC";

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: "DB Error" });
    res.json(rows);
  });
});

// =========================
// ADMIN: ADD USER
// =========================
app.post("/admin/users/add", requireAdmin, (req, res) => {
  const { name, email, mobile, password, group_name } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ success: false, message: "Hash error" });

    const sql = `
      INSERT INTO users (name, email, mobile, password, role, group_name)
      VALUES (?, ?, ?, ?, "user", ?)
    `;

    db.query(sql, [name, email, mobile, hash, group_name], (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ success: false, message: "Email already exists" });
        }
        return res.status(500).json({ success: false, message: "DB Error" });
      }

      res.json({ success: true });
    });
  });
});

// =========================
// ADMIN: UPDATE USER
// =========================
app.patch("/admin/users/update/:id", requireAdmin, (req, res) => {
  const { name, email, mobile, group_name } = req.body;

  const sql = `
    UPDATE users 
    SET name=?, email=?, mobile=?, group_name=? 
    WHERE id=?
  `;

  db.query(sql, [name, email, mobile, group_name, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "DB Error" });
    res.json({ success: true });
  });
});

// =========================
// ADMIN: DELETE USER
// =========================
app.delete("/admin/users/delete/:id", requireAdmin, (req, res) => {

  // Prevent admin from deleting themselves
  if (req.session.user.id === Number(req.params.id)) {
    return res.status(400).json({ success: false, message: "You cannot delete your own account" });
  }

  const sql = "DELETE FROM users WHERE id=?";

  db.query(sql, [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "DB Error" });
    res.json({ success: true });
  });
});



// =============================================
// ADMIN — REPORT DATA API 
// =============================================
app.post("/admin/report/data", requireAdmin, async (req, res) => {
  try {
    const { month, year, office } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year required" });
    }

    const data = await calculateReportData(month, year, office || "");

    res.json(data);

  } catch (err) {
    console.error("Report Data Error:", err);
    res.status(500).json({ message: "Failed to calculate report" });
  }
});



app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);
