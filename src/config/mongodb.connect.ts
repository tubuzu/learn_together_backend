import mongoose from "mongoose";
import chalk from 'chalk';
import { appSettings } from "../settings/app.setting.js";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(appSettings.MONGO_URI as string, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.log(chalk.red.bold(`Error: ${error.message}`));
        process.exit();
    }
};