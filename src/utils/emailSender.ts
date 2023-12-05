import nodemailer from "nodemailer";
import 'dotenv/config';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send email using nodemailer transporter GMAIL
 */
export const sendEmail = async (to: string, subject: string, body: string) => {
    try {
        await transporter.sendMail({
            to: to,
            from: process.env.EMAIL_USER as string,
            subject: subject,
            html: body,
        });
    } catch (error) {
        console.log(error);
    }
};
