import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { SubjectDocument, SubjectModel } from "../models/subject.model.js";

export async function findAndUpdateSubject(
    query: FilterQuery<SubjectDocument>,
    update: UpdateQuery<SubjectDocument>,
    options: QueryOptions = {}
) {
    return SubjectModel.findOneAndUpdate(query, update, options);
}

export async function findSubject(query: FilterQuery<SubjectDocument>) {
    return SubjectModel.findOne(query).lean();
}