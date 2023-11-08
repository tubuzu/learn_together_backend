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

  const subject = await RoomModel.find(keyword as Record<string, any>);
  res.send(subject);
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

  let documents: any[] = [];
  if (req.files && "documents" in req.files && req.files.documents) {
    documents = await Promise.all(
      req.files.documents.map(async (file) => {
        try {
          const dateTime = giveCurrentDateTime();

          const storageRef = ref(
            storage,
            `rooms/${room._id}/documents/${
              file.originalname + "___" + dateTime
            }`
          );

          // Create file metadata including the content type
          const metadata = {
            contentType: file.mimetype,
          };

          // Upload the file in the bucket storage
          const snapshot = await uploadBytesResumable(
            storageRef,
            file.buffer,
            metadata
          );
          //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel

          // Grab the public url
          const document = (await getDownloadURL(snapshot.ref)) as string;
          return document;
        } catch (error: any) {
          return res.status(400).send(error.message);
        }
      })
    );
  }

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

  if (documents.length > 0) {
    room.courseDocumentList = documents;
    await room.save();
  }

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
  let room = await RoomModel.findById(roomId);

  if (room.isDeleted) throw new Error("Room deleted!");

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

  let documents: any[] = [];
  console.log(req.files == undefined);
  if (req.files && "documents" in req.files && req.files.documents) {
    documents = await Promise.all(
      req.files.documents.map(async (file) => {
        try {
          const dateTime = giveCurrentDateTime();

          const storageRef = ref(
            storage,
            `rooms/${room._id}/documents/${
              file.originalname + "___" + dateTime
            }`
          );

          // Create file metadata including the content type
          const metadata = {
            contentType: file.mimetype,
          };
          // Convert the buffer to an array buffer
          // const arrayBuffer = file.buffer.buffer.slice(file.buffer.byteOffset, file.buffer.byteOffset + file.buffer.byteLength);
          // Upload the file in the bucket storage
          // const snapshot = await uploadBytesResumable(storageRef, arrayBuffer, metadata);
          // Upload the file in the bucket storage
          const snapshot = await uploadBytesResumable(
            storageRef,
            file.buffer,
            metadata
          );
          //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel

          // Grab the public url
          const document = (await getDownloadURL(snapshot.ref)) as string;
          return document;
        } catch (error: any) {
          return res.status(400).send(error.message);
        }
      })
    );
  }

  if (documents.length > 0) {
    room.courseDocumentList = documents;
    await room.save();
  }

  const deletedUrl = req.body.deletedUrl; // Mảng các url cần xóa

  if (deletedUrl && deletedUrl.length > 0) {
    // Duyệt qua từng url
    for (let url of deletedUrl) {
      // Tạo một tham chiếu đến file trong bucket, ví dụ: 'rooms/room1/documents/file1.pdf'
      const filePath = url
        .replace("https://firebasestorage.googleapis.com/v0/b/", "")
        .split("?")[0];
      const fileRef = ref(storage, filePath);
      // Xóa file khỏi Firebase Storage
      await deleteObject(fileRef);
      // Xóa url khỏi mảng documents của room
      room.documents = room.documents.filter((u: any) => u !== url);
    }

    // Lưu lại room model
    await room.save();
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

  return res.status(StatusCodes.OK).send(room);
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
