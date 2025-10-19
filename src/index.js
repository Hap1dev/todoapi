import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import db from "./db.js";
import notifier from "./cronJob.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import authenticate from "./authenticate.js";

const app = express();
const PORT = process.env.PORT;

dotenv.config();

app.use(bodyParser.urlencoded({
    extended: true
}));

db.connect();
notifier();

//register
app.post("/register", async (req, res) => {
	try{
		const username = req.body.username;
		const password = req.body.password;
		const hashedPassword = await bcrypt.hash(password, 10);
		const result = await db.query("INSERT INTO users(username, password) VALUES($1, $2) RETURNING *", [username, hashedPassword]);
		const user = result.rows[0];
		res.status(201).json({user});
	}catch(error){
		res.status(500).json({message: error.message});
	}
});

//login
app.post("/login", async (req, res) => {
	try{
		const username = req.body.username;
		const password = req.body.password;
		const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
		if(result.rows.length === 0){
			return res.status(400).json({error: `No user with ${username} username found`});
		}
		const user = result.rows[0];
		const match = bcrypt.compare(password, user.password);
		if(!match){
			return res.status(400).json({error: "Invalid credentials"});
		}
		const token = jwt.sign({userId: user.id}, process.env.JWT_SECRET, {expiresIn: "1h"});
		res.status(200).json({token: token});
	}catch(error){
		res.status(500).json({message: error.message});
	}
});

//post task
app.post("/tasks", authenticate, async (req, res) => {
    const title = req.body.title;
    const description = req.body.description;
    if (!title || title.trim() === '') {
        return res.status(400).json({ error: "Title is required" });
    }
    try {
        const result = await db.query("INSERT INTO tasks(title, description) VALUES($1, $2) RETURNING *", [title, description]);
        const newTask = result.rows[0];
        res.status(201).json(newTask);
    } catch (error) {
        res.status(501).json({
            message: error.message
        });
    }
});

//get all tasks
app.get("/tasks", authenticate, async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM tasks");
        const allTask = result.rows;
        res.status(200).json(allTask);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

//get specific task
app.get("/tasks/:id", authenticate, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
        if (result.rows.length !== 0) {
            const task = result.rows[0];
            res.status(200).json(task);
        } else {
            return res.status(404).json({
                message: `Task with id ${id} not found`
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

//modify existing task
app.put("/tasks/:id", authenticate, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
        var task = {};
        if (result.rows.length !== 0) {
            task = result.rows[0];
        } else {
            return res.status(404).json({
                message: `Task with id ${id} not found`
            });
        }
        const [title, description, is_done] = [req.body.title || task.title, req.body.description || task.description, req.body.is_done || task.is_done];
        const updated_at = new Date();
        const ut = await db.query("UPDATE tasks SET title = $1, description = $2, is_done = $3, updated_at = $4 WHERE id = $5 RETURNING *", [title, description, is_done, updated_at, id]);
        const updatedTask = ut.rows[0];
        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

//delete specific task
app.delete("/tasks/:id", authenticate, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
        if (result.rows.length !== 0) {
        	const deletedTask = result.rows[0];
            res.status(200).json(deletedTask);
        } else {
            return res.status(404).json({
                message: `Task with id ${id} not found`
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
});