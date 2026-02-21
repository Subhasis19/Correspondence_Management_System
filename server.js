const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const db = require("./db");
require("dotenv").config();

const nodemailer = require("nodemailer");
const crypto = require("crypto");

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");



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
// app.use(express.static("frontend"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.use(express.static("frontend", {
  index: false
}));



// =========================
// PROTECTED FORM ROUTES
// =========================
app.get("/inward", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "views/forms/inward.html"));
});

app.get("/outward", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "views/forms/outward.html"));
});


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
// REPORT CALCULATION  FUNCTIONS  
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

    async function calculateReportData(
      month,
      year,
      office = "",
      group = ""
    ) {

  const { start, end } = getMonthDateRange(year, month);

  const inOfficeCond = office ? "AND received_in = ?" : "";
  const outOfficeCond = office ? "AND reply_from = ?" : "";
  const groupCond = group ? "AND group_name = ?" : "";


  const paramsIn = [start, end];
  if (office) paramsIn.push(office);
  if (group) paramsIn.push(group);

  const paramsOut = [start, end];
  if (office) paramsOut.push(office);
  if (group) paramsOut.push(group);

  // -----------------------------
  // SQL BLOCKS
  // -----------------------------
  const sqlHindi = `
    SELECT COUNT(*) AS cnt
    FROM inward_records
    WHERE date_of_receipt >= ? AND date_of_receipt < ?
    ${inOfficeCond}
    ${groupCond}
    AND language_of_document IN ('Hindi')
  `;

const sqlReplyHindi = `
  SELECT COUNT(*) AS cnt
  FROM outward_records
  WHERE date_of_despatch >= ? AND date_of_despatch < ?
  ${outOfficeCond}
  ${groupCond}
  AND reply_sent_in = 'Hindi'
`;

const sqlReplyEnglish = `
  SELECT COUNT(*) AS cnt
  FROM outward_records
  WHERE date_of_despatch >= ? AND date_of_despatch < ?
  ${outOfficeCond}
  ${groupCond}
  AND reply_sent_in = 'English'
`;


  const sqlNotExpected = `
    SELECT COUNT(*) AS cnt
    FROM inward_records
    WHERE date_of_receipt >= ? AND date_of_receipt < ?
    ${inOfficeCond}
    ${groupCond}
    AND reply_required = 'No'
  `;

  const sqlInwardRegion = `
    SELECT COALESCE(sender_region, 'Unknown') AS region,
            SUM(language_of_document = 'English') AS receivedEnglish,
            SUM(language_of_document='English' AND reply_required = 'No') AS notExpected
    FROM inward_records
    WHERE date_of_receipt >= ? AND date_of_receipt < ?
    ${inOfficeCond}
    ${groupCond}
    GROUP BY region
  `;

  const sqlOutwardReplyRegion = `
    SELECT
      COALESCE(receiver_region, 'Unknown') AS region,
      SUM(language_of_document = 'English' AND reply_sent_in = 'Hindi') AS repliedHindi,
      SUM(language_of_document = 'English' AND reply_sent_in = 'English') AS repliedEnglish
    FROM outward_records
    WHERE date_of_despatch >= ? AND date_of_despatch < ?
    ${outOfficeCond}
    ${groupCond}
    GROUP BY region
  `;

// SECTION 3: Original letters issued (FROM INWARD)
const sqlSection3 = `
  SELECT
    COALESCE(sender_region, 'Unknown') AS region,
    SUM(language_of_document IN ('Hindi','Bilingual')) AS hindiPlusBilingual,
    SUM(language_of_document = 'English') AS english
  FROM inward_records
  WHERE date_of_receipt >= ? AND date_of_receipt < ?
  ${inOfficeCond}
  ${groupCond}
  GROUP BY region
`;


  const sqlTotalInward = `
    SELECT COUNT(*) AS cnt
    FROM inward_records
    WHERE date_of_receipt >= ? AND date_of_receipt < ?
    ${inOfficeCond}
    ${groupCond}
  `;

  const sqlTotalOutward = `
    SELECT COUNT(*) AS cnt
    FROM outward_records
    WHERE date_of_despatch >= ? AND date_of_despatch < ?
    ${outOfficeCond}
    ${groupCond}
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
  rowsOutwardReplyRegion, 
  rowsSection3,
  totalInward,
  totalOutward
] = await Promise.all([
  dbQuery(sqlHindi, paramsIn),            
  dbQuery(sqlReplyHindi, paramsOut),      
  dbQuery(sqlReplyEnglish, paramsOut),    
  dbQuery(sqlNotExpected, paramsIn),      
  dbQuery(sqlInwardRegion, paramsIn),   
  dbQuery(sqlOutwardReplyRegion, paramsOut),   
  dbQuery(sqlSection3, paramsIn),  
  dbQuery(sqlTotalInward, paramsIn),      
  dbQuery(sqlTotalOutward, paramsOut)    
]);

  // -----------------------------
  // BUILD REGION MAPS
  // -----------------------------
  const inwardByRegion = { A: {}, B: {}, C: {}, Unknown: {} };


  rowsInwardRegion.forEach((r) => {
    inwardByRegion[r.region] = {
      receivedEnglish: r.receivedEnglish || 0,
      notExpected: r.notExpected || 0,
      repliedHindi: 0,
      repliedEnglish: 0
    };
  });

  rowsOutwardReplyRegion.forEach((r) => {
  inwardByRegion[r.region] ||= {
    receivedEnglish: 0,
    notExpected: 0,
    repliedHindi: 0,
    repliedEnglish: 0
  };

  inwardByRegion[r.region].repliedHindi   = r.repliedHindi || 0;
  inwardByRegion[r.region].repliedEnglish = r.repliedEnglish || 0;
});

 
  ["A", "B", "C", "Unknown"].forEach((r) => {
    inwardByRegion[r] ||= { receivedEnglish: 0, repliedHindi: 0, repliedEnglish: 0, notExpected: 0 };
  });

  // -----------------------------
  // SECTION 3: ORIGINAL LETTERS ISSUED (FROM INWARD)
  // -----------------------------
  const section3ByRegion = {
    A: { hindi: 0, english: 0, total: 0, percent: 0 },
    B: { hindi: 0, english: 0, total: 0, percent: 0 },
    C: { hindi: 0, english: 0, total: 0, percent: 0 },
    Unknown: { hindi: 0, english: 0, total: 0, percent: 0 }
  };

  rowsSection3.forEach(r => {
    const hb = Number(r.hindiPlusBilingual) || 0;
    const e = Number(r.english) || 0;
    const total = hb + e;

    section3ByRegion[r.region] = {
      hindi: hb,
      english: e,
      total,
      percent: total ? Math.round((hb / total) * 100) : 0
    };
  });


  // -----------------------------
  // EMAIL/NOTINGS DEFAULTS
  // -----------------------------
  


// 5. Emails Received
const emailReceivedRows = await dbQuery(
  `
  SELECT region,
          SUM(total_english) AS eng,
          SUM(total_hindi)   AS hin
  FROM email_records
  WHERE month = ?
    AND year = ?
    ${group ? "AND group_name = ?" : ""}
    AND entry_type = 'Received'
  GROUP BY region
  `,
  group ? [month, year, group] : [month, year]
);

const emailReceived = {
  A: { eng: 0, hin: 0 },
  B: { eng: 0, hin: 0 },
  C: { eng: 0, hin: 0 }
};

emailReceivedRows.forEach(r => {
  emailReceived[r.region] = {
    eng: r.eng || 0,
    hin: r.hin || 0
  };
});


// 6. Emails Replied in Hindi
const emailRepliedRows = await dbQuery(
  `
  SELECT region,
         SUM(total_hindi) AS total
  FROM email_records
  WHERE month = ?
    AND year = ?
    ${group ? "AND group_name = ?" : ""}
    AND entry_type = 'Replied'
  GROUP BY region
  `,
  group ? [month, year, group] : [month, year]
);

const emailReplied = { A: 0, B: 0, C: 0 };

emailRepliedRows.forEach(r => {
  emailReplied[r.region] = r.total || 0;
});

  
// NOTINGS DATA (FROM DB)

const notingsRows = await dbQuery(
  `
  SELECT entry_type,
         notings_hindi_pages,
         notings_english_pages,
         eoffice_comments
  FROM notings_records
  WHERE month = ? AND year = ?
  ${group ? "AND group_name = ?" : ""}

  `,
  group ? [month, year, group] : [month, year]
);

let notingsHindi = 0;
let notingsEnglish = 0;
let notingsEoffice = 0;

notingsRows.forEach(row => {
  if (row.entry_type === "Noting") {
    notingsHindi += row.notings_hindi_pages || 0;
    notingsEnglish += row.notings_english_pages || 0;
  }

  if (row.entry_type === "Comment") {
    notingsEoffice += row.eoffice_comments || 0;
  }
});


  // -----------------------------
  // GROUP NAME DATA 
  // -----------------------------
  let groupName = "";
  let groupHeadName = "";

  if (group) {
    const row = await dbQuery(
      "SELECT name, group_name FROM users WHERE group_name = ? LIMIT 1",
      [group]
    );

    groupName = row[0]?.group_name || "";
    groupHeadName = row[0]?.name || "";
  }
if (!group) {
  const adminRow = await dbQuery(
    "SELECT name, group_name FROM users WHERE role='admin' LIMIT 1"
  );

  groupName = adminRow[0]?.group_name || "";
  groupHeadName = adminRow[0]?.name || "";
}
  // -----------------------------
  // FINAL RETURN OBJECT
  // -----------------------------
  return {
    lettersReceivedHindi: rowsHindi[0].cnt,
    repliesSentHindi: rowsReplyHindi[0].cnt,
    repliesSentEnglish: rowsReplyEnglish[0].cnt,
    notExpectedTotal: rowsNotExpected[0].cnt,

    inwardByRegion,
    section3ByRegion, 
    // outwardByRegion,

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
    const groupName = req.session.user.group;

        // REQUIRED FIELD VALIDATION 
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

    // NORMALIZE TYPE OF DOCUMENT (INWARD)

    let finalDocumentType = data.type_of_document;

    if (finalDocumentType === "Other Document") {
      finalDocumentType = data.other_document?.trim();

      if (!finalDocumentType) {
        return res.status(400).send("Please specify Other Document type");
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
              reply_ref_no, reply_sent_by, reply_sent_in, reply_count, group_name
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              data.date_of_receipt, data.month, data.year, data.received_in,
              data.name_of_sender, data.address_of_sender, data.sender_city,
              data.sender_state, data.sender_pin, data.sender_region, data.sender_org_type,
              inward_no, finalDocumentType, data.language_of_document, safeCount,
              data.remarks, data.issued_to, data.reply_required, data.reply_sent_date || null,
              data.reply_ref_no, data.reply_sent_by, data.reply_sent_in, safeReplyCount, groupName
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
      <p style="text-align:center;"><a href="/inward" target="_self">Add another</a></p>
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

// =========================
// INWARD DETAILS (FOR MODAL)
// =========================
app.get("/inward/details/:id", requireLogin, async (req, res) => {
  try {
    const id = req.params.id;

    const rows = await dbQuery(
      "SELECT * FROM inward_records WHERE s_no = ? LIMIT 1",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("Inward details error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =============================================
// OUTWARD DETAILS
// =============================================
app.get("/outward/details/:id", requireLogin, async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await dbQuery(
      "SELECT * FROM outward_records WHERE s_no = ? LIMIT 1",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Outward record not found" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("Outward details error:", err);
    res.status(500).json({ message: "Server error" });
  }
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
      date_of_receipt, received_in,
      type_of_document,
      language_of_document,
      DATE_FORMAT(reply_sent_date, '%Y-%m-%d') AS reply_sent_date,  
      issued_to AS reply_issued_by
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
    const groupName = req.session.user.group;

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


    // NORMALIZE TYPE OF DOCUMENT (OUTWARD)
    let finalDocumentType = data.type_of_document;

    if (finalDocumentType === "Other Document") {
      finalDocumentType = data.other_document?.trim();

      if (!finalDocumentType) {
        return res.status(400).send("Please specify Other Document type");
      }
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

    //  Block multiple outward for same inward
      if (inward_s_no) {
        const existing = await new Promise((resolve) =>
          db.query(
            "SELECT s_no FROM outward_records WHERE inward_s_no = ? LIMIT 1",
            [inward_s_no],
            (err, rows) => resolve(rows)
          )
        );

        if (existing.length > 0) {
          return res
            .status(400)
            .send("Outward reply already exists for this Inward entry");
        }
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
              reply_ref_no, reply_sent_by, reply_sent_in, reply_count, group_name
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              data.date_of_despatch, data.month, data.year, data.reply_from,
              data.name_of_receiver, data.address_of_receiver, data.receiver_city,
              data.receiver_state, data.receiver_pin, data.receiver_region, data.receiver_org_type,
              // outward_no, data.type_of_document, data.language_of_document, safeCount,
              outward_no, finalDocumentType, data.language_of_document, safeCount,
              data.inward_no || null, inward_s_no, data.reply_issued_by,
              data.reply_sent_date || null, data.reply_ref_no, data.reply_sent_by,
              data.reply_sent_in, safeReplyCount, groupName
            ],
            (err) => (err ? reject(err) : resolve())
          )
        );

 // AUTO-UPDATE INWARD FROM OUTWARD (SINGLE SOURCE OF TRUTH)
        if (inward_s_no) {
          await new Promise((resolve, reject) =>
            db.query(
              `
              UPDATE inward_records
              SET
                reply_sent_date = ?,
                reply_ref_no    = ?,
                reply_sent_by   = ?,
                reply_sent_in   = ?,
                reply_count     = ?,
                reply_required  = 'Yes'
              WHERE s_no = ?
              `,
              [
                data.reply_sent_date || null,
                data.reply_ref_no || null,
                data.reply_sent_by || null,
                data.reply_sent_in || null,
                safeReplyCount,
                inward_s_no
              ],
              (err) => (err ? reject(err) : resolve())
            )
          );
        }
        
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
      <p style="text-align:center;"><a href="/outward" target="_self">Add another</a></p>
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
// NOTINGS: SAVE MONTHLY DATA
// =========================
app.post("/notings/save", requireLogin, (req, res) => {
  const groupName = req.session.user.group;
  const {
    month,
    year,
    entry_type,
    hindi,
    english,
    eoffice
  } = req.body;

  // Validation
  if (!month || !year || !entry_type) {
    return res.status(400).json({
      success: false,
      message: "Month, Year and Entry Type are required"
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
    Number(eoffice) || 0
  ];

  db.query(sql, params, (err) => {
    if (err) {
      console.error("Notings save error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error"
      });
    }

    res.json({
      success: true,
      message: "Notings saved successfully"
    });
  });
});


// =========================
// EMAILS: SAVE MONTHLY DATA
// =========================
app.post("/emails/save", requireLogin, async (req, res) => {
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
// DASHBOARD  (GLOBAL + MONTHLY)
// =============================================
app.get("/dashboard/summary", requireLogin, async (req, res) => {
  try {
    const { month, year } = req.query;

    let start = null;
    let end = null;

    // If month & year provided → monthly mode
    if (month && year) {
      const range = getMonthDateRange(Number(year), Number(month));
      start = range.start;
      end = range.end;
    }

    // -------- INWARD QUERY --------
    let inwardSql = `
      SELECT * FROM inward_records
    `;
    let inwardParams = [];

    if (start && end) {
      inwardSql += `
        WHERE date_of_receipt >= ? AND date_of_receipt < ?
      `;
      inwardParams.push(start, end);
    }

    inwardSql += ` ORDER BY s_no DESC`;

    const inwardRows = await dbQuery(inwardSql, inwardParams);

    // -------- OUTWARD QUERY --------
    let outwardSql = `
      SELECT * FROM outward_records
    `;
    let outwardParams = [];

    if (start && end) {
      outwardSql += `
        WHERE date_of_despatch >= ? AND date_of_despatch < ?
      `;
      outwardParams.push(start, end);
    }

    outwardSql += ` ORDER BY s_no DESC`;

    const outwardRows = await dbQuery(outwardSql, outwardParams);

    // -------- COUNTS --------
    const totalInwards = inwardRows.length;
    const totalOutwards = outwardRows.length;

    const repliesPending = inwardRows.filter(r =>
      r.reply_required === "Yes" && !r.reply_sent_date
    ).length;

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




// =============================================
// ADMIN — REPORT DATA API 
// =============================================
app.post("/admin/report/data", requireAdmin, async (req, res) => {
  try {
    const { month, year, office, group } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year required" });
    }

    const data = await calculateReportData(
      month,
      year,
      office || "",
      group || ""
    );


    res.json(data);

  } catch (err) {
    console.error("Report Data Error:", err);
    res.status(500).json({ message: "Failed to calculate report" });
  }
});


// =============================================
// ADMIN — REPORT PDF GENERATION
// =============================================
app.post("/admin/report/pdf", requireAdmin, async (req, res) => {
  try {
    const { html, filename } = req.body;

    if (!html || !filename) {
      return res.status(400).json({ message: "Missing report HTML or filename" });
    }

    // Load report CSS (used in preview)
    const cssPath = path.join(__dirname, "frontend", "css", "report.css");
    const reportCss = fs.readFileSync(cssPath, "utf8");

    // Build full HTML for Puppeteer
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            ${reportCss}
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm"
      }
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    res.send(pdfBuffer);

  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
});


// =========================
// ADMIN: GET DISTINCT GROUPS (for reports)
// =========================
app.get("/admin/report/groups", requireAdmin, (req, res) => {
  const sql = `
    SELECT DISTINCT group_name
    FROM users
    WHERE group_name IS NOT NULL
      AND group_name <> ''
    ORDER BY group_name
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Group fetch error:", err);
      return res.status(500).json({ message: "Failed to load groups" });
    }

    res.json(rows.map(r => r.group_name));
  });
});







app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);
