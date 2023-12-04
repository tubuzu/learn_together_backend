import express from "express";
import {
  deserializeAdmin,
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";
import {
  // deleteProofOfLevel,
  getProofOfLevelById,
  getAllUserProofOfLevel,
  getAllProofOfLevelByUserId,
} from "../controllers/proofOfLevel.controller.js";

export const proofOfLevelRoutes = express.Router();

//User
proofOfLevelRoutes
  .route("/proof-of-level")
  .get([deserializeUser, requireUser], getAllUserProofOfLevel);
proofOfLevelRoutes
  .route("/proof-of-level/:proofId")
  .get(getProofOfLevelById);
proofOfLevelRoutes
  .route("/user/proof-of-level")
  .get(getAllProofOfLevelByUserId);

// //Admin
// proofOfLevelRoutes
//   .route("/admin/proof-of-level")
//   .delete([deserializeAdmin, requireUser], deleteProofOfLevel);

