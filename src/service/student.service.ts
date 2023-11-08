import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { StudentModel, StudentDocument } from "../models/student.model.js";

export async function findAndUpdateStudent(
    query: FilterQuery<StudentDocument>,
    update: UpdateQuery<StudentDocument>,
    options: QueryOptions = {}
) {
    return StudentModel.findOneAndUpdate(query, update, options);
}

export async function findStudent(query: FilterQuery<StudentDocument>) {
    return StudentModel.findOne(query).lean();
}