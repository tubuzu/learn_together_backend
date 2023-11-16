import { Request, Response } from "express";
import { BadRequestError } from "../errors/bad-request.error.js";
import { StatusCodes } from "http-status-codes";
// import { TutorModel } from "../models/tutor.model.js";
import { AdminModel } from "../models/admin.model.js";
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "../utils/const.js";
import jwt, { Secret } from "jsonwebtoken";
import { sendEmail } from "../utils/emailSender.js";
import { UnauthenticatedError } from "../errors/unauthenticated.error.js";
import { signJwt, verifyJwt } from "../utils/jwt.utils.js";
import lodashPkg from "lodash";
import SessionModel from "../models/session.model.js";
import { createSession, updateSession } from "../service/session.service.js";
import { UserModel } from "../models/user.model.js";
import {
  getGoogleOAuthTokens,
  getGoogleUser,
} from "../service/user.service.js";
import { generatePassword } from "../utils/generate-password.js";

const { get } = lodashPkg;

/**
 * @description Register new user
 * @route POST /api/v1/register
 */
export const registerUser = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    throw new BadRequestError("Please Enter all the Fields");
  }

  const emailExists = await UserModel.findOne({ email });
  if (emailExists) {
    throw new BadRequestError("Email already exists");
  }

  const verificationToken = jwt.sign(
    { email: email },
    process.env.EMAIL_VERIFICATION_KEY as Secret,
    {
      expiresIn: "1d",
    }
  );

  const user = await UserModel.create({
    email,
    password,
    firstName,
    lastName,
    accountVerificationToken: verificationToken,
  });

  // send email with token link
  const to = email;
  const from = process.env.EMAIL_USER as string;
  const subject = "Email Verification Link";
  const body = `
            <p> Hello ${user.firstName} ${user.lastName},</p>
            <p>Please click on the link below to verify your account on Learn Together</p>
            <a href="${process.env.SERVER_ENDPOINT}/api/v1/verify-account/${verificationToken}">Verify Account</a>
            <p>Regards,</p>
            <p>Team Learn Together</p>
        `;
  await sendEmail(to, from, subject, body);

  // create student
  // const student = await StudentModel.create({
  //   user: user._id,
  // });
  // if (!student) {
  //   throw new BadRequestError("Something went wrong!");
  // }
  // // create student
  // const tutor = await TutorModel.create({
  //   user: user._id,
  // });
  // if (!tutor) {
  //   throw new BadRequestError("Something went wrong!");
  // }

  // user.student = student._id;
  // user.tutor = tutor._id;
  // await user.save();

  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "User has been registered successfully",
  });
};

/**
 * @description User login
 * @route POST /api/v1/login
 */
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email }).select(
    "+password +accountStatus"
  );

  if (!user || !(await user.matchPassword(password))) {
    throw new BadRequestError("Invalid Email or Password");
  }

  // check if account's email is verified
  if (!user.accountStatus) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: "Account not verified",
      data: {
        email: user.email,
        accountStatus: user.accountStatus,
      },
    });
  }

  const session = await createSession(user._id, req.get("user-agent") || "");

  const accessToken = user.createAccessToken(session._id);
  const refreshToken = user.createRefreshToken(session._id);

  // set cookies
  res.cookie("accessToken", accessToken, accessTokenCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  });
};

/**
 * @description User oauth login
 * @route POST /api/v1/oauth/google
 */
export const googleOauthHandler = async (req: Request, res: Response) => {
  // get the code from qs
  const code = req.query.code as string;

  let googleUser;

  try {
    // get the id and access token with the code
    const { id_token, access_token } = await getGoogleOAuthTokens({ code });

    // get user with tokens
    googleUser = await getGoogleUser({ id_token, access_token });

    if (!googleUser.verified_email) {
      return res.status(403).json({
        success: false,
        message: "Google account is not verified",
      });
    }
  } catch (error) {
    // log.error(error, "Failed to authorize Google user");
    return res.redirect(
      `${req.headers.origin || (req.headers.referer as string)}/oauth/error`
    );
  }

  let user = await UserModel.findOne({ email: googleUser.email }).select(
    "+accountStatus +accountVerificationToken"
  );
  if (!user) {
    user = await UserModel.create({
      email: googleUser.email,
      firstName: googleUser.given_name,
      lastName: googleUser.family_name,
      avatar: googleUser.picture,
      accountStatus: true,
    });
    // const student = await StudentModel.create({
    //   user: user._id,
    // });
    // if (!student) {
    //   throw new BadRequestError("Something went wrong!");
    // }
    // const tutor = await TutorModel.create({
    //   user: user._id,
    // });
    // if (!tutor) {
    //   throw new BadRequestError("Something went wrong!");
    // }
    // user.student = student._id;
    // user.tutor = tutor._id;
    // await user.save();
  } else {
    if (!user.accountStatus) {
      user.accountStatus = true;
      user.accountVerificationToken = "";
      await user.Save();
    }
  }

  // create a session
  const session = await createSession(user._id, req.get("user-agent") || "");

  // create an access token
  const accessToken = user.createAccessToken(session._id);

  // create a refresh token
  const refreshToken = user.createRefreshToken(session._id);

  // set cookies
  res.cookie("accessToken", accessToken, accessTokenCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  user.accountVerificationToken = undefined;
  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  });
};

