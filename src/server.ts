import http from "http";
import "dotenv/config";
import "express-async-errors";
import express from "express";
import { connectDB } from "./config/mongodb.connect.js";

//routes
import { authRoutes } from "./routes/auth.routes.js";
import { subjectRoutes } from "./routes/subject.routes.js";
import { userRoutes } from "./routes/user.routes.js";
import { sessionRoutes } from "./routes/session.routes.js";
import { studentRoutes } from "./routes/student.routes.js";
import { classroomRoutes } from "./routes/classroom.routes.js";
import { tutorRoutes } from "./routes/tutor.routes.js";
import { proofOfLevelRoutes } from "./routes/proofOfLevel.routes.js";

// error handler
import { notFound, errorHandler } from "./middlewares/error.middleware.js";

// extra security packages
import cors from "cors";
import rateLimiter from "express-rate-limit";
import cookieParser from "cookie-parser";
import { proofOfLevelRequestRoutes } from "./routes/proofOfLevel.request.routes.js";

const app = express();
app.set("trust proxy", (ip: any) => {
  if (ip === "127.0.0.1" || ip === "123.123.123.123")
    return true; // trusted IPs
  else return false;
});

// connect db
connectDB();

// extra packages
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// middlewares
app.use(function (req, res, next) {
  res.header("Content-Type", "application/json;charset=UTF-8");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  next();
});

// routes
app.use("/api/v1", authRoutes);
app.use("/api/v1", sessionRoutes);
app.use("/api/v1", userRoutes);
app.use("/api/v1", studentRoutes);
app.use("/api/v1", tutorRoutes);
app.use("/api/v1", proofOfLevelRoutes);
app.use("/api/v1", proofOfLevelRequestRoutes);
app.use("/api/v1", classroomRoutes);
app.use("/api/v1", subjectRoutes);

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;
const server = http.createServer(app);
server.listen(PORT);
server.on("listening", () => {
  console.log(`Server running on PORT ${PORT}...`);
});
