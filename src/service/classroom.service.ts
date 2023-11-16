import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { ClassroomDocument, ClassroomModel } from "../models/classroom.model.js";

export async function findAndUpdateClassroom(
    query: FilterQuery<ClassroomDocument>,
    update: UpdateQuery<ClassroomDocument>,
    options: QueryOptions = {}
) {
    return ClassroomModel.findOneAndUpdate(query, update, options);
}

export async function findClassroom(query: FilterQuery<ClassroomDocument>) {
    return ClassroomModel.findOne(query).lean();
}