/**
 * @description User oauth login
 * @route POST /api/v1/logout
 */
export const logoutUser = async (req: Request, res: Response) => {
  const cookies = req.cookies;
  if (!cookies?.accessToken && !cookies?.refreshToken) {
    throw new BadRequestError("Token not found");
  }
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  try {
    await updateSession({ _id: res.locals.userData.session }, { valid: false });
  } catch (err: any) {
    throw new BadRequestError(err.message);
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Sign out successfully!",
  });
};

/**
 * @description Verify account
 * @route POST /api/v1/verify-account
 */
export const verifyAccount = async (req: Request, res: Response) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new BadRequestError("Token not found");
  }

  //verify token
  const { decoded } = verifyJwt(
    verificationToken,
    process.env.EMAIL_VERIFICATION_KEY as Secret
  );

  if (!decoded) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  //find user with token and email
  const user = await UserModel.findOne({
    email: get(decoded, "email"),
    accountVerificationToken: verificationToken,
  });
  if (!user) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "User with this token was not found",
    });
  }

  try {
    // update user account status
    user.accountStatus = true;
    user.accountVerificationToken = "";
    await user.save();
    return res.status(StatusCodes.OK).json({
      success: false,
      message: "User successfully verified",
    });
  } catch (err) {
    console.error("Error updating user status:", err);
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Error occurred while updating user status",
    });
  }
};

/**
 * @description Resend verification email
 * @route POST /api/v1/resend-verification-email
 */
export const resendVerificationEmail = async (req: Request, res: Response) => {
  const { email } = req.body;

  // find user with email
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new BadRequestError("User not found");
  }

  if (user.accountStatus) {
    throw new BadRequestError("This email has already been verified!");
  }

  //generate token
  const verificationToken = jwt.sign(
    { email: email },
    process.env.EMAIL_VERIFICATION_KEY as Secret,
    {
      expiresIn: "1d",
    }
  );

  // update the token in db
  user.accountVerificationToken = verificationToken;
  await user.save();

  // send email with token code
  const to = email;
  const from = process.env.EMAIL_USER as string;
  const subject = "Email Verification Link";
  const body = `
        <p> Hello ${user.firstName} ${user.lastName},</p>
        <p>Please click on the link below to verify your account on Learn Together</p>
        <a href="${process.env.SERVER_ENDPOINT}/api/v1/verify-account/${verificationToken}">Verify Account</a>
        <p>Regards,</p>
        <p>Team Learn Together</p>
        `;

  // send email with token link
  await sendEmail(to, from, subject, body);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Token reset and sent successfully",
  });
};

/**
 * @description Refresh user
 * @route GET /api/v1/refresh-user
 */
export const refreshUser = async (req: Request, res: Response) => {
  const cookie = req.cookies;

  if (!cookie?.refreshToken) {
    throw new UnauthenticatedError("Refresh token not found");
  }

  const refreshToken = cookie.refreshToken;

  const { decoded } = verifyJwt(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET as Secret
  );

  if (!decoded || !get(decoded, "session")) {
    throw new UnauthenticatedError("Invalid refresh token");
  }

  const session = await SessionModel.findById(get(decoded, "session"));
  if (!session || !session.valid) {
    throw new UnauthenticatedError("Session expired!");
  }

  const user = await UserModel.findOne({ _id: get(decoded, "user") });

  if (!user) {
    throw new UnauthenticatedError("User not found");
  }
  const accessToken = user.createAccessToken(session._id);
  res.cookie("accessToken", accessToken, accessTokenCookieOptions);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Access token refresh successfully",
    data: {
      accessToken: accessToken,
    },
  });
};

