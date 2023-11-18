import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../errors/bad-request.error.js";
import { UnauthenticatedError } from "../errors/unauthenticated.error.js";
import {
  ClassroomDocument,
  ClassroomModel,
} from "../models/classroom.model.js";
import {
  ClassroomParams,
  findAndUpdateClassroom,
  findOneClassroom,
  terminateClassroom,
  updateClassroomState,
  updateClassroomStateInterval,
} from "../service/classroom.service.js";
import { NotFoundError } from "../errors/not-found.error.js";
import {
  ClassroomMemberRole,
  ClassroomState,
  RequestState,
  UserType,
} from "../utils/const.js";
import { JoinRequestModel } from "../models/joinRequest.model.js";
import { UserModel } from "../models/user.model.js";
import { CustomAPIError } from "../errors/custom-api.error.js";
// import cron from "node-cron";
import { errorResponse, successResponse } from "../utils/response.util.js";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { ConflictError } from "../errors/conflict.error.js";
import { InternalServerError } from "../errors/internal-server-error.error.js";
import { createLocation } from "../service/location.service.js";

import schedule from "node-schedule";
import { date } from "zod";

// Schedule a trigger to run every 5 seconds
// cron.schedule("*/5 * * * * *", () => {
//   // Call the update function
//   updateClassroomState();
// });

const scheduledTasks: any = [];

//@description     Search classroom
//@route           GET /api/v1/classroom/search?subjectName=
//@access          Public
export const searchClassroom = async (req: Request, res: Response) => {
  const keyword: any = {
    isDeleted: false,
  };
  if (req.query.search)
    keyword.subjectName = { $regex: req.query.search, $options: "i" };

  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;
  const classrooms = await ClassroomModel.find(keyword)
    .skip((page - 1) * perPage)
    .limit(perPage);
  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: { classrooms } }));
};

//@description     Search classroom
//@route           GET /api/v1/classroom/map/search?subjectName=
//@access          Public
export const searchClassroomOnMap = async (req: Request, res: Response) => {
  const {
    northLatBound,
    northLongBound,
    southLatBound,
    southLongBound,
    search,
  } = req.query;
  if (!northLatBound || !northLongBound || !southLatBound || !southLongBound) {
    throw new BadRequestError("LatLngBounds required!");
  }

  const keyword: any = {
    location: {
      $geoWithin: {
        $geometry: {
          type: "Polygon",
          coordinates: [
            [
              [northLongBound, northLatBound],
              [northLongBound, southLatBound],
              [southLongBound, southLatBound],
              [southLongBound, northLatBound],
              [northLongBound, northLatBound],
            ],
          ],
        },
      },
    },
    isDeleted: false,
  };

  if (search) keyword.subjectName = { $regex: search, $options: "i" };

  const classrooms = await ClassroomModel.find(keyword as Record<string, any>);
  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: { classrooms } }));
};

//@description     Get classroom by id
//@route           GET /api/v1/classroom/:classroomId
//@access          Public
export const getClassroomById = async (req: Request, res: Response) => {
  const classroom = await ClassroomModel.findOne({
    _id: req.params.classroomId,
    isDeleted: false,
  });

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: { classrooms: classroom } }));
};

//@description     Get my classroom
//@route           GET /api/v1/user/current/classroom
//@access          Public
export const getUserCurrentClassrooms = async (req: Request, res: Response) => {
  const role = req.query.role;
  let keyword: any = {
    terminated: false,
    currentParticipants: { $in: res.locals.userData.user },
    isDeleted: false,
  };
  if (role == UserType.TUTOR) {
    keyword.tutor = { $eq: res.locals.userData.user };
  } else if (role == ClassroomMemberRole.OWNER) {
    keyword.owner = { $eq: res.locals.userData.user };
  }

  const classrooms = await ClassroomModel.find(keyword);

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: { classrooms } }));
};

/**
 * @description Create classroom
 * @route POST /api/v1/classroom/create
 */
