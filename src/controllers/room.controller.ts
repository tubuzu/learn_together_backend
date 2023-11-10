import { Request, Response } from "express";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../errors/bad-request.error.js";
import { UnauthenticatedError } from "../errors/unauthenticated.error.js";
import { LocationModel } from "../models/location.model.js";
import { RoomModel } from "../models/room.model.js";
import { findAndUpdateRoom } from "../service/room.service.js";
import { giveCurrentDateTime } from "../utils/upload-file.js";
import { storage } from "../config/firebase.config.js";
import { NotFoundError } from "../errors/not-found.error.js";
import { findAndUpdateLocation } from "../service/location.service.js";

//@description     Get or Search all subjects
//@route           GET /api/v1/admin/subject?search=
//@access          Public
export const searchRoom = async (req: Request, res: Response) => {
  const keyword = req.query.search
    ? {
        subjectName: { $regex: req.query.search, $options: "i" },
        isDeleted: false,
      }
    : {
        isDeleted: false,
      };

  const rooms = await RoomModel.find(keyword as Record<string, any>);
  res.status(StatusCodes.OK).json({
    data: { rooms },
  });
};

/**
 * @description Create room
 * @route POST /api/v1/room/
 */
export const createRoom = async (req: Request, res: Response) => {
  const { locationName, longtitude, latitude, address } = req.body;

  const location = await LocationModel.create({
    locationName,
    longtitude,
    latitude,
    address,
  });

  if (!location) throw new BadRequestError("Something went wrong!");

  const {
    roomName,
    subject,
    maxParticipants,
    startTime,
    endTime,
    tuitionFee,
    description,
  } = req.body;

  const room = await RoomModel.create({
    roomName,
    subject,
    creator: res.locals.userData.user,
    maxParticipants,
    location: location._id,
    startTime,
    endTime,
    tuitionFee,
    description,
  });

  if (!room) throw new BadRequestError("Something went wrong!");

  return res.status(StatusCodes.CREATED).json({
    data: { room: room },
  });
};

/**
 * @description Update room
 * @route PATCH /api/v1/room/:roomId
 */
export const updateRoom = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  let room = await RoomModel.findOne({
    _id: roomId,
    isDeleted: false,
  });

  if (!room) throw new NotFoundError("Room not found!");

  let currentTime = new Date();
  if (currentTime >= room.startTime && currentTime <= room.endTime)
    throw new Error("Can't update room while learning!");

  const { locationName, longtitude, latitude, address } = req.body;
  let filteredUpdateObj = Object.fromEntries(
    Object.entries({
      locationName,
      longtitude,
      latitude,
      address,
    }).filter(([_, value]) => value !== undefined)
  );
  if (Object.keys(filteredUpdateObj).length !== 0) {
    await findAndUpdateLocation(
      {
        _id: room.location,
      },
      filteredUpdateObj,
      {
        upsert: true,
        new: true,
      }
    );
  }

  const {
    roomName,
    subject,
    maxParticipants,
    startTime,
    endTime,
    tuitionFee,
    description,
  } = req.body;

  filteredUpdateObj = Object.fromEntries(
    Object.entries({
      roomName,
      subject,
      maxParticipants,
      startTime,
      endTime,
      tuitionFee,
      description,
    }).filter(([_, value]) => value !== undefined)
  );

  if (Object.keys(filteredUpdateObj).length !== 0) {
    room = await findAndUpdateRoom(
      {
        _id: roomId,
      },
      filteredUpdateObj,
      {
        upsert: true,
        new: true,
      }
    );
  }

  if (!room) {
    throw new BadRequestError("Something went wrong!");
  }

  return res.status(StatusCodes.OK).json({
    data: room,
  });
};

/**
 * @description Delete room
 * @route Delete /api/v1/room/delete?roomId=
 */
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    let room = await RoomModel.findOne({
      _id: req.params.roomId, // Lọc theo _id
      isDeleted: false,
    });

    if (!room) throw new NotFoundError("Room not found!");

    if (res.locals.userData.user != room.creator)
      throw new UnauthenticatedError("Only creator can delete room.");

    room.delete();

    return res.status(StatusCodes.OK).json({
      msg: "Room deleted!",
    });
  } catch (err: any) {
    throw new Error(err.message);
  }
};
