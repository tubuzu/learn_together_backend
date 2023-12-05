import express from "express";
import {
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";
import {
  createPaymentUrl,
  searchRechargeOrder,
  vnpUrlIpn,
  vnpUrlReturn,
} from "../controllers/recharge.controller.js";
export const rechargeRoutes = express.Router();

rechargeRoutes
  .route("/recharge/search")
  .get([deserializeUser, requireUser], searchRechargeOrder);
rechargeRoutes
  .route("/recharge/vnpay/create_order_url")
  .post([deserializeUser, requireUser], createPaymentUrl);
rechargeRoutes.route("/recharge/vnpay/vnp_ipn").get(vnpUrlIpn);
rechargeRoutes.route("/recharge/vnpay/vnp_return").get(vnpUrlReturn);
