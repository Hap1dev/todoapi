import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const PORT = 3000;
const db = new pg.Client({
	user: "postgres",
	host: "localhost",
	database: "todoapi",
	password: "root",
	port: 5432
});

db.connect();

app.use(bodyParser.urlencoded({extended: true}));

//post task
app.post("/tasks", async (req, res) => {
	const title = req.body.title;
	const description = req.body.description;
	try{
		const result = await db.query("INSERT INTO tasks(title, description) VALUES($1, $2) RETURNING *", [title, description]);
		const newTask = result.rows;
		res.status(201).json(newTask);
	}catch(error){
		res.status(501).json ({message: error.message});
	}
});

//get all tasks
app.get("/tasks", async (req, res) => {
	try{
		const result = await db.query("SELECT * FROM tasks");
		const allTask = result.rows;
		res.status(200).json(allTask);
	}catch(error){
		res.status(500).json({message: error.message});
	}
});

//get specific task
app.get("/tasks/:id", async (req, res) => {
	try{
		const id = parseInt(req.params.id);
		const result = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
		if(result.rows.length !== 0){
			const task = result.rows[0];
			res.status(200).json(task);
		}
		else{
			return res.status(404).json({message: `Task with id ${id} not found`});
		}
	}catch(error){
		res.status(500).json({message: error.message});
	}
});

//modify existing task
app.put("/tasks/:id", async (req, res) => {
	try{
		const id = parseInt(req.params.id);
		const result = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
		var task = {};
		if(result.rows.length !== 0){
			task = result.rows[0];
		}else{
			return res.status(404).json({message: `Task with id ${id} not found`});
		}
		const [title, description, is_done] = [req.body.title || task.title, req.body.description || task.description, req.body.is_done || task.is_done];
		const updated_at = new Date();
		const ut = await db.query("UPDATE tasks SET title = $1, description = $2, is_done = $3, updated_at = $4 WHERE id = $5 RETURNING *", [title, description, is_done, updated_at, id]);
		const updatedTask = ut.rows[0];
		res.status(200).json(updatedTask);
	}catch(error){
		res.status(500).json({message: error.message});
	}
});

//delete specific task
app.delete("/tasks/:id", async (req, res) => {
	try{
		const id = parseInt(req.params.id);
		const result = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
		if(result.rows.length !== 0){
			await db.query("DELETE FROM tasks WHERE id = $1", [id]);
			res.status(200).json({message: `Task with ${id} deleted successfully`});
		}else{
			return res.status(404).json({message: `Task with id ${id} not found`});
		}
	}catch(error){
		res.status(500).json({message: error.message});
	}
});

app.listen(PORT, () => {
	console.log(`API listening on port ${PORT}`);
});