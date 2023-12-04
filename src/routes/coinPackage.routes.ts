import express from "express";
import {
  deserializeAdmin,
  requireUser,
} from "../middlewares/auth.middleware.js";
import {
  createCoinPackage,
  getAllCoinPackage,
  updateCoinPackage,
} from "../controllers/coinPackage.controller.js";
export const coinPackageRoutes = express.Router();

coinPackageRoutes.route("/coin_package/all").get(getAllCoinPackage);
coinPackageRoutes
  .route("/coin_package/create")
  .post([deserializeAdmin, requireUser], createCoinPackage);
coinPackageRoutes
  .route("/coin_package/update/:packageId")
  .patch([deserializeAdmin, requireUser], updateCoinPackage);
