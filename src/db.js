import pkg from "pg";
const { Pool } = pkg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default db;


// import pg from "pg";

// const db = new pg.Client({
//     user: process.env.POSTGRES_USER,
//     host: process.env.POSTGRES_HOST,
//     database: process.env.POSTGRES_DATABASE,
//     password: process.env.POSTGRES_PASSWORD,
//     port: process.env.POSTGRES_PORT
// });

// export default db;