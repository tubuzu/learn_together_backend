import express from "express";
import { createAdminSessionHandler, createUserSessionHandler, deleteUserSessionHandler, getUserSessionsHandler } from "../controllers/session.controller.js";
import { deserializeAdmin, deserializeUser, requireUser } from "../middlewares/auth.middleware.js";

export const sessionRoutes = express.Router();

sessionRoutes.get("/session/", [deserializeUser, requireUser], getUserSessionsHandler);
sessionRoutes.get("/admin/session", [deserializeAdmin, requireUser], getUserSessionsHandler);
sessionRoutes.post("/session/", createUserSessionHandler);
sessionRoutes.post("/admin/session", createAdminSessionHandler);
sessionRoutes.delete("/session/", [deserializeUser, requireUser], deleteUserSessionHandler);
sessionRoutes.delete("/admin/session", [deserializeAdmin, requireUser], deleteUserSessionHandler);
