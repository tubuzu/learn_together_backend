import express from "express";
import {
  deserializeAdmin,
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";
import {
  acceptWithdrawOrder,
  cancelWithdrawOrder,
  createWithdrawOrder,
  rejectWithdrawOrder,
  searchWithdrawOrder,
} from "src/controllers/withdraw.controller.js";
export const withdrawRoutes = express.Router();

withdrawRoutes
  .route("/withdraw/search")
  .get([deserializeUser, requireUser], searchWithdrawOrder);
withdrawRoutes
  .route("/withdraw/create")
  .post([deserializeUser, requireUser], createWithdrawOrder);
withdrawRoutes
  .route("/withdraw/cancel")
  .post([deserializeUser, requireUser], cancelWithdrawOrder);

withdrawRoutes
  .route("/withdraw/accept")
  .post([deserializeAdmin, requireUser], acceptWithdrawOrder);
withdrawRoutes
  .route("/withdraw/reject")
  .post([deserializeAdmin, requireUser], rejectWithdrawOrder);
