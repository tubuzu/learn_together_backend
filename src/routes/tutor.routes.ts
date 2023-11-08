import express from "express";
import { searchTutor } from "../controllers/tutor.controller.js";
import {
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";

export const tutorRoutes = express.Router();

tutorRoutes.route("/tutor").get(searchTutor);
