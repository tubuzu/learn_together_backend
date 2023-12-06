import express from "express";
import {
  deserializeAdmin,
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";
import {
  createPaymentUrl,
  searchRechargeOrder,
  searchUserRechargeOrder,
  vnpUrlIpn,
  vnpUrlReturn,
} from "../controllers/recharge.controller.js";
export const rechargeRoutes = express.Router();

rechargeRoutes
  .route("/user/recharge/search")
  .get([deserializeUser, requireUser], searchUserRechargeOrder);
rechargeRoutes
  .route("/recharge/vnpay/create_order_url")
  .post([deserializeUser, requireUser], createPaymentUrl);
rechargeRoutes.route("/recharge/vnpay/vnp_ipn").get(vnpUrlIpn);
rechargeRoutes.route("/recharge/vnpay/vnp_return").get(vnpUrlReturn);

rechargeRoutes
  .route("/recharge/search")
  .get([deserializeAdmin, requireUser], searchRechargeOrder);
