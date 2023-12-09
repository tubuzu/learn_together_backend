import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { ProofOfLevelRequestModel } from "../models/proofOfLevelRequest.model.js";
import { ProofOfLevelModel } from "../models/proofOfLevel.model.js";
import { NotFoundError } from "../errors/not-found.error.js";
import { RequestState } from "../utils/const.js";
import { giveCurrentDateTime } from "../utils/upload-file.js";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../config/firebase.config.js";
import { BadRequestError } from "../errors/bad-request.error.js";
import { processFileMiddleware } from "../middlewares/upload.middleware.js";
import { findAndUpdateUser } from "../service/user.service.js";
import { pageResponse } from "../utils/response.util.js";
import {
  createProofOfLevelAcceptedNoti,
  createProofOfLevelRejectedNoti,
} from "../service/notification.service.js";
import { SubjectModel } from "../models/subject.model.js";

//@description     Get or Search all tutors
//@route           GET /api/v1/tutor?search=&subjectId=
//@access          Public
export const sendProofOfLevelRequest = async (req: Request, res: Response) => {
  await processFileMiddleware(req, res);

  const { subjectId, noteOfSender } = req.body;

  if (!subjectId)
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Subject is required!",
    });

  const proofs = await ProofOfLevelModel.find({
    user: res.locals.userData.user,
    subject: subjectId,
    isDeleted: false,
  });

  if (proofs.length > 0)
    throw new BadRequestError(
      "Proof of level for this subject already exists!"
    );

  const requests = await ProofOfLevelRequestModel.find({
    sender: res.locals.userData.user,
    subject: subjectId,
    state: RequestState.WAITING,
    isDeleted: false,
  });

  if (requests.length > 0)
    throw new BadRequestError(
      "Proof of level request for this subject already exists!"
    );

  let documents: any[] = [];
  if (req.files && "documents" in req.files && req.files.documents) {
    documents = await Promise.all(
      req.files.documents.map(async (file) => {
        try {
          const dateTime = giveCurrentDateTime();

          const storageRef = ref(
            storage,
            `users/${res.locals.userData.user}/proofs-of-level/${subjectId}/${
              dateTime + "___" + file.originalname
            }`
          );

          // Create file metadata including the content type
          const metadata = {
            contentType: file.mimetype,
          };

          // Upload the file in the bucket storage
          const url = await uploadBytesResumable(
            storageRef,
            file.buffer,
            metadata
          ).then(async (snapshot) => {
            return await getDownloadURL(snapshot.ref).then((url) => url);
          });

          return url;
        } catch (error: any) {
          return res.status(400).json({
            success: false,
            message: error.message,
          });
        }
      })
    );
  }

  if (documents.length == 0)
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Documents required!",
    });

  const request = await ProofOfLevelRequestModel.create({
    subject: subjectId,
    sender: res.locals.userData.user,
    documentURLs: documents,
    noteOfSender,
  });

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: { request: request },
  });
};

//@description     Get or Search all tutors
//@route           GET /api/v1/tutor?search=&subjectId=
//@access          Public
export const getUserProofOfLevelRequestById = async (
  req: Request,
  res: Response
) => {
  const requestId = req.params.requestId;
  let request = await ProofOfLevelRequestModel.findOne({
    _id: requestId,
    sender: res.locals.userData.user,
    isDeleted: false,
  });
  if (!request) throw new NotFoundError("Request not found!");

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      request,
    },
  });
};

//@description     Get or Search all tutors
//@route           GET /api/v1/tutor?search=&subjectId=
//@access          Public
export const getProofOfLevelRequestById = async (
  req: Request,
  res: Response
) => {
  const requestId = req.params.requestId;
  let request = await ProofOfLevelRequestModel.findOne({
    _id: requestId,
    isDeleted: false,
  });
  if (!request) throw new NotFoundError("Request not found!");

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      request,
    },
  });
};