export const createClassroom = async (req: Request, res: Response) => {
  const existClassrooms = await ClassroomModel.find({
    terminated: false,
    currentParticipants: { $in: res.locals.userData.user },
    isDeleted: false,
  }).exec();
  if (existClassrooms && existClassrooms.length >= 3) {
    throw new ForbiddenError("You can only join a maximum of 3 classrooms!");
  }

  let {
    //must have
    classroomName,
    subject,
    maxParticipants,
    longitude,
    latitude,
    address,
    startTime,
    endTime,

    //option
    description,
    isPublic,
    ownerApprovalRequired,
    secretKey,
  }: ClassroomParams = req.body;

  if (
    !classroomName ||
    !subject ||
    !maxParticipants ||
    !longitude ||
    !latitude ||
    !address ||
    !startTime ||
    !endTime
  ) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Please fill in all required fields!",
    });
    return;
  }
  if (isPublic) secretKey = "";
  else if (!secretKey) {
    throw new BadRequestError("secretKey required for private classroom!");
  } else if (ownerApprovalRequired) {
    ownerApprovalRequired = false;
  }

  if (startTime >= endTime || startTime < Date.now()) {
    throw new BadRequestError("Invalid start and end time!");
  }

  const location = createLocation({ longitude, latitude });

  const classroom = await ClassroomModel.create({
    classroomName,
    subject,
    maxParticipants,
    longitude,
    latitude,
    address,

    startTime: startTime,
    endTime: endTime,
    location: location,

    currentParticipants: [res.locals.userData.user],

    //option
    description,
    isPublic,
    ownerApprovalRequired,
    secretKey: secretKey,

    creator: res.locals.userData.user,
    owner: res.locals.userData.user,
  });

  const startTask = schedule.scheduleJob(startTime, () =>
    updateClassroomState({ _id: classroom._id }, ClassroomState.LEARNING)
  );
  const endTask = schedule.scheduleJob(endTime, () =>
    updateClassroomState({ _id: classroom._id }, ClassroomState.FINISHED)
  );
  scheduledTasks[classroom._id] = [startTask, endTask];

  if (!classroom) throw new BadRequestError("Something went wrong!");

  return res
    .status(StatusCodes.CREATED)
    .json(successResponse({ data: { classroom } }));
};

/**
 * @description Update classroom
 * @route PATCH /api/v1/classroom/:classroomId
 */
export const updateClassroom = async (req: Request, res: Response) => {
  const { classroomId } = req.params;
  let classroom = await ClassroomModel.findOne({
    _id: classroomId,
    terminated: false,
    isDeleted: false,
  }).exec();

  if (!classroom) throw new NotFoundError("Classroom not found!");

  if (classroom.owner != res.locals.userData.user) {
    throw new BadRequestError("Only owner can update study classroom!");
  }

  if (classroom.state == ClassroomState.FINISHED) {
    throw new BadRequestError("Can not update finished classroom!");
  }

  let {
    classroomName,
    subject,
    longitude,
    latitude,
    address,
    description,
    startTime,
    endTime,
  }: ClassroomParams = req.body;

  if (startTime || endTime) {
    let startTimeFinal = startTime
      ? startTime
      : Date.parse(classroom.startTime);
    let endTimeFinal = endTime ? endTime : Date.parse(classroom.endTime);
    if (startTime) {
      if (startTimeFinal < Date.now())
        throw new BadRequestError("Invalid start and end time!");
    }
    if (startTimeFinal >= endTimeFinal) {
      throw new BadRequestError("Invalid start and end time!");
    }
  }

  const location = createLocation({ longitude, latitude });

  const updateObj = Object.fromEntries(
    Object.entries({
      classroomName,
      subject,
      location,
      address,
      description,
      startTime: startTime ? startTime : undefined,
      endTime: endTime ? endTime : undefined,
    }).filter(([_, value]) => value !== undefined)
  );

  if (Object.keys(updateObj).length !== 0) {
    classroom = await findAndUpdateClassroom(
      {
        _id: classroomId,
      },
      updateObj,
      {
        new: true,
      }
    );
  }

  if (updateObj.startTime) {
    if (scheduledTasks[classroomId][0]) scheduledTasks[classroomId][0].cancel();
    const newStartTask = schedule.scheduleJob(
      new Date(updateObj.startTime as number),
      () =>
        updateClassroomState({ _id: classroom._id }, ClassroomState.LEARNING)
    );
    scheduledTasks[classroomId][0] = newStartTask;
  }

  if (updateObj.endTime) {
    if (scheduledTasks[classroomId][1]) scheduledTasks[classroomId][1].cancel();
    const newEndTask = schedule.scheduleJob(updateObj.endDate as number, () =>
      updateClassroomState({ _id: classroom._id }, ClassroomState.FINISHED)
    );
    scheduledTasks[classroomId][1] = newEndTask;
  }

  if (!classroom) {
    throw new BadRequestError("Something went wrong!");
  }

  return res.status(StatusCodes.OK).json(successResponse({ data: classroom }));
};

