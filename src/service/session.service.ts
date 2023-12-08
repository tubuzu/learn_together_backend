import { Secret } from "jsonwebtoken";
import lodashPkg from "lodash";
import { FilterQuery, UpdateQuery } from "mongoose";
import SessionModel, { SessionDocument } from "../models/session.model.js";
import { verifyJwt } from "../utils/jwt.utils.js";
import { UserModel } from "../models/user.model.js";
import { AdminModel } from "../models/admin.model.js";
import { appSettings } from "../settings/app.setting.js";

const { get } = lodashPkg;

export async function createSession(userId: string, userAgent: string) {
  const session = await SessionModel.create({ user: userId, userAgent });

  return session.toJSON();
}

export async function findSessions(query: FilterQuery<SessionDocument>) {
  return SessionModel.find(query).lean();
}

export async function updateSession(
  query: FilterQuery<SessionDocument>,
  update: UpdateQuery<SessionDocument>
) {
  return SessionModel.updateOne(query, update);
}

export async function reIssueUserAccessToken({
  refreshToken,
}: {
  refreshToken: string;
}) {
  const { decoded } = verifyJwt(
    refreshToken,
    appSettings.REFRESH_TOKEN_SECRET as Secret
  );

  if (!decoded || !get(decoded, "session")) return false;

  const session = await SessionModel.findById(get(decoded, "session"));

  if (!session || !session.valid) return false;

  const user = await UserModel.findById(session.user);

  if (!user) return false;

  const accessToken = user.createAccessToken(session._id);

  return accessToken;
}

export async function reIssueAdminAccessToken({
  refreshToken,
}: {
  refreshToken: string;
}) {
  const { decoded } = verifyJwt(
    refreshToken,
    appSettings.REFRESH_TOKEN_SECRET as Secret
  );

  if (!decoded || !get(decoded, "session")) return false;

  const session = await SessionModel.findById(get(decoded, "session"));

  if (!session || !session.valid) return false;

  const user = await AdminModel.findById(session.user);

  if (!user) return false;

  const accessToken = user.createRefreshToken();

  return accessToken;
}
