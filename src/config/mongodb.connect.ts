import mongoose from "mongoose";
import chalk from 'chalk';

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string, {
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