import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { ProofOfLevelModel } from "../models/proofOfLevel.model.js";
import { pageResponse } from "../utils/response.util.js";
// import { TutorModel } from "../models/tutor.model.js";

//@description     Get or Search all tutors
//@route           GET /api/v1/tutor?search=&subjectId=
//@access          Public
export const searchTutor = async (req: Request, res: Response) => {
  const searchQuery = req.query.search;
  const subjectId = req.query.subjectId;

  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;

  const keyword: any = {};
  if (subjectId) keyword.subject = { $eq: subjectId };
  if (searchQuery)
    keyword.$or = [
      { email: { $regex: searchQuery, $options: "i" } },
      { firstName: { $regex: searchQuery, $options: "i" } },
      { lastName: { $regex: searchQuery, $options: "i" } },
    ];

  const pipeline = [
    { $group: { _id: "$user", proof: { $first: "$$ROOT" } } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $replaceRoot: { newRoot: { $arrayElemAt: ["$user", 0] } } },
    {
      $project: {
        accountStatus: 0,
        password: 0,
        accountVerificationToken: 0,
        passwordResetToken: 0,
      },
    },
    { $match: keyword },
    { $skip: (page - 1) * perPage },
    { $limit: perPage },
  ];

  const tutors = await ProofOfLevelModel.aggregate(pipeline).exec();

  return res.status(StatusCodes.OK).json({
    success: true,
    data: pageResponse(tutors, page, perPage),
  });
};
// {
//   $project: {
//     _id: "$user._id",
//     email: "$user.email",
//     firstName: "$user.firstName",
//     lastName: "$user.lastName",
//     avatar: "$user.avatar",
//     background: "$user.background",
//     address: "$user.address",
//     about: "$user.about",
//     dateOfBirth: "$user.dateOfBirth",
//     gender: "$user.gender",
//     phoneNumber: "$user.phoneNumber",
//     studentCode: "$user.studentCode",
//     activityClass: "$user.activityClass",
//     schoolName: "$user.schoolName",
//     studyHardPoint: "$user.studyHardPoint",
//     isDeleted: "$user.isDeleted",
//     createdAt: "$user.createdAt",
//     updatedAt: "$user.updatedAt",
//   },
// },
