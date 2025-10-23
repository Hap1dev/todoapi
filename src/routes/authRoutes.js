import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "./../db.js";

const router = express.Router();

//register
router.post("/register", async (req, res) => {
	try{
		const email = req.body.email;
		const username = req.body.username;
		const password = req.body.password;
		const hashedPassword = await bcrypt.hash(password, 10);
		const result = await db.query("INSERT INTO users(email, username, password) VALUES($1, $2, $3) RETURNING *", [email, username, hashedPassword]);
		const user = result.rows[0];
		res.status(201).json(user);
	}catch(error){
		res.status(500).json({message: error.message});
	}
});

//login
router.post("/login", async (req, res) => {
	try{
		const username = req.body.username;
		const password = req.body.password;
		const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
		if(result.rows.length === 0){
			return res.status(400).json({error: `No user with ${username} username found`});
		}
		const user = result.rows[0];
		const match = await bcrypt.compare(password, user.password);
		if(!match){
			return res.status(400).json({error: "Invalid credentials"});
		}
		const token = jwt.sign({userId: user.id}, process.env.JWT_SECRET, {expiresIn: "1h"});
		req.session.user = { id: user.id };
		res.status(200).json({token: token});
	}catch(error){
		res.status(500).json({message: error.message});
	}
});

export default router;