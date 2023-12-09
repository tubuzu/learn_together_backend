import { CookieOptions } from "express";

export const UserType = {
  USER: "USER",
  STUDENT: "STUDENT",
  TUTOR: "TUTOR",
  ADMIN: "ADMIN",
};

export const RequestState = {
  WAITING: "WAITING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
};

export const NotificationCode = {
  CLASSROOM__NEW_MEMBER: "CLASSROOM__NEW_MEMBER",
  CLASSROOM__JOIN_REQUEST_REJECTED: "CLASSROOM__JOIN_REQUEST_REJECTED",
  CLASSROOM__JOIN_REQUEST_ACCEPTED: "CLASSROOM__JOIN_REQUEST_ACCEPTED",
  CLASSROOM__MEMBER_KICKED: "CLASSROOM__MEMBER_KICKED",
  CLASSROOM__TUTOR_UPDATED: "CLASSROOM__TUTOR_UPDATED",
  CLASSROOM__OWNER_UPDATED: "CLASSROOM__OWNER_UPDATED",
  CLASSROOM__CLASSROOM_TERMINATED: "CLASSROOM__CLASSROOM_TERMINATED",
  CLASSROOM__CLASSROOM_STARTED: "CLASSROOM__CLASSROOM_STARTED",
  CLASSROOM__CLASSROOM_FINISHED: "CLASSROOM__CLASSROOM_FINISHED",

  PROOF_OF_LEVEL__PROOF_OF_LEVEL_ACCEPTED: "PROOF_OF_LEVEL__PROOF_OF_LEVEL_ACCEPTED",
  PROOF_OF_LEVEL__PROOF_OF_LEVEL_REJECTED: "PROOF_OF_LEVEL__PROOF_OF_LEVEL_REJECTED",

  RECHARGE__RECHARGE_COIN_SUCCESS: "RECHARGE__RECHARGE_COIN_SUCCESS",
  DONATE__DONATE_COIN_SUCCESS: "DONATE__DONATE_COIN_SUCCESS",
  DONATE__RECEIVED_COIN: "DONATE__RECEIVED_COIN",
  WITHDRAW__WITHDRAW_REQUEST_SUBMITTED: "WITHDRAW__WITHDRAW_REQUEST_SUBMITTED",
  WITHDRAW__WITHDRAW_REQUEST_CANCELED: "WITHDRAW__WITHDRAW_REQUEST_CANCELED",
  WITHDRAW__WITHDRAW_REQUEST_ACCEPTED: "WITHDRAW__WITHDRAW_REQUEST_ACCEPTED",
  WITHDRAW__WITHDRAW_REQUEST_REJECTED: "WITHDRAW__WITHDRAW_REQUEST_REJECTED",
};

export const GenderType = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
};

export const ClassroomState = {
  WAITING: "WAITING",
  LEARNING: "LEARNING",
  FINISHED: "FINISHED",
};

export const ClassroomMemberRole = {
  OWNER: "OWNER",
  TUTOR: "TUTOR",
  STUDENT: "STUDENT",
};

export const ParticipantRole = {
  OWNER: "OWNER",
  ADMINISTRATOR: "ADMINISTRATOR",
  MEMBER: "MEMBER",
};

export const PaymentTransactionState = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
};

export const accessTokenCookieOptions: CookieOptions = {
  maxAge: 86400000, // 24 hours
  httpOnly: true,
  // domain: "learn-together-app.azurewebsites.net", // Đặt tên miền của server ở đây
  domain: "learn-together.onrender.com", // Đặt tên miền của server ở đây
  path: "/",
  sameSite: "lax", // Hoặc "strict" tùy theo yêu cầu
  secure: true, // Nếu bạn sử dụng HTTPS, hãy đặt true, nếu không, đặt false
  // domain: "localhost",
  // path: "/",
  // sameSite: "lax",
  // secure: false,
};

export const refreshTokenCookieOptions: CookieOptions = {
  ...accessTokenCookieOptions,
  maxAge: 3.154e10, // 1 year
};