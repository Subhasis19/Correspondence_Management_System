const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const db = require("./db");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: true,
  })
);

// Registration Route
app.post("/register", (req, res) => {
  const { name, email, mobile, password, confirmPassword, role } = req.body;

  if (password !== confirmPassword) {
    return res.send(
      'Passwords do not match! <a href="register.html">Try again</a>'
    );
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;

    db.query(
      "INSERT INTO users (name, email, mobile, password, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, mobile, hash, role || "user"],
      (err) => {
        if (err) return res.send("Error: " + err.message);
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

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
