import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { ProofOfLevelModel } from "../models/proofOfLevel.model.js";
import { NotFoundError } from "../errors/not-found.error.js";
import { pageResponse } from "../utils/response.util.js";

//@description     Get or Search all tutors
//@route           GET /api/v1/tutor?search=&subjectId=
//@access          Public
export const getAllUserProofOfLevel = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;
  let proofs = await ProofOfLevelModel.find({
    user: res.locals.userData.user,
    isDeleted: false,
  })
    .skip((page - 1) * perPage)
    .limit(perPage);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: pageResponse(proofs, page, perPage),
  });
};

//@description     Get or Search all tutors
//@route           GET /api/v1/tutor?search=&subjectId=
//@access          Public
export const getProofOfLevelById = async (req: Request, res: Response) => {
  const proofId = req.params.proofId;
  let proof = await ProofOfLevelModel.findOne({
    _id: proofId,
    isDeleted: false,
  });
  if (!proof) throw new NotFoundError("Proof of Level not found!");

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      proof,
    },
  });
};

//@description     Get or Search all tutors
//@route           GET /api/v1/tutor?search=&subjectId=
//@access          Public
export const getAllProofOfLevelByUserId = async (
  req: Request,
  res: Response
) => {
  const userId = req.query.userId;
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;
  const proofs = await ProofOfLevelModel.find({
    user: userId,
    isDeleted: false,
  })
    .skip((page - 1) * perPage)
    .limit(perPage);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: pageResponse(proofs, page, perPage),
  });
};

// //@description     Get or Search all tutors
// //@route           GET /api/v1/tutor?search=&subjectId=
// //@access          Public
// export const deleteProofOfLevel = async (req: Request, res: Response) => {
//   const { proofOfLevelId } = req.body as any;

//   let proof = await ProofOfLevelModel.findOne({
//     _id: proofOfLevelId,
//     isDeleted: false,
//   });

//   if (!proof) {
//     throw new NotFoundError("Proof of level not found!");
//   }

//   await proof.delete();

//   return res.status(StatusCodes.CREATED).json({
//     success: true,
//     message: "Request rejected!",
//   });
// };
