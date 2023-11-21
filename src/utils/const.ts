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

export const NotificationType = {
  GENERAL: "GENERAL",
  IMPORTANT: "IMPORTANT",
  WARNING: "WARNING",
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
}

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

export const accessTokenCookieOptions: CookieOptions = {
  maxAge: 86400000, // 24 hours
  httpOnly: true,
  // domain: "learn-together-app.azurewebsites.net", // Đặt tên miền của server ở đây
  // path: "/",
  // sameSite: "lax", // Hoặc "strict" tùy theo yêu cầu
  // secure: true, // Nếu bạn sử dụng HTTPS, hãy đặt true, nếu không, đặt false
  domain: "localhost",
  path: "/",
  sameSite: "lax",
  secure: false,
};

export const refreshTokenCookieOptions: CookieOptions = {
  ...accessTokenCookieOptions,
  maxAge: 3.154e10, // 1 year
};