//@description     Join a public classroom
//@route           GET /api/v1/classroom/public/join/:classroomId=&role=
//@access          Public
export const joinAPublicClassRoom = async (req: Request, res: Response) => {
  const { classroomId } = req.params;
  const { role } = req.query as Record<string, string>;
  const userId = res.locals.userData.user;

  //find classroom
  let keyword: any = {
    _id: classroomId,
    available: true,
    // terminated: false,
    currentParticipants: { $nin: userId },
    // isDeleted: false,
  };
  const classroom = await ClassroomModel.findOne(keyword)
    .populate("subject")
    .populate("proofsOfLevel");
  if (!classroom) {
    throw new BadRequestError(
      "Classroom is not currently available or you have joined this classroom"
    );
  }

  // check if classroom is public
  if (!classroom.isPublic) {
    throw new ForbiddenError("This is not a public classroom!");
  }

  // check if classroom full
  if (
    classroom.currentParticipants &&
    classroom.currentParticipants.length >= classroom.maxParticipants
  ) {
    throw new ConflictError("This classroom is full!");
  }

  // check for valid role
  if (
    !role ||
    ![ClassroomMemberRole.STUDENT, ClassroomMemberRole.TUTOR].includes(role)
  ) {
    throw new BadRequestError("Invalid role!");
  }

  // check if role is tutor and user has proof of level to be a tutor in this class
  if (role == ClassroomMemberRole.TUTOR) {
    const user = await UserModel.findById(userId).populate("proofsOfLevel");
    if (!user) {
      throw new InternalServerError("Something wrong happen!");
    }
    if (
      !user.proofsOfLevel.some(
        (proof: any) => proof.subject == classroom.subject
      )
    ) {
      throw new ForbiddenError(
        "You don't have any proof of level to be a tutor in this classroom!"
      );
    }
  }

  // send join request if ownerApprovalRequired == true
  if (classroom.ownerApprovalRequired) {
    const joinRequest = await JoinRequestModel.create({
      user: userId,
      classroom: classroomId,
      role: role,
    });
    await findAndUpdateClassroom(
      { _id: classroom._id },
      { $addToSet: { joinRequests: joinRequest._id } }
    );
    return res
      .status(StatusCodes.OK)
      .json(successResponse({ message: "Join request sent successfully" }));
  }

  // else join in class
  const updateQuery: any = {};

  if (role === ClassroomMemberRole.TUTOR) {
    updateQuery.$set = { tutor: userId };
  }

  updateQuery.$addToSet = { currentParticipants: userId };
  updateQuery.$addToSet = { historyParticipants: userId };

  if (classroom.currentParticipants.length === classroom.maxParticipants) {
    updateQuery.$set = { available: false };
  }

  const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
    classroomId,
    updateQuery,
    { new: true }
  );

  return res.status(StatusCodes.OK).json(
    successResponse({
      message: "Join classroom successfully!",
      data: { updatedClassroom },
    })
  );
};

//@description     Join a private classroom
//@route           GET /api/v1/classroom/private/join/:classroomId
//@access          Public
export const joinAPrivateClassRoom = async (req: Request, res: Response) => {
  const { classroomId } = req.params;
  const { role } = req.query;
  const { secretKey } = req.body;
  const userId = res.locals.userData.user;
  let keyword: any = {
    _id: classroomId,
    available: true,
    // terminated: false,
    currentParticipants: { $nin: userId },
    // isDeleted: false,
  };

  // find classroom
  const classroom = await ClassroomModel.findOne(keyword)
    .populate("subject")
    .populate("proofsOfLevel");
  if (!classroom) {
    throw new ForbiddenError(
      "Classroom is not currently available or you have joined this classroom"
    );
  }

  // check if classroom is public
  if (classroom.isPublic) {
    throw new ForbiddenError("This is not a private classroom!");
  }

  // check if classroom full
  if (classroom.currentParticipants.length >= classroom.maxParticipants) {
    throw new ConflictError("This classroom is full!");
  }

  // check secretKey match
  if (classroom.secretKey != secretKey) {
    throw new BadRequestError("secretKey not match!");
  }

  // check if invalid rold
  if (
    !role ||
    (role != ClassroomMemberRole.STUDENT && role != ClassroomMemberRole.TUTOR)
  ) {
    throw new BadRequestError("Invalid role!");
  }

  // check if role is tutor and user has proof of level to be this classroom tutor
  if (role == ClassroomMemberRole.TUTOR) {
    const user = await UserModel.findById(userId).populate("proofsOfLevel");
    if (!user) {
      throw new InternalServerError("Something wrong happen");
    }
    if (
      !user.proofsOfLevel.some(
        (proof: any) => proof.subject == classroom.subject
      )
    ) {
      throw new ForbiddenError(
        "You don't have any proof of level for this classroom subject!"
      );
    }
  }

  // else join in class
  const updateQuery: any = {};

  if (role === ClassroomMemberRole.TUTOR) {
    updateQuery.$set = { tutor: userId };
  }

  updateQuery.$addToSet = { currentParticipants: userId };
  updateQuery.$addToSet = { historyParticipants: userId };

  if (classroom.currentParticipants.length === classroom.maxParticipants) {
    updateQuery.$set = { available: false };
  }

  const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
    classroomId,
    updateQuery,
    { new: true }
  );

  return res.status(StatusCodes.OK).json(
    successResponse({
      message: "Join classroom successfully!",
      data: { updatedClassroom },
    })
  );
};

