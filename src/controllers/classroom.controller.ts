import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../errors/bad-request.error.js";
import { UnauthenticatedError } from "../errors/unauthenticated.error.js";
import { ClassroomModel } from "../models/classroom.model.js";
import {
  checkTimeConflict,
  createKeywordByLocation,
  createKeywordBySubjectAndState,
  findAndUpdateClassroom,
  findClassroomById,
  findClassrooms,
  findClassroomsPaginate,
  findOneClassroom,
  findUserCurClassesAndPaging,
  terminateClassroom,
  updateFinishedClassroom,
  updateStartedClassroom,
} from "../service/classroom.service.js";
import { NotFoundError } from "../errors/not-found.error.js";
import {
  ClassroomMemberRole,
  ClassroomState,
  RequestState,
} from "../utils/const.js";
import { JoinRequestModel } from "../models/joinRequest.model.js";
import {
  getPage,
  pageResponse,
  successResponse,
} from "../utils/response.util.js";
import { ForbiddenError } from "../errors/forbidden.error.js";
import { ConflictError } from "../errors/conflict.error.js";
import { createLocation } from "../service/location.service.js";

import schedule from "node-schedule";
import { ProofOfLevelModel } from "../models/proofOfLevel.model.js";
import { ClassroomParams } from "../dtos/classroom.dto.js";
import {
  createClassroomNewMemberNoti,
  createClassroomTerminatedNoti,
  createJoinRequestAcceptedNoti,
  createJoinRequestRejectedNoti,
  createMemberKickedNoti,
  createOwnerUpdatedNoti,
  createTutorUpdatedNoti,
} from "../service/notification.service.js";
import { UserModel } from "../models/user.model.js";

const MAX_CLASSROOM_JOIN_LIMIT = 5;

const scheduledTasks: any = [];

export const updateClassroomStateOnServerRestart = async () => {
  const now = new Date();

  //update waiting classrooms's state
  const waitingClassrooms = await ClassroomModel.find({
    startTime: { $gt: now },
    terminated: false,
  });
  waitingClassrooms.map(async (classroom: any) => {
    if (classroom.state != ClassroomState.WAITING)
      await ClassroomModel.findByIdAndUpdate(classroom._id, {
        state: ClassroomState.WAITING,
      });

    const startTask = schedule.scheduleJob(
      new Date(classroom.startTime),
      async () => updateStartedClassroom(classroom._id)
    );
    const endTask = schedule.scheduleJob(
      new Date(classroom.endTime),
      async () => updateFinishedClassroom(classroom._id)
    );
    scheduledTasks[classroom._id] = [startTask, endTask];
  });

  //update learning classrooms's state
  const learningClassrooms = await ClassroomModel.find({
    startTime: { $lt: now },
    endTime: { $gt: now },
    terminated: false,
  });
  learningClassrooms.map(async (classroom: any) => {
    if (classroom.state != ClassroomState.LEARNING)
      await updateStartedClassroom(classroom._id);

    const endTask = schedule.scheduleJob(
      new Date(classroom.endTime),
      async () => updateFinishedClassroom(classroom._id)
    );
    scheduledTasks[classroom._id] = [() => {}, endTask];
  });

  //update finished classrooms's state
  const finishedClassrooms = await ClassroomModel.find({
    endTime: { $lt: now },
    terminated: false,
  });

  finishedClassrooms.map(async (classroom: any) => {
    if (classroom.state != ClassroomState.FINISHED)
      await updateFinishedClassroom(classroom._id);
  });
};

//@description     Search classroom
//@route           GET /api/v1/classroom/search?subjectName=
//@access          Public
export const searchClassroom = async (req: Request, res: Response) => {
  const { search, state } = req.query;

  // Gọi hàm createKeywordBySubjectAndState để tạo ra keyword
  const keyword = createKeywordBySubjectAndState(search, state);

  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;

  // Gọi hàm findClassrooms để tìm kiếm lớp học
  const classrooms = await findClassroomsPaginate(keyword, page, perPage);

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: pageResponse(classrooms) }));
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
    state,
  } = req.query;
  if (!northLatBound || !northLongBound || !southLatBound || !southLongBound) {
    throw new BadRequestError("LatLngBounds required!");
  }

  // Gọi hàm createKeywordByLocation để tạo ra keyword theo vị trí
  const keyword = createKeywordByLocation(
    northLatBound,
    northLongBound,
    southLatBound,
    southLongBound
  );

  // Gọi hàm createKeywordBySubjectAndState để thêm điều kiện tìm kiếm theo tên môn học và trạng thái
  Object.assign(keyword, createKeywordBySubjectAndState(search, state));

  // Gọi hàm findClassrooms để tìm kiếm lớp học
  const classrooms = await findClassrooms(keyword);

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: { classrooms } }));
};

