import express from "express";
import {
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";
import {
  deleteClassroomMessageById,
  getMessagesByClassroomId,
  sendClassroomMessage,
  updateClassroomMessageById,
} from "../controllers/classroomMessage.controller.js";
export const classroomMessageRoutes = express.Router();

classroomMessageRoutes
  .route("/classroom/:classroomId/messages")
  .get([deserializeUser, requireUser], getMessagesByClassroomId);
classroomMessageRoutes
  .route("/classroom/messages/send")
  .post([deserializeUser, requireUser], sendClassroomMessage);
classroomMessageRoutes
  .route("/classroom/:classroomId/messages/:messageId")
  .patch([deserializeUser, requireUser], updateClassroomMessageById);
classroomMessageRoutes
  .route("/classroom/:classroomId/messages/:messageId")
  .delete([deserializeUser, requireUser], deleteClassroomMessageById);
