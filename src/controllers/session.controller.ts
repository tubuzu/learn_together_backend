import { Request, Response } from "express";
import {
  createSession,
  findSessions,
  updateSession,
} from "../service/session.service.js";
import { validateUserPassword } from "../service/user.service.js";
import { validateAdminPassword } from "../service/admin.service.js";
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "../utils/const.js";
import { StatusCodes } from "http-status-codes";

//USER
export async function createUserSessionHandler(req: Request, res: Response) {
  // Validate the user's password
  const user = await validateUserPassword(req.body);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  // create a session
  const session = await createSession(user._id, req.get("user-agent") || "");

  // create an access token
  const accessToken = user.createAccessToken(session._id);
  const refreshToken = user.createRefreshToken(session._id);

  // set cookies
  res.cookie("accessToken", accessToken, accessTokenCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: { accessToken, refreshToken },
  });
}

export async function getUserSessionsHandler(req: Request, res: Response) {
  const userId = res.locals.userData.user;

  const sessions = await findSessions({ user: userId, valid: true });

  return res.status(StatusCodes.OK).json({
    success: true,
    data: { sessions },
  });
}

export async function deleteUserSessionHandler(req: Request, res: Response) {
  const sessionId = res.locals.userData.session;

  await updateSession({ _id: sessionId }, { valid: false });

  return res.status(StatusCodes.OK);
}

//ADMIN
export async function createAdminSessionHandler(req: Request, res: Response) {
  // Validate the user's password
  const admin = await validateAdminPassword(req.body);

  if (!admin) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  // create a session
  const session = await createSession(admin._id, req.get("user-agent") || "");

  // create an access token
  const accessToken = admin.createAccessToken(session._id);
  const refreshToken = admin.createRefreshToken(session._id);

  // set cookies
  res.cookie("accessToken", accessToken, accessTokenCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: { accessToken, refreshToken },
  });
}
