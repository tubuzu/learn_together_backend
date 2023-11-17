import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import {
  ClassroomDocument,
  ClassroomModel,
} from "../models/classroom.model.js";

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
