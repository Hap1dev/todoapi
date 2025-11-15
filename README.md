# todoapi

**Hosted API:** [https://todoapi-2362.onrender.com/](https://todoapi-2362.onrender.com/)  
**API Documentation:** [https://documenter.getpostman.com/view/34259777/2sB3QQK8Eg](https://documenter.getpostman.com/view/34259777/2sB3QQK8Eg)

---

## Table of Contents

1. Project Overview
2. Tech stack
3. Prerequisites
4. Environment variables (`.env`)
5. Database schema & setup
6. Install & run locally
7. API endpoints (with authentication notes)
8. Authentication flow (register / login / using token in Postman)

---

## 1. Project overview

`todoapi` is a simple To-Do List backend built with Node.js, Express and PostgreSQL. It provides CRUD operations on tasks and runs a Cron job every 5 minutes that checks for tasks created in the last 5 minutes and sends a notification (email) if new tasks were found.

This repository includes:

* RESTful CRUD endpoints for `tasks`
* JWT-based user authentication (protects task routes)
* A `node-cron` job that runs every 5 minutes to detect newly created tasks
* Nodemailer-based (if running locally) email notifications (Gmail App Password assumed)

---

## 2. Tech stack

* Node.js (ES modules)
* Express
* PostgreSQL (database name: `todoapi`)
* `pg` (node-postgres)
* `node-cron`
* `nodemailer`/`resend`
* `jsonwebtoken` (JWT)
* `bcrypt` (password hashing)
* Postman for testing

---

## 3. Prerequisites

* Node.js (v16+ recommended)
* npm
* PostgreSQL installed and running locally
* (Optional for email) a Gmail account with 2-Step Verification enabled and an App Password generated

---

## 4. Environment variables (`.env`)

Create a file called `.env` in the project root and add the following variables (example values):

```
NODE_ENV=local
SESSION_SECRET=your_super_secret_session_key
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
PORT=3000
DATABASE_URL=postgres://[user]:[password]@localhost:5432/todoapi
```

---

## 5. Database schema & setup

Open `psql` or your preferred DB client and run the following SQL to create the database and tables.

### Create database

```sql
CREATE DATABASE todoapi;
\c todoapi
```

### Tasks table

```sql
CREATE TABLE tasks(
  id SERIAL PRIMARY KEY,
  uid INT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  is_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Users table (for JWT auth)

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

> Note: If you use a GUI client (pgAdmin, TablePlus), run the same SQL there.

---

## 6. Install & run locally

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/Hap1dev/todoapi.git
cd todoapi
npm install
```

2. Create `.env` (see section 4) and ensure PostgreSQL is running and the `todoapi` database exists.

3. Run the server in development:

```bash
npm start
# or if you use nodemon (recommended during development)
npm run dev
```

The API should now be listening on the port you set (e.g., `http://localhost:3000`).

---

## 7. API endpoints (with authentication notes)

> **Authentication:** All task routes require a valid Bearer token **except** `/register` and `/login`.

| Method | Path       | Auth required? | Description                                                |
| ------ | ---------- | -------------- | ---------------------------------------------------------- |
| POST   | /api/register  | No             | Create a new user (body: `email`, `username`, `password`)           |
| POST   | /api/login     | No             | Login, returns `{ token: XXXXX }` (body: `username`, `password`)  |
| POST   | /api/tasks     | Yes            | Create a new task (body: `title`, `description`)           |
| GET    | /api/tasks     | Yes            | Get all tasks                                              |
| GET    | /api/tasks/:id | Yes            | Get a specific task by id                                  |
| PUT    | /api/tasks/:id | Yes            | Update a task (body: `title?`, `description?`, `is_done?`) |
| DELETE | /api/tasks/:id | Yes            | Delete a task by id                                        |

### Example request (create task)

**URL:** `POST http://localhost:3000/api/tasks`
**Headers:** `Authorization: Bearer <token>`
**Body (JSON):**

```json
{
  "title": "Finish assignment",
  "description": "Implement cron + JWT"
}
```

---

## 8. Authentication flow (register / login / using token in Postman)

1. **Register** a user:

   * `POST /register` with JSON body `{ "email": "example@gmail.com", "username": "myuser", "password": "mypassword" }`.
   * Passwords are hashed with `bcrypt` before storing.

2. **Login** to get JWT:

   * `POST /login` with JSON body `{ "username": "myuser", "password": "mypassword" }`.
   * If successful, response contains `{ "token": "<jwt>" }`.

3. **Use the token** in Postman:

   * In Postman, open the request to a protected endpoint.
   * Go to the *Auth* tab → Select *Bearer Token* under Auth Type → Paste your token in the token field
   * Alternatively, in *Headers* add: `Authorization: Bearer <token>` (key: Authorization, value: <token>).

> The server validates the JWT using `process.env.JWT_SECRET`.