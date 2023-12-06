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
  searchUserWithdrawOrder,
  searchWithdrawOrder,
} from "../controllers/withdraw.controller.js";
export const withdrawRoutes = express.Router();

withdrawRoutes
  .route("/user/withdraw/search")
  .get([deserializeUser, requireUser], searchUserWithdrawOrder);
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
withdrawRoutes
  .route("/withdraw/search")
  .get([deserializeAdmin, requireUser], searchWithdrawOrder);
