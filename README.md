# todoapi

**To-Do List Backend (Node.js + Express + PostgreSQL)**

A compact, production-minded README describing how to set up, run, test (Postman), and understand the Cron job and JWT authentication used by the `todoapi` project.

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
9. Postman — how to test & export collection
10. Cron job — implementation and explanation
11. Hosting notes (quick guide for AWS)
12. Troubleshooting / common issues
13. Postman test ideas (suggested automated tests)
14. Contact / Credits

---

## 1. Project overview

`todoapi` is a simple To-Do List backend built with Node.js, Express and PostgreSQL. It provides CRUD operations on tasks and runs a Cron job every 5 minutes that checks for tasks created in the last 5 minutes and sends a notification (email) if new tasks were found.

This repository includes:

* RESTful CRUD endpoints for `tasks`
* JWT-based user authentication (protects task routes)
* A `node-cron` job that runs every 5 minutes to detect newly created tasks
* Nodemailer-based email notifications (Gmail App Password assumed)

---

## 2. Tech stack

* Node.js (ES modules)
* Express
* PostgreSQL (database name: `todoapi`)
* `pg` (node-postgres)
* `node-cron`
* `nodemailer`
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
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_TO=notify@example.com
PORT=3000
POSTGRES_USER=postgres
POSTGRES_HOST=localhost
POSTGRES_PASSWORD=root
POSTGRES_DATABASE=todoapi
POSTGRES_PORT=5432
```

> **Security note:** Do not commit `.env` to version control. Add it to `.gitignore`.

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
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Users table (for JWT auth)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
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
git clone <repo-url>
cd todoapi
npm install
```

2. Create `.env` (see section 4) and ensure PostgreSQL is running and the `todoapi` database exists.

3. Run the server in development:

```bash
# If entry file is index.js and package.json has "type": "module"
node index.js
# or if you use nodemon (recommended during development)
npx nodemon index.js
```

The API should now be listening on the port you set (e.g., `http://localhost:5000`).

---

## 7. API endpoints (with authentication notes)

> **Authentication:** All task routes require a valid Bearer token **except** `/register` and `/login`.

| Method | Path       | Auth required? | Description                                                |
| ------ | ---------- | -------------- | ---------------------------------------------------------- |
| POST   | /register  | No             | Create a new user (body: `username`, `password`)           |
| POST   | /login     | No             | Login, returns `{ token }` (body: `username`, `password`)  |
| POST   | /tasks     | Yes            | Create a new task (body: `title`, `description`)           |
| GET    | /tasks     | Yes            | Get all tasks                                              |
| GET    | /tasks/:id | Yes            | Get a specific task by id                                  |
| PUT    | /tasks/:id | Yes            | Update a task (body: `title?`, `description?`, `is_done?`) |
| DELETE | /tasks/:id | Yes            | Delete a task by id                                        |

### Example request (create task)

**URL:** `POST http://localhost:5000/tasks`
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

   * `POST /register` with JSON body `{ "username": "myuser", "password": "mypassword" }`.
   * Passwords are hashed with `bcrypt` before storing.

2. **Login** to get JWT:

   * `POST /login` with JSON body `{ "username": "myuser", "password": "mypassword" }`.
   * If successful, response contains `{ "token": "<jwt>" }`.

3. **Use the token** in Postman:

   * In Postman, open the request to a protected endpoint.
   * Go to the *Authorization* tab → Type: *Bearer Token* → paste the token.
   * Alternatively, in *Headers* add: `Authorization: Bearer <token>`

> The server validates the JWT using `process.env.JWT_SECRET`.

---

## 9. Postman — how to test & export collection

### Creating a collection and requests

1. Open Postman.
2. Create a new Collection named `todoapi`.
3. Add requests for each endpoint (register, login, create task, get all, get one, update, delete).
4. For protected endpoints, use the Authorization tab with Bearer Token (paste token returned from `/login`).

### How to save a token in Postman (optional convenience)

* Use *Collection/Folder Pre-request Script* or an *environment variable*:

  * After login, copy the token and set an environment variable `jwt`.
  * In other requests Authorization header use: `Bearer {{jwt}}`.

### Exporting a collection

