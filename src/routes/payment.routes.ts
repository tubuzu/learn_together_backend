import express from "express";
import {
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";
import {
  createPaymentUrl,
  vnpUrlIpn,
  vnpUrlReturn,
} from "../controllers/payment.controller.js";
export const paymentRoutes = express.Router();

paymentRoutes
  .route("/create_payment_url")
  .post([deserializeUser, requireUser], createPaymentUrl);
paymentRoutes.route("vnp_ipn").get(vnpUrlIpn);
paymentRoutes.route("vnp_return").get(vnpUrlReturn);
