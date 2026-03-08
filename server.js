const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const db = require("./db");
require("dotenv").config();
const { requireLogin, requireAdmin } = require("./middlewares/authMiddleware");



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


// ALL YOUR ROUTES:
app.use("/", require("./routes/auth"));
app.use("/", require("./routes/inward"));
app.use("/", require("./routes/outward"));
app.use("/", require("./routes/notings"));
app.use("/", require("./routes/emails"));
app.use("/", require("./routes/dashboard"));
app.use("/", require("./routes/admin"));
app.use("/", require("./routes/import"));


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.use(express.static("frontend", {
  index: false
}));



app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);
