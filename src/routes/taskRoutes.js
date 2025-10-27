import express from "express";
import db from "./../db.js";
import authenticate from "./../middleware/authenticate.js";

const router = express.Router();

//post task
router.post("/", authenticate, async (req, res) => {
    const uid = req.session.user?.id;
    const title = req.body.title;
    const description = req.body.description;
    if(!uid){
        return res.status(401).json({error: "User is not authenticated or session expired"});
    }
    if (!title || title.trim() === '') {
        return res.status(400).json({ error: "Title is required" });
    }
    try {
        const result = await db.query("INSERT INTO tasks(uid, title, description) VALUES($1, $2, $3) RETURNING *", [uid, title, description]);
        const newTask = result.rows[0];
        res.status(201).json(newTask);
    } catch (error) {
        res.status(501).json({
            message: error.message
        });
    }
});

//get all tasks
router.get("/", authenticate, async (req, res) => {
    try {
        // const result = await db.query("SELECT * FROM tasks");
        // const allTask = result.rows;
        // res.status(200).json(allTask);

        /* ------ UPDATE ------ */

        // const result = await db.query("SELECT * FROM tasks");
        const completed_tasks_result = await db.query("SELECT * FROM tasks WHERE is_done = true ORDER BY updated_at DESC");
        const incomplete_tasks_result = await db.query("SELECT * FROM tasks WHERE is_done = false ORDER BY updated_at DESC");
        const allTask = {
            meta: {
                total: completed_tasks_result.rows.length + incomplete_tasks_result.rows.length,
                completed_count: completed_tasks_result.rows.length,
                incomplete_count: incomplete_tasks_result.rows.length
            },
            completed_tasks: completed_tasks_result.rows,
            incomplete_tasks: incomplete_tasks_result.rows
        };
        res.status(200).json(allTask);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

//get specific task
router.get("/:id", authenticate, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: `Task with id ${id} not found`
            });
        }
        const task = result.rows[0];
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

//modify existing task
router.put("/:id", authenticate, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
        var task = {};
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: `Task with id ${id} not found`
            });
        }
        task = result.rows[0];
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
router.delete("/:id", authenticate, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: `Task with id ${id} not found`
            });
        }
        // const deletedTask = result.rows[0];
        await db.query("DELETE FROM tasks WHERE id = $1", [id]);
        res.status(200).json({message: `Task with id ${id} deleted successfully`});
        // res.status(200).json(deletedTask);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

export default router;