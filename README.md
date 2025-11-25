# Login and Registration System

A simple web application with user authentication functionality built using Node.js, Express, and MySql.

## Tech Stack

**Frontend:** HTML, CSS, JavaScript  
**Backend:** Node.js, Express.js  
**Database:** MySQL  
**Security:** bcrypt (for password hashing)  
**Environment Variables:** dotenv  

## Prerequisites

Before you begin, ensure you have installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MySQL](https://dev.mysql.com/downloads/) (v8.0 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Subhasis19/login-registration.git
cd login-registration
```

2. Install dependencies:
```bash
npm install
```

3. Create a MySQL database and ensure the MySQL service is running on your machine.

## Configuration

1. The application connects to MySQL using the configuration in `db.js`.
2. Make sure your MySQL server is running on the default port (3306).

## Set Up the MySQL Database

1. Start your MySQL server (via XAMPP, WAMP, or Workbench).

2. Open MySQL shell or phpMyAdmin.

3. Create a new database:
```sql
CREATE DATABASE login_system;
```

4. Select the database:
```sql
USE login_system;
```

5. Create the users table:
```CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  mobile VARCHAR(15),
  password VARCHAR(255),
  role ENUM('user', 'admin') DEFAULT 'user',
  group_name VARCHAR(50)
);
```

## Running the Application

1. Start the server:
```bash
node server.js
```

2. Open your web browser and navigate to:
- For registration: `http://localhost:3000/frontend/register.html`
- For login: `http://localhost:3000/frontend/index.html`

## Features

- User Registration
- User Login
- Form validation
- Password encryption
- Session management



## API Endpoints

- POST `/register` - Register a new user
- POST `/login` - Authenticate a user



## Database: Inward Records Table

If you added the Inward Correspondence form and need the corresponding database table, use the SQL definition below. This is the exact DDL for the `inward_records` table used by the application.

1. Open your MySQL client (MySQL shell, Workbench, or phpMyAdmin) and select the application database (for example, `login_system`).

2. Run the following statement to create the table:

```sql
CREATE TABLE inward_records (
  s_no INT NOT NULL AUTO_INCREMENT,

  date_of_receipt DATE NOT NULL,
  inward_no VARCHAR(50) NOT NULL UNIQUE,

  month VARCHAR(20),
  year INT,

  received_in ENUM('Silchar','Guwahati'),
  name_of_sender VARCHAR(100),
  address_of_sender VARCHAR(255),
  sender_city VARCHAR(100),
  sender_state VARCHAR(100),
  sender_pin VARCHAR(6),
  sender_region ENUM('A','B','C'),
  sender_org_type ENUM('Central','State','Private','Individual'),

  type_of_document ENUM('Letter','Bill','Other Document'),
  language_of_document ENUM('English','Hindi','Bilingual'),
  count INT DEFAULT 1,

  remarks ENUM('Action','Information'),
  issued_to VARCHAR(100),

  reply_required ENUM('Yes','No'),
  reply_sent_date DATE,
  reply_ref_no VARCHAR(100),
  reply_sent_by ENUM('Speed Post','Email'),
  reply_sent_in ENUM('English','Hindi','Bilingual'),
  reply_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (s_no)
);
```

3. Verify the table was created:

```sql
USE login_system;
SHOW TABLES;
DESCRIBE inward_records;
```

4. Optional: import from a file. Save the `CREATE TABLE` block to `inward_records.sql` and run:

```bash
mysql -u <user> -p login_system < inward_records.sql
```



5. Configure the application to connect to the database. The application reads connection values from environment variables via `db.js`. Set these in a `.env` file at the project root (create it if missing):

```
DB_HOST=localhost
DB_USER=appuser
DB_PASSWORD=strong_password
DB_NAME=login_system
```

7. Restart the Node server and test the form that writes to `inward_records`.

