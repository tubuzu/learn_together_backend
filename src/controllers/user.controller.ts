import { Request, Response } from "express";
// import lodashPkg from 'lodash';
import { StatusCodes } from "http-status-codes";
import { findAndUpdateUser } from "../service/user.service.js";
import { UserModel } from "../models/user.model.js";
import { BadRequestError } from "../errors/bad-request.error.js";
import { NotFoundError } from "../errors/not-found.error.js";

import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../config/firebase.config.js";
import { processFileMiddleware } from "../middlewares/upload.middleware.js";
import { pageResponse } from "../utils/response.util.js";

// const { get } = lodashPkg;

//@description     Get or Search all users
//@route           GET /api/v1/user?role=&search=
//@access          Public
// export const searchUser = async (req: Request, res: Response) => {
//   const searchQuery = req.query.search;

//   const page = parseInt(req.query.page as string) || 1;
//   const perPage = parseInt(req.query.perPage as string) || 10;

//   const keyword = searchQuery
//     ? {
//         $or: [
//           { email: { $regex: searchQuery, $options: "i" } },
//           { firstName: { $regex: searchQuery, $options: "i" } },
//           { lastName: { $regex: searchQuery, $options: "i" } },
//         ],
//         isDeleted: false,
//         _id: { $ne: res.locals.userData.user },
//       }
//     : {
//         isDeleted: false,
//         _id: { $ne: res.locals.userData.user },
//       };

//   const count = await UserModel.countDocuments(keyword as Record<string, any>);
//   const skip = (page - 1) * perPage;

//   const results = await UserModel.find(keyword as Record<string, any>)
// .skip((page - 1) * perPage)
//     .limit(perPage);

//   return res.status(StatusCodes.OK).json({
//     data: {
//       results,
//       totalResults: count,
//       currentPage: page,
//       totalPages: Math.ceil(count / perPage),
//     },
//   });
// };

/**
 * @description Get user profile
 * @route GET /api/v1/user/
 */
export const getUserProfile = async (req: Request, res: Response) => {
  const user = await UserModel.findOne({
    _id: res.locals.userData.user,
  }).select("+currentCredit");
  if (!user) throw new NotFoundError("User not found!");

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      user,
    },
  });
};

/**
 * @description Get user profile
 * @route GET /api/v1/user/:userId
 */
export const getUserById = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const user = await UserModel.findOne({ _id: userId })
    .populate("student")
    .populate("tutor");
  if (!user) throw new NotFoundError("User not found!");

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      user,
    },
  });
};

/**
 * @description Update user profile
 * @route PATCH /api/v1/user/update-profile
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  await processFileMiddleware(req, res);

  const {
    firstName,
    lastName,
    address,
    phoneNumber,
    dateOfBirth,
    gender,
    about,
  } = req.body;
  let avatar, background;

  if (req.files && "avatar" in req.files && req.files.avatar[0]) {
    const storageRef = ref(
      storage,
      `users/${res.locals.userData.user}/avatar/${req.files.avatar[0].originalname}`
    );

    // Create file metadata including the content type
    const metadata = {
      contentType: req.files.avatar[0].mimetype,
    };

    // Upload the file in the bucket storage
    await uploadBytesResumable(
      storageRef,
      req.files.avatar[0].buffer,
      metadata
    ).then(async (snapshot) => {
      return await getDownloadURL(snapshot.ref).then((url) => {
        avatar = url;
      });
    });
  }
  if (req.files && "background" in req.files && req.files.background[0]) {
    const storageRef = ref(
      storage,
      `users/${res.locals.userData.user}/background/${req.files.background[0].originalname}`
    );

    // Create file metadata including the content type
    const metadata = {
      contentType: req.files.background[0].mimetype,
    };

    // Upload the file in the bucket storage
    await uploadBytesResumable(
      storageRef,
      req.files.background[0].buffer,
      metadata
    ).then(async (snapshot) => {
      return await getDownloadURL(snapshot.ref).then((url) => {
        background = url;
      });
    });
  }

  let filteredUpdateObj = Object.fromEntries(
    Object.entries({
      firstName,
      lastName,
      address,
      phoneNumber,
      dateOfBirth,
      gender,
      avatar,
      background,
      about,
    }).filter(([_, value]) => value !== undefined)
  );

  if (Object.keys(filteredUpdateObj).length !== 0) {
    const user = await findAndUpdateUser(
      {
        _id: res.locals.userData.user,
      },
      filteredUpdateObj,
      {
        new: true,
      }
    );

    if (!user) {
      throw new BadRequestError("Something went wrong!");
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  } else return res.status(StatusCodes.OK);
};

/**
 * @description Get user profile
 * @route GET /api/v1/user/:userId
 */
export const getAllUsersProfile = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;
  const users = await UserModel.find({})
    .sort({ "createdAt": -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: pageResponse(users, page, perPage),
  });
};
