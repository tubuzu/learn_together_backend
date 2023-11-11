import express from "express";
import {
  deserializeAdmin,
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";
import {
  acceptProofOfLevelRequest,
  getAllProofOfLevelRequest,
  getAllProofOfLevelRequestByUserId,
  getAllUserProofOfLevelRequest,
  getProofOfLevelRequestById,
  getUserProofOfLevelRequestById,
  rejectProofOfLevelRequest,
  sendProofOfLevelRequest,
} from "../controllers/proofOfLevel.request.controller.js";

export const proofOfLevelRequestRoutes = express.Router();

//user
proofOfLevelRequestRoutes
  .route("/request/proof-of-level")
  .get([deserializeUser, requireUser], getAllUserProofOfLevelRequest);
proofOfLevelRequestRoutes
  .route("/request/proof-of-level/:requestId")
  .get([deserializeUser, requireUser], getUserProofOfLevelRequestById);
proofOfLevelRequestRoutes
  .route("/request/proof-of-level")
  .post([deserializeUser, requireUser], sendProofOfLevelRequest);

//admin
proofOfLevelRequestRoutes
  .route("/admin/request/proof-of-level")
  .get([deserializeAdmin, requireUser], getAllProofOfLevelRequest);
proofOfLevelRequestRoutes
  .route("/admin/request/proof-of-level/:requestId")
  .get([deserializeAdmin, requireUser], getProofOfLevelRequestById);
proofOfLevelRequestRoutes
  .route("/admin/request/user/proof-of-level")
  .get([deserializeAdmin, requireUser], getAllProofOfLevelRequestByUserId);
proofOfLevelRequestRoutes
  .route("/admin/request/proof-of-level/accept")
  .patch([deserializeAdmin, requireUser], acceptProofOfLevelRequest);
proofOfLevelRequestRoutes
  .route("/admin/request/proof-of-level/reject")
  .patch([deserializeAdmin, requireUser], rejectProofOfLevelRequest);
