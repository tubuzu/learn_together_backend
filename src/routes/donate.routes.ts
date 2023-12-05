import express from "express";
import {
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";
import { createDonateOrderAndSendOTP, comfirmOTPAndDonate, resendDonationOTP, searchDonateOrder } from "../controllers/donate.controller.js";

export const donateRoutes = express.Router();

donateRoutes
  .route("/donate/search")
  .get([deserializeUser, requireUser], searchDonateOrder);
donateRoutes
  .route("/donate/create")
  .post([deserializeUser, requireUser], createDonateOrderAndSendOTP);
donateRoutes
  .route("/donate/confirm")
  .post([deserializeUser, requireUser], comfirmOTPAndDonate);
donateRoutes
  .route("/donate/:donateOrderId/resend_otp")
  .get([deserializeUser, requireUser], resendDonationOTP);
