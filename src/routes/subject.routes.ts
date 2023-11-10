import express from "express";
import {
  createSubject,
  deleteSubject,
  getSubjectById,
  searchSubject,
  updateSubject,
} from "../controllers/subject.controller.js";
import {
  deserializeAdmin,
  requireUser,
} from "../middlewares/auth.middleware.js";
export const subjectRoutes = express.Router();

subjectRoutes.route("/subject").get(searchSubject);
subjectRoutes.route("/subject/:subjectId").get(getSubjectById);
subjectRoutes
  .route("/admin/subject")
  .post([deserializeAdmin, requireUser], createSubject);
subjectRoutes
  .route("/admin/subject/:subjectId")
  .patch([deserializeAdmin, requireUser], updateSubject);
subjectRoutes
  .route("/admin/subject/:subjectId")
  .delete([deserializeAdmin, requireUser], deleteSubject);
