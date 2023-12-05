import express from "express";
import {
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";
import {
  createPaymentUrl,
  vnpUrlIpn,
  vnpUrlReturn,
} from "../controllers/recharge.controller.js";
export const rechargeRoutes = express.Router();

rechargeRoutes
  .route("/create_payment_url")
  .post([deserializeUser, requireUser], createPaymentUrl);
rechargeRoutes.route("/vnp_ipn").get(vnpUrlIpn);
rechargeRoutes.route("/vnp_return").get(vnpUrlReturn);
