import { ClassroomJoinedNotificationDTO } from "../dtos/notification.dto.js";
import { ClassroomModel } from "../models/classroom.model.js";
import { NotificationModel } from "../models/notification.model.js";
import { NotificationCode } from "../utils/const.js";

export const getUserNotifications = async (
  userId: string,
  page: number,
  perPage: number
) => {
  return await NotificationModel.find({
    targetUser: userId,
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);
};

export const createClassroomJoinedNoti = async (
  request: ClassroomJoinedNotificationDTO
) => {
  return await NotificationModel.create({
    originUser: request.originUserId,
    targetUser: request.targetUserId,
    notificationCode: NotificationCode.CLASSROOM__HAS_JOIN_CLASSROOM,
    extraData: request,
  });
};
