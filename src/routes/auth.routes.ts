import express from "express";
import {
  changeUserPassword,
  forgotPassword,
  googleOauthHandler,
  loginAdmin,
  loginUser,
  logoutUser,
  refreshAdmin,
  refreshUser,
  registerUser,
  resendVerificationEmail,
  resetPassword,
  verifyAccount,
} from "../controllers/auth.controller.js";
import {
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";

export const authRoutes = express.Router();

// USER
authRoutes.route("/register").post(registerUser);
authRoutes.post("/login", loginUser);
authRoutes.get("/verify-account/:verificationToken", verifyAccount);
authRoutes.get("/refresh-user", refreshUser);
authRoutes.get("/oauth/google", googleOauthHandler);
authRoutes.get("/logout", [deserializeUser, requireUser], logoutUser);
authRoutes.post("/resend-verification-email", resendVerificationEmail);

authRoutes.post("/forgot-password", forgotPassword);
authRoutes.get("/reset-password/:resetToken", resetPassword);

authRoutes.post(
  "/change-password",
  [deserializeUser, requireUser],
  changeUserPassword
);

//ADMIN
authRoutes.post("/admin/login", loginAdmin);
authRoutes.get("/admin/refresh-user", refreshAdmin);
