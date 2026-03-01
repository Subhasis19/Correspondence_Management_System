const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../db"); // Points back to your root db.js
require("dotenv").config();

// =========================
// EMAIL TRANSPORTER
// =========================
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

// =========================
// OTP SYSTEM
// =========================
router.post("/send-otp", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send({ success: false, message: "Email required" });

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 1day

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

router.post("/verify-otp", (req, res) => {
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

// =========================
// USER REGISTRATION & LOGIN
// =========================
router.post("/register", (req, res) => {
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

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) throw err;
    if (rows.length === 0) return res.send("User not found");

    const user = rows[0];

    bcrypt.compare(password, user.password, (err, match) => {
      if (err) throw err;
      if (!match) return res.send("Invalid password");

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

// =========================
// SESSION INFO & LOGOUT
// =========================
router.get("/session-info", (req, res) => {
  if (!req.session.user) {
    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    return res.redirect("/");
  }
  res.json({ loggedIn: true, user: req.session.user });
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;