/**
 * @description Forgot password
 * @route POST /api/v1/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await UserModel.findOne({ email }); //check if user exists
  if (!user) {
    throw new BadRequestError("User with this email was not found");
  }

  //generate token
  const token = signJwt(
    { user: user._id },
    process.env.RESET_PASSWORD_SECRET as Secret,
    { expiresIn: "5m" }
  );

  // send email with token
  const to = email;
  const from = process.env.EMAIL_USER as string;
  const subject = "Reset Account Password Link";
  const body = `
    <h3>Please click the link below to reset your password</h3>
    <a href="${process.env.SERVER_ENDPOINT}/api/v1/reset-password/${token}">Reset Password</a>`;

  //update the user and add the token
  user.passwordResetToken = token;
  user.save(async (err: any, result: any) => {
    if (err) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Error occurred while saving the token in database",
      });
    } else {
      //if no error
      //send email
      await sendEmail(to, from, subject, body);
      return res.status(StatusCodes.OK).json({
        success: true,
        message: `Token has been sent to ${email}`,
      });
    }
  });
};

/**
 * @description Reset Password
 * @route GET /api/v1/reset-password
 */
export const resetPassword = async (req: Request, res: Response) => {
  const { resetToken } = req.params;
  if (!resetToken) {
    throw new BadRequestError("Token not found");
  }

  const { decoded } = verifyJwt(
    resetToken,
    process.env.RESET_PASSWORD_SECRET as Secret
  );

  if (!decoded) {
    throw new UnauthenticatedError("Invalid or expired token");
  }

  //find user with token
  const user = await UserModel.findOne({ passwordResetToken: resetToken });
  if (!user) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "User with this token was not found",
    });
  }

  //update password
  const newPassword = generatePassword(8);
  user.password = newPassword;
  user.passwordResetToken = "";

  // send email with token
  const to = user.email;
  const from = process.env.EMAIL_USER as string;
  const subject = "Account Password Reset Successfully";
  const body = `
    <h3>Here's your new password: <b>${newPassword}</b></h3>`;

  user.save(async (err: any, result: any) => {
    if (err) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Error occurred while resetting password",
      });
    } else {
      await sendEmail(to, from, subject, body);
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Password successfully changed",
      });
    }
  });
};

/**
 * @description Change Password
 * @route POST /api/v1/change-password
 */
export const changeUserPassword = async (req: Request, res: Response) => {
  const { newPassword, passwordRepeated } = req.body;
  if (!newPassword || !passwordRepeated) {
    throw new BadRequestError("Password is required");
  }

  if (newPassword !== passwordRepeated) {
    throw new BadRequestError("Passwords do not match");
  }

  //find user with token
  const user = await UserModel.findById(res.locals.userData.user);
  if (!user) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "User with this token was not found",
    });
  }

  //update password
  user.password = newPassword;
  user.passwordResetToken = "";
  user.save((err: any, result: any) => {
    if (err) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Error occurred while resetting password",
      });
    } else {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Password successfully changed",
      });
    }
  });
};

// ADMIN

/**
 * @description Admin login
 * @route POST /api/v1/admin/login
 */
export const loginAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const admin = await AdminModel.findOne({ email }).select("+password");

  if (!admin || !(await admin.matchPassword(password))) {
    throw new BadRequestError("Invalid Email or Password");
  }

  const session = await createSession(admin._id, req.get("user-agent") || "");

  const accessToken = admin.createAccessToken(session._id);
  const refreshToken = admin.createRefreshToken(session._id);

  // set cookies
  res.cookie("accessToken", accessToken, accessTokenCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  });
};

export const refreshAdmin = async (req: Request, res: Response) => {
  const cookie = req.cookies;

  if (!cookie?.refreshToken) {
    throw new UnauthenticatedError("Refresh token not found");
  }

  const refreshToken = cookie.refreshToken;

  const { decoded } = verifyJwt(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET as Secret
  );

  if (!decoded || !get(decoded, "session")) {
    throw new UnauthenticatedError("Invalid refresh token");
  }

  const session = await SessionModel.findById(get(decoded, "session"));
  if (!session || !session.valid) {
    throw new UnauthenticatedError("Session expired!");
  }

  const user = await AdminModel.findOne({ _id: get(decoded, "user") });

  if (!user) {
    throw new UnauthenticatedError("User not found");
  }
  const accessToken = user.createAccessToken(session._id);
  res.cookie("accessToken", accessToken, accessTokenCookieOptions);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Access token refresh successfully",
  });
};
