import http from "http";
import "dotenv/config";
import "express-async-errors";
import express from "express";
import { connectDB } from "./config/mongodb.connect.js";
import cron from "node-cron";
import https from "https";

//routes
import { authRoutes } from "./routes/auth.routes.js";
import { subjectRoutes } from "./routes/subject.routes.js";
import { userRoutes } from "./routes/user.routes.js";
import { sessionRoutes } from "./routes/session.routes.js";
import { studentRoutes } from "./routes/student.routes.js";
import { classroomRoutes } from "./routes/classroom.routes.js";
import { tutorRoutes } from "./routes/tutor.routes.js";
import { proofOfLevelRoutes } from "./routes/proofOfLevel.routes.js";
import { rechargeRoutes } from "./routes/recharge.routes.js";
import { coinPackageRoutes } from "./routes/coinPackage.routes.js";
import { donateRoutes } from "./routes/donate.routes.js";
import { withdrawRoutes } from "./routes/withdraw.routes.js";
import { notificationRoutes } from "./routes/notification.routes.js";
import { classroomMessageRoutes } from "./routes/classroomMessage.routes.js";

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
    max: 300,
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
    "Origin, X-Requested-With, Content-Type, Accept, Cookie"
  );
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  next();
});

// routes
app.get("/test", (req, res: express.Response) => {
  res.status(200).json({
    message: "OK",
  });
});
app.use("/api/v1", authRoutes);
app.use("/api/v1", sessionRoutes);
app.use("/api/v1", userRoutes);
app.use("/api/v1", studentRoutes);
app.use("/api/v1", tutorRoutes);
app.use("/api/v1", proofOfLevelRoutes);
app.use("/api/v1", proofOfLevelRequestRoutes);
app.use("/api/v1", classroomRoutes);
app.use("/api/v1", subjectRoutes);
app.use("/api/v1", rechargeRoutes);
app.use("/api/v1", donateRoutes);
app.use("/api/v1", withdrawRoutes);
app.use("/api/v1", coinPackageRoutes);
app.use("/api/v1", notificationRoutes);
app.use("/api/v1", classroomMessageRoutes);

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;
const server = http.createServer(app);
server.listen(PORT);
server.on("listening", () => {
  console.log(`Server running on PORT ${PORT}...`);
});

// import { Server } from "socket.io";
// import { WebSockets } from "./utils/webSocket.js";
// const webSockets = new WebSockets();

// export const socketio = new Server(server, {
//   pingTimeout: 60000,
//   cors: {
//     // origin: "https://learn-together.onrender.com",
//     origin: `http://localhost:${PORT}`,
//     credentials: true,
//   },
// });

// import events from "events";
// export const eventEmitter = new events.EventEmitter();

// socketio.on("connection", webSockets.connection);

// Keep server on Render alive

cron.schedule("*/14 * * * *", () => {
  https
    .get(`${process.env.SERVER_ENDPOINT!}/test`, (res: any) => {
      if (res.statusCode === 200) {
        console.log("Server restarted");
      } else {
        console.error(`
          Failed to restart server with status code: ${res.statusCode}
        `);
      }
    })
    .on("error", (err: any) => {
      console.error("Error during Restart: ", err.message);
    });
});
