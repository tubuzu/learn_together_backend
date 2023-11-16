import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../errors/bad-request.error.js";
import { UnauthenticatedError } from "../errors/unauthenticated.error.js";
import { ClassroomModel } from "../models/classroom.model.js";
import { findAndUpdateClassroom } from "../service/classroom.service.js";
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
  res.status(StatusCodes.OK).json({
    success: true,
    data: { classrooms },
  });
};

//@description     Search classroom
//@route           GET /api/v1/classroom/map/search?subjectName=
//@access          Public
export const searchClassroomOnMap = async (req: Request, res: Response) => {
  const { northLatBound, northLongBound, southLatBound, southLongBound } =
    req.query;
  if (!northLatBound || !northLongBound || !southLatBound || !southLongBound) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "LatLngBounds required!",
    });
    return;
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

  if (req.query.search)
    keyword.subjectName = { $regex: req.query.search, $options: "i" };

  const classrooms = await ClassroomModel.find(keyword as Record<string, any>);
  res.status(StatusCodes.OK).json({
    success: true,
    data: { classrooms },
  });
};

//@description     Get classroom by id
//@route           GET /api/v1/classroom/:classroomId
//@access          Public
export const getClassroomById = async (req: Request, res: Response) => {
  const classroom = await ClassroomModel.findOne({
    _id: req.params.classroomId,
    isDeleted: false,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: { classrooms: classroom },
  });
};

//@description     Get my classroom
//@route           GET /api/v1/user/classroom
//@access          Public
export const getMyClassRoom = async (req: Request, res: Response) => {
  const role = req.query.role;
  let keyword: any = {
    terminated: false,
    participants: { $in: res.locals.userData.user },
    isDeleted: false,
  };
  if (role == UserType.TUTOR) {
    keyword.tutor = { $eq: res.locals.userData.user };
  } else if (role == ClassroomMemberRole.OWNER) {
    keyword.owner = { $eq: res.locals.userData.user };
  }

  const classrooms = await ClassroomModel.find(keyword);
  if (!classrooms || classrooms.length == 0) {
    res.status(StatusCodes.OK).json({
      success: true,
      message: "You are not in any classroom!",
    });
    return;
  }
  res.status(StatusCodes.OK).json({
    success: true,
    data: { classroom: classrooms },
  });
};

/**
 * @description Create classroom
 * @route POST /api/v1/classroom/create
 */
export const createClassroom = async (req: Request, res: Response) => {
  const existClassrooms = await ClassroomModel.find({
    terminated: false,
    participants: { $in: res.locals.userData.user },
    isDeleted: false,
  });
  if (existClassrooms && existClassrooms.length >= 3) {
    res.status(StatusCodes.OK).json({
      success: false,
      message: "You can only join a maximum of 3 classrooms!",
    });
    return;
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
  } = req.body;

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
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "secretKey required for private classroom!",
    });
    return;
  } else if (ownerApprovalRequired) {
    ownerApprovalRequired = false;
  }

  const startDateTime = Date.parse(startTime);
  const endDateTime = Date.parse(endTime);
  if (startDateTime >= endDateTime || startDateTime < Date.now()) {
    res.status(StatusCodes.OK).json({
      success: false,
      message:
        "endTime has to be greater than startTime and startTime has to be greater than now.",
    });
    return;
  }

  const location = {
    type: "Point",
    coordinates: [parseFloat(longitude), parseFloat(latitude)],
  };

  const classroom = await ClassroomModel.create({
    classroomName,
    subject,
    maxParticipants,
    longitude,
    latitude,
    address,

    startTime: startDateTime,
    endTime: endDateTime,
    location: location,

    participants: [res.locals.userData.user],

    //option
    description,
    isPublic,
    ownerApprovalRequired,
    secretKey: secretKey,

    creator: res.locals.userData.user,
    owner: res.locals.userData.user,
  });

  if (!classroom) throw new BadRequestError("Something went wrong!");

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: { classroom },
  });
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

  if (!classroom) throw new NotFoundError("Classroom not found!");

  if (classroom.owner != res.locals.userData.user) {
    res.status(StatusCodes.OK).json({
      success: false,
      message: "Only owner can update study classroom!",
    });
    return;
  }

  if (classroom.state == ClassroomState.FINISHED) {
    res.status(StatusCodes.OK).json({
      success: false,
      message: "Can not update finished classroom!",
    });
    return;
  }

  let { classroomName, subject, longitude, latitude, address, description } =
    req.body;

  let location = undefined;
  if (longitude && latitude) {
    location = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };
  }

  let filteredUpdateObj = Object.fromEntries(
    Object.entries({
      classroomName,
      subject,
      location,
      address,
      description,
    }).filter(([_, value]) => value !== undefined)
  );

  if (Object.keys(filteredUpdateObj).length !== 0) {
    classroom = await findAndUpdateClassroom(
      {
        _id: classroomId,
      },
      filteredUpdateObj,
      {
        upsert: true,
        new: true,
      }
    );
  }

  if (!classroom) {
    throw new BadRequestError("Something went wrong!");
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: classroom,
  });
};

