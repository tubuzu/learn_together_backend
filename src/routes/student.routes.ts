import express from "express";
import {
  searchStudent,
  updateStudentProfile,
} from "../controllers/student.controller.js";
import {
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";
// import { registerUser, authUser, searchUser, authJWT, updateProfile, updateStatusMessage, getUserProfile, changePassword } from "../controllers/student.controller.js";

export const studentRoutes = express.Router();

studentRoutes.route("/student").get(searchStudent);
studentRoutes
  .route("/student/profile")
  .patch([deserializeUser, requireUser], updateStudentProfile);
