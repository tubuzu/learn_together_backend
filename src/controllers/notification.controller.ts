import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { NotificationModel } from "../models/notification.model.js";
import { getUserNotifications } from "../service/notification.service.js";
import {
  errorResponse,
  pageResponse,
  successResponse,
} from "../utils/response.util.js";

export const getPersonalNotfication = async (req: Request, res: Response) => {
  const userId = res.locals.userData.user;
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;
  const noties = await getUserNotifications(userId, page, perPage);
  return res.status(StatusCodes.OK).json(
    successResponse({
      data: pageResponse(noties),
    })
  );
};

export const setNotificationHasRead = async (req: Request, res: Response) => {
  const userId = res.locals.userData.user;
  const { notificationId } = req.params;
  const noti = await NotificationModel.findOne({
    _id: notificationId,
    targetUser: userId,
  });

  if (!noti)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(errorResponse({ message: "Notification not found!" }));

  noti.hasRead = true;
  await noti.save();

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ message: "Notification has been read!" }));
};

export const setNotificationAllRead = async (req: Request, res: Response) => {
  const userId = res.locals.userData.user;
  const noties = await NotificationModel.find({
    targetUser: userId,
  });

  await Promise.all(
    noties.map(async (noti: any) => {
      noti.hasRead = true;
      await noti.save();
    })
  );

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ message: "Notifications all read!" }));
};
