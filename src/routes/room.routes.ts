import express from "express";
import {
  createRoom,
  deleteRoom,
  searchRoom,
  updateRoom,
} from "../controllers/room.controller.js";
import {
  deserializeAdmin,
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";

export const roomRoutes = express.Router();

// Setting up multer as a middleware to grab photo uploads

roomRoutes.get("/room", [deserializeUser, requireUser], searchRoom);
roomRoutes.get("/admin/room", [deserializeAdmin, requireUser], searchRoom);
roomRoutes.post("/room", [deserializeUser, requireUser], createRoom);
roomRoutes.patch("/room/:roomId", [deserializeUser, requireUser], updateRoom);
roomRoutes.patch("/admin/room/:roomId", [deserializeAdmin, requireUser], updateRoom);
roomRoutes.delete("/room/:roomId", [deserializeUser, requireUser], deleteRoom);
roomRoutes.delete(
  "/admin/room/:roomId",
  [deserializeAdmin, requireUser],
  deleteRoom
);
