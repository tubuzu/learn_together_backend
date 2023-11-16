import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { UserModel } from "../models/user.model.js";
// import { TutorModel } from "../models/tutor.model.js";

//@description     Get or Search all tutors
//@route           GET /api/v1/tutor?search=&subjectId=
//@access          Public
export const searchTutor = async (req: Request, res: Response) => {
  const searchQuery = req.query.search;
  const subjectId = req.query.subjectId;

  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;

  const keyword: any = {
    proofsOfLevel: { $exists: true, $ne: [] },
  };
  if (searchQuery)
    keyword.$or = {
      email: { $regex: searchQuery, $options: "i" },
      firstName: { $regex: searchQuery, $options: "i" },
      lastName: { $regex: searchQuery, $options: "i" },
    };
  if (subjectId) {
    keyword.approvedSubjects = { $in: [subjectId] };
  }

  const tutors = await UserModel.find(keyword as Record<string, any>)
    .skip((page - 1) * perPage)
    .limit(perPage)
    .exec();

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      tutors: tutors,
      count: tutors.length,
      currentPage: page,
      totalPages: Math.ceil(tutors.length / perPage),
    },
  });
};
