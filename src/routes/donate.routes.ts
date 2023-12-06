import express from "express";
import {
  deserializeAdmin,
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";
import {
  createDonateOrderAndSendOTP,
  comfirmOTPAndDonate,
  resendDonationOTP,
  searchDonateOrder,
  searchUserDonateOrder,
} from "../controllers/donate.controller.js";

export const donateRoutes = express.Router();

donateRoutes
  .route("/user/donate/search")
  .get([deserializeUser, requireUser], searchUserDonateOrder);
donateRoutes
  .route("/donate/create")
  .post([deserializeUser, requireUser], createDonateOrderAndSendOTP);
donateRoutes
  .route("/donate/confirm")
  .post([deserializeUser, requireUser], comfirmOTPAndDonate);
donateRoutes
  .route("/donate/:donateOrderId/resend_otp")
  .get([deserializeUser, requireUser], resendDonationOTP);

donateRoutes
  .route("/donate/search")
  .get([deserializeAdmin, requireUser], searchDonateOrder);
