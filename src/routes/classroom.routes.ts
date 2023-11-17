import express from "express";
import {
  acceptJoinRequest,
  getAllJoinRequestByClassroomId,
  kickUser,
  leaveClassroom,
  rejectJoinRequest,
  createClassroom,
  deleteClassroom,
  endClassroom,
  getClassroomById,
  getUserCurrentClassrooms,
  joinAPrivateClassRoom,
  joinAPublicClassRoom,
  searchClassroom,
  searchClassroomOnMap,
  updateClassroom,
  getUserClassroomHistory,
  updateClassroomTutor,
  updateClassroomOwner,
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
  "/user/classroom/current",
  [deserializeUser, requireUser],
  getUserCurrentClassrooms
);
classroomRoutes.get(
  "/user/classroom/history",
  [deserializeUser, requireUser],
  getUserClassroomHistory
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

//join (public/private), leave, kick
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
classroomRoutes.patch(
  "/classroom/:classroomId/leave",
  [deserializeUser, requireUser],
  leaveClassroom
);
classroomRoutes.patch(
  "/classroom/:classroomId/kick/:userId",
  [deserializeUser, requireUser],
  kickUser
);

//get all requests, accept, reject
classroomRoutes.get(
  "/classroom/:classroomId/request/all",
  [deserializeUser, requireUser],
  getAllJoinRequestByClassroomId
);
classroomRoutes.patch(
  "/classroom/accept/request/:requestId",
  [deserializeUser, requireUser],
  acceptJoinRequest
);
classroomRoutes.patch(
  "/classroom/reject/request/:requestId",
  [deserializeUser, requireUser],
  rejectJoinRequest
);

//update owner, update tutor
classroomRoutes.patch(
  "/classroom/:classroomId/update-tutor/:userId",
  [deserializeUser, requireUser],
  updateClassroomTutor
);
classroomRoutes.patch(
  "/classroom/:classroomId/update-owner/:userId",
  [deserializeUser, requireUser],
  updateClassroomOwner
);

//admin
classroomRoutes.delete(
  "/admin/classroom/delete/:classroomId",
  [deserializeAdmin, requireUser],
  deleteClassroom
);
