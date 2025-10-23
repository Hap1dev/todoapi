import cron from "node-cron";
import db from "./../db.js";
import nodemailer from "nodemailer";
import { Resend } from "resend";

function notifier() {
    if (process.env.NODE_ENV === "production") {
        const resend = new Resend(process.env.RESEND_API_KEY);

        cron.schedule("*/5 * * * *", async () => {
            try {
                const result = await db.query(
                    `SELECT tasks.id, users.email, tasks.title, tasks.description, tasks.is_done, tasks.created_at, tasks.updated_at FROM tasks INNER JOIN users ON tasks.uid = users.id WHERE tasks.created_at > NOW() - INTERVAL '5 minutes'`
                );

                if (result.rows.length > 0) {
                    console.log("New tasks added:", result.rows);

                    for (const task of result.rows) {
                        await resend.emails.send({
                            from: "Notifier <onboarding@resend.dev>",
                            to: task.email,
                            subject: "New Tasks Added",
                            html: `<pre>${JSON.stringify(task, null, 2)}</pre>`,
                        });

                        console.log("Email sent successfully via Resend");
                    }
                } else {
                    console.log("No new tasks in the last 5 minutes");
                }
            } catch (error) {
                console.error("Cron job error (Resend):", error.message);
            }
        });
    } else {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        cron.schedule("*/5 * * * *", async () => {
            try {
                const result = await db.query("SELECT tasks.id, users.email, tasks.title, tasks.description, tasks.is_done, tasks.created_at, tasks.updated_at FROM tasks INNER JOIN users ON tasks.uid = users.id WHERE tasks.created_at > NOW() - INTERVAL '5 minutes'");
                if (result.rows.length > 0) {
                    console.log("New tasks added:", result.rows);
                    result.rows.forEach((task) => {
                        const mailOptions = {
                            from: process.env.EMAIL_USER,
                            to: task.email,
                            subject: "New Tasks Added",
                            text: `New tasks have been added: \n ${JSON.stringify(task, null, 2)}`,
                        };
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) console.error("Error sending email:", error);
                            else console.log("Email sent:", info.response);
                        });
                    });
                } else {
                    console.log("No new tasks in the last 5 minutes");
                }
            } catch (error) {
                console.error("Cron job error:", error.message);
            }
        });

    }
}

export default notifier;