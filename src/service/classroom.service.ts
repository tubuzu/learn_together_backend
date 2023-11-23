import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import {
  ClassroomDocument,
  ClassroomModel,
} from "../models/classroom.model.js";
import { ClassroomState } from "../utils/const.js";

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
  console.log("hehe");
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
