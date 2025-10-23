import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import db from "./db.js";
import notifier from "./cron/cronJob.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();
const PORT = process.env.PORT;

dotenv.config();

app.use(cors());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000*60*60
  } 
}));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use("/api", authRoutes);
app.use("/api/tasks", taskRoutes);

db.connect();
notifier();

app.get("/", (req, res) => {
    res.json({message: "hello from todoapi!"});
});

app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
});