import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { TutorModel } from "../models/tutor.model.js";

//@description     Get or Search all tutors
//@route           GET /api/v1/tutor?search=&subjectId=
//@access          Public
export const searchTutor = async (req: Request, res: Response) => {
  const searchQuery = req.query.search;
  // const subjectId = req.query.subjectId; //todo: filter by subject

  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;

  // if (subjectId) {
  //   tutorMatch.approvedSubjects = { $in: [subjectId] };
  // }
  try {
    const tutors = await TutorModel.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $match: {
          $and: [
            { proofsOfLevel: { $exists: true, $ne: [] } },
            searchQuery
              ? {
                  $or: {
                    "user.email": { $regex: searchQuery, $options: "i" },
                    "user.firstName": {
                      $regex: searchQuery,
                      $options: "i",
                    },
                    "user.lastName": {
                      $regex: searchQuery,
                      $options: "i",
                    },
                  },
                }
              : {},
          ],
        },
      },
      {
        $project: {
          _id: 1,
          user: {
            _id: 1,
            email: 1,
            firstName: 1,
            lastName: 1,
            avatar: 1,
            background: 1,
            address: 1,
            about: 1,
            dateOfBirth: 1,
            gender: 1,
            phoneNumber: 1,
            // tutor: 1,
            // student: 1,
            isDeleted: 1,
            createdAt: 1,
            updatedAt: 1,
          },
          isDeleted: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $skip: (page - 1) * perPage,
      },
      {
        $limit: perPage,
      },
    ]);

    return res.status(StatusCodes.OK).json({
      data: {
        tutors: tutors,
        count: tutors.length,
        currentPage: page,
        totalPages: Math.ceil(tutors.length / perPage),
      },
    });
  } catch (err: any) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: err.message });
  }
};
