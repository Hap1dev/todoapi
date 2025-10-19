import cron from "node-cron";
import db from "./../db.js";
import nodemailer from "nodemailer";

function notifier(){
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    cron.schedule("*/5 * * * *", async () => {
        try {
            const result = await db.query(
                "SELECT * FROM tasks WHERE created_at > NOW() - interval '5 minutes'"
            );

            if (result.rows.length > 0) {
                console.log("New tasks added:", result.rows);

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: process.env.EMAIL_TO,
                    subject: "New Tasks Added",
                    text: `New tasks have been added:\n${JSON.stringify(result.rows, null, 2)}`,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) console.error("Error sending email:", error);
                    else console.log("Email sent:", info.response);
                });
            } else {
                console.log("No new tasks in the last 5 minutes");
            }
        } catch (error) {
            console.error("Cron job error:", error.message);
        }
    });
};

export default notifier;