//@description     Get or Search all tutors
//@route           GET /api/v1/tutor?search=&subjectId=
//@access          Public
export const getAllUserProofOfLevelRequest = async (
  req: Request,
  res: Response
) => {
  let requestState = req.query.requestState as string;
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;

  let requests = await ProofOfLevelRequestModel.find(
    requestState
      ? {
          sender: res.locals.userData.user,
          state: requestState,
          isDeleted: false,
        }
      : {
          sender: res.locals.userData.user,
          isDeleted: false,
        }
  )
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: pageResponse(requests),
  });
};

//@description     Get or Search all tutors
//@route           GET /api/v1/tutor?search=&subjectId=
//@access          Public
export const getAllProofOfLevelRequest = async (
  req: Request,
  res: Response
) => {
  let requestState = req.query.requestState as string;
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;
  let requests = await ProofOfLevelRequestModel.find(
    requestState
      ? {
          state: requestState,
          isDeleted: false,
        }
      : {
          isDeleted: false,
        }
  )
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: pageResponse(requests),
  });
};

//@description     Get or Search all tutors
//@route           GET /api/v1/tutor?search=&subjectId=
//@access          Public
export const getAllProofOfLevelRequestByUserId = async (
  req: Request,
  res: Response
) => {
  const requestState = req.query.requestState as string;
  const userId = req.query.userId as string;
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;
  let requests = await ProofOfLevelRequestModel.find(
    requestState
      ? {
          state: requestState,
          sender: userId,
          isDeleted: false,
        }
      : {
          sender: userId,
          isDeleted: false,
        }
  )
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: pageResponse(requests),
  });
};

//@description     Get or Search all tutors
//@route           GET /api/v1/tutor?search=&subjectId=
//@access          Public
export const acceptProofOfLevelRequest = async (
  req: Request,
  res: Response
) => {
  const { requestId, noteOfReviewer } = req.body as any;
  const userId = res.locals.userData.user;

  let request = await ProofOfLevelRequestModel.findById(requestId);

  if (!request || request.state != RequestState.WAITING) {
    throw new NotFoundError("Request not found!");
  }

  request.state = RequestState.ACCEPTED;
  request.reviewer = userId;
  request.noteOfReviewer = noteOfReviewer;
  await request.save();

  const proof = await ProofOfLevelModel.create({
    user: request.sender,
    subject: request.subject,
    documentURLs: request.documentURLs,
    noteOfSender: request.noteOfSender,
    request: request._id,
  });

  const subject = await SubjectModel.findById(request.subject);
  let notiContent = `Your proof of level in ${subject.subjectName} has been accepted`;
  await createProofOfLevelAcceptedNoti({
    originUserId: userId,
    targetUserId: request.sender,
    requestId: request._id,
    proofOfLevelId: proof._id,
    content: notiContent,
  });

  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Request accepted!",
    data: {
      proofOfLevel: proof,
    },
  });
};

//@description     Get or Search all tutors
//@route           GET /api/v1/tutor?search=&subjectId=
//@access          Public
export const rejectProofOfLevelRequest = async (
  req: Request,
  res: Response
) => {
  const { requestId, noteOfReviewer } = req.body as any;
  const userId = res.locals.userData.user;

  let request = await ProofOfLevelRequestModel.findById(requestId);

  if (!request || request.state != RequestState.WAITING) {
    throw new NotFoundError("Request not found!");
  }

  request.state = RequestState.REJECTED;
  request.reviewer = userId;
  request.noteOfReviewer = noteOfReviewer;
  await request.save();

  const subject = await SubjectModel.findById(request.subject);
  let notiContent = `Your proof of level in ${subject.subjectName} has been rejected`;
  await createProofOfLevelRejectedNoti({
    originUserId: userId,
    targetUserId: request.sender,
    requestId: request._id,
    content: notiContent,
  });

  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Request rejected!",
  });
};