1. Right-click the collection → Export.
2. Choose version (2.1 recommended) → Export to JSON. Attach this JSON when you submit.

> I can create and export a sample Postman collection for you if you want — tell me and I will produce the JSON.

---

## 10. Cron job — implementation and explanation

The Cron job checks new tasks every 5 minutes and sends a notification email when new tasks are added in the last 5 minutes.

### Corrected and ready-to-use `cronJob.js`

> Place this file at your project root (or `src/`) and import it from `index.js`.

```js
// cronJob.js
import cron from "node-cron";
import db from "./db.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const notifier = () => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  cron.schedule("*/5 * * * *", async () => {
    try {
      const result = await db.query(
        "SELECT * FROM tasks WHERE created_at > NOW() - interval '5 minutes'"
      );

      if (result.rows.length > 0) {
        console.log("New tasks added:", result.rows);

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_TO,
          subject: "New Tasks Added",
          text: `New tasks have been added:\n${JSON.stringify(result.rows, null, 2)}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) console.error("Error sending email:", error);
          else console.log("Email sent:", info.response);
        });
      } else {
        console.log("No new tasks in the last 5 minutes");
      }
    } catch (error) {
      console.error("Cron job error:", error.message);
    }
  });
};

export default notifier;
```

### Using the cron job in `index.js`

```js
import notifier from './cronJob.js';

// ... other imports and app setup

notifier(); // starts the cron job
```

### How it works (explanation)

* `node-cron` is configured with the expression `"*/5 * * * *"` — runs at every 5th minute.
* Each run performs a query: tasks created within the last 5 minutes.
* If rows are returned, the job sends an email via Nodemailer (Gmail SMTP) to the configured `EMAIL_TO` recipient and logs the results.

> Note: While testing locally you can confirm emails by using a console log or by using Ethereal / Mailtrap if you prefer not to use your Gmail account.

---

## 11. Hosting notes (quick guide for AWS Elastic Beanstalk)

> You mentioned you have not hosted yet. Below is a short path to get this live on AWS using Elastic Beanstalk. You can also use EC2 directly or services like Render.

1. Install AWS CLI and EB CLI and configure credentials.
2. In project root, create a `Procfile` (if needed):

```
web: node index.js
```

3. Ensure environment variables are set in Elastic Beanstalk console (DATABASE_URL, JWT_SECRET, EMAIL_USER, EMAIL_PASS, EMAIL_TO).
4. `eb init` -> choose Node platform, `eb create` to create environment, then `eb deploy`.
5. Confirm EB environment health and test publicly accessible URL.

> For DB: either use AWS RDS (provision PostgreSQL and update `DATABASE_URL`) or keep using the local DB for dev (not recommended for production).

---

## 12. Troubleshooting / common issues

* **Nodemailer `535` / `534` Invalid login**: Use a Gmail App Password and ensure 2FA is enabled. Do not use your regular Gmail password.
* **`Invalid token` or `Missing token`**: Ensure `Authorization: Bearer <token>` header is present. Use Postman Authorization → Bearer Token field to avoid formatting mistakes.
* **Tokens invalid after server restart**: Make sure `JWT_SECRET` in `.env` is stable and not re-generated each run.
* **DB connection errors**: Ensure `DATABASE_URL` is correct and PostgreSQL server is running. Test with `psql` or `pgAdmin`.

---

## 13. Postman test ideas (automated tests you can add)

* **Register**: assert `201` and returned `username`.
* **Login**: assert `200` and token exists.
* **Create task (authenticated)**: assert `201`, response contains `id`, `title`.
* **Get all tasks**: assert `200`, returned is an array.
* **Get specific task**: assert `200` for existing id, `404` for missing id.
* **Update task**: assert `200` and field changes persisted.
* **Delete task**: assert `200` and follow up `GET` returns `404`.
* **Cron job**: create a task and check server logs for "New tasks added" within 5 minutes, or check email inbox for delivered message.

---

## 14. Contact / Credits

If you need a Postman collection exported or want me to produce the Postman JSON export (pre-filled with endpoints and sample requests), tell me and I will generate it for you.

Good luck — once you want, I can also help with the AWS deployment steps (EB CLI commands and environment variable configuration) or produce the Postman collection JSON for upload.
