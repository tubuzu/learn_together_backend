import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { RoomDocument, RoomModel } from "../models/room.model.js";

export async function findAndUpdateRoom(
    query: FilterQuery<RoomDocument>,
    update: UpdateQuery<RoomDocument>,
    options: QueryOptions = {}
) {
    return RoomModel.findOneAndUpdate(query, update, options);
}

export async function findRoom(query: FilterQuery<RoomDocument>) {
    return RoomModel.findOne(query).lean();
}