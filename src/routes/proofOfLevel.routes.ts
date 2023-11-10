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
  getProofOfLevelById,
  getUserProofOfLevelById,
  getAllUserProofOfLevelRequest,
  getAllUserProofOfLevel,
  rejectProofOfLevelRequest,
  sendProofOfLevelRequest,
  getUserProofOfLevelRequestById,
  getProofOfLevelRequestById,
} from "../controllers/proofOfLevel.controller.js";

export const proofOfLevelRoutes = express.Router();

//User
proofOfLevelRoutes
  .route("/proof-of-level")
  .get([deserializeUser, requireUser], getAllUserProofOfLevel);
proofOfLevelRoutes
  .route("/proof-of-level/:proofId")
  .get([deserializeUser, requireUser], getUserProofOfLevelById);
proofOfLevelRoutes
  .route("/request/proof-of-level")
  .get([deserializeUser, requireUser], getAllUserProofOfLevelRequest);
proofOfLevelRoutes
  .route("/request/proof-of-level/:requestId")
  .get([deserializeUser, requireUser], getUserProofOfLevelRequestById);
proofOfLevelRoutes
  .route("/request/proof-of-level")
  .post([deserializeUser, requireUser], sendProofOfLevelRequest);

//Admin
proofOfLevelRoutes
  .route("/admin/proof-of-level/:proofId")
  .get([deserializeAdmin, requireUser], getProofOfLevelById);
proofOfLevelRoutes
  .route("/admin/proof-of-level")
  .delete([deserializeAdmin, requireUser], deleteProofOfLevel);
proofOfLevelRoutes
  .route("/admin/request/proof-of-level")
  .get([deserializeAdmin, requireUser], getAllProofOfLevelRequest);
proofOfLevelRoutes
  .route("/admin/request/proof-of-level/:requestId")
  .get([deserializeAdmin, requireUser], getProofOfLevelRequestById);
proofOfLevelRoutes
  .route("/admin/request/proof-of-level/accept")
  .patch([deserializeAdmin, requireUser], acceptProofOfLevelRequest);
proofOfLevelRoutes
  .route("/admin/request/proof-of-level/reject")
  .patch([deserializeAdmin, requireUser], rejectProofOfLevelRequest);
