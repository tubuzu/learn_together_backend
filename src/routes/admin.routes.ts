import express from "express";
import {
  deserializeAdmin,
  requireUser,
} from "../middlewares/auth.middleware.js";

export const adminRoutes = express.Router();