//@description     Get classroom by id
//@route           GET /api/v1/classroom/:classroomId
//@access          Public
export const getClassroomById = async (req: Request, res: Response) => {
  // Gọi hàm findClassroomById để tìm kiếm lớp học theo id
  const classroom = await findClassroomById(req.params.classroomId);

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: { classrooms: classroom } }));
};

//@description     Get my classroom
//@route           GET /api/v1/user/current/classroom
//@access          Public
export const getUserCurrentClassrooms = async (req: Request, res: Response) => {
  const role = req.query.role as string;
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;

  // Gọi hàm findUserCurrentClassrooms để tìm kiếm lớp học của người dùng hiện tại theo vai trò
  const classrooms = await findUserCurClassesAndPaging(
    res.locals.userData.user,
    role,
    page,
    perPage
  );

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: pageResponse(classrooms) }));
};

/**
 * @description Create classroom
 * @route POST /api/v1/classroom/create
 */
export const createClassroom = async (req: Request, res: Response) => {
  const userId = res.locals.userData.user;

  const existClassrooms = await ClassroomModel.find({
    terminated: false,
    currentParticipants: { $in: res.locals.userData.user },
    isDeleted: false,
  });
  if (existClassrooms && existClassrooms.length >= MAX_CLASSROOM_JOIN_LIMIT) {
    throw new ForbiddenError(
      `You can only join a maximum of ${MAX_CLASSROOM_JOIN_LIMIT} classrooms!`
    );
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
    ownerIsTutor,

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

  if (!checkTimeConflict(existClassrooms, startTime, endTime)) {
    throw new BadRequestError(
      "Study time conflict with your existing classrooms!"
    );
  }

  if (ownerIsTutor) {
    const proofs = await ProofOfLevelModel.find({ user: userId });

    if (
      !proofs.some(
        (proof: any) => proof.subject.toString() == subject.toString()
      )
    ) {
      throw new BadRequestError(
        "You do not have any proof of level for this classroom subject!"
      );
    }
  }

  const location = createLocation({ longitude, latitude });

  let createObj = {
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
    historyParticipants: [res.locals.userData.user],

    //option
    description,
    isPublic,
    ownerApprovalRequired,
    secretKey: secretKey,

    creator: res.locals.userData.user,
    owner: res.locals.userData.user,
  } as any;

  if (ownerIsTutor) createObj.tutor = userId;

  const classroom = await ClassroomModel.create(createObj);

  if (!classroom) throw new BadRequestError("Something went wrong!");

  const startTask = schedule.scheduleJob(new Date(startTime), async () =>
    updateStartedClassroom(classroom._id)
  );
  const endTask = schedule.scheduleJob(new Date(endTime), async () =>
    updateFinishedClassroom(classroom._id)
  );
  scheduledTasks[classroom._id] = [startTask, endTask];

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
  });
  const existClassrooms = await ClassroomModel.find({
    terminated: false,
    currentParticipants: { $in: res.locals.userData.user },
    isDeleted: false,
  });

  if (!classroom) throw new NotFoundError("Classroom not found!");

  if (classroom.owner != res.locals.userData.user) {
    throw new BadRequestError("Only owner can update study classroom!");
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
    if (startTime && startTimeFinal < Date.now()) {
      throw new BadRequestError("Invalid start and end time!");
    }
    if (startTimeFinal >= endTimeFinal) {
      throw new BadRequestError("Invalid start and end time!");
    }
    for (let c of existClassrooms) {
      if (c._id == classroom._id) continue;
      if (
        (startTimeFinal >= classroom.startTime &&
          startTimeFinal < classroom.endTime) ||
        (endTimeFinal > classroom.startTime &&
          endTimeFinal <= classroom.endTime)
      ) {
        throw new BadRequestError(
          "Study time conflict with your existing classrooms!"
        );
      }
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

  if (updateObj.startTime) {
    if (scheduledTasks[classroomId][0]) scheduledTasks[classroomId][0].cancel();
    const newStartTask = schedule.scheduleJob(
      new Date(updateObj.startTime as number),
      async () => updateStartedClassroom(classroom._id)
    );
    scheduledTasks[classroomId][0] = newStartTask;
    updateObj.state = ClassroomState.WAITING;
  }

  if (updateObj.endTime) {
    if (scheduledTasks[classroomId][1]) scheduledTasks[classroomId][1].cancel();
    const newEndTask = schedule.scheduleJob(
      updateObj.endDate as number,
      async () => updateFinishedClassroom(classroom._id)
    );
    scheduledTasks[classroomId][1] = newEndTask;
    if (!updateObj.startTime && classroom.state == ClassroomState.FINISHED)
      updateObj.state = ClassroomState.LEARNING;
  }

  let resetTutor = false;
  if (
    updateObj.subject &&
    classroom.tutor &&
    updateObj.subject != classroom.subject
  ) {
    resetTutor = true;
  }

  if (Object.keys(updateObj).length !== 0) {
    classroom = await findAndUpdateClassroom(
      {
        _id: classroomId,
      },
      resetTutor
        ? {
            ...updateObj,
            tutor: undefined,
          }
        : updateObj,
      {
        new: true,
      }
    );
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
    currentParticipants: { $nin: userId },
    // isDeleted: false,
  };
  const classroom = await ClassroomModel.findOne(keyword).populate("subject");
  if (!classroom) {
    throw new BadRequestError(
      "Classroom is not currently available or you have joined this classroom"
    );
  }
  const existClassrooms = await ClassroomModel.find({
    terminated: false,
    currentParticipants: { $in: res.locals.userData.user },
    isDeleted: false,
  });
  if (existClassrooms && existClassrooms.length >= MAX_CLASSROOM_JOIN_LIMIT) {
    throw new ForbiddenError(
      `You can only join a maximum of ${MAX_CLASSROOM_JOIN_LIMIT} classrooms!`
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

  // check if study time is suitable
  if (
    !checkTimeConflict(
      existClassrooms,
      Date.parse(classroom.startTime),
      Date.parse(classroom.endTime)
    )
  ) {
    throw new BadRequestError(
      "Study time conflict with your existing classrooms!"
    );
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
    const proofs = await ProofOfLevelModel.find({ user: { $eq: userId } });
    if (
      !proofs.some(
        (proof: any) =>
          proof.subject.toString() == classroom.subject._id.toString()
      )
    ) {
      throw new ForbiddenError(
        "You don't have any proof of level to be a tutor in this classroom!"
      );
    }
  }

  // send join request if ownerApprovalRequired == true
  if (classroom.ownerApprovalRequired) {
    await classroom.populate("joinRequests").execPopulate();
    if (
      classroom.joinRequests.some(
        (x: any) =>
          x.user.toString() == userId && x.state == RequestState.WAITING
      )
    ) {
      throw new BadRequestError(
        "You have sent join request to this classroom!"
      );
    }

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

  updateQuery.$addToSet = {
    currentParticipants: userId,
    historyParticipants: userId,
  };

  if (classroom.currentParticipants.length === classroom.maxParticipants) {
    updateQuery.$set = { available: false };
  }

  const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
    classroomId,
    updateQuery,
    { new: true }
  );

  const notiContent = `You have joined ${updatedClassroom.classroomName}`;

  await createClassroomNewMemberNoti({
    originUserId: updatedClassroom.owner,
    targetUserId: userId,
    classroomId: updatedClassroom._id,
    content: notiContent,
  });
  //TODO: push noti

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
    currentParticipants: { $nin: userId },
    // isDeleted: false,
  };

  // find classroom
  const classroom = await ClassroomModel.findOne(keyword).populate("subject");
  if (!classroom) {
    throw new ForbiddenError(
      "Classroom is not currently available or you have joined this classroom"
    );
  }
  const existClassrooms = await ClassroomModel.find({
    terminated: false,
    currentParticipants: { $in: res.locals.userData.user },
    isDeleted: false,
  });
  if (existClassrooms && existClassrooms.length >= MAX_CLASSROOM_JOIN_LIMIT) {
    throw new ForbiddenError(
      `You can only join a maximum of ${MAX_CLASSROOM_JOIN_LIMIT} classrooms!`
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

  // check if study time is suitable
  if (
    !checkTimeConflict(
      existClassrooms,
      Date.parse(classroom.startTime),
      Date.parse(classroom.endTime)
    )
  ) {
    throw new BadRequestError(
      "Study time conflict with your existing classrooms!"
    );
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
    const proofs = await ProofOfLevelModel.find({ user: { $eq: userId } });
    if (
      !proofs.some(
        (proof: any) => proof.subject.toString() == classroom.subject._id.toString()
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

  updateQuery.$addToSet = {
    currentParticipants: userId,
    historyParticipants: userId,
  };

  if (classroom.currentParticipants.length === classroom.maxParticipants) {
    updateQuery.$set = { available: false };
  }

  const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
    classroomId,
    updateQuery,
    { new: true }
  );

  const notiContent = `You have joined ${updatedClassroom.classroomName}`;

  await createClassroomNewMemberNoti({
    originUserId: updatedClassroom.owner,
    targetUserId: userId,
    classroomId: updatedClassroom._id,
    content: notiContent,
  });
  //TODO: push noti

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
      state: ClassroomState.FINISHED,
      terminated: true,
    },
    {
      new: true,
    }
  );

  if (!classroom) {
    throw new BadRequestError("Something went wrong!");
  }

  let notiContent = `${classroom.classroomName} has been terminated`;
  await Promise.all(
    classroom.currentParticipants.map(async (user: any) => {
      await createClassroomTerminatedNoti({
        originUserId: classroom.owner,
        targetUserId: user,
        classroomId: classroom._id,
        content: notiContent,
      });
    })
  );

  return res.status(StatusCodes.OK).json(successResponse({ data: classroom }));
};

// /**
//  * @description Delete classroom
//  * @route Delete /api/v1/admin/classroom/delete?classroomId=
//  */
// export const deleteClassroom = async (req: Request, res: Response) => {
//   let classroom = await ClassroomModel.findOne({
//     _id: req.params.classroomId, // Lọc theo _id
//     isDeleted: false,
//   });

//   if (!classroom) throw new NotFoundError("Classroom not found!");

//   await classroom.delete();

//   return res
//     .status(StatusCodes.OK)
//     .json(successResponse({ message: "Classroom deleted!" }));
// };

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

  updateQuery.$addToSet = {
    currentParticipants: request.user,
    historyParticipants: request.user,
  };
  updateQuery.$pull = { joinRequest: request._id };
  if (classroom.currentParticipants.length == classroom.maxParticipants)
    updateQuery.$set = { available: false };

  const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
    classroom._id,
    updateQuery,
    { new: true }
  );

  let notiContent = `Your join request to ${updatedClassroom.classroomName} has been accepted`;
  await createJoinRequestAcceptedNoti({
    originUserId: updatedClassroom.owner,
    targetUserId: request.user,
    classroomId: updatedClassroom._id,
    content: notiContent,
  });
  notiContent = `You have joined ${updatedClassroom.classroomName}`;
  await createClassroomNewMemberNoti({
    originUserId: updatedClassroom.owner,
    targetUserId: request.user,
    classroomId: updatedClassroom._id,
    content: notiContent,
  });

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

  const notiContent = `Your join request to ${updatedClassroom.classroomName} has been rejected`;

  await createJoinRequestRejectedNoti({
    originUserId: updatedClassroom.owner,
    targetUserId: request.user,
    classroomId: updatedClassroom._id,
    content: notiContent,
  });

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
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;

  let classroom = await ClassroomModel.findOne({
    _id: req.params.classroomId,
    owner: userId,
    terminated: false,
  });
  if (!classroom)
    throw new BadRequestError(
      "Classroom not valid or you are not the owner of this classroom!"
    );

  await classroom
    .populate({
      path: "joinRequests",
      options: { sort: { createdAt: -1 } },
    })
    .execPopulate();

  const result = getPage(classroom.joinRequests, page, perPage);

  return res.status(StatusCodes.OK).json(
    successResponse({
      data: pageResponse(result),
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
  if (
    classroom.currentParticipants.length == 1 ||
    classroom.owner.toString() == userId
  ) {
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
  if (classroom.tutor.toString() == userId) updateQuery.$set = { tutor: "" };
  const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
    classroom._id,
    updateQuery,
    {
      new: true,
    }
  );

  let notiContent = `You have been kicked from ${updatedClassroom.classroomName}`;
  await createMemberKickedNoti({
    originUserId: updatedClassroom.owner,
    targetUserId: userId,
    classroomId: updatedClassroom._id,
    content: notiContent,
  });

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

  const proofs = await ProofOfLevelModel.find({ user: userId });

  const classroom = await ClassroomModel.findOne({
    _id: classroomId,
    owner: ownerId,
    terminated: false,
  }).lean();

  if (!classroom)
    throw new BadRequestError(
      "Classroom not valid or you are not the owner of this classroom!"
    );

  if (
    !proofs.some(
      (proof: any) => proof.subject.toString() == classroom.subject.toString()
    )
  ) {
    throw new BadRequestError(
      "This user do not have any proof of level for this classroom subject!"
    );
  }

  const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
    classroom._id,
    { $set: { tutor: userId } },
    {
      new: true,
    }
  );

  let notiContent = `You have been granted as tutor in ${updatedClassroom.classroomName}`;
  await createTutorUpdatedNoti({
    originUserId: updatedClassroom.owner,
    targetUserId: userId,
    classroomId: updatedClassroom._id,
    content: notiContent,
  });

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

  let notiContent = `You have been granted as owner of ${updatedClassroom.classroomName}`;
  await createOwnerUpdatedNoti({
    originUserId: oldOwnerId,
    targetUserId: updatedClassroom.owner,
    classroomId: updatedClassroom._id,
    content: notiContent,
  });

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
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;

  const classrooms = await ClassroomModel.find({
    historyParticipants: { $in: userId },
    terminated: true,
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);

  return res.status(StatusCodes.OK).json(
    successResponse({
      data: pageResponse(classrooms),
    })
  );
};