//@description     Join a public classroom
//@route           GET /api/v1/classroom/public/join/:classroomId=&role=
//@access          Public
export const joinAPublicClassRoom = async (req: Request, res: Response) => {
  const { classroomId } = req.params;
  const { role } = req.query;
  const userId = res.locals.userData.user;
  let keyword: any = {
    _id: classroomId,
    available: true,
    // terminated: false,
    participants: { $nin: userId },
    // isDeleted: false,
  };
  const classroom = await ClassroomModel.findOne(keyword)
    .populate("subject")
    .populate("proofsOfLevel");
  if (!classroom) {
    res.status(StatusCodes.OK).json({
      success: false,
      message:
        "Classroom is not currently available or you have joined this classroom",
    });
    return;
  }

  // check if classroom is public
  if (!classroom.isPublic) {
    res.status(StatusCodes.OK).json({
      success: false,
      message: "This is not a public classroom!",
    });
    return;
  }

  // check if classroom full
  if (classroom.participants.length >= classroom.maxParticipants) {
    res.status(StatusCodes.OK).json({
      success: false,
      message: "This classroom is full!",
    });
    return;
  }

  if (
    !role ||
    (role != ClassroomMemberRole.STUDENT && role != ClassroomMemberRole.TUTOR)
  ) {
    res.status(StatusCodes.OK).json({
      success: false,
      message: "Invalid role!",
    });
    return;
  }
  if (role == ClassroomMemberRole.TUTOR) {
    // check if role is tutor and user has proof of level to be this classroom tutor
    const user = await UserModel.findById(userId).populate("proofsOfLevel");
    if (!user) {
      res.status(StatusCodes.OK).json({
        success: false,
        message: "Something wrong happen",
      });
      return;
    }
    if (
      !user.proofsOfLevel.some(
        (proof: any) => proof.subject == classroom.subject
      )
    ) {
      res.status(StatusCodes.OK).json({
        success: false,
        message:
          "You don't have any proof of level for this classroom subject!",
      });
      return;
    }
  }

  // send
  if (classroom.ownerApprovalRequired) {
    const joinRequest = await JoinRequestModel.create({
      user: userId,
      classroom: classroomId,
      role: role,
    });
    classroom.joinRequests.push(joinRequest._id);
    await classroom.save();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Join request sent successfully",
    });
    return;
  }

  if (role == ClassroomMemberRole.TUTOR) {
    classroom.tutor = userId;
  }
  classroom.participants.push(userId);
  if (classroom.participants.length == classroom.maxParticipants)
    classroom.available = false;

  await classroom.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Join classroom successfully!",
    data: { classroom },
  });
};

