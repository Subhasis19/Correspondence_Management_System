// admin-setup.js
require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./db");

async function createAdmin() {
  const name = "Admin";
  const email = "asubhasis2002@gmail.com"; // Change if needed
  const mobile = "9348423357";
  const plainPassword = "Admin@123"; // Change this to your secure admin password
  const role = "admin";

  try {
    // Check if admin already exists
    db.query(
      "SELECT * FROM users WHERE role = 'admin'",
      async (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
          console.log("Admin already exists:", results[0].email);
          process.exit();
        }

        // Hash the password
        const hash = await bcrypt.hash(plainPassword, 10);

        // Insert admin record
        db.query(
          "INSERT INTO users (name, email, mobile, password, role) VALUES (?, ?, ?, ?, ?)",
          [name, email, mobile, hash, role],
          (err) => {
            if (err) throw err;
            console.log(`Admin created successfully!
------------------------------
Email: ${email}
Password: ${plainPassword}
------------------------------
`);
            process.exit();
          }
        );
      }
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();


// node admin-setup.js 