/**
 * @description End classroom
 * @route PATCH /api/v1/classroom/:classroomId
 */
export const endClassroom = async (req: Request, res: Response) => {
  const { classroomId } = req.params;
  let classroom = await ClassroomModel.findOne({
    _id: classroomId,
    terminated: false,
    isDeleted: false,
  });

  if (!classroom) throw new NotFoundError("Classroom not found!");

  if (classroom.owner != res.locals.userData.user) {
    throw new ForbiddenError("Only owner can end study classroom!");
  }

  classroom = await findAndUpdateClassroom(
    {
      _id: classroomId,
    },
    {
      available: false,
      terminated: true,
    },
    {
      new: true,
    }
  );

  if (!classroom) {
    throw new BadRequestError("Something went wrong!");
  }

  return res.status(StatusCodes.OK).json(successResponse({ data: classroom }));
};

/**
 * @description Delete classroom
 * @route Delete /api/v1/admin/classroom/delete?classroomId=
 */
export const deleteClassroom = async (req: Request, res: Response) => {
  let classroom = await ClassroomModel.findOne({
    _id: req.params.classroomId, // Lọc theo _id
    isDeleted: false,
  });

  if (!classroom) throw new NotFoundError("Classroom not found!");

  await classroom.delete();

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ message: "Classroom deleted!" }));
};

/**
 * @description Accept join request
 * @route PATCH /api/v1/classroom/accept/request/:requestId
 */
export const acceptJoinRequest = async (req: Request, res: Response) => {
  const userId = res.locals.userData.user;
  let request = await JoinRequestModel.findById(req.params.requestId);
  if (!request) throw new NotFoundError("Request not found!");

  // find classroom
  let classroom = await ClassroomModel.findOne({
    _id: request.classroom, // Lọc theo _id
    available: true,
    // terminated: false,
    isDeleted: false,
  });
  if (!classroom) throw new NotFoundError("Classroom not found!");

  // check if user is not owner
  if (classroom.owner != userId)
    throw new UnauthenticatedError(
      "Only classroom owner can handle join request!"
    );

  // update classroom
  const updateQuery: any = {};

  if (request.role == ClassroomMemberRole.TUTOR) {
    updateQuery.$set = { tutor: request.user };
  }

  updateQuery.$addToSet = { currentParticipants: request.user };
  updateQuery.$addToSet = { historyParticipants: request.user };
  updateQuery.$pull = { joinRequest: request._id };
  if (classroom.currentParticipants.length == classroom.maxParticipants)
    updateQuery.$set = { available: false };

  const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
    classroom._id,
    updateQuery,
    { new: true }
  );

  // update request
  request.reviewer = userId;
  request.state = RequestState.ACCEPTED;
  await request.save();

  return res.status(StatusCodes.OK).json(
    successResponse({
      message: "Participant accepted!",
      data: {
        classroom: updatedClassroom,
        request,
      },
    })
  );
};

/**
 * @description Reject join request
 * @route PATCH /api/v1/classroom/reject/request/:requestId
 */
export const rejectJoinRequest = async (req: Request, res: Response) => {
  const userId = res.locals.userData.user;
  let request = await JoinRequestModel.findById(req.params.requestId);
  if (!request) throw new NotFoundError("Request not found!");

  let classroom = await ClassroomModel.findOne({
    _id: request.classroom, // Lọc theo _id
    isDeleted: false,
  }).lean();
  if (!classroom) throw new NotFoundError("Classroom not found!");

  if (classroom.owner != userId)
    throw new UnauthenticatedError(
      "Only classroom owner can handle join request!"
    );

  const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
    classroom._id,
    {
      $pull: { joinRequests: request._id },
    },
    { new: true }
  );

  request.reviewer = userId;
  request.state = RequestState.REJECTED;
  await request.save();

  return res.status(StatusCodes.OK).json(
    successResponse({
      message: "Participant rejected!",
      data: {
        classroom: updatedClassroom,
        request,
      },
    })
  );
};

/**
 * @description Get all join request
 * @route PATCH /api/v1/classroom/:classroomId/request/all
 */
