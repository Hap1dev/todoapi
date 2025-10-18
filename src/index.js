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
app.get("/tasks/:id", (req, res) => {

});

//modify existing task
app.put("/tasks/:id", (req, res) => {

});

//delete specific task
app.delete("/tasks/:id", (req, res) => {

});

app.listen(PORT, () => {
	console.log(`API listening on port ${PORT}`);
});