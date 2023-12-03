import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import {
  ClassroomDocument,
  ClassroomModel,
} from "../models/classroom.model.js";
import {
  ClassroomMemberRole,
  ClassroomState,
  UserType,
} from "../utils/const.js";
import { UserDocument } from "../models/user.model.js";

export async function findAndUpdateClassroom(
  query: FilterQuery<ClassroomDocument>,
  update: UpdateQuery<ClassroomDocument>,
  options: QueryOptions = {}
) {
  return ClassroomModel.findOneAndUpdate(
    {
      ...query,
      isDeleted: false,
    },
    update,
    options
  );
}

export async function findOneClassroom(query: FilterQuery<ClassroomDocument>) {
  return ClassroomModel.findOne({
    ...query,
    isDeleted: false,
  });
}

export async function terminateClassroom(
  query: FilterQuery<ClassroomDocument>
) {
  return ClassroomModel.findOneAndUpdate(
    {
      ...query,
      isDeleted: false,
    },
    {
      currentParticipants: [],
      available: false,
      terminated: true,
    }
  );
}

export const updateClassroomStateInterval = async () => {
  const curTime = new Date();
  const classrooms = await ClassroomModel.find({
    $or: [
      { endTime: { $lte: curTime }, state: ClassroomState.LEARNING },
      { startTime: { $lte: curTime }, state: ClassroomState.WAITING },
    ],
    terminated: false,
  });

  for (let classroom of classrooms) {
    if (classroom.endTime <= curTime) classroom.state = ClassroomState.FINISHED;
    else if (classroom.startTime <= curTime)
      classroom.state = ClassroomState.LEARNING;
    await classroom.save();
  }
};

export const updateClassroomState = async (query: any, state: string) => {
  if (!Object.values(ClassroomState).includes(state)) return;
  await findAndUpdateClassroom(
    {
      ...query,
      terminated: false,
      isDeleted: false,
    },
    {
      $set: { state: state },
    }
  );
};

export const createKeywordBySubjectAndState = (search: any, state: any) => {
  const keyword: any = {
    isDeleted: false,
  };

  if (search) keyword.subjectName = { $regex: search, $options: "i" };

  if (state) {
    let stateArray: string[] = (state as string).split(",");
    keyword.state = { $in: stateArray };
  }

  return keyword;
};

// Tạo một hàm để tạo ra keyword cho việc tìm kiếm lớp học theo vị trí trên bản đồ
export const createKeywordByLocation = (
  northLatBound: any,
  northLongBound: any,
  southLatBound: any,
  southLongBound: any
) => {
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

  return keyword;
};

// Tạo một hàm để tìm kiếm lớp học theo keyword, page và perPage
export const findClassroomsPaginate = async (keyword: any, page: number, perPage: number) => {
  const classrooms = await ClassroomModel.find(keyword)
    .populate("joinRequests")
    .skip((page - 1) * perPage)
    .limit(perPage);
  return classrooms;
};

export const findClassrooms = async (keyword: any) => {
  const classrooms = await ClassroomModel.find(keyword)
    .populate("joinRequests")
  return classrooms;
};

// Tạo một hàm để tìm kiếm lớp học theo id
export const findClassroomById = async (id: string) => {
  const classroom = await ClassroomModel.findOne({
    _id: id,
    isDeleted: false,
  }).populate("joinRequests");
  return classroom;
};

// Tạo một hàm để tìm kiếm lớp học của người dùng hiện tại theo vai trò
export const findUserCurrentClassrooms = async (user: any, role: string) => {
  let keyword: any = {
    terminated: false,
    currentParticipants: { $in: user },
    isDeleted: false,
  };
  if (role == UserType.TUTOR) {
    keyword.tutor = { $eq: user };
  } else if (role == ClassroomMemberRole.OWNER) {
    keyword.owner = { $eq: user };
  }

  const classrooms = await ClassroomModel.find(keyword).populate(
    "joinRequests"
  );
  return classrooms;
};

export interface ClassroomParams {
  classroomName: string;
  subject: string;
  maxParticipants: number;
  longitude: number;
  latitude: number;
  address: string;
  startTime: number;
  endTime: number;
  ownerIsTutor: boolean;

  //option
  description?: string;
  isPublic?: boolean;
  ownerApprovalRequired?: boolean;
  secretKey?: string;
}