//@description     Join a classroom
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
    participants: { $nin: userId },
    // isDeleted: false,
  };
  const classroom = await ClassroomModel.findOne(keyword)
    .populate("subject")
    .populate("proofsOfLevel");
  if (!classroom) {
    res.status(StatusCodes.OK).json({
      success: false,
      message:
        "Classroom is not currently available or you have joined this classroom",
    });
    return;
  }

  // check if classroom is public
  if (classroom.isPublic) {
    res.status(StatusCodes.OK).json({
      success: false,
      message: "This is not a private classroom!",
    });
    return;
  }

  // check if classroom full
  if (classroom.participants.length >= classroom.maxParticipants) {
    res.status(StatusCodes.OK).json({
      success: false,
      message: "This classroom is full!",
    });
    return;
  }

  // check secretKey match
  if (classroom.secretKey != secretKey) {
    res.status(StatusCodes.OK).json({
      success: false,
      message: "secretKey not match!",
    });
    return;
  }

  if (
    !role ||
    (role != ClassroomMemberRole.STUDENT && role != ClassroomMemberRole.TUTOR)
  ) {
    res.status(StatusCodes.OK).json({
      success: false,
      message: "Invalid role!",
    });
    return;
  }
  if (role == ClassroomMemberRole.TUTOR) {
    // check if role is tutor and user has proof of level to be this classroom tutor
    const user = await UserModel.findById(userId).populate("proofsOfLevel");
    if (!user) {
      res.status(StatusCodes.OK).json({
        success: false,
        message: "Something wrong happen",
      });
      return;
    }
    if (
      !user.proofsOfLevel.some(
        (proof: any) => proof.subject == classroom.subject
      )
    ) {
      res.status(StatusCodes.OK).json({
        success: false,
        message:
          "You don't have any proof of level for this classroom subject!",
      });
      return;
    }
  }

  if (role == ClassroomMemberRole.TUTOR) {
    classroom.tutor = userId;
  }
  classroom.participants.push(userId);
  if (classroom.participants.length == classroom.maxParticipants)
    classroom.available = false;
  await classroom.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Join classroom successfully!",
    data: { classroom },
  });
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
    res.status(StatusCodes.OK).json({
      success: false,
      message: "Only owner can end study classroom!",
    });
    return;
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
      upsert: true,
      new: true,
    }
  );

  if (!classroom) {
    throw new BadRequestError("Something went wrong!");
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: classroom,
  });
};

/**
 * @description Delete classroom
 * @route Delete /api/v1/admin/classroom/delete?classroomId=
 */
export const deleteClassroom = async (req: Request, res: Response) => {
  try {
    let classroom = await ClassroomModel.findOne({
      _id: req.params.classroomId, // Lọc theo _id
      isDeleted: false,
    });

    if (!classroom) throw new NotFoundError("Classroom not found!");

    classroom.delete();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Classroom deleted!",
    });
  } catch (err: any) {
    throw new CustomAPIError(err.message);
  }
};

/**
 * @description Accept join request
 * @route PATCH /api/v1/classroom/accept/request/:requestId
 */
export const AcceptJoinRequest = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userData.user;
    let request = await JoinRequestModel.findById(req.params.requestId);
    if (!request) throw new NotFoundError("Request not found!");

    let classroom = await ClassroomModel.findOne({
      _id: request.classroom, // Lọc theo _id
      available: true,
      // terminated: false,
      isDeleted: false,
    });
    if (!classroom) throw new NotFoundError("Classroom not found!");

    if (classroom.owner != userId)
      throw new UnauthenticatedError(
        "Only classroom owner can handle join request!"
      );

    if (request.role == ClassroomMemberRole.TUTOR) {
      classroom.tutor = request.user;
    }
    classroom.participants.push(request.user);
    classroom.joinRequest.pull(request._id);
    if (classroom.participants.length == classroom.maxParticipants)
      classroom.available = false;
    await classroom.save();

    request.reviewer = userId;
    request.state = RequestState.ACCEPTED;
    await request.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Participant accepted!",
    });
  } catch (err: any) {
    throw new CustomAPIError(err.message);
  }
};

/**
 * @description Reject join request
 * @route PATCH /api/v1/classroom/reject/request/:requestId
 */
export const RejectJoinRequest = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userData.user;
    let request = await JoinRequestModel.findById(req.params.requestId);
    if (!request) throw new NotFoundError("Request not found!");

    let classroom = await ClassroomModel.findOne({
      _id: request.classroom, // Lọc theo _id
      isDeleted: false,
    });
    if (!classroom) throw new NotFoundError("Classroom not found!");

    if (classroom.owner != userId)
      throw new UnauthenticatedError(
        "Only classroom owner can handle join request!"
      );

    classroom.joinRequest.pull(request._id);
    await classroom.save();

    request.reviewer = userId;
    request.state = RequestState.REJECTED;
    await request.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Participant rejected!",
    });
  } catch (err: any) {
    throw new CustomAPIError(err.message);
  }
};

/**
 * @description Accept join request
 * @route PATCH /api/v1/classroom/accept/request/:requestId
 */
export const GetAllJoinRequest = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userData.user;

    let classroom = await ClassroomModel.findOne({
      owner: userId,
      available: true,
      // terminated: false,
      isDeleted: false,
    }).populate("joinRequests");
    if (!classroom)
      throw new NotFoundError(
        "Classroom not valid or you are not the owner of this classroom!"
      );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        requests: classroom.joinRequests,
      },
    });
  } catch (err: any) {
    throw new CustomAPIError(err.message);
  }
};
