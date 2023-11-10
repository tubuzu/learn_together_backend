import express from "express";
import {
  deserializeAdmin,
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";
import {
  acceptProofOfLevelRequest,
  deleteProofOfLevel,
  getAllProofOfLevelRequest,
  getUserProofOfLevelRequests,
  getUserProofsOfLevel,
  rejectProofOfLevelRequest,
  sendProofOfLevelRequest,
} from "../controllers/proofOfLevel.controller.js";

export const proofOfLevelRoutes = express.Router();

//User
proofOfLevelRoutes
  .route("/proof-of-level")
  .get([deserializeUser, requireUser], getUserProofsOfLevel);
proofOfLevelRoutes
  .route("/proof-of-level/request")
  .get([deserializeUser, requireUser], getUserProofOfLevelRequests);
proofOfLevelRoutes
  .route("/proof-of-level/request")
  .post([deserializeUser, requireUser], sendProofOfLevelRequest);

//Admin
proofOfLevelRoutes
  .route("/admin/proof-of-level")
  .get([deserializeAdmin, requireUser], getAllProofOfLevelRequest);
proofOfLevelRoutes
  .route("/admin/proof-of-level/request/accept")
  .patch([deserializeAdmin, requireUser], acceptProofOfLevelRequest);
proofOfLevelRoutes
  .route("/admin/proof-of-level/request/reject")
  .patch([deserializeAdmin, requireUser], rejectProofOfLevelRequest);
proofOfLevelRoutes
  .route("/admin/proof-of-level/delete")
  .delete([deserializeAdmin, requireUser], deleteProofOfLevel);
