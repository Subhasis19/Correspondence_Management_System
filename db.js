require("dotenv").config();
const mysql = require("mysql2");

// Changed from createConnection to createPool
const pool = mysql.createPool({
  connectionLimit: 10, // Allows up to 10 concurrent database connections
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,   // Ensures DATE and DATETIME are returned as strings
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

function dbQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
}

module.exports = { pool, dbQuery };