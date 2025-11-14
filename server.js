const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const db = require("./db");

require('dotenv').config();

const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("frontend"));
app.use(
  session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: true,
  })
);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((err) => {
  if (err) console.warn('Email transporter verification failed:', err);
  else console.log('Email transporter ready');
});

// send OTP route
app.post('/send-otp', (req, res) => {
  const email = req.body.email;
  if (!email) return res.status(400).send({ success: false, message: 'Email required' });

  // generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  // store in session for this client
  req.session.otp = otp;
  req.session.otpExpires = expiresAt;
  req.session.otpEmail = email;
  req.session.otpVerified = false;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your registration OTP',
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.error('Error sending OTP:', err);
      return res.status(500).send({ success: false, message: 'Failed to send OTP' });
    }
    console.log('OTP sent to', email, otp);
    return res.send({ success: true, message: 'OTP sent' });
  });
});

// verify OTP route (keeps verifiedEmail so /register can check)
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).send({ verified: false, message: 'Email and OTP required' });

  if (!req.session.otp || !req.session.otpExpires || !req.session.otpEmail) {
    return res.status(400).send({ verified: false, message: 'No OTP requested' });
  }

  if (Date.now() > req.session.otpExpires) {
    delete req.session.otp;
    delete req.session.otpExpires;
    delete req.session.otpEmail;
    req.session.otpVerified = false;
    return res.status(400).send({ verified: false, message: 'OTP expired' });
  }

  if (req.session.otpEmail !== email) {
    return res.status(400).send({ verified: false, message: 'Email mismatch' });
  }

  if (req.session.otp === otp.toString()) {
    // mark session as verified and remember which email was verified
    req.session.otpVerified = true;
    req.session.verifiedEmail = email;

    // clear the one-time OTP and expiry (keep verifiedEmail)
    delete req.session.otp;
    delete req.session.otpExpires;

    return res.send({ verified: true, message: 'OTP verified' });
  } else {
    return res.status(400).send({ verified: false, message: 'Invalid OTP' });
  }
});

// Registration Route
app.post("/register", (req, res) => {
 const { name, email, mobile, password, confirmPassword, group_name } = req.body;


  // require OTP verified before registration
  if (!req.session.otpVerified || req.session.verifiedEmail !== email) {
    return res.send(
      'Please verify your email OTP before registering. <a href="register.html">Try again</a>'
    );
  }

  if (password !== confirmPassword) {
    return res.send(
      'Passwords do not match! <a href="register.html">Try again</a>'
    );
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;

    db.query(
  "INSERT INTO users (name, email, mobile, password, role, group_name) VALUES (?, ?, ?, ?, ?, ?)",
  [name, email, mobile, hash, "user", group_name],
  (err) => {
    if (err) return res.send("Error: " + err.message);

    // clear OTP session flags
    req.session.otpVerified = false;
    delete req.session.verifiedEmail;

    res.send('Registration successful! <a href="/">Login</a>');
  }
);

  });
});

// Login Route
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) throw err;

    if (results.length === 0) return res.send("User not found");

    const user = results[0];
    bcrypt.compare(password, user.password, (err, match) => {
      if (match) {
        req.session.user = user;
        if (user.role === "admin") res.send("Welcome Admin " + user.name);
        else res.send("Welcome User " + user.name);
      } else {
        res.send("Invalid password");
      }
    });
  });
});

// ====================== INWARD ENTRY ROUTE ========================= //

app.post("/inward/add", (req, res) => {
  const {
    date_of_receipt,
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
    inward_no,
    type_of_document,
    language_of_document,
    count,
    remarks,
    issued_to,
    reply_required,
    reply_sent_date,
    reply_ref_no,
    reply_sent_by,
    reply_sent_in,
    reply_count
  } = req.body;

  // SQL Insert Query
  const sql = `
    INSERT INTO inward_records (
      date_of_receipt, month, year, received_in,
      name_of_sender, address_of_sender, sender_city,
      sender_state, sender_pin, sender_region, sender_org_type,
      inward_no, type_of_document, language_of_document, count,
      remarks, issued_to, reply_required, reply_sent_date,
      reply_ref_no, reply_sent_by, reply_sent_in, reply_count
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  const values = [
    date_of_receipt, month, year, received_in,
    name_of_sender, address_of_sender, sender_city,
    sender_state, sender_pin, sender_region, sender_org_type,
    inward_no, type_of_document, language_of_document, count || 1,
    remarks, issued_to, reply_required, reply_sent_date || null,
    reply_ref_no, reply_sent_by, reply_sent_in, reply_count || 0
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error saving inward entry:", err);
      return res.send("Error saving data: " + err.message);
    }

    res.send(`
      <h3 style="font-family:Arial; text-align:center;">Inward Entry Saved Successfully!</h3>
      <p style="text-align:center;"><a href="/inward.html">Add Another Entry</a></p>
    `);
  });
});




app.listen(3000, () => console.log("Server running on http://localhost:3000"));
