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

## Project Structure

```
login-registration/
│   db.js            # Database configuration
│   package.json     # Project dependencies
│   README.md        # Project documentation
│   server.js        # Express server setup
│
└───frontend/
    │   index.html   # Login page
    │   register.html # Registration page
    │   style.css    # Styling for the pages
```

## API Endpoints

- POST `/register` - Register a new user
- POST `/login` - Authenticate a user

## Security Features

- Passwords are securely hashed before storage
- Input validation for registration and login
- Protected routes using session management

