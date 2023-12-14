import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../errors/bad-request.error.js";
import { NotFoundError } from "../errors/not-found.error.js";
import { UnauthenticatedError } from "../errors/unauthenticated.error.js";
import { processImageAttachmentFileMiddleware } from "../middlewares/upload.middleware.js";
import { ClassroomModel } from "../models/classroom.model.js";
import { ClassroomMessageModel } from "../models/classroomMessage.model.js";
import { pageResponse, successResponse } from "../utils/response.util.js";
import { uploadFile } from "../utils/upload-file.js";
import WebSocket from "../utils/webSocket.js";
// import { WebSockets } from "../utils/webSocket.js";
// import { socketio } from "../server.js";

export const getMessagesByClassroomId = async (req: Request, res: Response) => {
  try {
    const classroom = await ClassroomModel.findById(req.params.classroomId);
    if (!classroom) throw new NotFoundError("Classroom is not found!");

    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 10;

    const messages = await ClassroomMessageModel.find({
      classroom: classroom._id,
    })
      .populate({
        path: "sender",
        select: "_id avatar firstName lastName email",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    res
      .status(StatusCodes.OK)
      .json(successResponse({ data: pageResponse(messages) }));
  } catch (error: any) {
    res.status(400);
    throw new Error(error.message);
  }
};

export const sendClassroomMessage = async (req: Request, res: Response) => {
  await processImageAttachmentFileMiddleware(req, res);

  const userId = res.locals.userData.user;
  const { content, classroomId } = req.body;

  if (
    (!content &&
      (!req.files ||
        !("attachments" in req.files) ||
        !req.files.attachments)) ||
    !classroomId
  ) {
    throw new BadRequestError("Invalid data passed into request");
  }

  const classroom = await ClassroomModel.findById(classroomId);
  if (!classroom) throw new NotFoundError("Classroom not found!");

  let attachments: any[] = [];
  if (req.files && "attachments" in req.files && req.files.attachments) {
    attachments = await Promise.all(
      req.files.attachments.map(async (file) =>
        uploadFile(file, `classrooms/${classroom._id}/media`)
      )
    );
  }

  try {
    let message = await ClassroomMessageModel.create({
      sender: userId,
      content,
      attachments,
      classroom: classroomId,
    });

    await message
      .populate("sender", "_id avatar firstName lastName email")
      .execPopulate();

    const io = WebSocket.getInstance();
    io.to(`classroom-${classroom._id}`).emit("onClassroomMessage", {
      message: message,
      classroom: classroom,
    });

    res.status(StatusCodes.CREATED).json(successResponse({ data: message }));
  } catch (error: any) {
    throw new BadRequestError(error.message);
  }
};

export const updateClassroomMessageById = async (
  req: Request,
  res: Response
) => {
  const { messageId, classroomId } = req.params;
  const { content } = req.body;
  const userId = res.locals.userData.user;
  try {
    const { sender } = await ClassroomMessageModel.findById(messageId);
    if (userId != sender)
      throw new UnauthenticatedError(
        "You are not authenticated to make changes of this message!"
      );

    const message = await ClassroomMessageModel.findByIdAndUpdate(
      messageId,
      { content: content },
      { new: true }
    )
      .populate("sender", "_id avatar firstName lastName email")
      .populate("classroom");

    const classroom = await ClassroomModel.findById(classroomId);
    if (!classroom) throw new NotFoundError("Classroom not found!");
    const io = WebSocket.getInstance();
    classroom.currentParticipants.map((user: any) => {
      if (
        user != message.sender._id &&
        WebSocket.onlineUsers.has(user.toString())
      )
        io.to(WebSocket.onlineUsers.get(user.toString())).emit(
          "onClassroomMessageUpdate",
          message
        );
    });

    res.status(StatusCodes.OK).json(
      successResponse({
        data: {
          classroomId: classroom._id,
          message,
        },
      })
    );
  } catch (error: any) {
    res.status(400);
    throw new Error(error.message);
  }
};

export const deleteClassroomMessageById = async (
  req: Request,
  res: Response
) => {
  const userId = res.locals.userData.user;
  const { messageId, classroomId } = req.params;
  try {
    const message = await ClassroomMessageModel.findById(messageId);
    if (userId != message.sender)
      throw new UnauthenticatedError(
        "You are not authenticated to make changes of this message!"
      );

    await message.delete();

    const { _id, currentParticipants } = await ClassroomModel.findById(
      classroomId
    );
    const io = WebSocket.getInstance();
    currentParticipants.map((user: any) => {
      if (user != message.sender && WebSocket.onlineUsers.has(user.toString()))
        io.to(WebSocket.onlineUsers.get(user.toString())).emit(
          "onClassroomMessageDelete",
          {
            classroomId: _id,
            messageId: message._id,
          }
        );
    });

    res.status(StatusCodes.OK).json(
      successResponse({
        data: {
          classroomId: _id,
          message: message,
        },
      })
    );
  } catch (error: any) {
    res.status(400);
    throw new Error(error.message);
  }
};
