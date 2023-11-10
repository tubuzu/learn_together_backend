import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../errors/bad-request.error.js";
import { SubjectModel } from "../models/subject.model.js";
import { findAndUpdateSubject } from "../service/subject.service.js";
import { NotFoundError } from "../errors/not-found.error.js";

//@description     Get or Search all subjects
//@route           GET /api/v1/admin/subject?search=
//@access          Public
export const searchSubject = async (req: Request, res: Response) => {
  const keyword = req.query.search
    ? {
        subjectName: { $regex: req.query.search, $options: "i" },
        isDeleted: false,
      }
    : {
        isDeleted: false,
      };

  const subjects = await SubjectModel.find(keyword as Record<string, any>);
  res.status(StatusCodes.OK).json({
    data: {
      subjects,
    },
  });
};

//@description     Get or Search all subjects
//@route           GET /api/v1/admin/subject?search=
//@access          Public
export const getSubjectById = async (req: Request, res: Response) => {
  const subjectId = req.params.subjectId;
  if (!subjectId)
    res.status(StatusCodes.OK).json({
      msg: "subjectId is missing!",
    });
  const subject = await SubjectModel.findOne({
    _id: subjectId,
  });
  if (!subject) throw new NotFoundError("Subject not found!");
  res.status(StatusCodes.OK).json({
    data: {
      subject,
    },
  });
};

/**
 * @description Create subject
 * @route POST /api/v1/admin/subject/create
 */
export const createSubject = async (req: Request, res: Response) => {
  const {
    subjectName,
    numberOfCredits,
    isDepartmentCourse,
    isElectiveCourse,
    description,
  } = req.body;

  const subject = await SubjectModel.create({
    subjectName,
    numberOfCredits,
    isElectiveCourse,
    isDepartmentCourse,
    description,
  });

  if (!subject) {
    throw new BadRequestError("Something went wrong!");
  }

  return res.status(StatusCodes.CREATED).json({
    data: { subject: subject },
  });
};

/**
 * @description Update subject
 * @route POST /api/v1/admin/subject/update
 */
export const updateSubject = async (req: Request, res: Response) => {
  const {
    subjectName,
    numberOfCredits,
    isDepartmentCourse,
    isElectiveCourse,
    description,
  } = req.body;
  let filteredUpdateObj = Object.fromEntries(
    Object.entries({
      subjectName,
      numberOfCredits,
      isDepartmentCourse,
      isElectiveCourse,
      description,
    }).filter(([_, value]) => value !== undefined)
  );

  const { subjectId } = req.params;

  if (Object.keys(filteredUpdateObj).length !== 0) {
    const subject = await findAndUpdateSubject(
      {
        _id: subjectId,
      },
      filteredUpdateObj,
      {
        upsert: true,
        new: true,
      }
    );

    if (!subject) {
      throw new BadRequestError("Something went wrong!");
    }

    return res.status(StatusCodes.OK).json({
      data: { subject: subject },
    });
  } else return res.status(StatusCodes.OK);
};

/**
 * @description Update subject
 * @route GET /api/v1/admin/subject/delete?subjectId=
 */
export const deleteSubject = async (req: Request, res: Response) => {
  const subject = await SubjectModel.findById(req.params.subjectId);

  if (!subject) {
    throw new NotFoundError("Subject not found!");
  }

  subject.delete();

  return res.status(StatusCodes.OK).json({
    msg: "Subject deleted!",
  });
};
