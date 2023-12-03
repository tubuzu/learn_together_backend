import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
// import { findAndUpdateStudent } from "../service/student.service.js";
// import { StudentModel } from "../models/student.model.js";
import { BadRequestError } from "../errors/bad-request.error.js";
import { UserModel } from "../models/user.model.js";
import { findAndUpdateUser } from "../service/user.service.js";
import { pageResponse } from "../utils/response.util.js";

//@description     Get or Search all students
//@route           GET /api/v1/student?search=
//@access          Public
export const searchStudent = async (req: Request, res: Response) => {
  const searchQuery = req.query.search; // query for student properties

  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;

  const keyword = searchQuery
    ? {
        $or: [
          { studentCode: { $regex: searchQuery, $options: "i" } },
          { activityClass: { $regex: searchQuery, $options: "i" } },
          { schoolName: { $regex: searchQuery, $options: "i" } },
          { email: { $regex: searchQuery, $options: "i" } },
          { firstName: { $regex: searchQuery, $options: "i" } },
          { lastName: { $regex: searchQuery, $options: "i" } },
        ],
        isDeleted: false,
      }
    : {
        isDeleted: false,
      };

  const students = await UserModel.find(keyword as Record<string, any>)
    .skip((page - 1) * perPage)
    .limit(perPage)
    .exec();

  res.status(StatusCodes.OK).json({
    success: true,
    data: pageResponse(students, page, perPage),
  });
};

export const updateStudentProfile = async (req: Request, res: Response) => {
  const { studentCode, activityClass, schoolName } = req.body;

  //TODO: validate info
  if (!studentCode || !activityClass || !schoolName) {
    throw new BadRequestError("Please Enter all the Fields");
  }

  const student = await findAndUpdateUser(
    {
      _id: res.locals.userData.user,
    },
    {
      studentCode,
      activityClass,
      schoolName,
    },
    {
      new: true,
    }
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: { student },
  });
};

// export const searchStudent = async (req: Request, res: Response) => {
//   const searchQuery = req.query.search; // query for student properties

//   const page = parseInt(req.query.page as string) || 1;
//   const perPage = parseInt(req.query.perPage as string) || 10;
//   try {
//     const students = await StudentModel.aggregate([
//       {
//         $lookup: {
//           from: "users",
//           localField: "user",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       { $unwind: "$user" },
//       searchQuery && {
//         $match: {
//           $or: [
//             { studentCode: { $regex: searchQuery, $options: "i" } },
//             { activityClass: { $regex: searchQuery, $options: "i" } },
//             { schoolName: { $regex: searchQuery, $options: "i" } },
//             {
//               "user.email": { $regex: searchQuery, $options: "i" },
//             },
//             {
//               "user.firstName": { $regex: searchQuery, $options: "i" },
//             },
//             {
//               "user.lastName": { $regex: searchQuery, $options: "i" },
//             },
//           ],
//         },
//       },
//       {
//         $project: {
//           _id: 1,
//           user: {
//             _id: 1,
//             email: 1,
//             firstName: 1,
//             lastName: 1,
//             avatar: 1,
//             background: 1,
//             address: 1,
//             about: 1,
//             dateOfBirth: 1,
//             gender: 1,
//             phoneNumber: 1,
//             // tutor: 1,
//             // student: 1,
//             isDeleted: 1,
//             createdAt: 1,
//             updatedAt: 1,
//           },
//           studentCode: 1,
//           activityClass: 1,
//           schoolName: 1,
//           studyHardPoint: 1,
//           isDeleted: 1,
//           createdAt: 1,
//           updatedAt: 1,
//         },
//       },
//       {
//         $skip: (page - 1) * perPage,
//       },
//       {
//         $limit: perPage,
//       },
//     ]);

//     return res.status(StatusCodes.OK).json({
//       data: {
//         students,
//         count: students.length,
//         currentPage: page,
//         totalPages: Math.ceil(students.length / perPage),
//       },
//     });
//   } catch (err: any) {
//     return res
//       .status(StatusCodes.INTERNAL_SERVER_ERROR)
//       .json({ error: err.message });
//   }
// };
