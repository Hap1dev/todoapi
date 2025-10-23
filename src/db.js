import pkg from "pg";

let config = {
  connectionString: process.env.DATABASE_URL
};

if(process.env.NODE_ENV==="production")
  config.ssl = { rejectUnauthorized: false };

const db = new pkg.Pool(config);

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