export const getAllJoinRequestByClassroomId = async (
  req: Request,
  res: Response
) => {
  const userId = res.locals.userData.user;

  let classroom = await findOneClassroom({
    _id: req.params.classroomId,
    owner: userId,
    terminated: false,
  });
  if (!classroom)
    throw new BadRequestError(
      "Classroom not valid or you are not the owner of this classroom!"
    );

  await classroom.populate("joinRequests").execPopulate();

  return res.status(StatusCodes.OK).json(
    successResponse({
      data: {
        requests: classroom.joinRequests,
      },
    })
  );
};

/**
 * @description Leave a classroom
 * @route PATCH /api/v1/classroom/:classroomId/leave
 */
export const leaveClassroom = async (req: Request, res: Response) => {
  const userId = res.locals.userData.user;
  const { classroomId } = req.params;

  const classroom = await findOneClassroom({
    _id: classroomId,
    terminated: false,
  });
  if (!classroom) throw new NotFoundError("Classroom not found!");

  //terminate classroom if you are the last one / if you are owner
  if (classroom.currentParticipants.length == 1 || classroom.owner == userId) {
    await terminateClassroom({
      _id: classroomId,
      terminated: false,
    });
  } else {
    await findAndUpdateClassroom(
      {
        _id: classroomId,
        terminated: false,
      },
      { $pull: { currentParticipants: userId } },
      { new: true }
    );
  }

  return res.status(StatusCodes.OK).json(
    successResponse({
      data: {
        classroom,
      },
    })
  );
};

/**
 * @description Kick a user out of classroom
 * @route PATCH /api/v1/classroom/:classroomId/kick/:userId
 */
export const kickUser = async (req: Request, res: Response) => {
  const ownerId = res.locals.userData.user;
  const { classroomId, userId } = req.params;

  if (ownerId == userId) throw new BadRequestError("Can't kick yourself!");

  const classroom = await ClassroomModel.findOne({
    _id: classroomId,
    owner: ownerId,
    terminated: false,
  }).lean();

  if (!classroom)
    throw new BadRequestError(
      "Classroom not valid or you are not the owner of this classroom!"
    );

  const updateQuery: any = { $pull: { currentParticipants: userId } };
  if (classroom.tutor == userId) updateQuery.$set = { tutor: "" };
  const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
    classroom._id,
    updateQuery,
    {
      new: true,
    }
  );

  return res.status(StatusCodes.OK).json(
    successResponse({
      data: {
        classroom: updatedClassroom,
      },
    })
  );
};

/**
 * @description Update classroom's tutor
 * @route PATCH /api/v1/classroom/:classroomId/update-tutor/:userId
 */
export const updateClassroomTutor = async (req: Request, res: Response) => {
  const ownerId = res.locals.userData.user;
  const { classroomId, userId } = req.params;

  const classroom = await ClassroomModel.findOne({
    _id: classroomId,
    owner: ownerId,
    terminated: false,
  }).lean();

  if (!classroom)
    throw new BadRequestError(
      "Classroom not valid or you are not the owner of this classroom!"
    );

  const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
    classroom._id,
    { $set: { tutor: userId } },
    {
      new: true,
    }
  );

  return res.status(StatusCodes.OK).json(
    successResponse({
      data: {
        classroom: updatedClassroom,
      },
    })
  );
};

/**
 * @description Update classroom's tutor
 * @route PATCH /api/v1/classroom/:classroomId/update-owner/:userId
 */
export const updateClassroomOwner = async (req: Request, res: Response) => {
  const oldOwnerId = res.locals.userData.user;
  const { classroomId, userId: newOwnerId } = req.params;

  const classroom = await ClassroomModel.findOne({
    _id: classroomId,
    owner: oldOwnerId,
    terminated: false,
  }).lean();

  if (!classroom)
    throw new BadRequestError(
      "Classroom not valid or you are not the owner of this classroom!"
    );

  const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
    classroomId,
    { $set: { owner: newOwnerId } },
    {
      new: true,
    }
  );

  return res.status(StatusCodes.OK).json(
    successResponse({
      data: {
        classroom: updatedClassroom,
      },
    })
  );
};

/**
 * @description Get user's classrooms history (joined and terminated)
 * @route GET /api/v1/user/classroom/history
 */
export const getUserClassroomHistory = async (req: Request, res: Response) => {
  const userId = res.locals.userData.user;

  const classrooms = await ClassroomModel.find({
    historyParticipants: { $in: userId },
    terminated: true,
  }).lean();

  return res.status(StatusCodes.OK).json(
    successResponse({
      data: {
        classrooms,
      },
    })
  );
};
