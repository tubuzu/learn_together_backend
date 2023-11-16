import express from "express";
import {
  AcceptJoinRequest,
  GetAllJoinRequest,
  RejectJoinRequest,
  createClassroom,
  deleteClassroom,
  endClassroom,
  getClassroomById,
  getMyClassRoom,
  joinAPrivateClassRoom,
  joinAPublicClassRoom,
  searchClassroom,
  searchClassroomOnMap,
  updateClassroom,
} from "../controllers/classroom.controller.js";
import {
  deserializeAdmin,
  deserializeUser,
  requireUser,
} from "../middlewares/auth.middleware.js";

export const classroomRoutes = express.Router();

//search
classroomRoutes.get(
  "/classroom/search",
  // [deserializeUser, requireUser],
  searchClassroom
);
classroomRoutes.get(
  "/classroom/map/search",
  // [deserializeUser, requireUser],
  searchClassroomOnMap
);

//get
classroomRoutes.get(
  "/classroom/:classroomId",
  // [deserializeUser, requireUser],
  getClassroomById
);
classroomRoutes.get(
  "/user/classroom",
  [deserializeUser, requireUser],
  getMyClassRoom
);

//create, update, end classroom
classroomRoutes.post(
  "/classroom/create",
  [deserializeUser, requireUser],
  createClassroom
);
classroomRoutes.patch(
  "/classroom/update/:classroomId",
  [deserializeUser, requireUser],
  updateClassroom
);
classroomRoutes.patch(
  "/classroom/end/:classroomId",
  [deserializeUser, requireUser],
  endClassroom
);

//join, leave, kick
classroomRoutes.get(
  "/classroom/join/public/:classroomId",
  [deserializeUser, requireUser],
  joinAPublicClassRoom
);
classroomRoutes.post(
  "/classroom/join/private/:classroomId",
  [deserializeUser, requireUser],
  joinAPrivateClassRoom
);

//get all requests, accept, reject
classroomRoutes.get(
  "/classroom/request/all",
  [deserializeUser, requireUser],
  GetAllJoinRequest
);
classroomRoutes.patch(
  "/classroom/accept/request/:requestId",
  [deserializeUser, requireUser],
  AcceptJoinRequest
);
classroomRoutes.patch(
  "/classroom/reject/request/:requestId",
  [deserializeUser, requireUser],
  RejectJoinRequest
);

//admin
classroomRoutes.delete(
  "/admin/classroom/delete/:classroomId",
  [deserializeAdmin, requireUser],
  deleteClassroom
);
