import express from "express";
import {
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";
import {
  getPersonalNotfication,
  setNotificationAllRead,
  setNotificationHasRead,
} from "../controllers/notification.controller.js";
export const notificationRoutes = express.Router();

notificationRoutes
  .route("/user/notification")
  .get([deserializeUser, requireUser], getPersonalNotfication);
notificationRoutes
  .route("/notification/:notificationId/read")
  .get([deserializeUser, requireUser], setNotificationHasRead);
notificationRoutes
  .route("/notification/read-all")
  .get([deserializeUser, requireUser], setNotificationAllRead);
