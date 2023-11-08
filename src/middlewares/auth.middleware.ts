import lodashPkg from "lodash";
import { Secret } from "jsonwebtoken";
import { Response, NextFunction, Request } from "express";
import { UnauthenticatedError } from "../errors/index.js";
import { verifyJwt } from "../utils/jwt.utils.js";
import {
  reIssueAdminAccessToken,
  reIssueUserAccessToken,
} from "../service/session.service.js";
import { UserType, accessTokenCookieOptions } from "../utils/const.js";

const { get } = lodashPkg;

export const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken =
    get(req, "cookies.accessToken") ||
    get(req, "headers.authorization", "").replace(/^Bearer\s/, "");

  const refreshToken =
    get(req, "cookies.refreshToken") || get(req, "headers.x-refresh");

  if (!accessToken) {
    throw new UnauthenticatedError("Not authorized");
  }

  //decodes token id
  const { decoded, expired } = verifyJwt(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET as Secret
  );

  if (decoded && get(decoded, "userType") == UserType.USER) {
    res.locals.userData = decoded;
    return next();
  }

  if (expired && refreshToken) {
    const newAccessToken = await reIssueUserAccessToken({ refreshToken });

    if (newAccessToken) {
      // res.setHeader("x-access-token", newAccessToken);
      res.cookie("accessToken", newAccessToken, accessTokenCookieOptions);
    } else {
      throw new UnauthenticatedError("Refresh Token is not valid");
    }

    const result = verifyJwt(
      newAccessToken as string,
      process.env.ACESS_TOKEN_SECRET as Secret
    );

    res.locals.userData = result.decoded;
    return next();
  }

  throw new UnauthenticatedError("Refresh Token is not valid");
};

export const deserializeAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken =
    get(req, "cookies.accessToken") ||
    get(req, "headers.authorization", "").replace(/^Bearer\s/, "");

  const refreshToken =
    get(req, "cookies.refreshToken") || get(req, "headers.x-refresh");

  if (!accessToken) {
    throw new UnauthenticatedError("Not authorized");
  }

  //decodes token id
  const { decoded, expired } = verifyJwt(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET as Secret
  );

  if (decoded && get(decoded, "userType") == UserType.ADMIN) {
    res.locals.userData = decoded;
    return next();
  }

  if (expired && refreshToken) {
    const newAccessToken = await reIssueAdminAccessToken({ refreshToken });

    if (newAccessToken) {
      res.cookie("accessToken", newAccessToken, accessTokenCookieOptions);
    } else {
      throw new UnauthenticatedError("Refresh Token is not valid");
    }

    const result = verifyJwt(
      newAccessToken as string,
      process.env.ACESS_TOKEN_SECRET as Secret
    );

    res.locals.userData = result.decoded;
    return next();
  }

  throw new UnauthenticatedError("Refresh Token is not valid");
};

export const requireUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = res.locals.userData;

  if (!user) {
    return res.sendStatus(403);
  }

  return next();
};
