require("dotenv").config();
const mysql = require("mysql2");

// Changed from createConnection to createPool
const pool = mysql.createPool({
  connectionLimit: 10, // Allows up to 10 concurrent database connections
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,   // Kept this from your original code!
});

// Test the pool connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed: " + err.message);
    return;
  }
  console.log("Connected to MySQL Database via Connection Pool");
  connection.release(); // Always release the connection back to the pool
});

module.exports = pool;