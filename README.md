# Login & Registration System
Simple Node.js + Express + MySQL authentication app (User & Admin).

## Tech
- Frontend: HTML, CSS, JS
- Backend: Node.js, Express
- Database: MySQL
- Auth: bcrypt (password hashing)

## Quick start (local)
1. Install MySQL and create `login_system` DB and `users` table:
   ```sql
   CREATE DATABASE login_system;
   USE login_system;
   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(100),
     email VARCHAR(100) UNIQUE,
     mobile VARCHAR(15),
     password VARCHAR(255),
     role ENUM('user','admin') DEFAULT 'user'
   );
