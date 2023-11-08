import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { AdminDocument, AdminModel } from "../models/admin.model.js";
import omit from "lodash/omit.js";

export async function validateAdminPassword({
    email,
    password,
}: {
    email: string;
    password: string;
}) {
    const admin = await AdminModel.findOne({ email }).select("+password");

    if (!admin) {
        return false;
    }

    const isValid = await admin.comparePassword(password);

    if (!isValid) return false;

    return omit(admin.toJSON(), "password");
}

export async function findAndUpdateAdmin(
    query: FilterQuery<AdminDocument>,
    update: UpdateQuery<AdminDocument>,
    options: QueryOptions = {}
) {
    return AdminModel.findOneAndUpdate(query, update, options);
}

export async function findAdmin(query: FilterQuery<AdminDocument>) {
    return AdminModel.findOne(query).lean();
}