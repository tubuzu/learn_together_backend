import express from "express";
import {
  getAllUsersProfile,
  getUserById,
  getUserProfile,
  updateUserProfile,
} from "../controllers/user.controller.js";
import {
  deserializeAdmin,
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";
export const userRoutes = express.Router();

userRoutes
  .route("/user/profile")
  .get([deserializeUser, requireUser], getUserProfile);
userRoutes
  .route("/user/profile/:userId")
  .get([deserializeUser, requireUser], getUserById);
userRoutes
  .route("/user/profile")
  .patch([deserializeUser, requireUser], updateUserProfile);
userRoutes
  .route("/admin/user/profiles")
  .get([deserializeAdmin, requireUser], getAllUsersProfile);
