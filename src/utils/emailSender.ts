import nodemailer from "nodemailer";
import 'dotenv/config';
import { appSettings } from "../settings/app.setting.js";

const transporter = nodemailer.createTransport({
    host: appSettings.EMAIL_HOST,
    port: Number(appSettings.EMAIL_PORT),
    secure: true,
    auth: {
        user: appSettings.EMAIL_USER,
        pass: appSettings.EMAIL_PASS,
    },
});

/**
 * Send email using nodemailer transporter GMAIL
 */
export const sendEmail = async (to: string, subject: string, body: string) => {
    try {
        await transporter.sendMail({
            to: to,
            from: appSettings.EMAIL_USER as string,
            subject: subject,
            html: body,
        });
    } catch (error) {
        console.log(error);
    }
};
