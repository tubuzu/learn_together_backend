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

export const updateClassroomState = async () => {
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
