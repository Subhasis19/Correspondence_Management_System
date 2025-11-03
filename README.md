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
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    mobile VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

## Recent UI updates (responsive login page)

I updated the frontend styling to make the login page fully responsive and improve the user experience across devices.

Summary of changes:

- Added a centered, bounded `.login-container` with padding, rounded corners, and a subtle shadow to contain the form.
- Improved input and button styling: consistent padding, focus states, and sizing so the controls scale well on phones and tablets.
- Added `.password-container` and `.toggle-password` rules to position the eye icon correctly and make it touch-friendly.
- Implemented media queries for breakpoints at 600px and 400px so typography, spacing, and padding adapt on small screens.
- Small UX polish: button hover states, color tweaks, and lightweight box shadow for better contrast on the gradient background.

Files changed:

- `frontend/style.css` — primary responsive improvements and new utility classes for the login UI.

Suggested HTML wrapper (insert inside your existing `<body>` around the form):

```html
<div class="login-container">
    <h2>Login</h2>
    <form action="/login" method="POST">
        <input type="email" name="email" placeholder="Email" required>
        <div class="password-container">
            <input type="password" name="password" id="loginPassword" placeholder="Password" required>
            <i class="fa-solid fa-eye toggle-password" onclick="togglePassword('loginPassword', this)"></i>
        </div>
        <button type="submit">Login</button>
    </form>
    <p>Don't have an account? <a href="register.html">Register</a></p>
</div>
```

Quick test steps:

1. Start the server: `node server.js`.
2. Open the login page: `http://localhost:3000/frontend/index.html`.
3. Resize the browser window or use device emulation in devtools to verify the layout adapts at small widths.
4. Confirm the password toggle icon still reveals/hides the password and remains tappable on mobile.

If you'd like, I can apply the same responsive container and styles to `register.html` as a follow-up.

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

