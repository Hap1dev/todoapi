#users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
#tasks table
CREATE TABLE tasks(
  id SERIAL PRIMARY KEY,
  uid INT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  is_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
#tasks added in last 5 minutes
SELECT 
tasks.id,
users.email,
tasks.title,
tasks.description,
tasks.is_done,
tasks.created_at,
tasks.updated_at
FROM tasks
INNER JOIN users
ON tasks.uid = users.id
WHERE tasks.created_at > NOW() - INTERVAL '5 minutes'