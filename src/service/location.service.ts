import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { LocationDocument, LocationModel } from "../models/location.model.js";

export async function findAndUpdateLocation(
    query: FilterQuery<LocationDocument>,
    update: UpdateQuery<LocationDocument>,
    options: QueryOptions = {}
) {
    return LocationModel.findOneAndUpdate(query, update, options);
}

export async function findLocation(query: FilterQuery<LocationDocument>) {
    return LocationModel.findOne(query).lean();
}